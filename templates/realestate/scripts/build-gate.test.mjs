import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { checkThumbnail } from '../../../template-kit/scripts/check-thumbnail.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('realestate site build gate', () => {
  it('npm run build succeeds and produces a static export with index.html', () => {
    const outDir = path.join(ROOT, 'out');
    if (existsSync(outDir)) {
      rmSync(outDir, { recursive: true, force: true });
    }
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    expect(existsSync(path.join(outDir, 'index.html'))).toBe(true);
  }, 180_000);

  it('public/thumbnail.webp exists and is a valid WEBP before build runs', () => {
    const result = checkThumbnail(path.join(ROOT, 'public', 'thumbnail.webp'));
    expect(result.ok).toBe(true);
  });

  it('all 8 listing map-placeholder images exist', () => {
    for (let i = 1; i <= 8; i++) {
      const file = path.join(ROOT, 'public', 'listings', `map-placeholder-0${i}.webp`);
      expect(existsSync(file)).toBe(true);
    }
  });
});
