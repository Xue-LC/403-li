// Test script to check font validity
const fs = require('fs');
const path = require('path');

const fontDir = './src/assets/fonts/figlet';
const files = fs.readdirSync(fontDir).filter(f => f.endsWith('.flf'));

console.log('Checking font files...\n');

const badFonts = [];
const goodFonts = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(fontDir, file), 'utf-8');
  const firstLine = content.split('\n')[0];
  
  // Check if it's a valid figlet header
  const validHeader = /^flf2a./.test(firstLine);
  const hasDollar = firstLine.includes('flf2a$');
  
  if (!validHeader) {
    badFonts.push({ file, reason: 'Invalid header', firstLine: firstLine.substring(0, 50) });
  } else if (!hasDollar) {
    // Check what character is used instead of $
    const match = firstLine.match(/^flf2a(.)/);
    const char = match ? match[1] : 'unknown';
    const charCode = match ? match[1].charCodeAt(0) : -1;
    badFonts.push({ file, reason: `Wrong hardblank char: '${char}' (code: ${charCode})`, firstLine: firstLine.substring(0, 50) });
  } else {
    // Try to parse the header
    const parts = firstLine.split(/\s+/);
    const height = parseInt(parts[1], 10);
    if (isNaN(height) || height < 1 || height > 100) {
      badFonts.push({ file, reason: `Invalid height: ${parts[1]}`, firstLine: firstLine.substring(0, 50) });
    } else {
      goodFonts.push({ file, height });
    }
  }
}

console.log('✅ Good fonts:', goodFonts.length);
goodFonts.forEach(f => console.log(`  - ${f.file} (height: ${f.height})`));

console.log('\n❌ Bad fonts:', badFonts.length);
badFonts.forEach(f => console.log(`  - ${f.file}: ${f.reason}`));

console.log('\n' + '='.repeat(50));
console.log('Summary: Need to fix', badFonts.length, 'fonts');
