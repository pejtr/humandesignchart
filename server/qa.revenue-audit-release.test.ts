import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const script = resolve('scripts/qa/audit-revenue-preview.mjs');
const source = readFileSync(script, 'utf8');
const run = (url: string) => spawnSync(process.execPath, [script], {
  encoding: 'utf8', timeout: 10000,
  env: { ...process.env, HD_AUDIT_PREVIEW_URL: url }
});

describe('HDCHART read-only revenue audit release contract', () => {
  it('parses and fails closed without a preview URL', () => {
    const checked = spawnSync(process.execPath, ['--check', script], { encoding:'utf8', timeout:10000 });
    expect(checked.status, checked.stderr).toBe(0);
    const absent = run('');
    expect(absent.status).not.toBe(0);
    expect(absent.stderr).toContain('HD_AUDIT_PREVIEW_URL is required');
  });
  it('refuses production origins and wrong Pages projects before Playwright import', () => {
    for (const url of [
      'https://humandesignchart.app/',
      'https://humandesignmapa.cz/',
      'https://anything.pages.dev/',
      'http://test.humandesignchart-web.pages.dev/',
      'https://test.humandesignchart-web.pages.dev/malicious',
    ]) {
      const result = run(url);
      expect(result.status, url).not.toBe(0);
      expect(result.stderr, url).toContain('Only a real Cloudflare Pages preview origin');
    }
  });
  it('has no form, auth, data mutation or transaction automation', () => {
    expect(source).toContain('new URL(route, base)');
    expect(source).not.toMatch(/\bpage\.(click|fill|press|type|submit)\s*\(/);
    expect(source).not.toMatch(/\.getByRole\([^;\n]+\)\.click\s*\(/);
    expect(source).not.toContain('checkout-sessions');
    expect(source).not.toContain('page.request.post');
  });
  it('writes traceable evidence and never claims payment validation', () => {
    expect(source).toContain('audit-report.json');
    expect(source).toContain('audit-report.md');
    expect(source).toContain('HD_AUDIT_COMMIT_SHA');
    expect(source).toContain('HD_AUDIT_DEPLOYMENT_ID');
    expect(source).toContain('Auth, checkout, PDF and production release still UNVERIFIED');
  });
});
