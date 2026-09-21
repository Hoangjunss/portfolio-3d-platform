import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('restaurant site build gate', () => {
  it('next build succeeds and produces a static export with thumbnail.webp', () => {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    const exported = path.join(ROOT, 'out', 'thumbnail.webp');
    expect(existsSync(exported)).toBe(true);
  }, 180_000);
});
