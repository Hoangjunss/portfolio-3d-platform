import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkThumbnail } from '../../../template-kit/scripts/check-thumbnail.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const isNodeTest = process.execArgv.includes('--test') || process.env.NODE_TEST_CONTEXT !== undefined;

let describe, it, expect;

if (isNodeTest) {
  const t = await import('node:test');
  const assert = await import('node:assert/strict');
  describe = t.describe;
  it = t.it;
  expect = (val) => ({
    toBe: (expected) => assert.strictEqual(val, expected),
    toBeTruthy: () => assert.ok(val),
  });
} else {
  const v = await import('vitest');
  describe = v.describe;
  it = v.it;
  expect = v.expect;
}

describe('event site build gate', () => {
  it('npm run build succeeds and produces a static export with index.html', () => {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    expect(existsSync(path.join(ROOT, 'out', 'index.html'))).toBe(true);
  });

  it('public/thumbnail.webp exists and is a valid WEBP before build runs', () => {
    const result = checkThumbnail(path.join(ROOT, 'public', 'thumbnail.webp'));
    expect(result.ok).toBe(true);
  });
});
