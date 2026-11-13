/**
 * Read-only HDCHART smoke audit. Never targets production or performs customer actions.
 * Usage: HD_AUDIT_PREVIEW_URL=https://<id>.humandesignchart-web.pages.dev/ node scripts/qa/audit-revenue-preview.mjs
 * Prerequisite in isolated QA checkout: playwright + Chromium installed separately.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const input = process.env.HD_AUDIT_PREVIEW_URL;
if (!input) throw new Error('HD_AUDIT_PREVIEW_URL is required; no production fallback');
const base = new URL(input);
if (base.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.humandesignchart-web\.pages\.dev$/.test(base.hostname) ||
    base.pathname !== '/' || base.search || base.hash || base.username || base.password) {
  throw new Error('Only a real Cloudflare Pages preview origin is permitted');
}
const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const dir = resolve('qa-artifacts', 'hd-revenue-audit');
mkdirSync(dir, { recursive: true });
const report = {
  at: new Date().toISOString(), origin: base.origin,
  sha: process.env.HD_AUDIT_COMMIT_SHA || null,
  deploymentId: process.env.HD_AUDIT_DEPLOYMENT_ID || null,
  scope: 'READ ONLY: public routes. OAuth, checkout, paid PDF and webhook NOT TESTED',
  pages: [], findings: []
};
const add = (sev, route, vp, rule, detail) =>
  report.findings.push({ sev, route, viewport: vp, rule, detail: String(detail).slice(0, 400) });
const safe = value => String(value ?? '').replaceAll('|','\\|').replaceAll('\n',' ');

try {
  for (const route of ['/cs','/en','/cs/calculate','/en/calculate']) {
    for (const vp of [{name:'390',width:390,height:844},{name:'1440',width:1440,height:900}]) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce'
      });
      await context.addInitScript(() => {
        const v = { lcp:null, cls:0, longTasks:0, supportsLcp:false, supportsCls:false };
        Object.defineProperty(window,'__hdLabVitals',{value:v});
        const types = PerformanceObserver.supportedEntryTypes || [];
        if (types.includes('largest-contentful-paint')) {
          v.supportsLcp = true;
          new PerformanceObserver(list => {
            const es = list.getEntries();
            if (es.length) v.lcp = es[es.length-1].startTime;
          }).observe({type:'largest-contentful-paint', buffered:true});
        }
        if (types.includes('layout-shift')) {
          v.supportsCls = true;
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) v.cls += e.value;
          }).observe({type:'layout-shift', buffered:true});
        }
        if (types.includes('longtask')) {
          new PerformanceObserver(list => { v.longTasks += list.getEntries().length; })
            .observe({type:'longtask',buffered:true});
        }
      });
      const page = await context.newPage();
      const jsErrors = [], failed = [];
      page.on('pageerror', e => jsErrors.push(e.message));
      page.on('requestfailed', req => {
        if (new URL(req.url()).origin === base.origin)
          failed.push(req.method() + ' ' + req.url() + ' ' + (req.failure()?.errorText || 'failed'));
      });
      try {
        const response = await page.goto(new URL(route, base).href, {waitUntil:'load',timeout:45000});
        await page.waitForTimeout(1500);
        const status = response?.status() ?? null;
        if (status !== 200) add('S0',route,vp.name,'HTTP','Expected 200, got ' + status);
        if (new URL(page.url()).origin !== base.origin)
          add('S0',route,vp.name,'REDIRECT','Unexpected origin ' + new URL(page.url()).origin);
        const data = await page.evaluate(() => {
          const get = selector => document.querySelector(selector)?.getAttribute('content') || null;
          const active = el => {
            const r = el.getBoundingClientRect(), s = getComputedStyle(el);
            return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none';
          };
          const controls = [...document.querySelectorAll('a[href],button,input,select,textarea')];
          const noLabel = controls.filter(el =>
            el.matches('input,select,textarea') && active(el) && el.type!=='hidden' &&
            !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') &&
            !el.labels?.length && !el.getAttribute('title')).length;
          return {
            title:document.title,
            metaDescription:get('meta[name="description"]'),
            ogImage:get('meta[property="og:image"]'),
            canonical:document.querySelector('link[rel="canonical"]')?.href || null,
            hreflang:[...document.querySelectorAll('link[rel="alternate"][hreflang]')]
              .map(el => el.getAttribute('hreflang')),
            h1:document.querySelectorAll('h1').length,
            overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
            smallTargets:controls.filter(el => active(el) &&
              (el.getBoundingClientRect().width<24||el.getBoundingClientRect().height<24)).length,
            unlabeledInputs:noLabel,
            vitals:window.__hdLabVitals || null
          };
        });
        const shot = resolve(dir,route.replaceAll('/','_') + '-' + vp.name + '.png');
        await page.screenshot({path:shot,fullPage:true});
        report.pages.push({route,viewport:vp.name,status,screenshot:shot,...data});
        if (data.overflow>2) add('S1',route,vp.name,'OVERFLOW',data.overflow+'px');
        if (data.unlabeledInputs) add('S1',route,vp.name,'A11Y','Unlabeled visible inputs: '+data.unlabeledInputs);
        if (data.h1!==1) add('S2',route,vp.name,'SEO','H1 count: '+data.h1);
        if (!data.metaDescription || !data.ogImage || !data.canonical)
          add('S2',route,vp.name,'SEO','Missing description, OG image or canonical');
        if (!data.hreflang.includes('cs') || !data.hreflang.includes('en'))
          add('S2',route,vp.name,'SEO','Missing cs/en hreflang');
        if (data.smallTargets) add('S2',route,vp.name,'A11Y',
          data.smallTargets+' small targets; manually assess spacing exceptions');
        if (data.vitals?.supportsLcp && data.vitals.lcp>2500)
          add('S2',route,vp.name,'PERF_LAB','Indicative LCP '+Math.round(data.vitals.lcp)+'ms');
        if (data.vitals?.supportsCls && data.vitals.cls>0.1)
          add('S2',route,vp.name,'PERF_LAB','Indicative CLS '+data.vitals.cls.toFixed(3));
        for (const error of jsErrors) add('S1',route,vp.name,'PAGEERROR',error);
        for (const error of failed) add('S1',route,vp.name,'FIRST_PARTY_REQUEST',error);
      } catch (e) {
        add('S0',route,vp.name,'AUDIT_EXCEPTION',e instanceof Error ? e.message : String(e));
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  writeFileSync(resolve(dir,'audit-report.json'),JSON.stringify(report,null,2));
  const rows = report.findings.map(f =>
    '| '+[f.sev,f.route,f.viewport,f.rule,safe(f.detail)].join(' | ')+' |').join('\n');
  writeFileSync(resolve(dir,'audit-report.md'),
    '# HDCHART preview audit '+report.at+'\n\nOrigin: '+report.origin+
    '\nSHA: '+(report.sha||'NOT PROVIDED')+'; Deployment ID: '+(report.deploymentId||'NOT PROVIDED')+
    '\n\nThis is a read-only lab smoke test, NOT auth/payment/PDF E2E or field CWV.\n\n'+
    '| Severity | Route | Viewport | Rule | Evidence |\n|---|---|---|---|---|\n'+
    (rows||'| — | — | — | — | No automated findings |')+'\n');
}
if (report.findings.some(f=>f.sev==='S0'||f.sev==='S1')) {
  console.error('S0/S1 findings. NO-GO until triaged. See qa-artifacts/hd-revenue-audit');
  process.exitCode=1;
} else console.log('No automated S0/S1. Auth, checkout, PDF and production release still UNVERIFIED.');
