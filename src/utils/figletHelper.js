// figletHelper.js - 浏览器中从 CDN 动态加载 figlet 字体

// CDN 基础路径
const FONT_CDN = 'https://unpkg.com/figlet@1.11.0/fonts/';

// 支持的字体列表（所有 figlet 字体）
export const AVAILABLE_FONTS = [
  { name: 'Standard', label: 'Standard - 标准' },
  { name: 'Slant', label: 'Slant - 斜体' },
  { name: 'Banner', label: 'Banner - 横幅' },
  { name: 'Block', label: 'Block - 方块' },
  { name: 'Big', label: 'Big - 大号' },
  { name: 'Small', label: 'Small - 小号' },
  { name: 'Shadow', label: 'Shadow - 阴影' },
  { name: 'Bubble', label: 'Bubble - 泡泡' },
  { name: 'Digital', label: 'Digital - 数码' },
  { name: 'Script', label: 'Script - 手写' },
  { name: 'Graffiti', label: 'Graffiti - 涂鸦' },
  { name: 'Acrobatic', label: 'Acrobatic - 杂技' },
  { name: 'Alligator', label: 'Alligator - 鳄鱼' },
  { name: 'ANSI Shadow', label: 'ANSI Shadow - ANSI 阴影' },
  { name: 'Avatar', label: 'Avatar - 头像' },
  { name: '3-D', label: '3-D - 立体' },
  { name: '3x5', label: '3x5 - 点阵' },
  { name: '5lineoblique', label: '5 Line Oblique - 斜线' },
  { name: 'Alphabet', label: 'Alphabet - 字母' },
  { name: 'Banner3', label: 'Banner3 - 横幅 3' },
  { name: 'Banner4', label: 'Banner4 - 横幅 4' },
  { name: 'Barbwire', label: 'Barbwire - 铁丝网' },
  { name: 'Basic', label: 'Basic - 基础' },
  { name: 'Bell', label: 'Bell - 铃铛' },
  { name: 'Isometric1', label: 'Isometric1 - 等角' },
  { name: 'Isometric2', label: 'Isometric2 - 等角 2' },
  { name: 'Isometric3', label: 'Isometric3 - 等角 3' },
  { name: 'Isometric4', label: 'Isometric4 - 等角 4' },
  { name: 'Calvin S', label: 'Calvin S - 卡尔文' },
  { name: 'Doom', label: 'Doom - 毁灭' },
  { name: 'Dr Pepper', label: 'Dr Pepper - 博士' },
  { name: 'Efti Font', label: 'Efti Font - 埃夫蒂' },
  { name: 'Efti Piti', label: 'Efti Piti - 小字体' },
  { name: 'Efti Robot', label: 'Efti Robot - 机器人' },
  { name: 'Efti Water', label: 'Efti Water - 水波' },
  { name: 'Efti Wall', label: 'Efti Wall - 墙壁' },
  { name: 'Fun Faces', label: 'Fun Faces - 笑脸' },
  { name: 'Georgia11', label: 'Georgia11 - 乔治亚' },
  { name: 'I Love You', label: 'I Love You - 我爱你' },
  { name: 'Konto', label: 'Konto - 康托' },
  { name: 'Konto Slant', label: 'Konto Slant - 康托斜体' },
  { name: 'Larry 3D', label: 'Larry 3D - 拉里 3D' },
  { name: 'LCD', label: 'LCD - 液晶' },
  { name: 'Modular', label: 'Modular - 模块化' },
  { name: 'Nancyj', label: 'Nancyj - 南希' },
  { name: 'O8', label: 'O8 - O8' },
  { name: 'OS2', label: 'OS2 - OS2' },
  { name: 'Rectangles', label: 'Rectangles - 矩形' },
  { name: 'Rowan Cap', label: 'Rowan Cap - 罗文大写' },
  { name: 'Santa Clara', label: 'Santa Clara - 圣克拉拉' },
  { name: 'Sblood', label: 'Sblood - 血书' },
  { name: 'Speed', label: 'Speed - 速度' },
  { name: 'Stellar', label: 'Stellar - 恒星' },
  { name: 'Stop', label: 'Stop - 停止' },
  { name: 'Thin', label: 'Thin - 细体' },
  { name: 'Ticks', label: 'Ticks - 滴答' },
  { name: 'Tinker Toy', label: 'Tinker Toy - 玩具' },
  { name: 'Tombstone', label: 'Tombstone - 墓碑' },
  { name: 'Whimsy', label: 'Whimsy - 异想' },
  { name: 'Zapf', label: 'Zapf - 扎普夫' }
];

// 缓存已加载的字体
const fontCache = new Map();

// 加载字体文件（从 CDN）
async function loadFontFile(fontName) {
  // 检查缓存
  if (fontCache.has(fontName)) {
    return fontCache.get(fontName);
  }

  // 从 CDN 加载
  const url = `${FONT_CDN}${fontName}.flf`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`无法加载字体：${fontName}`);
  }
  const fontData = await response.text();
  fontCache.set(fontName, fontData);
  return fontData;
}

// FIGlet 解析器
class FigletParser {
  constructor(fontData) {
    this.fontData = fontData;
    this.characters = new Map();
    this.height = 0;
    this.baseline = 0;
    this.hardblank = '$';
    this.parseFont();
  }

  parseFont() {
    const normalizedData = this.fontData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedData.split('\n');
    const header = lines[0];
    
    const headerMatch = header.match(/^flf2a(.)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(\d+)/);
    if (!headerMatch) {
      throw new Error('无效的 FIGlet 字体头部');
    }
    
    this.hardblank = headerMatch[1];
    this.height = parseInt(headerMatch[2], 10);
    this.baseline = parseInt(headerMatch[3], 10);
    const commentLines = parseInt(headerMatch[6], 10) || 0;
    
    let lineIndex = 1 + commentLines;
    let currentChar = 32;
    
    while (lineIndex < lines.length && currentChar <= 126) {
      const charLines = [];
      
      for (let i = 0; i < this.height && lineIndex < lines.length; i++) {
        let line = lines[lineIndex] || '';
        
        if (line.endsWith('@@')) {
          line = line.slice(0, -2);
        } else if (line.endsWith('@')) {
          line = line.slice(0, -1);
        }
        
        if (this.hardblank) {
          line = line.replace(new RegExp('\\' + this.hardblank, 'g'), ' ');
        }
        
        charLines.push(line);
        lineIndex++;
      }
      
      if (charLines.length === this.height) {
        this.characters.set(currentChar, charLines);
        currentChar++;
      } else {
        break;
      }
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
          result[i] += ' ';
        }
      } else {
        for (let i = 0; i < this.height; i++) {
          result[i] += '    ';
        }
      }
    }
    
    return result.map(line => line.trimEnd()).join('\n');
  }
}

// 生成 ASCII 艺术
export async function generateAsciiArt(text, fontName = 'Standard') {
  if (!text || text.trim() === '') {
    return '';
  }

  const fontData = await loadFontFile(fontName);
  const parser = new FigletParser(fontData);
  return parser.render(text);
}

// 预加载字体
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
