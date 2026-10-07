import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../apps/web/dist', import.meta.url));

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

const forbidden = [/service_role/, /sb_secret_/];
let failed = false;

for (const file of walk(dist)) {
  if (!/\.(js|html|css|json|map|txt)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      console.error(`Segreto nel bundle: ${file} (${pattern})`);
      failed = true;
    }
  }
  const tokens = text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
  for (const token of tokens) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      if (payload.role === 'service_role') {
        console.error(`JWT service_role nel bundle: ${file}`);
        failed = true;
      }
    } catch {
      // Un token non decodificabile non è una service key.
    }
  }
}

if (failed) process.exit(1);
console.log('Nessun segreto nel bundle.');
