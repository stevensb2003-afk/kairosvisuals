const fs = require('fs');
const content = fs.readFileSync('src/app/solicitud/page.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Very simple tag matcher
    let tags = line.match(/<(\/?[a-zA-Z0-9]+)/g);
    if (!tags) continue;
    
    for (let tag of tags) {
        if (tag.startsWith('</')) {
            let tagName = tag.substring(2);
            if (stack.length === 0) {
                console.log(`L${i+1}: Extra closing tag </${tagName}>`);
            } else {
                let last = stack.pop();
                if (last !== tagName) {
                    console.log(`L${i+1}: Mismatch. Closed </${tagName}> but expected </${last}>`);
                }
            }
        } else {
            let tagName = tag.substring(1);
            // Ignore self-closing tags (very naive)
            if (!line.includes(`${tag} `) && !line.includes(`${tag}>`) && !line.includes(`${tag}\n`)) {
                // This is too complex for regex, but let's see
            }
            if (!line.match(new RegExp(`<${tagName}[^>]*\\/>`))) {
                stack.push(tagName);
            }
        }
    }
}

console.log('Stack at end:', stack);
