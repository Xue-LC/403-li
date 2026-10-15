<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔬 Unicode 码点查看器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 双栏：左输入 / 右预览 -->
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              class="code-input"
              rows="10"
              spellcheck="false"
              placeholder="输入或粘贴文本，逐字符分析 Unicode 码点、名称、类别与编码字节..."
            ></textarea>

            <div class="options-group" style="margin-top: 10px;">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showInvisibleMarks" />
                <span>用占位符标记不可见字符</span>
              </label>
            </div>

            <div class="sample-row">
              <button class="tool-button" @click="loadSample('invisible')">🕵️ 不可见字符示例</button>
              <button class="tool-button" @click="loadSample('emoji')">😀 Emoji 示例</button>
              <button class="tool-button" @click="loadSample('cjk')">漢 中日韩示例</button>
            </div>

            <div class="button-group button-group-2" style="margin-top: 10px;">
              <button class="tool-button primary" @click="copyInput" :disabled="!input">📋 复制输入</button>
              <button class="tool-button danger" @click="clearAll" :disabled="!input">🗑️ 清空</button>
            </div>
          </div>

          <!-- 右栏：预览 + 概览 -->
          <div class="tool-col">
            <label class="tool-label">字符预览：</label>
            <div class="preview-box">
              <template v-if="characters.length">
                <span
                  v-for="(item, idx) in characters"
                  :key="idx"
                  class="preview-char"
                  :class="{
                    'is-invisible': item.flags.includes('invisible'),
                    'is-special': item.flags.includes('special')
                  }"
                  :title="'U+' + item.cpHex + ' · ' + (item.name || item.categoryName)"
                ><template v-if="showInvisibleMarks && item.flags.includes('invisible')">{{ markerFor(item) }}</template><template v-else>{{ item.char }}</template></span>
              </template>
              <span v-else class="preview-empty">预览将显示在这里...</span>
            </div>

            <div class="legend">
              <span class="legend-item"><i class="swatch sw-invisible"></i>不可见字符</span>
              <span class="legend-item"><i class="swatch sw-special"></i>特殊符号</span>
            </div>

            <div v-if="characters.length" class="stats-section">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">码点总数</span>
                  <span class="stat-value">{{ characters.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">UTF-8 字节</span>
                  <span class="stat-value">{{ totalUtf8Bytes }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">不可见字符</span>
                  <span class="stat-value">{{ invisibleCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">超 BMP 字符</span>
                  <span class="stat-value">{{ astralCount }}</span>
                </div>
              </div>
            </div>

            <div v-if="invisibleCount" class="status-error" style="margin-top: 12px;">
              ⚠️ 检测到 {{ invisibleCount }} 个不可见/格式字符，可能影响文本处理结果
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 全宽：逐字符详情表 -->
        <div v-if="characters.length" class="detail-wrap">
          <div class="section-header">
            <span class="section-title">▼ 逐字符分析（{{ characters.length }}）</span>
            <button class="copy-btn-inline" @click="copyReport" title="复制完整报告">📋</button>
          </div>
          <div class="table-scroll">
            <table class="uni-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>字符</th>
                  <th>码点</th>
                  <th>名称</th>
                  <th>类别</th>
                  <th>UTF-8</th>
                  <th>UTF-16</th>
                  <th>UTF-32</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in characters"
                  :key="idx"
                  :class="{ 'row-invisible': item.flags.includes('invisible') }"
                >
                  <td class="cell-idx">{{ idx + 1 }}</td>
                  <td class="cell-char">
                    <span class="char-glyph">{{ item.flags.includes('invisible') ? markerFor(item) : item.char }}</span>
                  </td>
                  <td class="cell-mono">
                    U+{{ item.cpHex }}
                    <button class="copy-btn-inline" @click="copyValue('U+' + item.cpHex)" title="复制码点">📋</button>
                  </td>
                  <td class="cell-name">{{ item.name || '—' }}</td>
                  <td class="cell-cat">
                    <span class="cat-tag">{{ item.category }}</span>
                    {{ item.categoryName }}
                  </td>
                  <td class="cell-mono">{{ item.utf8 }}</td>
                  <td class="cell-mono">{{ item.utf16 }}</td>
                  <td class="cell-mono">{{ item.utf32 }}</td>
                  <td class="cell-actions">
                    <button
                      class="tool-button"
                      style="padding: 2px 8px; font-size: 11px;"
                      @click="copyValue(item.char)"
                    >复制</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- State ---
const input = ref('')
const showInvisibleMarks = ref(true)
const error = ref('')
const success = ref('')

// --- 常用字符名称表（紧凑内置） ---
const NAMED = {}

const ASCII_NAMES = [
  'NULL', 'START OF HEADING', 'START OF TEXT', 'END OF TEXT',
  'END OF TRANSMISSION', 'ENQUIRY', 'ACKNOWLEDGE', 'BELL',
  'BACKSPACE', 'CHARACTER TABULATION', 'LINE FEED', 'VERTICAL TABULATION',
  'FORM FEED', 'CARRIAGE RETURN', 'SHIFT OUT', 'SHIFT IN',
  'DATA LINK ESCAPE', 'DEVICE CONTROL ONE', 'DEVICE CONTROL TWO', 'DEVICE CONTROL THREE',
  'DEVICE CONTROL FOUR', 'NEGATIVE ACKNOWLEDGE', 'SYNCHRONOUS IDLE', 'END OF TRANSMISSION BLOCK',
  'CANCEL', 'END OF MEDIUM', 'SUBSTITUTE', 'ESCAPE',
  'INFORMATION SEPARATOR FOUR', 'INFORMATION SEPARATOR THREE', 'INFORMATION SEPARATOR TWO', 'INFORMATION SEPARATOR ONE',
  'SPACE', 'EXCLAMATION MARK', 'QUOTATION MARK', 'NUMBER SIGN',
  'DOLLAR SIGN', 'PERCENT SIGN', 'AMPERSAND', 'APOSTROPHE',
  'LEFT PARENTHESIS', 'RIGHT PARENTHESIS', 'ASTERISK', 'PLUS SIGN',
  'COMMA', 'HYPHEN-MINUS', 'FULL STOP', 'SOLIDUS',
  'DIGIT ZERO', 'DIGIT ONE', 'DIGIT TWO', 'DIGIT THREE',
  'DIGIT FOUR', 'DIGIT FIVE', 'DIGIT SIX', 'DIGIT SEVEN',
  'DIGIT EIGHT', 'DIGIT NINE', 'COLON', 'SEMICOLON',
  'LESS-THAN SIGN', 'EQUALS SIGN', 'GREATER-THAN SIGN', 'QUESTION MARK',
  'COMMERCIAL AT', 'LATIN CAPITAL LETTER A', 'LATIN CAPITAL LETTER B', 'LATIN CAPITAL LETTER C',
  'LATIN CAPITAL LETTER D', 'LATIN CAPITAL LETTER E', 'LATIN CAPITAL LETTER F', 'LATIN CAPITAL LETTER G',
  'LATIN CAPITAL LETTER H', 'LATIN CAPITAL LETTER I', 'LATIN CAPITAL LETTER J', 'LATIN CAPITAL LETTER K',
  'LATIN CAPITAL LETTER L', 'LATIN CAPITAL LETTER M', 'LATIN CAPITAL LETTER N', 'LATIN CAPITAL LETTER O',
  'LATIN CAPITAL LETTER P', 'LATIN CAPITAL LETTER Q', 'LATIN CAPITAL LETTER R', 'LATIN CAPITAL LETTER S',
  'LATIN CAPITAL LETTER T', 'LATIN CAPITAL LETTER U', 'LATIN CAPITAL LETTER V', 'LATIN CAPITAL LETTER W',
  'LATIN CAPITAL LETTER X', 'LATIN CAPITAL LETTER Y', 'LATIN CAPITAL LETTER Z', 'LEFT SQUARE BRACKET',
  'REVERSE SOLIDUS', 'RIGHT SQUARE BRACKET', 'CIRCUMFLEX ACCENT', 'LOW LINE',
  'GRAVE ACCENT', 'LATIN SMALL LETTER A', 'LATIN SMALL LETTER B', 'LATIN SMALL LETTER C',
  'LATIN SMALL LETTER D', 'LATIN SMALL LETTER E', 'LATIN SMALL LETTER F', 'LATIN SMALL LETTER G',
  'LATIN SMALL LETTER H', 'LATIN SMALL LETTER I', 'LATIN SMALL LETTER J', 'LATIN SMALL LETTER K',
  'LATIN SMALL LETTER L', 'LATIN SMALL LETTER M', 'LATIN SMALL LETTER N', 'LATIN SMALL LETTER O',
  'LATIN SMALL LETTER P', 'LATIN SMALL LETTER Q', 'LATIN SMALL LETTER R', 'LATIN SMALL LETTER S',
  'LATIN SMALL LETTER T', 'LATIN SMALL LETTER U', 'LATIN SMALL LETTER V', 'LATIN SMALL LETTER W',
  'LATIN SMALL LETTER X', 'LATIN SMALL LETTER Y', 'LATIN SMALL LETTER Z', 'LEFT CURLY BRACKET',
  'VERTICAL LINE', 'RIGHT CURLY BRACKET', 'TILDE', 'DELETE'
]
for (let i = 0; i < 128; i++) NAMED[i] = ASCII_NAMES[i]

const LATIN1_NAMES = {
  0x80: 'PADDING CHARACTER', 0x81: 'HIGH OCTET PRESET', 0x82: 'BREAK PERMITTED HERE',
  0x83: 'NO BREAK HERE', 0x84: 'INDEX', 0x85: 'NEXT LINE',
  0x86: 'START OF SELECTED AREA', 0x87: 'END OF SELECTED AREA',
  0x88: 'CHARACTER TABULATION SET', 0x89: 'CHARACTER TABULATION WITH JUSTIFICATION',
  0x8A: 'LINE TABULATION SET', 0x8B: 'PARTIAL LINE FORWARD', 0x8C: 'PARTIAL LINE BACKWARD',
  0x8D: 'REVERSE LINE FEED', 0x8E: 'SINGLE SHIFT TWO', 0x8F: 'SINGLE SHIFT THREE',
  0x90: 'DEVICE CONTROL STRING', 0x91: 'PRIVATE USE ONE', 0x92: 'PRIVATE USE TWO',
  0x93: 'SET TRANSMIT STATE', 0x94: 'CANCEL CHARACTER', 0x95: 'MESSAGE WAITING',
  0x96: 'START OF GUARDED AREA', 0x97: 'END OF GUARDED AREA',
  0x98: 'START OF STRING', 0x99: 'SINGLE GRAPHIC CHARACTER INTRODUCER',
  0x9A: 'SINGLE CHARACTER INTRODUCER', 0x9B: 'CONTROL SEQUENCE INTRODUCER',
  0x9C: 'STRING TERMINATOR', 0x9D: 'OPERATING SYSTEM COMMAND',
  0x9E: 'PRIVACY MESSAGE', 0x9F: 'APPLICATION PROGRAM COMMAND',
  0xA0: 'NO-BREAK SPACE', 0xA1: 'INVERTED EXCLAMATION MARK', 0xA2: 'CENT SIGN',
  0xA3: 'POUND SIGN', 0xA4: 'CURRENCY SIGN', 0xA5: 'YEN SIGN',
  0xA6: 'BROKEN BAR', 0xA7: 'SECTION SIGN', 0xA8: 'DIAERESIS',
  0xA9: 'COPYRIGHT SIGN', 0xAA: 'FEMININE ORDINAL INDICATOR',
  0xAB: 'LEFT-POINTING DOUBLE ANGLE QUOTATION MARK', 0xAC: 'NOT SIGN',
  0xAD: 'SOFT HYPHEN', 0xAE: 'REGISTERED SIGN', 0xAF: 'MACRON',
  0xB0: 'DEGREE SIGN', 0xB1: 'PLUS-MINUS SIGN', 0xB2: 'SUPERSCRIPT TWO',
  0xB3: 'SUPERSCRIPT THREE', 0xB4: 'ACUTE ACCENT', 0xB5: 'MICRO SIGN',
  0xB6: 'PILCROW SIGN', 0xB7: 'MIDDLE DOT', 0xB8: 'CEDILLA',
  0xB9: 'SUPERSCRIPT ONE', 0xBA: 'MASCULINE ORDINAL INDICATOR',
  0xBB: 'RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK', 0xBC: 'VULGAR FRACTION ONE QUARTER',
  0xBD: 'VULGAR FRACTION ONE HALF', 0xBE: 'VULGAR FRACTION THREE QUARTERS',
  0xBF: 'INVERTED QUESTION MARK', 0xC0: 'LATIN CAPITAL LETTER A WITH GRAVE',
  0xC1: 'LATIN CAPITAL LETTER A WITH ACUTE', 0xC2: 'LATIN CAPITAL LETTER A WITH CIRCUMFLEX',
  0xC3: 'LATIN CAPITAL LETTER A WITH TILDE', 0xC4: 'LATIN CAPITAL LETTER A WITH DIAERESIS',
  0xC5: 'LATIN CAPITAL LETTER A WITH RING ABOVE', 0xC6: 'LATIN CAPITAL LETTER AE',
  0xC7: 'LATIN CAPITAL LETTER C WITH CEDILLA', 0xC8: 'LATIN CAPITAL LETTER E WITH GRAVE',
  0xC9: 'LATIN CAPITAL LETTER E WITH ACUTE', 0xCA: 'LATIN CAPITAL LETTER E WITH CIRCUMFLEX',
  0xCB: 'LATIN CAPITAL LETTER E WITH DIAERESIS', 0xCC: 'LATIN CAPITAL LETTER I WITH GRAVE',
  0xCD: 'LATIN CAPITAL LETTER I WITH ACUTE', 0xCE: 'LATIN CAPITAL LETTER I WITH CIRCUMFLEX',
  0xCF: 'LATIN CAPITAL LETTER I WITH DIAERESIS', 0xD0: 'LATIN CAPITAL LETTER ETH',
  0xD1: 'LATIN CAPITAL LETTER N WITH TILDE', 0xD2: 'LATIN CAPITAL LETTER O WITH GRAVE',
  0xD3: 'LATIN CAPITAL LETTER O WITH ACUTE', 0xD4: 'LATIN CAPITAL LETTER O WITH CIRCUMFLEX',
  0xD5: 'LATIN CAPITAL LETTER O WITH TILDE', 0xD6: 'LATIN CAPITAL LETTER O WITH DIAERESIS',
  0xD7: 'MULTIPLICATION SIGN', 0xD8: 'LATIN CAPITAL LETTER O WITH STROKE',
  0xD9: 'LATIN CAPITAL LETTER U WITH GRAVE', 0xDA: 'LATIN CAPITAL LETTER U WITH ACUTE',
  0xDB: 'LATIN CAPITAL LETTER U WITH CIRCUMFLEX', 0xDC: 'LATIN CAPITAL LETTER U WITH DIAERESIS',
  0xDD: 'LATIN CAPITAL LETTER Y WITH ACUTE', 0xDE: 'LATIN CAPITAL LETTER THORN',
  0xDF: 'LATIN SMALL LETTER SHARP S', 0xE0: 'LATIN SMALL LETTER A WITH GRAVE',
  0xE1: 'LATIN SMALL LETTER A WITH ACUTE', 0xE2: 'LATIN SMALL LETTER A WITH CIRCUMFLEX',
  0xE3: 'LATIN SMALL LETTER A WITH TILDE', 0xE4: 'LATIN SMALL LETTER A WITH DIAERESIS',
  0xE5: 'LATIN SMALL LETTER A WITH RING ABOVE', 0xE6: 'LATIN SMALL LETTER AE',
  0xE7: 'LATIN SMALL LETTER C WITH CEDILLA', 0xE8: 'LATIN SMALL LETTER E WITH GRAVE',
  0xE9: 'LATIN SMALL LETTER E WITH ACUTE', 0xEA: 'LATIN SMALL LETTER E WITH CIRCUMFLEX',
  0xEB: 'LATIN SMALL LETTER E WITH DIAERESIS', 0xEC: 'LATIN SMALL LETTER I WITH GRAVE',
  0xED: 'LATIN SMALL LETTER I WITH ACUTE', 0xEE: 'LATIN SMALL LETTER I WITH CIRCUMFLEX',
  0xEF: 'LATIN SMALL LETTER I WITH DIAERESIS', 0xF0: 'LATIN SMALL LETTER ETH',
  0xF1: 'LATIN SMALL LETTER N WITH TILDE', 0xF2: 'LATIN SMALL LETTER O WITH GRAVE',
  0xF3: 'LATIN SMALL LETTER O WITH ACUTE', 0xF4: 'LATIN SMALL LETTER O WITH CIRCUMFLEX',
  0xF5: 'LATIN SMALL LETTER O WITH TILDE', 0xF6: 'LATIN SMALL LETTER O WITH DIAERESIS',
  0xF7: 'DIVISION SIGN', 0xF8: 'LATIN SMALL LETTER O WITH STROKE',
  0xF9: 'LATIN SMALL LETTER U WITH GRAVE', 0xFA: 'LATIN SMALL LETTER U WITH ACUTE',
  0xFB: 'LATIN SMALL LETTER U WITH CIRCUMFLEX', 0xFC: 'LATIN SMALL LETTER U WITH DIAERESIS',
  0xFD: 'LATIN SMALL LETTER Y WITH ACUTE', 0xFE: 'LATIN SMALL LETTER THORN',
  0xFF: 'LATIN SMALL LETTER Y WITH DIAERESIS'
}
Object.assign(NAMED, LATIN1_NAMES)

const SYMBOL_NAMES = {
  0x2000: 'EN QUAD', 0x2001: 'EM QUAD', 0x2002: 'EN SPACE', 0x2003: 'EM SPACE',
  0x2004: 'THREE-PER-EM SPACE', 0x2005: 'FOUR-PER-EM SPACE', 0x2006: 'SIX-PER-EM SPACE',
  0x2007: 'FIGURE SPACE', 0x2008: 'PUNCTUATION SPACE', 0x2009: 'THIN SPACE',
  0x200A: 'HAIR SPACE', 0x200B: 'ZERO WIDTH SPACE', 0x200C: 'ZERO WIDTH NON-JOINER',
  0x200D: 'ZERO WIDTH JOINER', 0x200E: 'LEFT-TO-RIGHT MARK', 0x200F: 'RIGHT-TO-LEFT MARK',
  0x2010: 'HYPHEN', 0x2011: 'NON-BREAKING HYPHEN', 0x2012: 'FIGURE DASH',
  0x2013: 'EN DASH', 0x2014: 'EM DASH', 0x2015: 'HORIZONTAL BAR',
  0x2018: 'LEFT SINGLE QUOTATION MARK', 0x2019: 'RIGHT SINGLE QUOTATION MARK',
  0x201C: 'LEFT DOUBLE QUOTATION MARK', 0x201D: 'RIGHT DOUBLE QUOTATION MARK',
  0x2020: 'DAGGER', 0x2021: 'DOUBLE DAGGER', 0x2022: 'BULLET',
  0x2026: 'HORIZONTAL ELLIPSIS', 0x2030: 'PER MILLE SIGN', 0x2032: 'PRIME',
  0x2033: 'DOUBLE PRIME', 0x2039: 'SINGLE LEFT-POINTING ANGLE QUOTATION MARK',
  0x203A: 'SINGLE RIGHT-POINTING ANGLE QUOTATION MARK', 0x2044: 'FRACTION SLASH',
  0x2052: 'COMMERCIAL MINUS SIGN', 0x2060: 'WORD JOINER', 0x2061: 'FUNCTION APPLICATION',
  0x2062: 'INVISIBLE TIMES', 0x2063: 'INVISIBLE SEPARATOR', 0x2064: 'INVISIBLE PLUS',
  0xFEFF: 'ZERO WIDTH NO-BREAK SPACE (BOM)', 0x00A0: 'NO-BREAK SPACE',
  0x2190: 'LEFTWARDS ARROW', 0x2191: 'UPWARDS ARROW', 0x2192: 'RIGHTWARDS ARROW',
  0x2193: 'DOWNWARDS ARROW', 0x2194: 'LEFT RIGHT ARROW', 0x21D2: 'RIGHTWARDS DOUBLE ARROW',
  0x21D4: 'LEFT RIGHT DOUBLE ARROW', 0x2200: 'FOR ALL', 0x2202: 'PARTIAL DIFFERENTIAL',
  0x2203: 'THERE EXISTS', 0x2205: 'EMPTY SET', 0x2207: 'NABLA', 0x2208: 'ELEMENT OF',
  0x220F: 'N-ARY PRODUCT', 0x2211: 'N-ARY SUMMATION', 0x2212: 'MINUS SIGN',
  0x221A: 'SQUARE ROOT', 0x221D: 'PROPORTIONAL TO', 0x221E: 'INFINITY',
  0x2227: 'LOGICAL AND', 0x2228: 'LOGICAL OR', 0x2229: 'INTERSECTION', 0x222A: 'UNION',
  0x222B: 'INTEGRAL', 0x2234: 'THEREFORE', 0x223C: 'TILDE OPERATOR', 0x2248: 'ALMOST EQUAL TO',
  0x2260: 'NOT EQUAL TO', 0x2261: 'IDENTICAL TO', 0x2264: 'LESS-THAN OR EQUAL TO',
  0x2265: 'GREATER-THAN OR EQUAL TO', 0x2282: 'SUBSET OF', 0x2283: 'SUPERSET OF',
  0x2295: 'CIRCLED PLUS', 0x2297: 'CIRCLED TIMES', 0x22A5: 'UP TACK',
  0x2308: 'LEFT CEILING', 0x2309: 'RIGHT CEILING', 0x230A: 'LEFT FLOOR', 0x230B: 'RIGHT FLOOR',
  0x25A0: 'BLACK SQUARE', 0x25A1: 'WHITE SQUARE', 0x25B2: 'BLACK UP-POINTING TRIANGLE',
  0x25B6: 'BLACK RIGHT-POINTING TRIANGLE', 0x25BC: 'BLACK DOWN-POINTING TRIANGLE',
  0x25C0: 'BLACK LEFT-POINTING TRIANGLE', 0x25C6: 'BLACK DIAMOND', 0x25CB: 'WHITE CIRCLE',
  0x25CF: 'BLACK CIRCLE', 0x2605: 'BLACK STAR', 0x2606: 'WHITE STAR',
  0x2660: 'BLACK SPADE SUIT', 0x2663: 'BLACK CLUB SUIT', 0x2665: 'BLACK HEART SUIT',
  0x2666: 'BLACK DIAMOND SUIT', 0x266A: 'EIGHTH NOTE', 0x2713: 'CHECK MARK',
  0x2714: 'HEAVY CHECK MARK', 0x2717: 'BALLOT X', 0x2718: 'HEAVY BALLOT X',
  0x2728: 'SPARKLES', 0x274C: 'CROSS MARK', 0x2757: 'HEAVY EXCLAMATION MARK SYMBOL',
  0x2764: 'HEAVY BLACK HEART', 0x27A1: 'BLACK RIGHTWARDS ARROWHEAD',
  0x20AC: 'EURO SIGN', 0x00A3: 'POUND SIGN', 0x00A5: 'YEN SIGN',
  0x20B9: 'INDIAN RUPEE SIGN', 0x20BD: 'RUBLE SIGN', 0x20BF: 'BITCOIN SIGN',
  0x2122: 'TRADE MARK SIGN', 0x00A9: 'COPYRIGHT SIGN', 0x00AE: 'REGISTERED SIGN'
}
Object.assign(NAMED, SYMBOL_NAMES)

// --- 类别检测（通用类别）---
const CATEGORIES = [
  ['Lu', '大写字母'], ['Ll', '小写字母'], ['Lt', '首字母大写'],
  ['Lm', '修饰字母'], ['Lo', '其他字母'],
  ['Mn', '非间距标记'], ['Mc', '间距标记'], ['Me', '包围标记'],
  ['Nd', '十进制数字'], ['Nl', '字母数字'], ['No', '其他数字'],
  ['Pc', '连接符'], ['Pd', '破折号'], ['Ps', '开括号'],
  ['Pe', '闭括号'], ['Pi', '开引号'], ['Pf', '闭引号'], ['Po', '其他标点'],
  ['Sm', '数学符号'], ['Sc', '货币符号'], ['Sk', '修饰符号'], ['So', '其他符号'],
  ['Zs', '空格分隔符'], ['Zl', '行分隔符'], ['Zp', '段落分隔符'],
  ['Cc', '控制字符'], ['Cf', '格式字符'], ['Cs', '代理项'],
  ['Co', '私用区'], ['Cn', '未分配']
]

const catCache = new Map()
function getCategory(cp) {
  if (catCache.has(cp)) return catCache.get(cp)
  const char = String.fromCodePoint(cp)
  let result = ['Cn', '未分配']
  for (const [cat, name] of CATEGORIES) {
    try {
      if (new RegExp(`\\p{General_Category=${cat}}`, 'u').test(char)) {
        result = [cat, name]
        break
      }
    } catch (e) { /* 忽略不支持的属性 */ }
  }
  catCache.set(cp, result)
  return result
}

// --- 名称获取 ---
const HANGUL_L = ['G', 'GG', 'N', 'D', 'DD', 'R', 'M', 'B', 'BB', 'S', 'SS', '', 'J', 'JJ', 'C', 'K', 'T', 'P', 'H']
const HANGUL_V = ['A', 'AE', 'YA', 'YAE', 'EO', 'E', 'YEO', 'YE', 'O', 'WA', 'WAE', 'OE', 'YO', 'U', 'WEO', 'WE', 'WI', 'YU', 'EU', 'YI', 'I']
const HANGUL_T = ['', 'G', 'GG', 'GS', 'N', 'NJ', 'NH', 'D', 'L', 'LG', 'LM', 'LB', 'LS', 'LT', 'LP', 'LH', 'M', 'B', 'BS', 'S', 'SS', 'NG', 'J', 'C', 'K', 'T', 'P', 'H']

function getCharName(cp) {
  if (NAMED[cp]) return NAMED[cp]
  // CJK 统一表意文字
  if (cp >= 0x4E00 && cp <= 0x9FFF) {
    return 'CJK UNIFIED IDEOGRAPH-' + cp.toString(16).toUpperCase()
  }
  if (cp >= 0x3400 && cp <= 0x4DBF) {
    return 'CJK UNIFIED IDEOGRAPH EXTENSION A-' + cp.toString(16).toUpperCase()
  }
  // 韩文音节（算法可推导官方名称）
  if (cp >= 0xAC00 && cp <= 0xD7A3) {
    const s = cp - 0xAC00
    const l = Math.floor(s / 588)
    const v = Math.floor((s % 588) / 28)
    const t = s % 28
    return 'HANGUL SYLLABLE ' + HANGUL_L[l] + HANGUL_V[v] + HANGUL_T[t]
  }
  return null
}

// --- 区块识别 ---
const BLOCKS = [
  [0x0000, 0x007F, '基本拉丁字母 (Basic Latin)'],
  [0x0080, 0x00FF, '拉丁字母补充-1 (Latin-1 Supplement)'],
  [0x0100, 0x017F, '拉丁字母扩展-A'],
  [0x0180, 0x024F, '拉丁字母扩展-B'],
  [0x0250, 0x02AF, '国际音标扩展'],
  [0x0300, 0x036F, '组合附加符号'],
  [0x0370, 0x03FF, '希腊字母及科普特字母'],
  [0x0400, 0x04FF, '西里尔字母'],
  [0x0590, 0x05FF, '希伯来文'],
  [0x0600, 0x06FF, '阿拉伯文'],
  [0x0900, 0x097F, '天城文'],
  [0x0E00, 0x0E7F, '泰文'],
  [0x1100, 0x11FF, '谚文字母'],
  [0x1E00, 0x1EFF, '拉丁字母扩展附加'],
  [0x1F00, 0x1FFF, '希腊字母扩展'],
  [0x2000, 0x206F, '常用标点'],
  [0x2070, 0x209F, '上标及下标'],
  [0x20A0, 0x20CF, '货币符号'],
  [0x2100, 0x214F, '类字母符号'],
  [0x2150, 0x218F, '数字形式'],
  [0x2190, 0x21FF, '箭头'],
  [0x2200, 0x22FF, '数学运算符'],
  [0x2300, 0x23FF, '杂项技术符号'],
  [0x2460, 0x24FF, '带圈字母及数字'],
  [0x2500, 0x257F, '制表符'],
  [0x2580, 0x259F, '方块元素'],
  [0x25A0, 0x25FF, '几何图形'],
  [0x2600, 0x26FF, '杂项符号'],
  [0x2700, 0x27BF, '装饰符号'],
  [0x3000, 0x303F, '中日韩符号及标点'],
  [0x3040, 0x309F, '平假名'],
  [0x30A0, 0x30FF, '片假名'],
  [0x3100, 0x312F, '注音符号'],
  [0x3400, 0x4DBF, '中日韩统一表意文字扩展 A'],
  [0x4E00, 0x9FFF, '中日韩统一表意文字'],
  [0xA000, 0xA48F, '彝文音节'],
  [0xAC00, 0xD7AF, '谚文音节'],
  [0xE000, 0xF8FF, '私用区'],
  [0xF900, 0xFAFF, '中日韩兼容表意文字'],
  [0xFB00, 0xFB4F, '字母表达形式'],
  [0xFE00, 0xFE0F, '变体选择符'],
  [0xFE10, 0xFE1F, '竖排标点'],
  [0xFE30, 0xFE4F, '中日韩兼容形式'],
  [0xFE50, 0xFE6F, '小写变体形式'],
  [0xFF00, 0xFFEF, '半角及全角形式'],
  [0x1F300, 0x1F5FF, '杂项符号及图形 (Emoji)'],
  [0x1F600, 0x1F64F, '表情符号 (Emoji)'],
  [0x1F680, 0x1F6FF, '交通及地图符号 (Emoji)'],
  [0x1F900, 0x1F9FF, '补充符号及图形 (Emoji)']
]
function getBlock(cp) {
  for (const [lo, hi, name] of BLOCKS) {
    if (cp >= lo && cp <= hi) return name
  }
  return '未收录区块'
}

// --- 不可见 / 特殊判定 ---
function isInvisible(cp, cat) {
  if (cat === 'Cc' || cat === 'Cf' || cat === 'Cs') return true
  // 非普通空格的分隔符（如 NBSP、全角空格）
  if (cat === 'Zs' && cp !== 0x20) return true
  return false
}
function isSpecial(cp, cat) {
  if (cp < 0x80) return false
  return cat === 'So' || cat === 'Sc' || cat === 'Sk' || cp >= 0x1F000
}

// --- 编码字节 ---
const utf8Encoder = new TextEncoder()
function getUtf8(cp) {
  const bytes = utf8Encoder.encode(String.fromCodePoint(cp))
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}
function getUtf16(cp) {
  const c = String.fromCodePoint(cp)
  const out = []
  for (let i = 0; i < c.length; i++) {
    out.push(c.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0'))
  }
  return out.join(' ')
}
function getUtf32(cp) {
  return cp.toString(16).toUpperCase().padStart(8, '0')
}

// --- 逐字符分析 ---
const characters = computed(() => {
  const text = input.value
  if (!text) return []
  const out = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    const [cat, catName] = getCategory(cp)
    const flags = []
    if (isInvisible(cp, cat)) flags.push('invisible')
    if (isSpecial(cp, cat)) flags.push('special')
    out.push({
      char: ch,
      cp,
      cpHex: cp.toString(16).toUpperCase().padStart(4, '0'),
      name: getCharName(cp),
      category: cat,
      categoryName: catName,
      block: getBlock(cp),
      utf8: getUtf8(cp),
      utf16: getUtf16(cp),
      utf32: getUtf32(cp),
      flags
    })
  }
  return out
})

const totalUtf8Bytes = computed(() =>
  utf8Encoder.encode(input.value).length
)
const invisibleCount = computed(() =>
  characters.value.filter(c => c.flags.includes('invisible')).length
)
const astralCount = computed(() =>
  characters.value.filter(c => c.cp > 0xFFFF).length
)

// --- 占位符 ---
function markerFor(item) {
  const cp = item.cp
  const map = {
    0x0009: '⇥', 0x000A: '⏎', 0x000D: '⏎', 0x0020: '␣',
    0x00A0: '␣', 0x200B: '␠', 0x200C: '␠', 0x200D: '␠',
    0xFEFF: 'BOM', 0x200E: '␤', 0x200F: '␤', 0x2060: '␠',
    0x00AD: '␤', 0x3000: '␣'
  }
  if (map[cp]) return map[cp]
  return '’' + item.cpHex + '’'
}

// --- 操作 ---
async function copyValue(text) {
  if (!text) return
  try {
    await copyText(text)
    flash('已复制：' + (text.length > 30 ? text.slice(0, 30) + '…' : text))
  } catch (e) {
    error.value = '复制失败：' + e.message
  }
}

async function copyInput() {
  if (!input.value) return
  try {
    await copyText(input.value)
    flash('输入内容已复制')
  } catch (e) {
    error.value = '复制失败：' + e.message
  }
}

async function copyReport() {
  if (!characters.value.length) return
  const lines = characters.value.map((c, i) => {
    const parts = [
      `#${i + 1}`,
      `字符:${c.char}`,
      `码点:U+${c.cpHex}`,
      `名称:${c.name || c.categoryName}`,
      `类别:${c.category} ${c.categoryName}`,
      `UTF-8:${c.utf8}`,
      `UTF-16:${c.utf16}`,
      `UTF-32:${c.utf32}`
    ]
    return parts.join(' | ')
  })
  const header = `Unicode 码点分析报告\n码点总数: ${characters.value.length}  UTF-8 字节: ${totalUtf8Bytes.value}  不可见字符: ${invisibleCount.value}\n`
  try {
    await copyText(header + '\n' + lines.join('\n'))
    flash('完整报告已复制')
  } catch (e) {
    error.value = '复制失败：' + e.message
  }
}

function loadSample(type) {
  if (type === 'invisible') {
    // 包含零宽空格、零宽连接符、NBSP、BOM、软连字符
    input.value = 'hello\u200Bworld\u200C\u200D test\u00A0with\uFEFFBOM\u00ADsoft'
  } else if (type === 'emoji') {
    input.value = '😀👍🏽🎉🚀❤️👨👩👧'
  } else if (type === 'cjk') {
    input.value = '漢ひらがなカタカナ한글'
  }
  success.value = ''
  error.value = ''
}

function clearAll() {
  input.value = ''
  error.value = ''
  success.value = ''
}

let flashTimer = null
function flash(msg) {
  success.value = msg
  error.value = ''
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { success.value = '' }, 2000)
}

// 输入变化时清理旧提示
watch(input, () => { error.value = '' })
</script>

<style scoped>
.preview-box {
  min-height: 160px;
  max-height: 320px;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--panel-2);
  font-size: 20px;
  line-height: 1.9;
  word-break: break-all;
  white-space: pre-wrap;
}
.preview-empty {
  color: var(--muted);
  font-size: 13px;
}
.preview-char {
  padding: 1px 2px;
}
.preview-char.is-invisible {
  background: var(--green-soft);
  box-shadow: inset 0 0 0 1px var(--green);
  color: var(--green);
  font-size: 13px;
  padding: 2px 3px;
}
.preview-char.is-special {
  text-shadow: 0 0 8px var(--green-glow);
}

.legend {
  display: flex;
  gap: 18px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.swatch {
  width: 12px;
  height: 12px;
  display: inline-block;
  border: 1px solid var(--line);
}
.sw-invisible {
  background: var(--green-soft);
  border-color: var(--green);
}
.sw-special {
  background: var(--green);
  opacity: 0.6;
}

.sample-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.sample-row .tool-button {
  flex: 1 1 auto;
  min-width: 120px;
}

.detail-wrap {
  margin-top: 20px;
}
.table-scroll {
  max-height: 460px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 0;
}
.uni-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.uni-table th,
.uni-table td {
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}
.uni-table th {
  position: sticky;
  top: 0;
  background: var(--panel);
  color: var(--green);
  font-weight: 700;
  z-index: 1;
}
.uni-table tr:last-child td {
  border-bottom: none;
}
.uni-table th:last-child,
.uni-table td:last-child {
  border-right: none;
}
.uni-table tbody tr:hover td {
  background: var(--green-soft);
}
.row-invisible td {
  background: var(--green-soft);
}
.cell-idx {
  color: var(--muted);
}
.cell-char {
  text-align: center;
  font-size: 18px;
}
.char-glyph {
  display: inline-block;
  min-width: 20px;
}
.cell-mono {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--muted);
}
.cell-name {
  white-space: normal;
  max-width: 240px;
  color: var(--text);
}
.cell-cat {
  white-space: normal;
  max-width: 160px;
}
.cat-tag {
  display: inline-block;
  padding: 0 4px;
  margin-right: 4px;
  background: var(--green-soft);
  border: 1px solid var(--line);
  color: var(--green);
  font-size: 11px;
}
.cell-actions {
  text-align: center;
}

/* 段落标题 + 内联复制按钮 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-bottom: none;
}
.section-title {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.02em;
}
.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 8px;
  transition: all 0.2s;
}
.copy-btn-inline:hover {
  background: var(--green-soft);
}

/* 统计网格 */
.stats-section {
  margin-top: 12px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}
.stat-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}
.stat-value {
  color: var(--green);
  font-family: var(--mono);
  font-size: 16px;
}

/* 选项组 */
.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

@media (max-width: 640px) {
  .preview-box {
    font-size: 17px;
  }
  .uni-table {
    font-size: 11px;
  }
  .uni-table th,
  .uni-table td {
    padding: 4px 6px;
  }
  .cell-name {
    max-width: 160px;
  }
}
</style>
