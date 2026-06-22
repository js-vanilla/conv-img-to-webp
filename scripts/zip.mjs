import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const parent = dirname(root);
const name = basename(root);
const out = join(parent, `${name}.zip`);

await new Promise((resolve, reject) => {
  const child = spawn('zip', ['-r', out, name, '-x', `${name}/node_modules/*`, `${name}/.git/*`, `${name}/coverage/*`, `${name}/__MACOSX/*`], {
    cwd: parent,
    stdio: 'inherit'
  });
  child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`zip exited with ${code}`))));
  child.on('error', reject);
});

console.log(out);
