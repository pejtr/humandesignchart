const fs = require('fs');
let content = fs.readFileSync('server/data/hdContent.ts', 'utf8');
const lines = content.split('\n');
let replacedCount = 0;
const newLines = lines.map(line => {
    if (line.includes('siddhiKeyword: ') && line.match(/siddhiKeyword:\s*\"[^\"]+\",/g)?.length > 1) {
        // Find the first occurrence of siddhiKeyword... siddhiKeywordEn... and remove it.
        const replaced = line.replace(/siddhiKeyword:\s*\"[^\"]+\",\s*siddhiKeywordEn:\s*\"[^\"]+\",\s*(siddhiKeyword:\s*\"[^\"]+\",\s*siddhiKeywordEn:\s*\"[^\"]+\")/, '$1');
        if (replaced !== line) {
            replacedCount++;
            return replaced;
        }
    }
    return line;
});
fs.writeFileSync('server/data/hdContent.ts', newLines.join('\n'), 'utf8');
console.log('Replaced ' + replacedCount + ' lines');
