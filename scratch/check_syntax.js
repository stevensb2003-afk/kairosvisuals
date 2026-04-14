const fs = require('fs');
const content = fs.readFileSync('src/app/solicitud/page.tsx', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = null;
let inComment = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i+1];
    
    if (inComment) {
        if (inComment === '//' && char === '\n') inComment = false;
        if (inComment === '/*' && char === '*' && next === '/') {
            inComment = false;
            i++;
        }
        continue;
    }
    
    if (inString) {
        if (char === inString && content[i-1] !== '\\') inString = null;
        continue;
    }
    
    if (char === '/' && next === '/') { inComment = '//'; continue; }
    if (char === '/' && next === '*') { inComment = '/*'; i++; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = char; continue; }
    
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
    
    if (braces < 0 || parens < 0 || brackets < 0) {
        console.log(`Mismatch at index ${i} (Line roughly ${content.substring(0, i).split('\n').length}): Char ${char}`);
        console.log(`Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
        // break;
    }
}

console.log('Final counts:');
console.log(`Braces: ${braces}`);
console.log(`Parens: ${parens}`);
console.log(`Brackets: ${brackets}`);
