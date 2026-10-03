import { DurableObject } from "cloudflare:workers";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

function containerEnv(env) {
  const result = {
    NODE_ENV: "production",
    PORT: "8080",
  };

  for (const key of [
    "DATABASE_URL",
    "GEMINI_API_KEY",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "JWT_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ]) {
    if (typeof env[key] === "string" && env[key].length > 0) {
      result[key] = env[key];
    }
  }

  return result;
}

export class HumanDesignContainer extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.starting = undefined;

    const container = ctx.container;
    if (container?.running) {
      void ctx.blockConcurrencyWhile(() =>
        container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS),
      );
    }
  }

  async fetch(request) {
    this.starting ??= this.startAndWaitForReady().finally(() => {
      this.starting = undefined;
    });
    await this.starting;

    const url = new URL(request.url);
    url.protocol = "http:";
    url.host = "container";

    const forwarded = new Request(url, request);
    forwarded.headers.delete("host");
    forwarded.headers.set("x-forwarded-proto", "https");

    return this.ctx.container.getTcpPort(8080).fetch(forwarded);
  }

  async startAndWaitForReady() {
    const container = this.ctx.container;

    if (!container.running) {
      container.start({
        image: container.images.base,
        instance: "lite",
        enableInternet: true,
        env: containerEnv(this.env),
      });
    }

    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);

    const port = container.getTcpPort(8080);
    let lastError;

    for (let attempt = 0; attempt < 120; attempt++) {
      try {
        const response = await port.fetch("http://container/", {
          signal: AbortSignal.timeout(1500),
        });
        await response.body?.cancel();
        if (response.status < 500) return;
        lastError = new Error(`Readiness returned ${response.status}`);
      } catch (error) {
        lastError = error;
      }
      await scheduler.wait(250);
    }

    throw new Error("Human Design container did not become ready on port 8080", {
      cause: lastError,
    });
  }
}

export default {
  fetch(request, env) {
    return env.APP_CONTAINER.getByName("production").fetch(request);
  },
};
