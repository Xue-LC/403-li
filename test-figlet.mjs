// 测试 Figlet 解析器
import fs from 'fs';

const fontData = fs.readFileSync('./src/assets/fonts/figlet/Standard.flf', 'utf-8');

class FigletParser {
  constructor(fontData) {
    this.fontData = fontData;
    this.characters = new Map();
    this.parseFont();
  }

  parseFont() {
    // 处理 Windows 换行符 (CRLF -> LF)
    const normalizedData = this.fontData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedData.split('\n');
    
    // 解析头部
    const header = lines[0];
    const headerMatch = header.match(/^flf2a\$\s*(\d+)\s+(\d+)/);
    
    if (!headerMatch) {
      throw new Error('Invalid FIGlet font header: ' + header);
    }
    
    this.height = parseInt(headerMatch[1], 10);
    this.baseline = parseInt(headerMatch[2], 10);
    console.log('✅ Header parsed: height=' + this.height + ', baseline=' + this.baseline);
    
    let currentChar = 32;
    let currentLines = [];
    let lineIndex = 1;
    
    // 跳过头部注释行
    while (lineIndex < lines.length && !lines[lineIndex].includes('@')) {
      lineIndex++;
    }
    console.log('📍 First data line at index:', lineIndex);
    
    // 解析字符
    while (lineIndex < lines.length && currentChar <= 126) {
      const line = lines[lineIndex];
      
      if (line.endsWith('@@')) {
        currentLines.push(line.slice(0, -2));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, [...currentLines]);
          currentChar++;
          currentLines = [];
        }
      } else if (line.endsWith('@')) {
        currentLines.push(line.slice(0, -1));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, [...currentLines]);
          currentChar++;
          currentLines = [];
        }
      } else if (line.includes('@')) {
        const atIndex = line.indexOf('@');
        currentLines.push(line.slice(0, atIndex));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, [...currentLines]);
          currentChar++;
          currentLines = [];
        }
      }
      
      lineIndex++;
    }
    
    console.log('✅ Parsed', this.characters.size, 'characters');
  }

  render(text) {
    const result = new Array(this.height).fill('');
    
    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const charLines = this.characters.get(charCode);
      
      if (charLines) {
        for (let i = 0; i < this.height; i++) {
          result[i] += charLines[i] || '';
        }
      } else {
        for (let i = 0; i < this.height; i++) {
          result[i] += '    ';
        }
      }
    }
    
    return result.join('\n');
  }
}

console.log('🔍 Testing Figlet Parser...\n');

try {
  const parser = new FigletParser(fontData);
  
  console.log('\n📝 Testing "HELLO":');
  const result = parser.render('HELLO');
  console.log(result);
  
  console.log('\n📝 Testing "hi":');
  console.log(parser.render('hi'));
  
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}