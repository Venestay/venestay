import fs from 'fs';
import path from 'path';

function fixAny(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        fixAny(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = content.replace(/:\s*any\b/g, ': unknown');
      content = content.replace(/<any>/g, '<unknown>');
      content = content.replace(/\bany\[\]/g, 'unknown[]');
      
      if (content !== original) fs.writeFileSync(fullPath, content);
    }
  }
}
fixAny(process.cwd());
console.log("Fixed any types.");
