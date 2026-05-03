import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      const importRegex = /from\s+['"](\.\.\/[^'"]+)['"]/g;
      content = content.replace(importRegex, (match, relPath) => {
        const absoluteImportPath = path.resolve(
          path.dirname(fullPath),
          relPath
        );
        if (absoluteImportPath.startsWith(rootDir)) {
          let newRelPath = absoluteImportPath
            .substring(rootDir.length)
            .replace(/\\/g, '/');
          if (newRelPath.startsWith('/')) {
            newRelPath = newRelPath.substring(1);
          }
          return `from '@/${newRelPath}'`;
        }
        return match;
      });

      const importRegexCurrent = /from\s+['"](\.\/[^'"]+)['"]/g;
      content = content.replace(importRegexCurrent, (match, relPath) => {
        const absoluteImportPath = path.resolve(
          path.dirname(fullPath),
          relPath
        );
        if (absoluteImportPath.startsWith(rootDir)) {
          let newRelPath = absoluteImportPath
            .substring(rootDir.length)
            .replace(/\\/g, '/');
          if (newRelPath.startsWith('/')) {
            newRelPath = newRelPath.substring(1);
          }
          return `from '@/${newRelPath}'`;
        }
        return match;
      });

      // also replace dynamic imports: import('../')
      const dynamicImportRegex = /import\(['"](\.\.\/[^'"]+)['"]\)/g;
      content = content.replace(dynamicImportRegex, (match, relPath) => {
        const absoluteImportPath = path.resolve(
          path.dirname(fullPath),
          relPath
        );
        if (absoluteImportPath.startsWith(rootDir)) {
          let newRelPath = absoluteImportPath
            .substring(rootDir.length)
            .replace(/\\/g, '/');
          if (newRelPath.startsWith('/')) {
            newRelPath = newRelPath.substring(1);
          }
          return `import('@/${newRelPath}')`;
        }
        return match;
      });

      const dynamicImportCurrentRegex = /import\(['"](\.\/[^'"]+)['"]\)/g;
      content = content.replace(dynamicImportCurrentRegex, (match, relPath) => {
        const absoluteImportPath = path.resolve(
          path.dirname(fullPath),
          relPath
        );
        if (absoluteImportPath.startsWith(rootDir)) {
          let newRelPath = absoluteImportPath
            .substring(rootDir.length)
            .replace(/\\/g, '/');
          if (newRelPath.startsWith('/')) {
            newRelPath = newRelPath.substring(1);
          }
          return `import('@/${newRelPath}')`;
        }
        return match;
      });

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory(rootDir);
console.log('Imports fixed to absolute alias.');
