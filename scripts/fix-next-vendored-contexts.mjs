import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const nextDist = path.join(projectRoot, 'node_modules', 'next', 'dist');

const copies = [
  {
    source: path.join(nextDist, 'server', 'route-modules', 'app-page', 'vendored'),
    target: path.join(nextDist, 'server', 'route-modules', 'app-route', 'vendored'),
  },
  {
    source: path.join(nextDist, 'esm', 'server', 'route-modules', 'app-page', 'vendored'),
    target: path.join(nextDist, 'esm', 'server', 'route-modules', 'app-route', 'vendored'),
  },
];

for (const { source, target } of copies) {
  if (!fs.existsSync(source)) continue;

  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (fs.existsSync(targetPath)) {
      if (entry.isDirectory()) {
        continue;
      }
      fs.rmSync(targetPath, { recursive: true, force: true });
    }

    fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
  }
}
