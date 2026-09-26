<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔤 Unicode 字符查询器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入 + 搜索 -->
          <div class="tool-col">
            <label class="tool-label">输入字符：</label>
            <textarea
              v-model="input"
              class="code-input"
              rows="6"
              placeholder="输入或粘贴字符（自动分析第一个字符）..."
              @input="onInputChange"
            ></textarea>

            <label class="tool-label" style="margin-top: 16px;">搜索字符：</label>
            <input
              v-model="searchQuery"
              class="code-input-sm"
              placeholder="U+0041 / 0x41 / 65 / 关键词..."
              @keyup.enter="searchChar"
            />
            <div class="button-group button-group-2" style="margin-top: 8px;">
              <button class="tool-button primary" @click="searchChar">🔍 搜索</button>
              <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
            </div>

            <!-- 搜索建议 -->
            <div v-if="searchResults.length > 0" class="search-results">
              <div class="section-header">
                <span class="section-title">▼ 搜索结果 ({{ searchResults.length }})</span>
              </div>
              <div class="search-list">
                <div
                  v-for="(item, idx) in searchResults.slice(0, 20)"
                  :key="idx"
                  class="search-item"
                  @click="selectSearchResult(item)"
                >
                  <span class="search-char">{{ item.char }}</span>
                  <span class="search-cp">U+{{ item.cpHex }}</span>
                  <span class="search-name">{{ item.name }}</span>
                </div>
              </div>
              <div v-if="searchResults.length > 20" class="search-more">
                显示前 20 条，共 {{ searchResults.length }} 条
              </div>
            </div>

            <!-- 常用分类快速浏览 -->
            <label class="tool-label" style="margin-top: 16px;">快速浏览：</label>
            <div class="quick-nav">
              <button
                v-for="cat in quickCategories"
                :key="cat.key"
                class="tool-button"
                @click="browseCategory(cat)"
              >{{ cat.label }}</button>
            </div>
            <div v-if="browseResults.length > 0" class="search-results">
              <div class="search-list">
                <div
                  v-for="(item, idx) in browseResults.slice(0, 30)"
                  :key="idx"
                  class="search-item"
                  @click="selectSearchResult(item)"
                >
                  <span class="search-char">{{ item.char }}</span>
                  <span class="search-cp">U+{{ item.cpHex }}</span>
                  <span class="search-name">{{ item.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：分析结果 -->
          <div class="tool-col">
            <label class="tool-label">字符详情：</label>
            <div v-if="charInfo" class="char-detail">
              <!-- 大字显示 -->
              <div class="char-preview" :title="'U+' + charInfo.cpHex">
                {{ charInfo.char }}
              </div>

              <!-- 属性表格 -->
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-label">Unicode 码点</span>
                  <span class="detail-value">
                    U+{{ charInfo.cpHex }}
                    <button class="copy-btn-inline" @click="copyValue('U+' + charInfo.cpHex)" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">十进制</span>
                  <span class="detail-value">
                    {{ charInfo.cpDec }}
                    <button class="copy-btn-inline" @click="copyValue(String(charInfo.cpDec))" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">HTML 实体</span>
                  <span class="detail-value">
                    &amp;#{{ charInfo.cpDec }};
                    <button class="copy-btn-inline" @click="copyValue('&#' + charInfo.cpDec + ';')" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">CSS 转义</span>
                  <span class="detail-value">
                    {{ charInfo.cssEscape }}
                    <button class="copy-btn-inline" @click="copyValue(charInfo.cssEscape)" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">UTF-8 编码</span>
                  <span class="detail-value">
                    {{ charInfo.utf8 }}
                    <button class="copy-btn-inline" @click="copyValue(charInfo.utf8)" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">UTF-16 编码</span>
                  <span class="detail-value">
                    {{ charInfo.utf16 }}
                    <button class="copy-btn-inline" @click="copyValue(charInfo.utf16)" title="复制">📋</button>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">字符类别</span>
                  <span class="detail-value">{{ charInfo.category }} ({{ charInfo.categoryName }})</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">所属文字</span>
                  <span class="detail-value">{{ charInfo.script }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">字符名称</span>
                  <span class="detail-value char-name">{{ charInfo.name }}</span>
                </div>
                <div v-if="charInfo.block" class="detail-row">
                  <span class="detail-label">所属区块</span>
                  <span class="detail-value">{{ charInfo.block }}</span>
                </div>
              </div>

              <div class="button-group button-group-2" style="margin-top: 12px;">
                <button class="tool-button primary" @click="copyFullReport">📋 复制完整报告</button>
                <button class="tool-button" @click="copyValue(charInfo.char)">📝 复制字符</button>
              </div>
            </div>
            <div v-else class="detail-empty">
              <div class="detail-empty-icon">🔤</div>
              <div class="detail-empty-text">输入字符或搜索以查看 Unicode 详情</div>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- State ---
const input = ref('')
const searchQuery = ref('')
const charInfo = ref(null)
const error = ref('')
const success = ref(false)
const searchResults = ref([])
const browseResults = ref([])

// --- Character Name Data ---
// Compact lookup for common character names
const NAMED_CHARS = {}

// Build ASCII names (U+0000 to U+007F)
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
for (let i = 0; i < 128; i++) {
  NAMED_CHARS[i] = ASCII_NAMES[i]
}

// Latin-1 Supplement (U+0080 to U+00FF)
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
Object.assign(NAMED_CHARS, LATIN1_NAMES)

// Greek and Coptic (selected)
const GREEK_NAMES = {
  0x391: 'GREEK CAPITAL LETTER ALPHA', 0x392: 'GREEK CAPITAL LETTER BETA',
  0x393: 'GREEK CAPITAL LETTER GAMMA', 0x394: 'GREEK CAPITAL LETTER DELTA',
  0x395: 'GREEK CAPITAL LETTER EPSILON', 0x396: 'GREEK CAPITAL LETTER ZETA',
  0x397: 'GREEK CAPITAL LETTER ETA', 0x398: 'GREEK CAPITAL LETTER THETA',
  0x399: 'GREEK CAPITAL LETTER IOTA', 0x39A: 'GREEK CAPITAL LETTER KAPPA',
  0x39B: 'GREEK CAPITAL LETTER LAMDA', 0x39C: 'GREEK CAPITAL LETTER MU',
  0x39D: 'GREEK CAPITAL LETTER NU', 0x39E: 'GREEK CAPITAL LETTER XI',
  0x39F: 'GREEK CAPITAL LETTER OMICRON', 0x3A0: 'GREEK CAPITAL LETTER PI',
  0x3A1: 'GREEK CAPITAL LETTER RHO', 0x3A3: 'GREEK CAPITAL LETTER SIGMA',
  0x3A4: 'GREEK CAPITAL LETTER TAU', 0x3A5: 'GREEK CAPITAL LETTER UPSILON',
  0x3A6: 'GREEK CAPITAL LETTER PHI', 0x3A7: 'GREEK CAPITAL LETTER CHI',
  0x3A8: 'GREEK CAPITAL LETTER PSI', 0x3A9: 'GREEK CAPITAL LETTER OMEGA',
  0x3B1: 'GREEK SMALL LETTER ALPHA', 0x3B2: 'GREEK SMALL LETTER BETA',
  0x3B3: 'GREEK SMALL LETTER GAMMA', 0x3B4: 'GREEK SMALL LETTER DELTA',
  0x3B5: 'GREEK SMALL LETTER EPSILON', 0x3B6: 'GREEK SMALL LETTER ZETA',
  0x3B7: 'GREEK SMALL LETTER ETA', 0x3B8: 'GREEK SMALL LETTER THETA',
  0x3B9: 'GREEK SMALL LETTER IOTA', 0x3BA: 'GREEK SMALL LETTER KAPPA',
  0x3BB: 'GREEK SMALL LETTER LAMDA', 0x3BC: 'GREEK SMALL LETTER MU',
  0x3BD: 'GREEK SMALL LETTER NU', 0x3BE: 'GREEK SMALL LETTER XI',
  0x3BF: 'GREEK SMALL LETTER OMICRON', 0x3C0: 'GREEK SMALL LETTER PI',
  0x3C1: 'GREEK SMALL LETTER RHO', 0x3C3: 'GREEK SMALL LETTER SIGMA',
  0x3C4: 'GREEK SMALL LETTER TAU', 0x3C5: 'GREEK SMALL LETTER UPSILON',
  0x3C6: 'GREEK SMALL LETTER PHI', 0x3C7: 'GREEK SMALL LETTER CHI',
  0x3C8: 'GREEK SMALL LETTER PSI', 0x3C9: 'GREEK SMALL LETTER OMEGA'
}
Object.assign(NAMED_CHARS, GREEK_NAMES)

// Common punctuation (U+2000 to U+206F)
const PUNCT_NAMES = {
  0x2000: 'EN QUAD', 0x2001: 'EM QUAD', 0x2002: 'EN SPACE', 0x2003: 'EM SPACE',
  0x2004: 'THREE-PER-EM SPACE', 0x2005: 'FOUR-PER-EM SPACE', 0x2006: 'SIX-PER-EM SPACE',
  0x2007: 'FIGURE SPACE', 0x2008: 'PUNCTUATION SPACE', 0x2009: 'THIN SPACE',
  0x200A: 'HAIR SPACE', 0x200B: 'ZERO WIDTH SPACE', 0x200C: 'ZERO WIDTH NON-JOINER',
  0x200D: 'ZERO WIDTH JOINER', 0x200E: 'LEFT-TO-RIGHT MARK', 0x200F: 'RIGHT-TO-LEFT MARK',
  0x2010: 'HYPHEN', 0x2011: 'NON-BREAKING HYPHEN', 0x2012: 'FIGURE DASH',
  0x2013: 'EN DASH', 0x2014: 'EM DASH', 0x2015: 'HORIZONTAL BAR',
  0x2016: 'DOUBLE VERTICAL LINE', 0x2017: 'DOUBLE LOW LINE', 0x2018: 'LEFT SINGLE QUOTATION MARK',
  0x2019: 'RIGHT SINGLE QUOTATION MARK', 0x201A: 'SINGLE LOW-9 QUOTATION MARK',
  0x201B: 'SINGLE HIGH-REVERSED-9 QUOTATION MARK', 0x201C: 'LEFT DOUBLE QUOTATION MARK',
  0x201D: 'RIGHT DOUBLE QUOTATION MARK', 0x201E: 'DOUBLE LOW-9 QUOTATION MARK',
  0x2020: 'DAGGER', 0x2021: 'DOUBLE DAGGER', 0x2022: 'BULLET',
  0x2023: 'TRIANGULAR BULLET', 0x2024: 'ONE DOT LEADER', 0x2025: 'TWO DOT LEADER',
  0x2026: 'HORIZONTAL ELLIPSIS', 0x2027: 'HYPHENATION POINT',
  0x2030: 'PER MILLE SIGN', 0x2031: 'PER TEN THOUSAND SIGN',
  0x2032: 'PRIME', 0x2033: 'DOUBLE PRIME',
  0x2039: 'SINGLE LEFT-POINTING ANGLE QUOTATION MARK',
  0x203A: 'SINGLE RIGHT-POINTING ANGLE QUOTATION MARK',
  0x203C: 'DOUBLE EXCLAMATION MARK', 0x203D: 'INTERROBANG',
  0x2044: 'FRACTION SLASH', 0x2049: 'EXCLAMATION QUESTION MARK',
  0x2052: 'COMMERCIAL MINUS SIGN', 0x2060: 'WORD JOINER',
  0x2061: 'FUNCTION APPLICATION', 0x2062: 'INVISIBLE TIMES', 0x2063: 'INVISIBLE SEPARATOR',
  0x2064: 'INVISIBLE PLUS'
}
Object.assign(NAMED_CHARS, PUNCT_NAMES)

// Common math symbols
const MATH_NAMES = {
  0x2190: 'LEFTWARDS ARROW', 0x2191: 'UPWARDS ARROW', 0x2192: 'RIGHTWARDS ARROW',
  0x2193: 'DOWNWARDS ARROW', 0x2194: 'LEFT RIGHT ARROW',
  0x21D2: 'RIGHTWARDS DOUBLE ARROW', 0x21D4: 'LEFT RIGHT DOUBLE ARROW',
  0x2200: 'FOR ALL', 0x2202: 'PARTIAL DIFFERENTIAL', 0x2203: 'THERE EXISTS',
  0x2205: 'EMPTY SET', 0x2207: 'NABLA', 0x2208: 'ELEMENT OF',
  0x2209: 'NOT AN ELEMENT OF', 0x220B: 'CONTAINS AS MEMBER',
  0x220F: 'N-ARY PRODUCT', 0x2211: 'N-ARY SUMMATION',
  0x2212: 'MINUS SIGN', 0x2217: 'ASTERISK OPERATOR',
  0x221A: 'SQUARE ROOT', 0x221D: 'PROPORTIONAL TO', 0x221E: 'INFINITY',
  0x221F: 'RIGHT ANGLE', 0x2220: 'ANGLE', 0x2227: 'LOGICAL AND',
  0x2228: 'LOGICAL OR', 0x2229: 'INTERSECTION', 0x222A: 'UNION',
  0x222B: 'INTEGRAL', 0x222C: 'DOUBLE INTEGRAL', 0x222E: 'CONTOUR INTEGRAL',
  0x2234: 'THEREFORE', 0x2235: 'BECAUSE',
  0x223C: 'TILDE OPERATOR', 0x223D: 'REVERSED TILDE',
  0x2248: 'ALMOST EQUAL TO', 0x224C: 'ALL EQUAL TO',
  0x2252: 'APPROXIMATELY EQUAL TO OR THE IMAGE OF',
  0x2260: 'NOT EQUAL TO', 0x2261: 'IDENTICAL TO',
  0x2264: 'LESS-THAN OR EQUAL TO', 0x2265: 'GREATER-THAN OR EQUAL TO',
  0x226A: 'MUCH LESS-THAN', 0x226B: 'MUCH GREATER-THAN',
  0x226E: 'NOT LESS-THAN', 0x226F: 'NOT GREATER-THAN',
  0x2282: 'SUBSET OF', 0x2283: 'SUPERSET OF', 0x2286: 'SUBSET OF OR EQUAL TO',
  0x2287: 'SUPERSET OF OR EQUAL TO', 0x2295: 'CIRCLED PLUS', 0x2297: 'CIRCLED TIMES',
  0x22A5: 'UP TACK', 0x22C5: 'DOT OPERATOR',
  0x2308: 'LEFT CEILING', 0x2309: 'RIGHT CEILING',
  0x230A: 'LEFT FLOOR', 0x230B: 'RIGHT FLOOR',
  0x2320: 'TOP HALF INTEGRAL', 0x2321: 'BOTTOM HALF INTEGRAL',
  0x25B2: 'BLACK UP-POINTING TRIANGLE', 0x25B6: 'BLACK RIGHT-POINTING TRIANGLE',
  0x25BC: 'BLACK DOWN-POINTING TRIANGLE', 0x25C0: 'BLACK LEFT-POINTING TRIANGLE',
  0x25C6: 'BLACK DIAMOND', 0x25CB: 'WHITE CIRCLE', 0x25CF: 'BLACK CIRCLE',
  0x25A0: 'BLACK SQUARE', 0x25A1: 'WHITE SQUARE',
  0x2605: 'BLACK STAR', 0x2606: 'WHITE STAR',
  0x2660: 'BLACK SPADE SUIT', 0x2661: 'WHITE HEART SUIT',
  0x2662: 'WHITE DIAMOND SUIT', 0x2663: 'BLACK CLUB SUIT',
  0x2664: 'WHITE SPADE SUIT', 0x2665: 'BLACK HEART SUIT',
  0x2666: 'BLACK DIAMOND SUIT', 0x2667: 'WHITE CLUB SUIT',
  0x2669: 'QUARTER NOTE', 0x266A: 'EIGHTH NOTE',
  0x266B: 'BEAMED EIGHTH NOTES', 0x266C: 'BEAMED SIXTEENTH NOTES',
  0x266D: 'MUSIC FLAT SIGN', 0x266E: 'MUSIC NATURAL SIGN', 0x266F: 'MUSIC SHARP SIGN',
  0x2713: 'CHECK MARK', 0x2714: 'HEAVY CHECK MARK',
  0x2717: 'BALLOT X', 0x2718: 'HEAVY BALLOT X',
  0x2728: 'SPARKLES', 0x273F: 'BLACK FLORETTE',
  0x274C: 'CROSS MARK', 0x2753: 'BLACK QUESTION MARK ORNAMENT',
  0x2757: 'HEAVY EXCLAMATION MARK SYMBOL',
  0x2764: 'HEAVY BLACK HEART',
  0x2795: 'HEAVY PLUS SIGN', 0x2796: 'HEAVY MINUS SIGN',
  0x2797: 'HEAVY DIVISION SIGN',
  0x27A1: 'BLACK RIGHTWARDS ARROWHEAD',
  0x2934: 'ARROW POINTING RIGHTWARDS THEN CURVING UPWARDS',
  0x2935: 'ARROW POINTING RIGHTWARDS THEN CURVING DOWNWARDS'
}
Object.assign(NAMED_CHARS, MATH_NAMES)

// Currency symbols
const CURRENCY_NAMES = {
  0x20A0: 'EURO-CURRENCY SIGN', 0x20A1: 'COLON SIGN', 0x20A2: 'CRUZEIRO SIGN',
  0x20A3: 'FRENCH FRANC SIGN', 0x20A4: 'LIRA SIGN', 0x20A5: 'MILL SIGN',
  0x20A6: 'NAIRA SIGN', 0x20A7: 'PESETA SIGN', 0x20A8: 'RUPEE SIGN',
  0x20A9: 'WON SIGN', 0x20AA: 'NEW SHEQEL SIGN', 0x20AB: 'DONG SIGN',
  0x20AC: 'EURO SIGN', 0x20AD: 'KIP SIGN', 0x20AE: 'TUGRIK SIGN',
  0x20AF: 'DRACHMA SIGN', 0x20B0: 'GERMAN PENNY SIGN', 0x20B1: 'PESO SIGN',
  0x20B9: 'INDIAN RUPEE SIGN', 0x20BA: 'TURKISH LIRA SIGN',
  0x20BD: 'RUBLE SIGN', 0x20BF: 'BITCOIN SIGN'
}
Object.assign(NAMED_CHARS, CURRENCY_NAMES)

// --- Unicode category detection ---
function getCategory(cp) {
  const char = String.fromCodePoint(cp)
  const cats = [
    ['Lu', '大写字母'], ['Ll', '小写字母'], ['Lt', '首字母大写'],
    ['Lm', '修饰字母'], ['Lo', '其他字母'],
    ['Mn', '非间距标记'], ['Mc', '间距标记'], ['Me', '包围标记'],
    ['Nd', '十进制数字'], ['Nl', '字母数字'], ['No', '其他数字'],
    ['Pc', '连接符'], ['Pd', '破折号'], ['Ps', '开括号'],
    ['Pe', '闭括号'], ['Pi', '开引号'], ['Pf', '闭引号'],
    ['Po', '其他标点'],
    ['Sm', '数学符号'], ['Sc', '货币符号'], ['Sk', '修饰符号'], ['So', '其他符号'],
    ['Zs', '空格分隔符'], ['Zl', '行分隔符'], ['Zp', '段落分隔符'],
    ['Cc', '控制字符'], ['Cf', '格式字符'], ['Cs', '代理项'],
    ['Co', '私用区'], ['Cn', '未分配']
  ]
  for (const [cat, name] of cats) {
    try {
      const re = new RegExp(`\\p{General_Category=${cat}}`, 'u')
      if (re.test(char)) return [cat, name]
    } catch (e) { /* skip */ }
  }
  // Fallback
  try {
    if (/\p{L}/u.test(char)) return ['L', '字母']
    if (/\p{N}/u.test(char)) return ['N', '数字']
    if (/\p{P}/u.test(char)) return ['P', '标点']
    if (/\p{S}/u.test(char)) return ['S', '符号']
    if (/\p{Z}/u.test(char)) return ['Z', '分隔符']
    if (/\p{C}/u.test(char)) return ['C', '控制字符']
  } catch (e) { /* skip */ }
  return ['?', '未知']
}

// --- Script detection ---
function getScript(cp) {
  const char = String.fromCodePoint(cp)
  const scripts = [
    ['Latin', '拉丁字母'], ['Cyrillic', '西里尔字母'], ['Greek', '希腊字母'],
    ['Han', '汉字'], ['Hiragana', '平假名'], ['Katakana', '片假名'],
    ['Hangul', '韩文'], ['Arabic', '阿拉伯字母'], ['Hebrew', '希伯来字母'],
    ['Devanagari', '天城文'], ['Thai', '泰文'], ['Myanmar', '缅甸文'],
    ['Georgian', '格鲁吉亚字母'], ['Armenian', '亚美尼亚字母'],
    ['Ethiopic', '埃塞俄比亚文'], ['Mongolian', '蒙古文'], ['Tibetan', '藏文'],
    ['Common', '通用'], ['Inherited', '继承']
  ]
  for (const [sc, name] of scripts) {
    try {
      const re = new RegExp(`\\p{Script=${sc}}`, 'u')
      if (re.test(char)) return `${name} (${sc})`
    } catch (e) { /* skip */ }
  }
  return '未知'
}

// --- Get character name ---
function getCharName(cp) {
  if (NAMED_CHARS[cp]) return NAMED_CHARS[cp]
  // CJK Unified Ideographs (U+4E00 to U+9FFF)
  if (cp >= 0x4E00 && cp <= 0x9FFF) {
    return 'CJK UNIFIED IDEOGRAPH-' + cp.toString(16).toUpperCase().padStart(4, '0')
  }
  // CJK Extension A (U+3400 to U+4DBF)
  if (cp >= 0x3400 && cp <= 0x4DBF) {
    return 'CJK UNIFIED IDEOGRAPH EXTENSION A-' + cp.toString(16).toUpperCase().padStart(4, '0')
  }
  // Hangul Syllables
  if (cp >= 0xAC00 && cp <= 0xD7AF) {
    return 'HANGUL SYLLABLE'
  }
  return null
}

// --- Block identification ---
function getBlock(cp) {
  const blocks = [
    [0x0000, 0x007F, '基本拉丁字母 (Basic Latin)'],
    [0x0080, 0x00FF, '拉丁字母补充-1 (Latin-1 Supplement)'],
    [0x0100, 0x017F, '拉丁字母扩展-A'],
    [0x0180, 0x024F, '拉丁字母扩展-B'],
    [0x0250, 0x02AF, '国际音标扩展'],
    [0x0370, 0x03FF, '希腊字母及科普特字母'],
    [0x0400, 0x04FF, '西里尔字母'],
    [0x2000, 0x206F, '常用标点'],
    [0x2070, 0x209F, '上标及下标'],
    [0x20A0, 0x20CF, '货币符号'],
    [0x2100, 0x214F, '类字母符号'],
    [0x2150, 0x218F, '数字形式'],
    [0x2190, 0x21FF, '箭头'],
    [0x2200, 0x22FF, '数学运算符'],
    [0x2300, 0x23FF, '杂项工业符号'],
    [0x2400, 0x243F, '控制图片'],
    [0x2440, 0x245F, '光学字符识别'],
    [0x2460, 0x24FF, '带圈字母数字'],
    [0x2500, 0x257F, '制表符'],
    [0x2580, 0x259F, '方块元素'],
    [0x25A0, 0x25FF, '几何图形'],
    [0x2600, 0x26FF, '杂项符号'],
    [0x2700, 0x27BF, '装饰符号'],
    [0x27C0, 0x27EF, '杂项数学符号-A'],
    [0x27F0, 0x27FF, '补充箭头-A'],
    [0x2900, 0x297F, '补充箭头-B'],
    [0x2980, 0x29FF, '杂项数学符号-B'],
    [0x2A00, 0x2AFF, '补充数学运算符'],
    [0x2B00, 0x2BFF, '杂项符号和箭头'],
    [0x3000, 0x303F, '中日韩标点符号'],
    [0x3040, 0x309F, '日文平假名'],
    [0x30A0, 0x30FF, '日文片假名'],
    [0x3100, 0x312F, '注音字母'],
    [0x3130, 0x318F, '韩文兼容字母'],
    [0x3190, 0x319F, '汉文标注符号'],
    [0x31A0, 0x31BF, '注音字母扩展'],
    [0x31F0, 0x31FF, '日文片假名语音扩展'],
    [0x3200, 0x32FF, '带圈中日韩字母和月份'],
    [0x3300, 0x33FF, '中日韩兼容字符'],
    [0x3400, 0x4DBF, '中日韩统一表意文字扩展-A'],
    [0x4DC0, 0x4DFF, '易经六十四卦符号'],
    [0x4E00, 0x9FFF, '中日韩统一表意文字 (CJK)'],
    [0xA000, 0xA48F, '彝文音节'],
    [0xA490, 0xA4CF, '彝文部首'],
    [0xAC00, 0xD7AF, '韩文音节'],
    [0xD800, 0xDB7F, '高代理项'],
    [0xDB80, 0xDBFF, '高代理项（私用）'],
    [0xDC00, 0xDFFF, '低代理项'],
    [0xE000, 0xF8FF, '私用区'],
    [0xF900, 0xFAFF, '中日韩兼容表意文字'],
    [0xFB00, 0xFB4F, '字母表达形式'],
    [0xFE00, 0xFE0F, '变体选择符'],
    [0xFE10, 0xFE1F, '竖排形式'],
    [0xFE20, 0xFE2F, '组合半角标记'],
    [0xFE30, 0xFE4F, '中日韩兼容形式'],
    [0xFE50, 0xFE6F, '小写变体形式'],
    [0xFE70, 0xFEFF, '阿拉伯文表达形式-B'],
    [0xFF00, 0xFFEF, '半角及全角形式'],
    [0xFFF0, 0xFFFF, '特殊'],
    [0x10000, 0x1007F, '线性文字B音节'],
    [0x10080, 0x100FF, '线性文字B表意文字'],
    [0x10100, 0x1013F, '爱琴数字'],
    [0x10300, 0x1032F, '古意大利字母'],
    [0x10330, 0x1034F, '哥特字母'],
    [0x10400, 0x1044F, '德赛莱特字母'],
    [0x1D000, 0x1D0FF, '拜占庭音乐符号'],
    [0x1D100, 0x1D1FF, '音乐符号'],
    [0x1D300, 0x1D35F, '太玄经符号'],
    [0x1D400, 0x1D7FF, '数学字母数字符号'],
    [0x1F000, 0x1F02F, '麻将牌'],
    [0x1F030, 0x1F09F, '多米诺骨牌'],
    [0x1F0A0, 0x1F0FF, '扑克牌'],
    [0x1F100, 0x1F1FF, '带圈字母数字补充'],
    [0x1F200, 0x1F2FF, '带圈表意文字补充'],
    [0x1F300, 0x1F5FF, '杂项符号和象形文字'],
    [0x1F600, 0x1F64F, '表情符号'],
    [0x1F650, 0x1F67F, '装饰符号'],
    [0x1F680, 0x1F6FF, '交通和地图符号'],
    [0x1F700, 0x1F77F, '炼金术符号'],
    [0x1F780, 0x1F7FF, '几何形状扩展'],
    [0x1F800, 0x1F8FF, '补充箭头-C'],
    [0x1F900, 0x1F9FF, '补充符号和象形文字'],
    [0x1FA00, 0x1FA6F, '国际象棋符号'],
    [0x1FA70, 0x1FAFF, '符号和象形文字扩展-A'],
    [0x20000, 0x2A6DF, '中日韩统一表意文字扩展-B'],
    [0x2A700, 0x2B73F, '中日韩统一表意文字扩展-C'],
    [0x2B740, 0x2B81F, '中日韩统一表意文字扩展-D'],
    [0x2B820, 0x2CEAF, '中日韩统一表意文字扩展-E'],
    [0x2CEB0, 0x2EBEF, '中日韩统一表意文字扩展-F'],
    [0xE0000, 0xE007F, '语言标签'],
    [0xF0000, 0xFFFFF, '补充私用区-A'],
    [0x100000, 0x10FFFF, '补充私用区-B']
  ]
  for (const [start, end, name] of blocks) {
    if (cp >= start && cp <= end) return name
  }
  return null
}

// --- Analyze a code point ---
function analyzeCodePoint(cp) {
  const char = String.fromCodePoint(cp)
  const cpHex = cp.toString(16).toUpperCase().padStart(cp > 0xFFFF ? 6 : 4, '0')
  const cpHexFull = cp.toString(16).toUpperCase()

  // UTF-8
  const encoder = new TextEncoder()
  const utf8Bytes = encoder.encode(char)
  const utf8 = Array.from(utf8Bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

  // UTF-16
  let utf16
  if (cp <= 0xFFFF) {
    utf16 = cp.toString(16).toUpperCase().padStart(4, '0')
  } else {
    const high = 0xD800 + Math.floor((cp - 0x10000) / 0x400)
    const low = 0xDC00 + ((cp - 0x10000) % 0x400)
    utf16 = high.toString(16).toUpperCase().padStart(4, '0') + ' ' + low.toString(16).toUpperCase().padStart(4, '0')
  }

  // CSS escape
  const cssEscape = cp > 0xFFFF
    ? '\\' + cpHexFull.padStart(6, '0') + ' '
    : '\\' + cpHex

  const [catCode, catName] = getCategory(cp)
  const script = getScript(cp)
  const name = getCharName(cp) || '（未收录名称）'
  const block = getBlock(cp)

  return {
    char,
    cpDec: cp,
    cpHex,
    cpHexFull,
    utf8,
    utf16,
    cssEscape,
    category: catCode,
    categoryName: catName,
    script,
    name,
    block
  }
}

// --- Handle input change ---
function onInputChange() {
  error.value = ''
  success.value = false
  searchResults.value = []
  browseResults.value = []

  const text = input.value
  if (!text) {
    charInfo.value = null
    return
  }
  const cp = text.codePointAt(0)
  if (cp === undefined) {
    charInfo.value = null
    return
  }
  try {
    charInfo.value = analyzeCodePoint(cp)
  } catch (e) {
    error.value = '无法分析该字符：' + e.message
    charInfo.value = null
  }
}

// --- Search ---
function searchChar() {
  error.value = ''
  success.value = false
  searchResults.value = []
  browseResults.value = []

  const q = searchQuery.value.trim()
  if (!q) {
    error.value = '请输入搜索内容'
    return
  }

  let cp = null

  // Try U+XXXX format
  const uMatch = q.match(/^U\+([0-9A-Fa-f]+)$/i)
  if (uMatch) {
    cp = parseInt(uMatch[1], 16)
  }

  // Try 0xXXXX format
  if (cp === null) {
    const hexMatch = q.match(/^0x([0-9A-Fa-f]+)$/i)
    if (hexMatch) {
      cp = parseInt(hexMatch[1], 16)
    }
  }

  // Try decimal
  if (cp === null && /^\d+$/.test(q)) {
    cp = parseInt(q, 10)
  }

  // Direct code point lookup
  if (cp !== null) {
    if (cp >= 0 && cp <= 0x10FFFF) {
      try {
        charInfo.value = analyzeCodePoint(cp)
        searchResults.value = [charInfo.value]
        return
      } catch (e) {
        error.value = '无效的码点：' + e.message
        return
      }
    } else {
      error.value = '码点超出 Unicode 范围 (0-0x10FFFF)'
      return
    }
  }

  // Search by name
  const qUpper = q.toUpperCase()
  const results = []

  // Search named characters
  for (const [cpStr, name] of Object.entries(NAMED_CHARS)) {
    if (name.includes(qUpper)) {
      const cp = parseInt(cpStr)
      results.push({ char: String.fromCodePoint(cp), cpHex: cp.toString(16).toUpperCase().padStart(4, '0'), cpDec: cp, name })
    }
  }

  // If query is short, also search in CJK range (limit to avoid performance issues)
  if (q.length >= 2 && results.length < 10) {
    // Search by hex pattern in CJK range
    let hexPattern = null
    if (qUpper.match(/^[0-9A-F]{1,4}$/)) {
      hexPattern = qUpper
    }
    if (hexPattern) {
      for (let cp = 0x4E00; cp <= 0x9FFF && results.length < 30; cp++) {
        const cpHex = cp.toString(16).toUpperCase()
        if (cpHex.includes(hexPattern)) {
          const name = getCharName(cp)
          results.push({ char: String.fromCodePoint(cp), cpHex: cpHex.padStart(4, '0'), cpDec: cp, name })
        }
      }
    }
  }

  searchResults.value = results
  if (results.length === 0) {
    error.value = '未找到匹配的字符，尝试输入码点 (如 U+0041) 或名称关键词'
  }
}

function selectSearchResult(item) {
  charInfo.value = analyzeCodePoint(item.cpDec)
  input.value = item.char
  searchResults.value = []
  browseResults.value = []
  error.value = ''
}

// --- Quick browse categories ---
const quickCategories = [
  { key: 'arrows', label: '➡️ 箭头', range: [0x2190, 0x21FF] },
  { key: 'math', label: '∑ 数学', range: [0x2200, 0x22FF] },
  { key: 'shapes', label: '◆ 几何', range: [0x25A0, 0x25FF] },
  { key: 'misc', label: '☀ 符号', range: [0x2600, 0x26FF] },
  { key: 'dingbats', label: '✂ 装饰', range: [0x2700, 0x27BF] },
  { key: 'cjk_punct', label: '。CJK 标点', range: [0x3000, 0x303F] },
  { key: 'hiragana', label: 'あ 平假名', range: [0x3040, 0x309F] },
  { key: 'katakana', label: 'ア 片假名', range: [0x30A0, 0x30FF] },
  { key: 'emoticons', label: '😀 表情', range: [0x1F600, 0x1F64F] }
]

function browseCategory(cat) {
  error.value = ''
  success.value = false
  const [start, end] = cat.range
  const results = []
  for (let cp = start; cp <= end && results.length < 100; cp++) {
    const name = getCharName(cp)
    if (name || cp <= 0xFF) {
      results.push({
        char: String.fromCodePoint(cp),
        cpHex: cp.toString(16).toUpperCase().padStart(cp > 0xFFFF ? 6 : 4, '0'),
        cpDec: cp,
        name: name || `U+${cp.toString(16).toUpperCase()}`
      })
    }
  }
  browseResults.value = results
}

// --- Copy helpers ---
async function copyValue(text) {
  if (await copyText(text)) {
    success.value = '已复制'
    setTimeout(() => { success.value = false }, 2000)
  }
}

async function copyFullReport() {
  if (!charInfo.value) return
  const info = charInfo.value
  const lines = [
    `字符：${info.char}`,
    `Unicode 码点：U+${info.cpHex}`,
    `十进制：${info.cpDec}`,
    `HTML 实体：&#${info.cpDec};`,
    `CSS 转义：${info.cssEscape}`,
    `UTF-8：${info.utf8}`,
    `UTF-16：${info.utf16}`,
    `字符类别：${info.category} (${info.categoryName})`,
    `所属文字：${info.script}`,
    `字符名称：${info.name}`,
  ]
  if (info.block) lines.push(`所属区块：${info.block}`)
  if (await copyText(lines.join('\n'))) {
    success.value = '完整报告已复制'
    setTimeout(() => { success.value = false }, 2000)
  }
}

function clearAll() {
  input.value = ''
  searchQuery.value = ''
  charInfo.value = null
  error.value = ''
  success.value = false
  searchResults.value = []
  browseResults.value = []
}
</script>

<style scoped>
/* === 字符大字预览 === */
.char-preview {
  font-size: 64px;
  line-height: 1.3;
  text-align: center;
  padding: 20px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  margin-bottom: 16px;
  color: var(--green);
  font-family: var(--mono), serif;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-all;
}

/* === 属性详情网格 === */
.detail-grid {
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-family: var(--mono);
  font-size: 13px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--muted);
  min-width: 110px;
  flex-shrink: 0;
  text-transform: uppercase;
  font-size: 11px;
  padding-top: 2px;
}

.detail-value {
  color: var(--text);
  flex: 1;
  word-break: break-all;
  position: relative;
  line-height: 1.6;
}

.char-name {
  color: var(--green);
  font-size: 12px;
}

/* === 搜索列表 === */
.search-results {
  margin-top: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  max-height: 300px;
  overflow-y: auto;
}

.search-list {
  /* container */
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s;
}

.search-item:hover {
  background: var(--green-soft);
}

.search-item:last-child {
  border-bottom: none;
}

.search-char {
  font-size: 20px;
  min-width: 32px;
  text-align: center;
  color: var(--green);
}

.search-cp {
  color: var(--muted);
  font-size: 11px;
  min-width: 60px;
}

.search-name {
  color: var(--text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-more {
  padding: 8px 12px;
  text-align: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}

/* === 快速浏览按钮 === */
.quick-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.quick-nav .tool-button {
  font-size: 11px;
  padding: 4px 10px;
}

/* === 空状态 === */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--panel-2);
  border: 1px dashed var(--line);
  opacity: 0.6;
}

.detail-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.detail-empty-text {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--muted);
}

/* === 内联复制按钮 === */
.copy-btn-inline {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  opacity: 0.5;
  transition: opacity 0.15s;
  vertical-align: middle;
  margin-left: 4px;
}

.copy-btn-inline:hover {
  opacity: 1;
}

/* === 滚动条 === */
.search-results::-webkit-scrollbar {
  width: 6px;
}
.search-results::-webkit-scrollbar-track {
  background: transparent;
}
.search-results::-webkit-scrollbar-thumb {
  background: var(--line);
}
.search-results::-webkit-scrollbar-thumb:hover {
  background: var(--line-strong);
}

/* === 响应式 === */
@media (max-width: 640px) {
  .char-preview {
    font-size: 48px;
    padding: 16px;
    min-height: 70px;
  }
  .detail-label {
    min-width: 80px;
    font-size: 10px;
  }
  .detail-row {
    font-size: 12px;
  }
  .search-item {
    font-size: 11px;
  }
  .search-char {
    font-size: 18px;
    min-width: 28px;
  }
}
</style>
