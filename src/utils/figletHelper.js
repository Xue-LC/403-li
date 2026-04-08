// figletHelper.js - 浏览器中加载 figlet 字体并生成 ASCII 艺术
// 使用内嵌字体文件，避免 CORS 问题

// 直接导入本地字体文件（作为文本）
import StandardFont from '../assets/fonts/figlet/Standard.flf?raw';
import SlantFont from '../assets/fonts/figlet/Slant.flf?raw';
import BannerFont from '../assets/fonts/figlet/Banner.flf?raw';
import BlockFont from '../assets/fonts/figlet/Block.flf?raw';
import BigFont from '../assets/fonts/figlet/Big.flf?raw';

// 字体映射表
const FONT_MAP = {
  Standard: StandardFont,
  Slant: SlantFont,
  Banner: BannerFont,
  Block: BlockFont,
  Big: BigFont
};

// 支持的字体列表
export const AVAILABLE_FONTS = [
  { name: 'Standard', label: 'Standard - 标准', description: '经典标准字体' },
  { name: 'Slant', label: 'Slant - 斜体', description: '优雅斜体风格' },
  { name: 'Banner', label: 'Banner - 横幅', description: '大横幅风格' },
  { name: 'Block', label: 'Block - 方块', description: '方块填充风格' },
  { name: 'Big', label: 'Big - 大号', description: '超大号字体' }
];

// 缓存已加载的字体
const fontCache = new Map();

// 加载字体文件
async function loadFontFile(fontName) {
  // 检查缓存
  if (fontCache.has(fontName)) {
    return fontCache.get(fontName);
  }

  // 检查是否是本地可用字体
  if (FONT_MAP[fontName]) {
    const fontData = FONT_MAP[fontName];
    fontCache.set(fontName, fontData);
    return fontData;
  }

  throw new Error(`Font not available: ${fontName}`);
}

// 简单的 FIGlet 解析器（简化版）
class FigletParser {
  constructor(fontData) {
    this.fontData = fontData;
    this.characters = new Map();
    this.parseFont();
  }

  parseFont() {
    const lines = this.fontData.split('\n');
    
    // 解析头部
    const header = lines[0];
    const headerMatch = header.match(/^flf2a\$(\d+)\s+(\d+)/);
    if (!headerMatch) {
      throw new Error('Invalid FIGlet font header');
    }
    
    this.height = parseInt(headerMatch[1], 10);
    this.baseline = parseInt(headerMatch[2], 10);
    
    // 查找结束标记（通常是 @@ 或 @ 结尾）
    let currentChar = 32; // 从空格开始 (ASCII 32)
    let currentLines = [];
    let lineIndex = 1;
    
    // 跳过头部注释行
    while (lineIndex < lines.length && !lines[lineIndex].startsWith('@')) {
      lineIndex++;
    }
    
    // 解析字符
    while (lineIndex < lines.length && currentChar <= 126) {
      const line = lines[lineIndex];
      
      if (line.endsWith('@@')) {
        // 字符结束
        currentLines.push(line.slice(0, -2));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, currentLines);
          currentChar++;
          currentLines = [];
        }
      } else if (line.endsWith('@')) {
        currentLines.push(line.slice(0, -1));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, currentLines);
          currentChar++;
          currentLines = [];
        }
      } else if (line.includes('@')) {
        // 处理特殊情况
        const atIndex = line.indexOf('@');
        currentLines.push(line.slice(0, atIndex));
        if (currentLines.length === this.height) {
          this.characters.set(currentChar, currentLines);
          currentChar++;
          currentLines = [];
        }
      }
      
      lineIndex++;
    }
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
        // 对于未定义的字符，使用空格
        for (let i = 0; i < this.height; i++) {
          result[i] += ' ';
        }
      }
    }
    
    return result.join('\n');
  }
}

// 生成 ASCII 艺术
export async function generateAsciiArt(text, fontName = 'Standard') {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    // 加载字体数据
    const fontData = await loadFontFile(fontName);
    
    // 使用自定义解析器
    const parser = new FigletParser(fontData);
    return parser.render(text);
  } catch (error) {
    console.error('Error generating ASCII art:', error);
    throw new Error(`无法生成 ASCII 艺术: ${error.message}`);
  }
}

// 预加载字体（可选，用于提升性能）
export async function preloadFonts(fontNames) {
  const promises = fontNames.map(name => loadFontFile(name).catch(() => null));
  await Promise.all(promises);
}

// 检查字体是否可用
export async function checkFontAvailability(fontName) {
  try {
    await loadFontFile(fontName);
    return true;
  } catch {
    return false;
  }
}
