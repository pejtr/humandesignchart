import { createRemoteJWKSet, jwtVerify } from "jose";
import { publicSeoUrlFromRequest } from "./social-meta";

/** Cloudflare Pages Google OIDC: PKCE, state, nonce, signed ID token, D1 users + hashed sessions. */
type D1 = any;
export type AuthEnv = { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string; HD_ORDERS?: D1; DB?: D1 };
const DB = (e: AuthEnv): D1 | null => e.HD_ORDERS || e.DB || null;
const OAUTH = "__Host-hd_oauth_state", SESSION = "__Host-hd_session", TTL = 600_000;
const HOSTS = new Set(["humandesignchart.app","www.humandesignchart.app","humandesignmapa.cz","www.humandesignmapa.cz"]);
const KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const h = (more: Record<string,string> = {}) => new Headers({
  "cache-control": "no-store, private", "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff", ...more
});
const cookie = (key: string, value: string, age: number) =>
  key + "=" + value + "; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=" + age;
const token = () => {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const sha = async (s: string) => {
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return btoa(String.fromCharCode(...b)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const cv = (r: Request, k: string) => (r.headers.get("cookie") || "").split(";")
  .map(x => x.trim()).find(x => x.startsWith(k+"="))?.slice(k.length+1);
const loc = (host: string) => host.endsWith("humandesignchart.app") ? "en" : "cs";
export function safeReturnPath(raw: string | null | undefined, locale: string) {
  return raw && raw.length <= 512 && raw.startsWith("/") &&
    !raw.startsWith("//") && !raw.includes("\\") &&
    !/[\x00-\x1f]/.test(raw) && !/^\/api(\/|$)/i.test(raw)
    ? raw : "/" + locale + "/account";
}
/** Detailed owner-only log diagnosis. NEVER expose secret values, SQL errors or account data. */
export type GoogleReadinessCode =
  | "READY"
  | "D1_BINDING_MISSING"
  | "GOOGLE_CLIENT_ID_MISSING"
  | "GOOGLE_CLIENT_SECRET_MISSING"
  | "D1_OAUTH_USERS_UNAVAILABLE"
  | "D1_OAUTH_SESSIONS_UNAVAILABLE";

export async function googleReadinessCode(env: AuthEnv): Promise<GoogleReadinessCode> {
  const db = DB(env);
  if (!db || typeof db.prepare !== "function") return "D1_BINDING_MISSING";
  if (!env.GOOGLE_CLIENT_ID?.trim()) return "GOOGLE_CLIENT_ID_MISSING";
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) return "GOOGLE_CLIENT_SECRET_MISSING";
  try {
    await db.prepare("SELECT id FROM hd_oauth_users LIMIT 1").first();
  } catch {
    return "D1_OAUTH_USERS_UNAVAILABLE";
  }
  try {
    await db.prepare("SELECT token_hash FROM hd_oauth_sessions LIMIT 1").first();
  } catch {
    return "D1_OAUTH_SESSIONS_UNAVAILABLE";
  }
  return "READY";
}

export async function googleAvailable(env: AuthEnv): Promise<boolean> {
  return (await googleReadinessCode(env)) === "READY";
}
const fail = (url: URL) => {
  const head = h({location: "/" + loc(url.hostname) + "/login?auth=failed"});
  head.append("set-cookie", cookie(OAUTH, "", 0));
  return new Response(null, {status: 303, headers: head});
};
export async function googleLogin(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  if (!(await googleAvailable(env))) {
    // Direct browser navigation must never display a raw JSON error.
    // The localized login page explains that Google sign-in is unavailable.
    const acceptsHtml = request.headers.get("sec-fetch-mode") === "navigate" ||
      request.headers.get("accept")?.includes("text/html") === true;
    if (acceptsHtml) {
      const headers = h({ location: "/" + loc(url.hostname) + "/login?auth=unavailable" });
      headers.append("set-cookie", cookie(OAUTH, "", 0));
      return new Response(null, { status: 303, headers });
    }
    return Response.json({error:"GOOGLE_LOGIN_NOT_CONFIGURED"}, {status:503,headers:h()});
  }
  const state = { s: token(), n: token(), v: token(), at: Date.now(), host:url.host,
    back:safeReturnPath(url.searchParams.get("returnTo"),loc(url.hostname)) };
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const params = {
    client_id:env.GOOGLE_CLIENT_ID!, redirect_uri:url.origin + "/api/oauth/callback/google",
    response_type:"code",scope:"openid email profile",state:state.s,nonce:state.n,
    code_challenge:await sha(state.v), code_challenge_method:"S256",
    prompt:"select_account", access_type:"online"
  };
  Object.entries(params).forEach(([k,v]) => target.searchParams.set(k,v));
  const head = h({location:target.toString()});
  head.append("set-cookie",cookie(OAUTH,encodeURIComponent(JSON.stringify(state)),600));
  return new Response(null,{status:302,headers:head});
}
export async function googleCallback(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  let data: {s:string;n:string;v:string;at:number;host:string;back:string};
  try {data=JSON.parse(decodeURIComponent(cv(request,OAUTH)||""));}
  catch {return fail(url);}
  if (!data || data.host !== url.host || !data.s || !data.n || !data.v ||
    !Number.isFinite(data.at) || Date.now()-data.at<0 || Date.now()-data.at>TTL ||
    data.s !== url.searchParams.get("state") || !url.searchParams.get("code") ||
    url.searchParams.has("error") || !(await googleAvailable(env))) return fail(url);
  try {
    const answer = await fetch("https://oauth2.googleapis.com/token",{
      method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({code:url.searchParams.get("code")!,client_id:env.GOOGLE_CLIENT_ID!,
        client_secret:env.GOOGLE_CLIENT_SECRET!,redirect_uri:url.origin+"/api/oauth/callback/google",
        grant_type:"authorization_code",code_verifier:data.v})
    });
    if (!answer.ok) return fail(url);
    const response = await answer.json() as {id_token?:string};
    if (!response.id_token) return fail(url);
    const verified = await jwtVerify(response.id_token,KEYS,{
      issuer:["https://accounts.google.com","accounts.google.com"],
      audience:env.GOOGLE_CLIENT_ID!,maxTokenAge:"10m",clockTolerance:"30s"
    });
    const p=verified.payload;
    if (!p.sub || p.nonce!==data.n || p.email_verified!==true ||
        typeof p.email!=="string") return fail(url);
    const name=typeof p.name==="string"?p.name.slice(0,200):null;
    const db=DB(env);
    const email=p.email.toLowerCase().slice(0,320);
    await db.prepare("INSERT INTO hd_oauth_users(google_sub,email,name,last_login_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,name=excluded.name,last_login_at=CURRENT_TIMESTAMP")
      .bind(p.sub,email,name).run();
    const user=await db.prepare("SELECT id FROM hd_oauth_users WHERE google_sub=? LIMIT 1")
      .bind(p.sub).first();
    if (!Number.isInteger(user?.id)) return fail(url);
    const session=token();
    await db.prepare("INSERT INTO hd_oauth_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)")
      .bind(await sha(session),user.id,Math.floor(Date.now()/1000)+30*86400).run();
    const head=h({location:safeReturnPath(data.back,loc(url.hostname))});
    head.append("set-cookie",cookie(OAUTH,"",0));
    head.append("set-cookie",cookie(SESSION,session,30*86400));
    return new Response(null,{status:303,headers:head});
  } catch(e) {
    console.warn("[google-oidc] callback rejected:",e instanceof Error?e.name:"unknown");
    return fail(url);
  }
}
export async function getSessionUser(request:Request,env:AuthEnv) {
  const value=cv(request,SESSION),db=DB(env);
  if (!db || !value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return null;
  try {
    const user=await db.prepare("SELECT u.id,u.email,u.name,u.created_at FROM hd_oauth_sessions s JOIN hd_oauth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? LIMIT 1")
      .bind(await sha(value),Math.floor(Date.now()/1000)).first();
    return user ? {id:user.id,name:user.name,email:user.email,role:"user",
      subscriptionPlan:"free",subscriptionStatus:"inactive",aiReadingCredits:0,
      createdAt:new Date(user.created_at.replace(" ","T")+"Z")} : null;
  } catch {return null;}
}
export async function revokeSession(request:Request,env:AuthEnv) {
  const value=cv(request,SESSION),db=DB(env);
  if (db && value && /^[A-Za-z0-9_-]{43}$/.test(value))
    await db.prepare("DELETE FROM hd_oauth_sessions WHERE token_hash=?")
      .bind(await sha(value)).run();
}
export async function handleGoogleAuth(request:Request,env:AuthEnv):Promise<Response|null> {
  // Cloudflare Pages can receive an internal *.pages.dev URL behind the branded edge.
  // Resolve only an allowlisted public hostname before OAuth origin/host validation.
  const url=publicSeoUrlFromRequest(request), path=url.pathname;
  if (!path.startsWith("/api/oauth/") && path!=="/api/auth/config") return null;
  if (!HOSTS.has(url.hostname))
    return Response.json({error:"UNSUPPORTED_AUTH_HOST"},{status:404,headers:h()});
  if (path==="/api/auth/config") {
    if (request.method!=="GET" && request.method!=="HEAD")
      return new Response(null,{status:405,headers:h({allow:"GET, HEAD"})});
    const readiness = await googleReadinessCode(env);
    // On-demand, sanitized Cloudflare Observability breadcrumb for the operator.
    // Public response remains just {google:boolean}; never log credentials, D1 SQL,
    // OAuth codes or customer data. Do not expose detailed readiness publicly.
    if (url.searchParams.get("diagnostic") === "1" && readiness !== "READY") {
      console.warn("[hd-google-oauth] readiness:", readiness);
    }
    return Response.json({google:readiness === "READY"},{headers:h()});
  }
  if (path==="/api/oauth/login" || path==="/api/oauth/login/google") {
    if (request.method!=="GET") return new Response(null,{status:405,headers:h({allow:"GET"})});
    return googleLogin(request,env,url);
  }
  if (path==="/api/oauth/callback/google") {
    if (request.method!=="GET") return new Response(null,{status:405,headers:h({allow:"GET"})});
    return googleCallback(request,env,url);
  }
  if (path==="/api/oauth/logout") {
    if (request.method!=="POST") return new Response(null,{status:405,headers:h({allow:"POST"})});
    if (request.headers.get("origin")!==url.origin)
      return Response.json({error:"CSRF_ORIGIN_INVALID"},{status:403,headers:h()});
    try {await revokeSession(request,env);}
    catch {return Response.json({error:"LOGOUT_FAILED"},{status:503,headers:h()});}
    const head=h();head.append("set-cookie",cookie(SESSION,"",0));
    return Response.json({success:true},{headers:head});
  }
  return null;
}
