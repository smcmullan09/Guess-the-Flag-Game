const fs = require('node:fs/promises');
const path = require('node:path');
const { countries } = require('../countries.js');
const directory = path.join(__dirname, '..', 'assets', 'flags');

async function main() {
  await fs.mkdir(directory, { recursive: true });
  const queue = [...countries];
  const failed = [];
  let downloaded = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const country = queue.shift();
      const filename = path.join(directory, `${country.code}.svg`);
      try {
        const existing = await fs.readFile(filename, 'utf8').catch(() => '');
        if (existing.includes('<svg')) { downloaded++; continue; }
        let content;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(`https://flagcdn.com/${country.code}.svg`, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            content = await response.text();
            if (!content.includes('<svg') || /<script\b/i.test(content)) throw new Error('Invalid SVG');
            break;
          } catch (error) { if (attempt === 2) throw error; }
        }
        await fs.writeFile(filename, content);
        downloaded++;
        if (downloaded % 25 === 0) console.log(`${downloaded} / ${countries.length} flags saved`);
      } catch (error) { failed.push(`${country.name}: ${error.message}`); }
    }
  }));
  console.log(`${downloaded} / ${countries.length} local flags ready.`);
  if (failed.length) { console.error(failed.join('\n')); process.exitCode = 1; }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
