import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkThumbnail } from '../../../template-kit/scripts/check-thumbnail.mjs';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('saas site build gate', () => {
  it('npm run build succeeds and produces a static export with a valid thumbnail', () => {
    const outDir = path.join(SITE_ROOT, 'out');
    rmSync(outDir, { recursive: true, force: true });
    execSync('npm run build', { cwd: SITE_ROOT, stdio: 'inherit' });

    expect(existsSync(outDir)).toBe(true);
    expect(checkThumbnail(path.join(SITE_ROOT, 'public', 'thumbnail.webp')).ok).toBe(true);
  }, 180_000);
});
