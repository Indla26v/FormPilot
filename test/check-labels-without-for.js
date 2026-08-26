import fs from 'fs';

const content = fs.readFileSync('src/options/options.html', 'utf8');
const labelRegex = /<label([^>]*)>([\s\S]*?)<\/label>/gi;
let m;
let countWithoutFor = 0;
while ((m = labelRegex.exec(content)) !== null) {
  const attrs = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 50);
  if (!attrs.includes('for=')) {
    countWithoutFor++;
    console.log(`[Without For] "${text}" -> attrs: ${attrs}`);
  }
}
console.log('Total labels without for attribute in options.html:', countWithoutFor);
