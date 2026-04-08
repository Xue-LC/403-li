// figletHelper.js - 浏览器中加载 figlet 字体并生成 ASCII 艺术
// 使用内嵌字体文件，避免 CORS 问题

// 直接导入本地字体文件（作为文本）
// 已有字体
import StandardFont from '../assets/fonts/figlet/Standard.flf?raw';
import SlantFont from '../assets/fonts/figlet/Slant.flf?raw';
import BannerFont from '../assets/fonts/figlet/Banner.flf?raw';
import BlockFont from '../assets/fonts/figlet/Block.flf?raw';
import BigFont from '../assets/fonts/figlet/Big.flf?raw';

// 新添加字体
import SmallFont from '../assets/fonts/figlet/Small.flf?raw';
import ShadowFont from '../assets/fonts/figlet/Shadow.flf?raw';
import BubbleFont from '../assets/fonts/figlet/Bubble.flf?raw';
import DigitalFont from '../assets/fonts/figlet/Digital.flf?raw';
import ScriptFont from '../assets/fonts/figlet/Script.flf?raw';
import GraffitiFont from '../assets/fonts/figlet/Graffiti.flf?raw';
// 5lineoblique.flf 已移除（字体文件不可用）
// 以下字体已移除（oldLayout=-1，全宽模式不兼容）:
// Isometric1, 3-D, 3x5, Alphabet, Banner3, Banner4, Barbwire, Basic, Bell
import AcrobaticFont from '../assets/fonts/figlet/Acrobatic.flf?raw';
import AlligatorFont from '../assets/fonts/figlet/Alligator.flf?raw';
import ANSIShadowFont from '../assets/fonts/figlet/ANSI Shadow.flf?raw';
import AvatarFont from '../assets/fonts/figlet/Avatar.flf?raw';

// 字体映射表
const FONT_MAP = {
  Standard: StandardFont,
  Slant: SlantFont,
  Banner: BannerFont,
  Block: BlockFont,
  Big: BigFont,
  Small: SmallFont,
  Shadow: ShadowFont,
  Bubble: BubbleFont,
  Digital: DigitalFont,
  Script: ScriptFont,
  Graffiti: GraffitiFont,
  // 以下字体已移除（oldLayout=-1，全宽模式不兼容）:
  // Isometric1, 3-D, 3x5, Alphabet, Banner3, Banner4, Barbwire, Basic, Bell
  // '5lineoblique' 已移除
  Acrobatic: AcrobaticFont,
  Alligator: AlligatorFont,
  'ANSI Shadow': ANSIShadowFont,
  Avatar: AvatarFont
};

// 支持的字体列表
export const AVAILABLE_FONTS = [
  { name: 'Standard', label: 'Standard - 标准', description: '经典标准字体' },
  { name: 'Slant', label: 'Slant - 斜体', description: '优雅斜体风格' },
  { name: 'Banner', label: 'Banner - 横幅', description: '大横幅风格' },
  { name: 'Block', label: 'Block - 方块', description: '方块填充风格' },
  { name: 'Big', label: 'Big - 大号', description: '超大号字体' },
  { name: 'Small', label: 'Small - 小号', description: '紧凑小字体' },
  { name: 'Shadow', label: 'Shadow - 阴影', description: '带阴影效果' },
  { name: 'Bubble', label: 'Bubble - 泡泡', description: '泡泡环绕风格' },
  { name: 'Digital', label: 'Digital - 数码', description: 'LED 数码管风格' },
  { name: 'Script', label: 'Script - 手写', description: '手写体风格' },
  { name: 'Graffiti', label: 'Graffiti - 涂鸦', description: '街头涂鸦风格' },
  { name: 'Isometric1', label: 'Isometric1 - 等距', description: '3D 等距投影' },
  { name: '3-D', label: '3-D - 立体', description: '3D 立体效果' },
  { name: '3x5', label: '3x5 - 点阵', description: '3x5 点阵字体' },
  // 5lineoblique 已移除（字体文件不可用）
  { name: 'Acrobatic', label: 'Acrobatic - 杂技', description: '杂技表演风格' },
  { name: 'Alligator', label: 'Alligator - 鳄鱼', description: '鳄鱼纹理风格' },
  { name: 'Alphabet', label: 'Alphabet - 字母', description: '纯字母风格' },
  { name: 'ANSI Shadow', label: 'ANSI Shadow - ANSI阴影', description: 'ANSI 阴影效果' },
  { name: 'Avatar', label: 'Avatar - 头像', description: '阿凡达风格' },
  { name: 'Banner3', label: 'Banner3 - 横幅3', description: '横幅风格变种3' },
  { name: 'Banner4', label: 'Banner4 - 横幅4', description: '横幅风格变种4' },
  { name: 'Barbwire', label: 'Barbwire - 铁丝网', description: '带刺铁丝网风格' },
  { name: 'Basic', label: 'Basic - 基础', description: '基础简洁风格' },
  { name: 'Bell', label: 'Bell - 铃铛', description: '铃铛形状风格' }
];

// 缓存已加载的字体
const fontCache = new Map();

// 加载字体文件
async function loadFontFile(fontName) {
  console.log('[Figlet Debug] Loading font:', fontName);
  
  // 检查缓存
  if (fontCache.has(fontName)) {
    console.log('[Figlet Debug] Font found in cache');
    return fontCache.get(fontName);
  }

  // 检查是否是本地可用字体
  if (FONT_MAP[fontName]) {
    const fontData = FONT_MAP[fontName];
    console.log('[Figlet Debug] Font data loaded, length:', fontData.length);
    console.log('[Figlet Debug] Font data first 100 chars:', fontData.substring(0, 100));
    fontCache.set(fontName, fontData);
    return fontData;
  }

  throw new Error(`Font not available: ${fontName}`);
}

// 简单的 FIGlet 解析器（简化版）
class FigletParser {
  constructor(fontData) {
    console.log('[Figlet Debug] Creating FigletParser');
    this.fontData = fontData;
    this.characters = new Map();
    this.parseFont();
  }

  parseFont() {
    // 处理 Windows 换行符
    const normalizedData = this.fontData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedData.split('\n');
    
    // 解析头部: flf2a$ height baseline maxLength oldLayout commentLines ...
    const header = lines[0];
    // 匹配所有数字: height baseline maxLength oldLayout commentLines ...
    const headerMatch = header.match(/^flf2a\$\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    if (!headerMatch) {
      throw new Error('Invalid FIGlet font header');
    }
    
    this.height = parseInt(headerMatch[1], 10);
    this.baseline = parseInt(headerMatch[2], 10);
    
    // commentLines 是第5个数字，需要跳过这些注释行
    const commentLines = parseInt(headerMatch[5], 10) || 0;
    let lineIndex = 1 + commentLines; // 跳过注释行
    
    // 简化的解析逻辑：每个字符 height 行，每行以 @ 结尾，字符结束标记是 @@
    let currentChar = 32; // 从空格开始
    
    while (lineIndex < lines.length && currentChar <= 126) {
      const charLines = [];
      
      // 读取 height 行
      for (let i = 0; i < this.height && lineIndex < lines.length; i++) {
        let line = lines[lineIndex];
        
        // 去掉行尾的 @ 或 @@
        if (line.endsWith('@@')) {
          line = line.slice(0, -2);
        } else if (line.endsWith('@')) {
          line = line.slice(0, -1);
        }
        
        // $ 是 figlet hardblank，替换为空格
        line = line.replace(/\$/g, ' ');
        
        charLines.push(line);
        lineIndex++;
      }
      
      if (charLines.length === this.height) {
        this.characters.set(currentChar, charLines);
        currentChar++;
      } else {
        break; // 解析完成或出错
      }
    }
  }

  render(text) {
    console.log('[Figlet Debug] Rendering text:', text);
    const result = new Array(this.height).fill('');
    
    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const charLines = this.characters.get(charCode);
      
      if (charLines) {
        for (let i = 0; i < this.height; i++) {
          // 字符之间加空格避免重叠（简化版，不做 smush）
          result[i] += (charLines[i] || '') + ' ';
        }
      } else {
        // 对于未定义的字符，使用空格
        console.warn('[Figlet Debug] Character not found:', char, '(code:', charCode + ')');
        for (let i = 0; i < this.height; i++) {
          result[i] += '    ';
        }
      }
    }
    
    const output = result.join('\n');
    console.log('[Figlet Debug] Rendered output length:', output.length);
    return output;
  }
}

// 生成 ASCII 艺术
export async function generateAsciiArt(text, fontName = 'Standard') {
  console.log('[Figlet Debug] generateAsciiArt called with text:', text, 'font:', fontName);
  
    if (!text || text.trim() === '') {
    return '';
  }

  try {
    // 加载字体数据
    const fontData = await loadFontFile(fontName);
    
    // 使用自定义解析器
    const parser = new FigletParser(fontData);
    const result = parser.render(text);
    return result;
  } catch (error) {
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
