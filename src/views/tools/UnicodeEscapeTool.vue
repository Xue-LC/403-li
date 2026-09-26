<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔤 Unicode 转义转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 格式选择和方向 -->
        <div class="config-section">
          <div class="config-row">
            <label class="tool-label" style="margin:0; min-width: 80px;">方向：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="direction" value="encode" />
                <span>编码（文本→转义）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="direction" value="decode" />
                <span>解码（转义→文本）</span>
              </label>
            </div>
          </div>
          <div class="config-row">
            <label class="tool-label" style="margin:0; min-width: 80px;">格式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="format" value="js" />
                <span>JavaScript (\uXXXX)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="format" value="python" />
                <span>Python (\UXXXXXXXX)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="format" value="html" />
                <span>HTML 实体 (&amp;#xXXXX;)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="format" value="css" />
                <span>CSS (\XXXX)</span>
              </label>
            </div>
          </div>
          <div v-if="direction === 'encode'" class="config-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="escapeAll" />
              <span>转义所有字符（包括 ASCII）</span>
            </label>
          </div>
        </div>

        <!-- 双栏布局 -->
        <div class="tool-two-col">
          <!-- 左侧：输入 -->
          <div class="tool-col">
            <label class="tool-label">
              {{ direction === 'encode' ? '原始文本：' : '转义序列：' }}
            </label>
            <textarea
              v-model="input"
              class="code-input"
              rows="10"
              :placeholder="direction === 'encode'
                ? '输入要转义的文本...'
                : '粘贴 Unicode 转义序列...'"
              @input="convert"
            ></textarea>
            <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
              <button class="tool-button" @click="copyInput">📋 复制</button>
            </div>
          </div>

          <!-- 右侧：输出 -->
          <div class="tool-col">
            <label class="tool-label">
              {{ direction === 'encode' ? '转义结果：' : '还原文本：' }}
            </label>
            <textarea
              :value="output"
              class="code-input output"
              rows="10"
              readonly
              placeholder="结果将显示在这里..."
            ></textarea>
            <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
              <button class="tool-button primary" @click="copyOutput" :disabled="!output">📋 复制</button>
            </div>
          </div>
        </div>

        <!-- 按钮和提示 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="convert">
            🔄 {{ direction === 'encode' ? '编码' : '解码' }}
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 格式参考 -->
        <div v-if="input && output" class="stats-section" style="margin-top: 12px;">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">输入长度</span>
              <span class="stat-value">{{ input.length }} 字符</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出长度</span>
              <span class="stat-value">{{ output.length }} 字符</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- State ---
const input = ref('')
const output = ref('')
const direction = ref('encode')
const format = ref('js')
const escapeAll = ref(false)
const error = ref('')
const success = ref('')

// --- Watch format/direction/escapeAll changes to re-convert ---
watch([format, direction, escapeAll], () => {
  if (input.value) convert()
})

// --- Encode helpers ---

function toHex4(cp) {
  return cp.toString(16).toUpperCase().padStart(4, '0')
}

function toHex8(cp) {
  return cp.toString(16).toUpperCase().padStart(8, '0')
}

function toHex6(cp) {
  return cp.toString(16).toUpperCase().padStart(6, '0')
}

// Check if a code point is printable ASCII (space to tilde: 0x20-0x7E)
function isPrintableAscii(cp) {
  return cp >= 0x20 && cp <= 0x7E
}

// Encode a single code point to the selected format
function encodeCodepoint(cp) {
  switch (format.value) {
    case 'js':
      // JavaScript \uXXXX for BMP, surrogate pairs for supplementary
      if (cp <= 0xFFFF) {
        return '\\u' + toHex4(cp)
      } else {
        // Surrogate pair: subtract 0x10000, split into high and low
        const sub = cp - 0x10000
        const hi = 0xD800 + ((sub >> 10) & 0x3FF)
        const lo = 0xDC00 + (sub & 0x3FF)
        return '\\u' + toHex4(hi) + '\\u' + toHex4(lo)
      }

    case 'python':
      // Python \UXXXXXXXX (always 8 hex digits)
      return '\\U' + toHex8(cp)

    case 'html':
      // HTML entity &#xXXXX; or &#xXXXXXXXX;
      if (cp <= 0xFFFF) {
        return '&#x' + cp.toString(16).toUpperCase() + ';'
      } else {
        return '&#x' + cp.toString(16).toUpperCase() + ';'
      }

    case 'css':
      // CSS \XXXX (4 or 6 hex digits, need trailing space if next char is hex)
      if (cp <= 0xFFFF) {
        return '\\' + toHex4(cp) + ' '
      } else {
        return '\\' + toHex6(cp) + ' '
      }

    default:
      return '\\u' + toHex4(cp)
  }
}

// --- Decode helpers ---

function decodeJsEscape(str) {
  // Match \uXXXX sequences (including surrogate pairs)
  return str.replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
}

function decodePythonEscape(str) {
  // Match \UXXXXXXXX (8 hex digits)
  return str.replace(/\\U([0-9A-Fa-f]{8})/g, (match, hex) => {
    const cp = parseInt(hex, 16)
    if (cp <= 0x10FFFF) {
      return String.fromCodePoint(cp)
    }
    return match // invalid, keep as-is
  })
}

function decodeHtmlEntity(str) {
  // Match &#xXXXX; and &#xXXXXXXXX; (case insensitive hex)
  return str.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    const cp = parseInt(hex, 16)
    if (cp <= 0x10FFFF) {
      return String.fromCodePoint(cp)
    }
    return match
  })
}

function decodeCssEscape(str) {
  // Match \XXXX or \XXXXXX followed by optional whitespace
  return str.replace(/\\([0-9A-Fa-f]{4,6})\s?/g, (match, hex) => {
    const cp = parseInt(hex, 16)
    if (cp <= 0x10FFFF) {
      return String.fromCodePoint(cp)
    }
    return match
  })
}

// --- Conversion ---

function convert() {
  error.value = ''
  success.value = ''

  if (!input.value.trim()) {
    output.value = ''
    return
  }

  try {
    if (direction.value === 'encode') {
      // Encode: text → escape sequences
      const result = []
      for (const char of input.value) {
        const cp = char.codePointAt(0)
        if (cp === undefined) continue

        if (!escapeAll.value && isPrintableAscii(cp)) {
          result.push(char)
        } else {
          result.push(encodeCodepoint(cp))
        }

        // Skip the low surrogate if this was a supplementary character
        if (cp > 0xFFFF) {
          // codePointAt advances by 2, but for...of also advances properly
          // No extra action needed since for...of handles this correctly
        }
      }
      output.value = result.join('')
    } else {
      // Decode: escape sequences → text
      let decoded = input.value
      switch (format.value) {
        case 'js':
          decoded = decodeJsEscape(decoded)
          break
        case 'python':
          decoded = decodePythonEscape(decoded)
          break
        case 'html':
          decoded = decodeHtmlEntity(decoded)
          break
        case 'css':
          decoded = decodeCssEscape(decoded)
          break
      }
      output.value = decoded
    }
  } catch (e) {
    error.value = '转换出错：' + e.message
    output.value = ''
  }
}

// --- Actions ---

function copyInput() {
  if (!input.value) return
  try {
    copyText(input.value)
    success.value = '输入内容已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = '复制失败：' + e.message
  }
}

function copyOutput() {
  if (!output.value) return
  try {
    copyText(output.value)
    success.value = '输出内容已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = '复制失败：' + e.message
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 格式参考区利用 tools.css 已有的 .stats-section / .stats-grid / .stat-item */
</style>
