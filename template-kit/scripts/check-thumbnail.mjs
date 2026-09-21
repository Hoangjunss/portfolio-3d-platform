import { readFileSync, existsSync } from 'node:fs';

export function checkThumbnail(filePath) {
  if (!existsSync(filePath)) {
    return { ok: false, reason: `thumbnail not found at ${filePath}` };
  }
  const buffer = readFileSync(filePath);
  const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!isRiff || !isWebp) {
    return { ok: false, reason: `${filePath} is not a valid WEBP file` };
  }
  return { ok: true, reason: null };
}

function main() {
  const target = process.argv[2] ?? 'public/thumbnail.webp';
  const result = checkThumbnail(target);
  if (!result.ok) {
    console.error(`check-thumbnail: ${result.reason}`);
    process.exit(1);
  }
  console.log(`check-thumbnail: ${target} OK`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
