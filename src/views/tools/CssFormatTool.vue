<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 CSS 压缩美化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">CSS 输入：</label>
            <textarea
              v-model="input"
              placeholder="粘贴 CSS 代码..."
              rows="14"
              class="code-input"
              @input="clearStatus"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="format" :disabled="!input.trim()">
            ✨ 格式化
          </button>
          <button class="tool-button" @click="minify" :disabled="!input.trim()">
            📦 压缩
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clearAll" :disabled="!input && !output">
            🗑️ 清空
          </button>
        </div>

        <div v-if="showStats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">原始大小</span>
              <span class="stat-value">{{ stats.originalSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出大小</span>
              <span class="stat-value">{{ stats.outputSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">压缩率</span>
              <span class="stat-value">{{ stats.ratio }}</span>
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
import { ref, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const success = ref('')
const showStats = ref(false)
const stats = reactive({ originalSize: '', outputSize: '', ratio: '' })

function clearStatus() {
  error.value = ''
  success.value = ''
  showStats.value = false
}

function updateStats(original, formatted) {
  const origBytes = new Blob([original]).size
  const outBytes = new Blob([formatted]).size
  stats.originalSize = formatBytes(origBytes)
  stats.outputSize = formatBytes(outBytes)
  const ratio = origBytes > 0 ? ((1 - outBytes / origBytes) * 100).toFixed(1) : '0.0'
  stats.ratio = ratio + '%'
  showStats.value = true
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

// Remove CSS comments
function removeComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

// Token-based CSS beautifier
function beautifyCSS(css) {
  const indentStr = '  '

  // Step 1: Remove comments
  let clean = css.replace(/\/\*[\s\S]*?\*\//g, '')

  // Step 2: Preserve strings (so we don't mess with content values)
  const strings = []
  clean = clean.replace(/(["'])(?:(?!\1|\\).|\\.)*\1/g, (match) => {
    strings.push(match)
    return '___STR_' + (strings.length - 1) + '___'
  })

  // Step 3: Normalize separators
  clean = clean.replace(/\{/g, ' { ')
  clean = clean.replace(/\}/g, ' } ')
  clean = clean.replace(/;/g, '; ')

  // Step 4: Split into tokens
  const tokens = clean.split(/\s+/).filter(t => t.length > 0)

  const lines = []
  let level = 0
  let needNewline = false

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t]

    if (token === '{') {
      // Trim trailing space on previous line and attach brace
      if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].trimEnd()
      }
      lines.push(' {')
      level++
      needNewline = true
    } else if (token === '}') {
      level = Math.max(0, level - 1)
      lines.push(indentStr.repeat(level) + '}')
      // Blank line between rules (unless next token is also })
      if (t < tokens.length - 1 && tokens[t + 1] !== '}') {
        lines.push('')
      }
      needNewline = true
    } else if (token === ';') {
      // Attach semicolon to last line
      if (lines.length > 0) {
        lines[lines.length - 1] = lines[lines.length - 1].trimEnd() + ';'
      }
      needNewline = true
    } else {
      if (needNewline || lines.length === 0) {
        lines.push(indentStr.repeat(level) + token)
        needNewline = false
      } else {
        // Append to current line (selector parts, multi-value properties, etc.)
        lines[lines.length - 1] += ' ' + token
      }
    }
  }

  // Step 5: Join lines
  let result = lines.join('\n')

  // Step 6: Restore strings
  result = result.replace(/___STR_(\d+)___/g, (_, idx) => strings[parseInt(idx)])

  // Step 7: Clean up: remove trailing spaces, collapse multiple blank lines
  result = result.split('\n').map(line => line.trimEnd()).join('\n')
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.trim()

  // Step 8: Ensure a trailing newline
  if (result) result += '\n'

  return result
}

function minifyCSS(css) {
  // Remove comments
  let result = removeComments(css)
  // Remove whitespace around structural chars
  result = result.replace(/\s*\{\s*/g, '{')
  result = result.replace(/\s*\}\s*/g, '}')
  result = result.replace(/\s*;\s*/g, ';')
  result = result.replace(/\s*:\s*/g, ':')
  result = result.replace(/\s*,\s*/g, ',')
  result = result.replace(/\s*>\s*/g, '>')
  result = result.replace(/\s*\+\s*/g, '+')
  result = result.replace(/\s*~\s*/g, '~')
  // Collapse all remaining whitespace
  result = result.replace(/\s+/g, ' ')
  // Remove last semicolon before closing brace
  result = result.replace(/;\}/g, '}')
  // Remove space before closing brace
  result = result.replace(/\s+\}/g, '}')
  result = result.trim()
  return result
}

function format() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 CSS 代码'
    return
  }
  try {
    const formatted = beautifyCSS(input.value)
    output.value = formatted
    updateStats(input.value, formatted)
    success.value = '格式化完成'
  } catch (e) {
    error.value = '格式化失败：' + e.message
    output.value = ''
  }
}

function minify() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 CSS 代码'
    return
  }
  try {
    const compressed = minifyCSS(input.value)
    output.value = compressed
    updateStats(input.value, compressed)
    success.value = '压缩完成'
  } catch (e) {
    error.value = '压缩失败：' + e.message
    output.value = ''
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => {
      if (success.value === '已复制到剪贴板') success.value = ''
    }, 2000)
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  clearStatus()
}
</script>

<style scoped>
/* All styling uses shared classes from tools.css — no component-specific styles needed */
</style>
