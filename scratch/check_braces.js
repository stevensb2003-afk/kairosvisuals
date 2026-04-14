const fs = require('fs');
const content = fs.readFileSync('src/app/clients/[id]/page.tsx', 'utf8');

let braceCount = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inJsxComment = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i+1];

  if (inComment) {
    if (char === '\n') inComment = false;
    continue;
  }
  if (inJsxComment) {
    if (char === '*' && nextChar === '/') {
      inJsxComment = false;
      i++;
    }
    continue;
  }
  if (inString) {
    if (char === stringChar && content[i-1] !== '\\') inString = false;
    continue;
  }

  if (char === '/' && nextChar === '/') {
    inComment = true;
    i++;
    continue;
  }
  if (char === '{' && nextChar === '*') {
    inJsxComment = true;
    i++;
    continue;
  }
  if (char === "'" || char === '"' || char === '`') {
    inString = true;
    stringChar = char;
    continue;
  }

  if (char === '{') {
    braceCount++;
  } else if (char === '}') {
    braceCount--;
    if (braceCount < 0) {
      console.log('Extra closing brace found at index', i, 'around line', content.substring(0, i).split('\n').length);
      // Print some context
      console.log('Context:', content.substring(i - 20, i + 20));
    }
  }
}

console.log('Final brace count:', braceCount);
if (braceCount > 0) {
  console.log('Missing closing braces:', braceCount);
}
