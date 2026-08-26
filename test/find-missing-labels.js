import fs from 'fs';

const files = ['src/options/options.html', 'src/popup/popup.html'];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const ids = new Set();
  const idRegex = /id=["']([^"']+)["']/g;
  let m;
  while ((m = idRegex.exec(content)) !== null) {
    ids.add(m[1]);
  }

  const labelRegex = /<label[^>]*for=["']([^"']+)["'][^>]*>([\s\S]*?)<\/label>/gi;
  const missing = [];
  while ((m = labelRegex.exec(content)) !== null) {
    const forVal = m[1];
    if (!ids.has(forVal)) {
      missing.push({ for: forVal, labelText: m[2].replace(/<[^>]+>/g, '').trim().slice(0, 50) });
    }
  }
  console.log(`File: ${f} -> Total Missing Labels: ${missing.length}`);
  missing.forEach((item, idx) => console.log(`  [${idx + 1}] for="${item.for}" (Text: "${item.labelText}")`));
}
