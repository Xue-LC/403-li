// figletHelper.js - 浏览器中加载 figlet 字体并生成 ASCII 艺术
// 从 unpkg CDN 动态加载字体文件

// 字体 CDN 基础路径
const FONT_BASE_URL = 'https://unpkg.com/figlet@1.7.0/fonts';

// 支持的字体列表
export const AVAILABLE_FONTS = [
  { name: 'Standard', label: 'Standard - 标准', description: '经典标准字体' },
  { name: 'Slant', label: 'Slant - 斜体', description: '优雅斜体风格' },
  { name: 'Banner', label: 'Banner - 横幅', description: '大横幅风格' },
  { name: 'Block', label: 'Block - 方块', description: '方块填充风格' },
  { name: 'Big', label: 'Big - 大号', description: '超大号字体' },
  { name: 'Small', label: 'Small - 小号', description: '紧凑小号字体' },
  { name: 'Shadow', label: 'Shadow - 阴影', description: '带阴影效果' },
  { name: 'Bubble', label: 'Bubble - 泡泡', description: '圆形泡泡风格' },
  { name: 'Digital', label: 'Digital - 数码', description: '数码显示风格' },
  { name: 'Script', label: 'Script - 手写', description: '手写体风格' },
  { name: 'Graffiti', label: 'Graffiti - 涂鸦', description: '街头涂鸦风格' },
  { name: 'Isometric1', label: 'Isometric - 等角', description: '3D 等角投影' }
];

// 缓存已加载的字体
const fontCache = new Map();

// 加载字体文件
async function loadFontFile(fontName) {
  // 检查缓存
  if (fontCache.has(fontName)) {
    return fontCache.get(fontName);
  }

  try {
    const response = await fetch(`${FONT_BASE_URL}/${fontName}.flf`);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${fontName}`);
    }
    const fontData = await response.text();
    // 缓存字体数据
    fontCache.set(fontName, fontData);
    return fontData;
  } catch (error) {
    console.error(`Error loading font ${fontName}:`, error);
    throw error;
  }
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

// 使用 figlet npm 包（如果可用）或降级到简化版
export async function generateAsciiArt(text, fontName = 'Standard') {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    // 尝试动态导入 figlet 包
    const figlet = await import('figlet');
    
    // 加载字体数据
    const fontData = await loadFontFile(fontName);
    
    // 使用 figlet 的 parseFont 和 text 方法
    return new Promise((resolve, reject) => {
      try {
        // 解析字体
        const font = figlet.parseFont(fontName, fontData);
        
        // 生成文本
        figlet.text(text, { font: fontName }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (e) {
        // 降级到简化版解析器
        const parser = new FigletParser(fontData);
        resolve(parser.render(text));
      }
    });
  } catch (error) {
    console.error('Error generating ASCII art:', error);
    // 降级处理：使用简化版
    try {
      const fontData = await loadFontFile(fontName);
      const parser = new FigletParser(fontData);
      return parser.render(text);
    } catch (e) {
      throw new Error(`无法生成 ASCII 艺术: ${error.message}`);
    }
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
