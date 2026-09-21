import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkThumbnail } from './check-thumbnail.mjs';

let dir;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'thumb-check-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('checkThumbnail', () => {
  it('returns ok:false when the file is missing', () => {
    const result = checkThumbnail(path.join(dir, 'public', 'thumbnail.webp'));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });

  it('returns ok:false when the file exists but is not a real WEBP', () => {
    const file = path.join(dir, 'thumbnail.webp');
    writeFileSync(file, Buffer.from('not a webp file'));
    const result = checkThumbnail(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not a valid webp/i);
  });

  it('returns ok:true for a real WEBP magic-byte header', () => {
    const file = path.join(dir, 'thumbnail.webp');
    const header = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP'),
    ]);
    writeFileSync(file, header);
    const result = checkThumbnail(file);
    expect(result.ok).toBe(true);
  });
});
