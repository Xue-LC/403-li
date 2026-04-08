// figletHelper.js - 浏览器中从 CDN 动态加载 figlet 字体

// CDN 基础路径
const FONT_CDN = 'https://unpkg.com/figlet@1.11.0/fonts/';

// 支持的字体列表（所有 figlet 字体，417 种）
// 常用字体置顶，其余按字母排序
export const AVAILABLE_FONTS = [
  { name: 'Standard', label: 'Standard' },
  { name: 'Slant', label: 'Slant' },
  { name: 'Banner', label: 'Banner' },
  { name: 'Block', label: 'Block' },
  { name: 'Big', label: 'Big' },
  { name: 'Small', label: 'Small' },
  { name: 'Shadow', label: 'Shadow' },
  { name: 'Bubble', label: 'Bubble' },
  { name: 'Digital', label: 'Digital' },
  { name: 'Script', label: 'Script' },
  { name: 'Graffiti', label: 'Graffiti' },
  { name: 'ANSI Shadow', label: 'ANSI Shadow' },
  { name: '3-D', label: '3-D' },
  { name: 'Isometric1', label: 'Isometric1' },
  { name: '1Row', label: '1Row' },
  { name: '201', label: '201' },
  { name: '2012', label: '2012' },
  { name: '202', label: '202' },
  { name: '203D', label: '203D' },
  { name: '209', label: '209' },
  { name: '20AAA01', label: '20AAA01' },
  { name: '20ASCII', label: '20ASCII' },
  { name: '20All', label: '20All' },
  { name: '20Banner', label: '20Banner' },
  { name: '20Block', label: '20Block' },
  { name: '20Blocks', label: '20Blocks' },
  { name: '20Blocky', label: '20Blocky' },
  { name: '20Blood', label: '20Blood' },
  { name: '20Braille', label: '20Braille' },
  { name: '20Cap', label: '20Cap' },
  { name: '20Caps', label: '20Caps' },
  { name: '20Cheese', label: '20Cheese' },
  { name: '20Chess', label: '20Chess' },
  { name: '20Chief', label: '20Chief' },
  { name: '20Clara', label: '20Clara' },
  { name: '20Cola', label: '20Cola' },
  { name: '20Compact', label: '20Compact' },
  { name: '20Cursive', label: '20Cursive' },
  { name: '20Curves', label: '20Curves' },
  { name: '20Devil', label: '20Devil' },
  { name: '20Diagonal', label: '20Diagonal' },
  { name: '20Edge', label: '20Edge' },
  { name: '20Face', label: '20Face' },
  { name: '20Faces', label: '20Faces' },
  { name: '20Flag', label: '20Flag' },
  { name: '20Font', label: '20Font' },
  { name: '20Font-k', label: '20Font-k' },
  { name: '20Font-s', label: '20Font-s' },
  { name: '20Greek', label: '20Greek' },
  { name: '20Isometric1', label: '20Isometric1' },
  { name: '20Italic', label: '20Italic' },
  { name: '20KB', label: '20KB' },
  { name: '20Keyboard', label: '20Keyboard' },
  { name: '20Lame', label: '20Lame' },
  { name: '20Land', label: '20Land' },
  { name: '20Leet', label: '20Leet' },
  { name: '20Left', label: '20Left' },
  { name: '20Leppard', label: '20Leppard' },
  { name: '20Letter', label: '20Letter' },
  { name: '20Letters', label: '20Letters' },
  { name: '20Line', label: '20Line' },
  { name: '20Liv1', label: '20Liv1' },
  { name: '20Matrix', label: '20Matrix' },
  { name: '20Mini', label: '20Mini' },
  { name: '20Money-ne', label: '20Money-ne' },
  { name: '20Money-nw', label: '20Money-nw' },
  { name: '20Money-se', label: '20Money-se' },
  { name: '20Money-sw', label: '20Money-sw' },
  { name: '20Neko', label: '20Neko' },
  { name: '20Oblique', label: '20Oblique' },
  { name: '20Pepper', label: '20Pepper' },
  { name: '20Phoenix', label: '20Phoenix' },
  { name: '20Piti', label: '20Piti' },
  { name: '20Point', label: '20Point' },
  { name: '20Poison', label: '20Poison' },
  { name: '20Power', label: '20Power' },
  { name: '20Razor', label: '20Razor' },
  { name: '20Razor2', label: '20Razor2' },
  { name: '20Rebel', label: '20Rebel' },
  { name: '20Regular', label: '20Regular' },
  { name: '20Relief', label: '20Relief' },
  { name: '20Right', label: '20Right' },
  { name: '20Robot', label: '20Robot' },
  { name: '20Roman', label: '20Roman' },
  { name: '20S', label: '20S' },
  { name: '20Script', label: '20Script' },
  { name: '20Shadow', label: '20Shadow' },
  { name: '20Shorts', label: '20Shorts' },
  { name: '20Slant', label: '20Slant' },
  { name: '20Slash', label: '20Slash' },
  { name: '20Slider', label: '20Slider' },
  { name: '20Smooth', label: '20Smooth' },
  { name: '20Strips', label: '20Strips' },
  { name: '20Tengwar', label: '20Tengwar' },
  { name: '20Text', label: '20Text' },
  { name: '20Thin', label: '20Thin' },
  { name: '20Tops', label: '20Tops' },
  { name: '20Tubes', label: '20Tubes' },
  { name: '20Untitled', label: '20Untitled' },
  { name: '20Wall', label: '20Wall' },
  { name: '20Wars', label: '20Wars' },
  { name: '20Water', label: '20Water' },
  { name: '3D Diagonal', label: '3D Diagonal' },
  { name: '3D-ASCII', label: '3D-ASCII' },
  { name: '3x5', label: '3x5' },
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
  { name: 'ANSI Compact', label: 'ANSI Compact' },
  { name: 'ANSI Regular', label: 'ANSI Regular' },
  { name: 'ASCII 12', label: 'ASCII 12' },
  { name: 'ASCII 9', label: 'ASCII 9' },
  { name: 'ASCII New Roman', label: 'ASCII New Roman' },
  { name: 'Acrobatic', label: 'Acrobatic' },
  { name: 'Alligator', label: 'Alligator' },
  { name: 'Alligator2', label: 'Alligator2' },
  { name: 'Alpha', label: 'Alpha' },
  { name: 'Alphabet', label: 'Alphabet' },
  { name: 'Arrows', label: 'Arrows' },
  { name: 'Avatar', label: 'Avatar' },
  { name: 'B1FF', label: 'B1FF' },
  { name: 'Babyface Lame', label: 'Babyface Lame' },
  { name: 'Babyface Leet', label: 'Babyface Leet' },
  { name: 'Banner3-D', label: 'Banner3-D' },
  { name: 'Banner3', label: 'Banner3' },
  { name: 'Banner4', label: 'Banner4' },
  { name: 'Barbwire', label: 'Barbwire' },
  { name: 'Basic', label: 'Basic' },
  { name: 'Bear', label: 'Bear' },
  { name: 'Bell', label: 'Bell' },
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
  { name: 'Binary', label: 'Binary' },
  { name: 'Blocks', label: 'Blocks' },
  { name: 'Bloody', label: 'Bloody' },
  { name: 'BlurVision ASCII', label: 'BlurVision ASCII' },
  { name: 'Bolger', label: 'Bolger' },
  { name: 'Braced', label: 'Braced' },
  { name: 'Bright', label: 'Bright' },
  { name: 'Broadway KB', label: 'Broadway KB' },
  { name: 'Broadway', label: 'Broadway' },
  { name: 'Bulbhead', label: 'Bulbhead' },
  { name: 'Caligraphy', label: 'Caligraphy' },
  { name: 'Caligraphy2', label: 'Caligraphy2' },
  { name: 'Calvin S', label: 'Calvin S' },
  { name: 'Cards', label: 'Cards' },
  { name: 'Catwalk', label: 'Catwalk' },
  { name: 'Chiseled', label: 'Chiseled' },
  { name: 'Chunky', label: 'Chunky' },
  { name: 'Circle', label: 'Circle' },
  { name: 'Classy', label: 'Classy' },
  { name: 'Coder Mini', label: 'Coder Mini' },
  { name: 'Coinstak', label: 'Coinstak' },
  { name: 'Cola', label: 'Cola' },
  { name: 'Colossal', label: 'Colossal' },
  { name: 'Computer', label: 'Computer' },
  { name: 'Contessa', label: 'Contessa' },
  { name: 'Contrast', label: 'Contrast' },
  { name: 'Cosmike', label: 'Cosmike' },
  { name: 'Cosmike2', label: 'Cosmike2' },
  { name: 'Crawford', label: 'Crawford' },
  { name: 'Crawford2', label: 'Crawford2' },
  { name: 'Crazy', label: 'Crazy' },
  { name: 'Cricket', label: 'Cricket' },
  { name: 'Cursive', label: 'Cursive' },
  { name: 'Cyberlarge', label: 'Cyberlarge' },
  { name: 'Cybermedium', label: 'Cybermedium' },
  { name: 'Cybersmall', label: 'Cybersmall' },
  { name: 'Cygnet', label: 'Cygnet' },
  { name: 'DANC4', label: 'DANC4' },
  { name: 'DOS Rebel', label: 'DOS Rebel' },
  { name: 'DWhistled', label: 'DWhistled' },
  { name: 'Dancing Font', label: 'Dancing Font' },
  { name: 'Decimal', label: 'Decimal' },
  { name: 'Def Leppard', label: 'Def Leppard' },
  { name: 'Delta Corps Priest 1', label: 'Delta Corps Priest 1' },
  { name: 'DiamFont', label: 'DiamFont' },
  { name: 'Diamond', label: 'Diamond' },
  { name: 'Diet Cola', label: 'Diet Cola' },
  { name: 'Doh', label: 'Doh' },
  { name: 'Doom', label: 'Doom' },
  { name: 'Dot Matrix', label: 'Dot Matrix' },
  { name: 'Double Shorts', label: 'Double Shorts' },
  { name: 'Double', label: 'Double' },
  { name: 'Dr Pepper', label: 'Dr Pepper' },
  { name: 'Efti Chess', label: 'Efti Chess' },
  { name: 'Efti Font', label: 'Efti Font' },
  { name: 'Efti Italic', label: 'Efti Italic' },
  { name: 'Efti Piti', label: 'Efti Piti' },
  { name: 'Efti Robot', label: 'Efti Robot' },
  { name: 'Efti Wall', label: 'Efti Wall' },
  { name: 'Efti Water', label: 'Efti Water' },
  { name: 'Electronic', label: 'Electronic' },
  { name: 'Elite', label: 'Elite' },
  { name: 'Emboss 2', label: 'Emboss 2' },
  { name: 'Emboss', label: 'Emboss' },
  { name: 'Epic', label: 'Epic' },
  { name: 'Fender', label: 'Fender' },
  { name: 'Filter', label: 'Filter' },
  { name: 'Fire Font-k', label: 'Fire Font-k' },
  { name: 'Fire Font-s', label: 'Fire Font-s' },
  { name: 'Flipped', label: 'Flipped' },
  { name: 'Flower Power', label: 'Flower Power' },
  { name: 'Font Font', label: 'Font Font' },
  { name: 'Four Tops', label: 'Four Tops' },
  { name: 'Fraktur', label: 'Fraktur' },
  { name: 'Fun Face', label: 'Fun Face' },
  { name: 'Fun Faces', label: 'Fun Faces' },
  { name: 'Future Smooth', label: 'Future Smooth' },
  { name: 'Future Thin', label: 'Future Thin' },
  { name: 'Future', label: 'Future' },
  { name: 'Fuzzy', label: 'Fuzzy' },
  { name: 'Georgi16', label: 'Georgi16' },
  { name: 'Georgia11', label: 'Georgia11' },
  { name: 'Ghost', label: 'Ghost' },
  { name: 'Ghoulish', label: 'Ghoulish' },
  { name: 'Glenyn', label: 'Glenyn' },
  { name: 'Goofy', label: 'Goofy' },
  { name: 'Gothic', label: 'Gothic' },
  { name: 'Graceful', label: 'Graceful' },
  { name: 'Gradient', label: 'Gradient' },
  { name: 'Greek', label: 'Greek' },
  { name: 'Heart Left', label: 'Heart Left' },
  { name: 'Heart Right', label: 'Heart Right' },
  { name: 'Henry 3D', label: 'Henry 3D' },
  { name: 'Hex', label: 'Hex' },
  { name: 'Hieroglyphs', label: 'Hieroglyphs' },
  { name: 'Hollywood', label: 'Hollywood' },
  { name: 'Horizontal Left', label: 'Horizontal Left' },
  { name: 'Horizontal Right', label: 'Horizontal Right' },
  { name: 'ICL-1900', label: 'ICL-1900' },
  { name: 'Impossible', label: 'Impossible' },
  { name: 'Invita', label: 'Invita' },
  { name: 'Isometric2', label: 'Isometric2' },
  { name: 'Isometric3', label: 'Isometric3' },
  { name: 'Isometric4', label: 'Isometric4' },
  { name: 'Italic', label: 'Italic' },
  { name: 'Ivrit', label: 'Ivrit' },
  { name: 'JS Block Letters', label: 'JS Block Letters' },
  { name: 'JS Bracket Letters', label: 'JS Bracket Letters' },
  { name: 'JS Capital Curves', label: 'JS Capital Curves' },
  { name: 'JS Cursive', label: 'JS Cursive' },
  { name: 'JS Stick Letters', label: 'JS Stick Letters' },
  { name: 'Jacky', label: 'Jacky' },
  { name: 'Jazmine', label: 'Jazmine' },
  { name: 'Jerusalem', label: 'Jerusalem' },
  { name: 'Katakana', label: 'Katakana' },
  { name: 'Kban', label: 'Kban' },
  { name: 'Keyboard', label: 'Keyboard' },
  { name: 'Knob', label: 'Knob' },
  { name: 'Konto Slant', label: 'Konto Slant' },
  { name: 'Konto', label: 'Konto' },
  { name: 'LCD', label: 'LCD' },
  { name: 'Larry 3D 2', label: 'Larry 3D 2' },
  { name: 'Larry 3D', label: 'Larry 3D' },
  { name: 'Lean', label: 'Lean' },
  { name: 'Letter', label: 'Letter' },
  { name: 'Letters', label: 'Letters' },
  { name: 'Lil Devil', label: 'Lil Devil' },
  { name: 'Line Blocks', label: 'Line Blocks' },
  { name: 'Linux', label: 'Linux' },
  { name: 'Lockergnome', label: 'Lockergnome' },
  { name: 'Madrid', label: 'Madrid' },
  { name: 'Marquee', label: 'Marquee' },
  { name: 'Maxfour', label: 'Maxfour' },
  { name: 'Merlin1', label: 'Merlin1' },
  { name: 'Merlin2', label: 'Merlin2' },
  { name: 'Mike', label: 'Mike' },
  { name: 'Mini', label: 'Mini' },
  { name: 'Mirror', label: 'Mirror' },
  { name: 'Mnemonic', label: 'Mnemonic' },
  { name: 'Modular', label: 'Modular' },
  { name: 'Mono 12', label: 'Mono 12' },
  { name: 'Mono 9', label: 'Mono 9' },
  { name: 'Morse', label: 'Morse' },
  { name: 'Morse2', label: 'Morse2' },
  { name: 'Moscow', label: 'Moscow' },
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
  { name: 'Octal', label: 'Octal' },
  { name: 'Ogre', label: 'Ogre' },
  { name: 'Old Banner', label: 'Old Banner' },
  { name: 'Pagga', label: 'Pagga' },
  { name: 'Patorjk-HeX', label: 'Patorjk-HeX' },
  { name: 'Pawp', label: 'Pawp' },
  { name: 'Peaks Slant', label: 'Peaks Slant' },
  { name: 'Peaks', label: 'Peaks' },
  { name: 'Pebbles', label: 'Pebbles' },
  { name: 'Pepper', label: 'Pepper' },
  { name: 'Poison', label: 'Poison' },
  { name: 'Puffy', label: 'Puffy' },
  { name: 'Puzzle', label: 'Puzzle' },
  { name: 'Pyramid', label: 'Pyramid' },
  { name: 'Rammstein', label: 'Rammstein' },
  { name: 'Rebel', label: 'Rebel' },
  { name: 'Rectangles', label: 'Rectangles' },
  { name: 'Red Phoenix', label: 'Red Phoenix' },
  { name: 'Relief', label: 'Relief' },
  { name: 'Relief2', label: 'Relief2' },
  { name: 'Reverse', label: 'Reverse' },
  { name: 'Roman', label: 'Roman' },
  { name: 'Rot13', label: 'Rot13' },
  { name: 'Rotated', label: 'Rotated' },
  { name: 'Rounded', label: 'Rounded' },
  { name: 'Rowan Cap', label: 'Rowan Cap' },
  { name: 'Rozzo', label: 'Rozzo' },
  { name: 'RubiFont', label: 'RubiFont' },
  { name: 'Runic', label: 'Runic' },
  { name: 'Runyc', label: 'Runyc' },
  { name: 'S Blood', label: 'S Blood' },
  { name: 'SL Script', label: 'SL Script' },
  { name: 'Santa Clara', label: 'Santa Clara' },
  { name: 'Serifcap', label: 'Serifcap' },
  { name: 'Shaded Blocky', label: 'Shaded Blocky' },
  { name: 'Shimrod', label: 'Shimrod' },
  { name: 'Short', label: 'Short' },
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
  { name: 'Soft', label: 'Soft' },
  { name: 'Speed', label: 'Speed' },
  { name: 'Spliff', label: 'Spliff' },
  { name: 'Stacey', label: 'Stacey' },
  { name: 'Stampate', label: 'Stampate' },
  { name: 'Stampatello', label: 'Stampatello' },
  { name: 'Star Strips', label: 'Star Strips' },
  { name: 'Star Wars', label: 'Star Wars' },
  { name: 'Stellar', label: 'Stellar' },
  { name: 'Stforek', label: 'Stforek' },
  { name: 'Stick Letters', label: 'Stick Letters' },
  { name: 'Stop', label: 'Stop' },
  { name: 'Straight', label: 'Straight' },
  { name: 'Stronger Than All', label: 'Stronger Than All' },
  { name: 'Sub-Zero', label: 'Sub-Zero' },
  { name: 'Swamp Land', label: 'Swamp Land' },
  { name: 'Swan', label: 'Swan' },
  { name: 'Sweet', label: 'Sweet' },
  { name: 'THIS', label: 'THIS' },
  { name: 'Tanja', label: 'Tanja' },
  { name: 'Tengwar', label: 'Tengwar' },
  { name: 'Term', label: 'Term' },
  { name: 'Terrace', label: 'Terrace' },
  { name: 'Test1', label: 'Test1' },
  { name: 'The Edge', label: 'The Edge' },
  { name: 'Thick', label: 'Thick' },
  { name: 'Thin', label: 'Thin' },
  { name: 'Thorned', label: 'Thorned' },
  { name: 'Three Point', label: 'Three Point' },
  { name: 'Ticks Slant', label: 'Ticks Slant' },
  { name: 'Ticks', label: 'Ticks' },
  { name: 'Tiles', label: 'Tiles' },
  { name: 'Tinker-Toy', label: 'Tinker-Toy' },
  { name: 'Tmplr', label: 'Tmplr' },
  { name: 'Tombstone', label: 'Tombstone' },
  { name: 'Train', label: 'Train' },
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
  { name: 'Weird', label: 'Weird' },
  { name: 'Wet Letter', label: 'Wet Letter' },
  { name: 'Whimsy', label: 'Whimsy' },
  { name: 'WideTerm', label: 'WideTerm' },
  { name: 'Wow', label: 'Wow' },
  { name: 'miniwi', label: 'miniwi' },
  { name: 's Cheese', label: 's Cheese' }
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
