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
  // 以下字体已移除（oldLayout=-1，全宽模式不兼容）:
  // Isometric1, 3-D, 3x5, Alphabet, Banner3, Banner4, Barbwire, Basic, Bell
  // 5lineoblique 已移除（字体文件不可用）
  { name: 'Acrobatic', label: 'Acrobatic - 杂技', description: '杂技表演风格' },
  { name: 'Alligator', label: 'Alligator - 鳄鱼', description: '鳄鱼纹理风格' },
  { name: 'ANSI Shadow', label: 'ANSI Shadow - ANSI阴影', description: 'ANSI 阴影效果' },
  { name: 'Avatar', label: 'Avatar - 头像', description: '阿凡达风格' }
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

// FIGlet 解析器（完整版，支持所有布局模式）
class FigletParser {
  constructor(fontData) {
    console.log('[Figlet Debug] Creating FigletParser');
    this.fontData = fontData;
    this.characters = new Map();
    this.height = 0;
    this.baseline = 0;
    this.hardblank = '$';
    this.oldLayout = 0;
    this.parseFont();
  }

  parseFont() {
    // 处理 Windows 换行符
    const normalizedData = this.fontData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedData.split('\n');
    
    // 解析头部: flf2a$ hardblank height baseline maxLength oldLayout commentLines ...
    // 注意：hardblank 是 flf2a 后面的那个字符，通常是 $
    const header = lines[0];
    
    // 匹配头部: flf2a<hardblank> height baseline maxLength oldLayout commentLines ...
    // oldLayout 可能是负数（-1 表示全宽模式）
    const headerMatch = header.match(/^flf2a(.)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(\d+)/);
    if (!headerMatch) {
      throw new Error('Invalid FIGlet font header: ' + header);
    }
    
    this.hardblank = headerMatch[1]; // 通常是 '$'
    this.height = parseInt(headerMatch[2], 10);
    this.baseline = parseInt(headerMatch[3], 10);
    const maxLength = parseInt(headerMatch[4], 10);
    this.oldLayout = parseInt(headerMatch[5], 10);
    const commentLines = parseInt(headerMatch[6], 10) || 0;
    
    console.log('[Figlet Debug] Font header parsed:', {
      hardblank: this.hardblank,
      height: this.height,
      baseline: this.baseline,
      maxLength,
      oldLayout: this.oldLayout,
      commentLines
    });
    
    let lineIndex = 1 + commentLines; // 跳过注释行
    
    // 解析字符：每个字符 height 行，每行以 @ 结尾，字符结束标记是 @@
    let currentChar = 32; // 从空格开始 (ASCII 32-126 是可打印字符)
    
    while (lineIndex < lines.length && currentChar <= 126) {
      const charLines = [];
      
      // 读取 height 行
      for (let i = 0; i < this.height && lineIndex < lines.length; i++) {
        let line = lines[lineIndex] || '';
        
        // 去掉行尾的 @ 或 @@（结束标记）
        if (line.endsWith('@@')) {
          line = line.slice(0, -2);
        } else if (line.endsWith('@')) {
          line = line.slice(0, -1);
        }
        
        // hardblank 需要替换为空格，而不是删除
        // 这很重要：$ 在 figlet 中是 "硬空格"，表示必须保留的位置
        if (this.hardblank) {
          line = line.replace(new RegExp('\\' + this.hardblank, 'g'), ' ');
        }
        
        charLines.push(line);
        lineIndex++;
      }
      
      if (charLines.length === this.height) {
        // 存储字符时保留原始宽度，不做 trimEnd
        // trimEnd 会导致字符间距问题
        this.characters.set(currentChar, charLines);
        currentChar++;
      } else {
        break; // 解析完成或出错
      }
    }
    
    console.log('[Figlet Debug] Parsed characters:', this.characters.size, 'from', lineIndex, 'lines');
  }

  render(text) {
    // 根据布局模式决定字符间距
    // oldLayout = -1: 全宽模式，字符间无重叠
    // oldLayout = 0: 仅 kerning，无 smush
    // oldLayout > 0: smush 模式，字符可以重叠
    const spacing = this.oldLayout === -1 ? 0 : 1; // 全宽模式不加额外空格
    
    // 初始化结果数组
    const result = new Array(this.height).fill('');
    
    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const charLines = this.characters.get(charCode);
      
      if (charLines) {
        for (let i = 0; i < this.height; i++) {
          // 将每行追加到结果，不做 trimEnd 以保持对齐
          result[i] += charLines[i] || '';
          // 每个字符后都添加间距（保持对齐）
          if (spacing > 0) {
            result[i] += ' ';
          }
        }
      } else {
        // 对于未定义的字符，使用空格替代
        const spaceWidth = this.characters.get(32) ? this.characters.get(32)[0]?.length || 4 : 4;
        for (let i = 0; i < this.height; i++) {
          result[i] += ' '.repeat(spaceWidth + spacing);
        }
      }
    }
    
    // 去除每行末尾的空白
    return result.map(line => line.trimEnd()).join('\n');
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
