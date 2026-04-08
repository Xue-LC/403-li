// figletHelper.js - 浏览器中从 CDN 动态加载 figlet 字体

// CDN 基础路径
const FONT_CDN = 'https://unpkg.com/figlet@1.11.0/fonts/';

// 支持的字体列表（328 种，已移除不可用的 20 开头字体）
// 常用字体置顶带中文翻译，其余按字母排序
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
  { name: 'ANSI Shadow', label: 'ANSI Shadow - ANSI 阴影' },
  { name: '3-D', label: '3-D - 立体' },
  { name: 'Isometric1', label: 'Isometric1 - 等角' },
  { name: '1Row', label: '1Row - 单行' },
  { name: '3D Diagonal', label: '3D Diagonal - 3D 对角' },
  { name: '3D-ASCII', label: '3D-ASCII' },
  { name: '3x5', label: '3x5 - 点阵' },
  { name: '4Max', label: '4Max' },
  { name: '5 Line Oblique', label: '5 Line Oblique' },
  { name: 'AMC 3 Line', label: 'AMC 3 Line' },
  { name: 'AMC 3 Liv1', label: 'AMC 3 Liv1' },
  { name: 'AMC AAA01', label: 'AMC AAA01' },
  { name: 'AMC Neko', label: 'AMC Neko' },
  { name: 'AMC Razor', label: 'AMC Razor' },
  { name: 'AMC Razor2', label: 'AMC Razor2' },
  { name: 'AMC Slash', label: 'AMC Slash' },
  { name: 'AMC Slider', label: 'AMC Slider' },
  { name: 'AMC Thin', label: 'AMC Thin' },
  { name: 'AMC Tubes', label: 'AMC Tubes' },
  { name: 'AMC Untitled', label: 'AMC Untitled' },
  { name: 'ANSI Compact', label: 'ANSI Compact - 紧凑' },
  { name: 'ANSI Regular', label: 'ANSI Regular - 常规' },
  { name: 'ASCII 12', label: 'ASCII 12' },
  { name: 'ASCII 9', label: 'ASCII 9' },
  { name: 'ASCII New Roman', label: 'ASCII New Roman' },
  { name: 'Acrobatic', label: 'Acrobatic - 杂技' },
  { name: 'Alligator', label: 'Alligator - 鳄鱼' },
  { name: 'Alligator2', label: 'Alligator2' },
  { name: 'Alpha', label: 'Alpha - 字母' },
  { name: 'Alphabet', label: 'Alphabet - 字母表' },
  { name: 'Arrows', label: 'Arrows - 箭头' },
  { name: 'Avatar', label: 'Avatar - 头像' },
  { name: 'B1FF', label: 'B1FF' },
  { name: 'Babyface Lame', label: 'Babyface Lame' },
  { name: 'Babyface Leet', label: 'Babyface Leet' },
  { name: 'Banner3-D', label: 'Banner3-D' },
  { name: 'Banner3', label: 'Banner3' },
  { name: 'Banner4', label: 'Banner4' },
  { name: 'Barbwire', label: 'Barbwire - 铁丝网' },
  { name: 'Basic', label: 'Basic - 基础' },
  { name: 'Bear', label: 'Bear - 熊' },
  { name: 'Bell', label: 'Bell - 铃铛' },
  { name: 'Benjamin', label: 'Benjamin' },
  { name: 'Big ASCII 12', label: 'Big ASCII 12' },
  { name: 'Big ASCII 9', label: 'Big ASCII 9' },
  { name: 'Big Chief', label: 'Big Chief' },
  { name: 'Big Money-ne', label: 'Big Money-ne' },
  { name: 'Big Money-nw', label: 'Big Money-nw' },
  { name: 'Big Money-se', label: 'Big Money-se' },
  { name: 'Big Money-sw', label: 'Big Money-sw' },
  { name: 'Big Mono 12', label: 'Big Mono 12' },
  { name: 'Big Mono 9', label: 'Big Mono 9' },
  { name: 'Bigfig', label: 'Bigfig' },
  { name: 'Binary', label: 'Binary - 二进制' },
  { name: 'Blocks', label: 'Blocks - 方块' },
  { name: 'Bloody', label: 'Bloody - 血腥' },
  { name: 'BlurVision ASCII', label: 'BlurVision ASCII' },
  { name: 'Bolger', label: 'Bolger' },
  { name: 'Braced', label: 'Braced' },
  { name: 'Bright', label: 'Bright - 明亮' },
  { name: 'Broadway KB', label: 'Broadway KB' },
  { name: 'Broadway', label: 'Broadway - 百老汇' },
  { name: 'Bulbhead', label: 'Bulbhead' },
  { name: 'Caligraphy', label: 'Caligraphy - 书法' },
  { name: 'Caligraphy2', label: 'Caligraphy2' },
  { name: 'Calvin S', label: 'Calvin S' },
  { name: 'Cards', label: 'Cards - 卡片' },
  { name: 'Catwalk', label: 'Catwalk' },
  { name: 'Chiseled', label: 'Chiseled - 雕刻' },
  { name: 'Chunky', label: 'Chunky' },
  { name: 'Circle', label: 'Circle - 圆形' },
  { name: 'Classy', label: 'Classy - 优雅' },
  { name: 'Coder Mini', label: 'Coder Mini' },
  { name: 'Coinstak', label: 'Coinstak' },
  { name: 'Cola', label: 'Cola' },
  { name: 'Colossal', label: 'Colossal - 巨大' },
  { name: 'Computer', label: 'Computer - 电脑' },
  { name: 'Contessa', label: 'Contessa' },
  { name: 'Contrast', label: 'Contrast - 对比' },
  { name: 'Cosmike', label: 'Cosmike' },
  { name: 'Cosmike2', label: 'Cosmike2' },
  { name: 'Crawford', label: 'Crawford' },
  { name: 'Crawford2', label: 'Crawford2' },
  { name: 'Crazy', label: 'Crazy - 疯狂' },
  { name: 'Cricket', label: 'Cricket - 蟋蟀' },
  { name: 'Cursive', label: 'Cursive - 草书' },
  { name: 'Cyberlarge', label: 'Cyberlarge' },
  { name: 'Cybermedium', label: 'Cybermedium' },
  { name: 'Cybersmall', label: 'Cybersmall' },
  { name: 'Cygnet', label: 'Cygnet' },
  { name: 'DANC4', label: 'DANC4' },
  { name: 'DOS Rebel', label: 'DOS Rebel' },
  { name: 'DWhistled', label: 'DWhistled' },
  { name: 'Dancing Font', label: 'Dancing Font - 舞蹈' },
  { name: 'Decimal', label: 'Decimal - 十进制' },
  { name: 'Def Leppard', label: 'Def Leppard' },
  { name: 'Delta Corps Priest 1', label: 'Delta Corps Priest 1' },
  { name: 'DiamFont', label: 'DiamFont - 钻石' },
  { name: 'Diamond', label: 'Diamond - 钻石' },
  { name: 'Diet Cola', label: 'Diet Cola' },
  { name: 'Doh', label: 'Doh' },
  { name: 'Doom', label: 'Doom - 毁灭战士' },
  { name: 'Dot Matrix', label: 'Dot Matrix - 点阵' },
  { name: 'Double Shorts', label: 'Double Shorts' },
  { name: 'Double', label: 'Double - 双倍' },
  { name: 'Dr Pepper', label: 'Dr Pepper' },
  { name: 'Efti Chess', label: 'Efti Chess' },
  { name: 'Efti Font', label: 'Efti Font' },
  { name: 'Efti Italic', label: 'Efti Italic' },
  { name: 'Efti Piti', label: 'Efti Piti' },
  { name: 'Efti Robot', label: 'Efti Robot' },
  { name: 'Efti Wall', label: 'Efti Wall' },
  { name: 'Efti Water', label: 'Efti Water' },
  { name: 'Electronic', label: 'Electronic - 电子' },
  { name: 'Elite', label: 'Elite - 精英' },
  { name: 'Emboss 2', label: 'Emboss 2' },
  { name: 'Emboss', label: 'Emboss - 浮雕' },
  { name: 'Epic', label: 'Epic - 史诗' },
  { name: 'Fender', label: 'Fender' },
  { name: 'Filter', label: 'Filter - 滤镜' },
  { name: 'Fire Font-k', label: 'Fire Font-k' },
  { name: 'Fire Font-s', label: 'Fire Font-s' },
  { name: 'Flipped', label: 'Flipped - 翻转' },
  { name: 'Flower Power', label: 'Flower Power' },
  { name: 'Font Font', label: 'Font Font' },
  { name: 'Four Tops', label: 'Four Tops' },
  { name: 'Fraktur', label: 'Fraktur - 德文' },
  { name: 'Fun Face', label: 'Fun Face' },
  { name: 'Fun Faces', label: 'Fun Faces' },
  { name: 'Future Smooth', label: 'Future Smooth' },
  { name: 'Future Thin', label: 'Future Thin' },
  { name: 'Future', label: 'Future - 未来' },
  { name: 'Fuzzy', label: 'Fuzzy - 模糊' },
  { name: 'Georgi16', label: 'Georgi16' },
  { name: 'Georgia11', label: 'Georgia11' },
  { name: 'Ghost', label: 'Ghost - 幽灵' },
  { name: 'Ghoulish', label: 'Ghoulish' },
  { name: 'Glenyn', label: 'Glenyn' },
  { name: 'Goofy', label: 'Goofy - 高飞' },
  { name: 'Gothic', label: 'Gothic - 哥特' },
  { name: 'Graceful', label: 'Graceful - 优雅' },
  { name: 'Gradient', label: 'Gradient - 渐变' },
  { name: 'Greek', label: 'Greek - 希腊' },
  { name: 'Heart Left', label: 'Heart Left' },
  { name: 'Heart Right', label: 'Heart Right' },
  { name: 'Henry 3D', label: 'Henry 3D' },
  { name: 'Hex', label: 'Hex - 十六进制' },
  { name: 'Hieroglyphs', label: 'Hieroglyphs - 象形文字' },
  { name: 'Hollywood', label: 'Hollywood - 好莱坞' },
  { name: 'Horizontal Left', label: 'Horizontal Left' },
  { name: 'Horizontal Right', label: 'Horizontal Right' },
  { name: 'ICL-1900', label: 'ICL-1900' },
  { name: 'Impossible', label: 'Impossible - 不可能' },
  { name: 'Invita', label: 'Invita' },
  { name: 'Isometric2', label: 'Isometric2' },
  { name: 'Isometric3', label: 'Isometric3' },
  { name: 'Isometric4', label: 'Isometric4' },
  { name: 'Italic', label: 'Italic - 斜体' },
  { name: 'Ivrit', label: 'Ivrit - 希伯来' },
  { name: 'JS Block Letters', label: 'JS Block Letters' },
  { name: 'JS Bracket Letters', label: 'JS Bracket Letters' },
  { name: 'JS Capital Curves', label: 'JS Capital Curves' },
  { name: 'JS Cursive', label: 'JS Cursive' },
  { name: 'JS Stick Letters', label: 'JS Stick Letters' },
  { name: 'Jacky', label: 'Jacky' },
  { name: 'Jazmine', label: 'Jazmine' },
  { name: 'Jerusalem', label: 'Jerusalem - 耶路撒冷' },
  { name: 'Katakana', label: 'Katakana - 片假名' },
  { name: 'Kban', label: 'Kban' },
  { name: 'Keyboard', label: 'Keyboard - 键盘' },
  { name: 'Knob', label: 'Knob' },
  { name: 'Konto Slant', label: 'Konto Slant' },
  { name: 'Konto', label: 'Konto' },
  { name: 'LCD', label: 'LCD - 液晶' },
  { name: 'Larry 3D 2', label: 'Larry 3D 2' },
  { name: 'Larry 3D', label: 'Larry 3D' },
  { name: 'Lean', label: 'Lean' },
  { name: 'Letter', label: 'Letter' },
  { name: 'Letters', label: 'Letters' },
  { name: 'Lil Devil', label: 'Lil Devil' },
  { name: 'Line Blocks', label: 'Line Blocks' },
  { name: 'Linux', label: 'Linux' },
  { name: 'Lockergnome', label: 'Lockergnome' },
  { name: 'Madrid', label: 'Madrid - 马德里' },
  { name: 'Marquee', label: 'Marquee' },
  { name: 'Maxfour', label: 'Maxfour' },
  { name: 'Merlin1', label: 'Merlin1' },
  { name: 'Merlin2', label: 'Merlin2' },
  { name: 'Mike', label: 'Mike' },
  { name: 'Mini', label: 'Mini - 迷你' },
  { name: 'Mirror', label: 'Mirror - 镜子' },
  { name: 'Mnemonic', label: 'Mnemonic' },
  { name: 'Modular', label: 'Modular - 模块化' },
  { name: 'Mono 12', label: 'Mono 12' },
  { name: 'Mono 9', label: 'Mono 9' },
  { name: 'Morse', label: 'Morse - 摩尔斯' },
  { name: 'Morse2', label: 'Morse2' },
  { name: 'Moscow', label: 'Moscow - 莫斯科' },
  { name: 'Mshebrew210', label: 'Mshebrew210' },
  { name: 'Muzzle', label: 'Muzzle' },
  { name: 'NScript', label: 'NScript' },
  { name: 'NT Greek', label: 'NT Greek' },
  { name: 'NV Script', label: 'NV Script' },
  { name: 'Nancyj-Fancy', label: 'Nancyj-Fancy' },
  { name: 'Nancyj-Improved', label: 'Nancyj-Improved' },
  { name: 'Nancyj-Underlined', label: 'Nancyj-Underlined' },
  { name: 'Nancyj', label: 'Nancyj' },
  { name: 'Nipples', label: 'Nipples' },
  { name: 'O8', label: 'O8' },
  { name: 'OS2', label: 'OS2' },
  { name: 'Octal', label: 'Octal - 八进制' },
  { name: 'Ogre', label: 'Ogre - 食人魔' },
  { name: 'Old Banner', label: 'Old Banner' },
  { name: 'Pagga', label: 'Pagga' },
  { name: 'Patorjk-HeX', label: 'Patorjk-HeX' },
  { name: 'Pawp', label: 'Pawp' },
  { name: 'Peaks Slant', label: 'Peaks Slant' },
  { name: 'Peaks', label: 'Peaks' },
  { name: 'Pebbles', label: 'Pebbles' },
  { name: 'Pepper', label: 'Pepper' },
  { name: 'Poison', label: 'Poison - 毒药' },
  { name: 'Puffy', label: 'Puffy' },
  { name: 'Puzzle', label: 'Puzzle - 拼图' },
  { name: 'Pyramid', label: 'Pyramid - 金字塔' },
  { name: 'Rammstein', label: 'Rammstein' },
  { name: 'Rebel', label: 'Rebel - 叛逆' },
  { name: 'Rectangles', label: 'Rectangles - 矩形' },
  { name: 'Red Phoenix', label: 'Red Phoenix' },
  { name: 'Relief', label: 'Relief - 浮雕' },
  { name: 'Relief2', label: 'Relief2' },
  { name: 'Reverse', label: 'Reverse - 反向' },
  { name: 'Roman', label: 'Roman - 罗马' },
  { name: 'Rot13', label: 'Rot13' },
  { name: 'Rotated', label: 'Rotated - 旋转' },
  { name: 'Rounded', label: 'Rounded - 圆润' },
  { name: 'Rowan Cap', label: 'Rowan Cap' },
  { name: 'Rozzo', label: 'Rozzo' },
  { name: 'RubiFont', label: 'RubiFont' },
  { name: 'Runic', label: 'Runic - 符文' },
  { name: 'Runyc', label: 'Runyc' },
  { name: 'S Blood', label: 'S Blood' },
  { name: 'SL Script', label: 'SL Script' },
  { name: 'Santa Clara', label: 'Santa Clara' },
  { name: 'Serifcap', label: 'Serifcap' },
  { name: 'Shaded Blocky', label: 'Shaded Blocky' },
  { name: 'Shimrod', label: 'Shimrod' },
  { name: 'Short', label: 'Short - 短' },
  { name: 'Slant Relief', label: 'Slant Relief' },
  { name: 'Slide', label: 'Slide' },
  { name: 'Small ASCII 12', label: 'Small ASCII 12' },
  { name: 'Small ASCII 9', label: 'Small ASCII 9' },
  { name: 'Small Block', label: 'Small Block' },
  { name: 'Small Braille', label: 'Small Braille' },
  { name: 'Small Caps', label: 'Small Caps' },
  { name: 'Small Isometric1', label: 'Small Isometric1' },
  { name: 'Small Keyboard', label: 'Small Keyboard' },
  { name: 'Small Mono 12', label: 'Small Mono 12' },
  { name: 'Small Mono 9', label: 'Small Mono 9' },
  { name: 'Small Poison', label: 'Small Poison' },
  { name: 'Small Script', label: 'Small Script' },
  { name: 'Small Shadow', label: 'Small Shadow' },
  { name: 'Small Slant', label: 'Small Slant' },
  { name: 'Small Tengwar', label: 'Small Tengwar' },
  { name: 'Soft', label: 'Soft - 柔和' },
  { name: 'Speed', label: 'Speed - 速度' },
  { name: 'Spliff', label: 'Spliff' },
  { name: 'Stacey', label: 'Stacey' },
  { name: 'Stampate', label: 'Stampate' },
  { name: 'Stampatello', label: 'Stampatello' },
  { name: 'Star Strips', label: 'Star Strips' },
  { name: 'Star Wars', label: 'Star Wars - 星球大战' },
  { name: 'Stellar', label: 'Stellar - 恒星' },
  { name: 'Stforek', label: 'Stforek' },
  { name: 'Stick Letters', label: 'Stick Letters' },
  { name: 'Stop', label: 'Stop - 停止' },
  { name: 'Straight', label: 'Straight - 直线' },
  { name: 'Stronger Than All', label: 'Stronger Than All' },
  { name: 'Sub-Zero', label: 'Sub-Zero' },
  { name: 'Swamp Land', label: 'Swamp Land' },
  { name: 'Swan', label: 'Swan - 天鹅' },
  { name: 'Sweet', label: 'Sweet - 甜蜜' },
  { name: 'THIS', label: 'THIS' },
  { name: 'Tanja', label: 'Tanja' },
  { name: 'Tengwar', label: 'Tengwar' },
  { name: 'Term', label: 'Term' },
  { name: 'Terrace', label: 'Terrace' },
  { name: 'Test1', label: 'Test1' },
  { name: 'The Edge', label: 'The Edge' },
  { name: 'Thick', label: 'Thick - 粗' },
  { name: 'Thin', label: 'Thin - 细' },
  { name: 'Thorned', label: 'Thorned' },
  { name: 'Three Point', label: 'Three Point' },
  { name: 'Ticks Slant', label: 'Ticks Slant' },
  { name: 'Ticks', label: 'Ticks' },
  { name: 'Tiles', label: 'Tiles - 瓷砖' },
  { name: 'Tinker-Toy', label: 'Tinker-Toy' },
  { name: 'Tmplr', label: 'Tmplr' },
  { name: 'Tombstone', label: 'Tombstone - 墓碑' },
  { name: 'Train', label: 'Train - 火车' },
  { name: 'Trek', label: 'Trek' },
  { name: 'Tsalagi', label: 'Tsalagi' },
  { name: 'Tubular', label: 'Tubular' },
  { name: 'Twisted', label: 'Twisted' },
  { name: 'Two Point', label: 'Two Point' },
  { name: 'USA Flag', label: 'USA Flag' },
  { name: 'Univers', label: 'Univers' },
  { name: 'Upside Down Text', label: 'Upside Down Text' },
  { name: 'Varsity', label: 'Varsity' },
  { name: 'Wavescape', label: 'Wavescape' },
  { name: 'Wavy', label: 'Wavy' },
  { name: 'Weird', label: 'Weird - 怪异' },
  { name: 'Wet Letter', label: 'Wet Letter' },
  { name: 'Whimsy', label: 'Whimsy' },
  { name: 'WideTerm', label: 'WideTerm' },
  { name: 'Wow', label: 'Wow' },
  { name: 'miniwi', label: 'miniwi' }
  // 's Cheese' - 不可用 (404)
];

// 缓存已加载的字体
const fontCache = new Map();

// 加载字体文件（从 CDN）
async function loadFontFile(fontName) {
  if (fontCache.has(fontName)) {
    return fontCache.get(fontName);
  }

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
