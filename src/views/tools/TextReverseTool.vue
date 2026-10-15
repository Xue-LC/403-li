<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔃 文本翻转器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              rows="12"
              class="code-input"
              placeholder="输入任意文本，支持多行..."
            ></textarea>
            <div class="inline-actions">
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">翻转结果（{{ modeLabel }}）：</label>
            <textarea
              :value="output"
              readonly
              rows="12"
              class="code-input output"
              :placeholder="input ? '正在转换...' : '输入文本后自动翻转...'"
            ></textarea>
            <div class="inline-actions">
              <button class="copy-btn" title="复制结果" @click="copyOutput">📋</button>
            </div>
          </div>
        </div>

        <label class="tool-label">翻转模式（点击选择）：</label>
        <div class="mode-grid">
          <button
            v-for="m in modes"
            :key="m.value"
            :class="['mode-btn', { active: mode === m.value }]"
            @click="mode = m.value"
          >
            {{ m.icon }} {{ m.label }}
          </button>
        </div>

        <div class="mode-hint">💡 {{ modeHint }}</div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!output" @click="copyOutput">
            📋 复制结果
          </button>
          <button class="tool-button" :disabled="!input" @click="useAsInput">
            🔁 结果转输入
          </button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const mode = ref('char')
const error = ref('')
const success = ref('')

const modes = [
  { value: 'char', label: '逐字符翻转', icon: '🔄' },
  { value: 'word', label: '逐词翻转', icon: '🔤' },
  { value: 'line', label: '逐行翻转', icon: '📄' },
  { value: 'upside', label: '上下颠倒', icon: '🙃' },
  { value: 'mirror', label: '镜像文字', icon: '🪞' }
]

const modeHints = {
  char: '每行文字从左到右反序，行与行顺序不变。',
  word: '每行内单词顺序反转，单词本身不拆开。',
  line: '整段文本的行顺序反转，第一行变最后一行。',
  upside: '把字母数字替换为上下颠倒的字形并反序，可倒过来读。',
  mirror: '反序并镜像成对符号（括号、引号、bdpq 等），如镜中文字。'
}

const modeLabels = {
  char: '逐字符翻转',
  word: '逐词翻转',
  line: '逐行翻转',
  upside: '上下颠倒',
  mirror: '镜像文字'
}

const modeLabel = computed(() => modeLabels[mode.value] || mode.value)
const modeHint = computed(() => modeHints[mode.value] || '')

// 上下颠倒字形映射表
const UPSIDE_MAP = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ',
  j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ',
  s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  A: '∀', B: '𐐒', C: 'Ɔ', D: 'p', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I',
  J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ò', R: 'ᴚ',
  S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  0: '0', 1: 'Ɩ', 2: 'ᄅ', 3: 'Ɛ', 4: 'ㄣ', 5: 'ϛ', 6: '9', 7: 'ㄥ', 8: '8', 9: '6',
  '.': '˙', ',': "'", "'": ',', '"': '„', '?': '¿', '!': '¡', ';': '؛',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '&': '⅋', '_': '‾', '‿': '⁀', ' ': ' '
}

// 镜像字形映射表（反序后逐字符替换）
const MIRROR_MAP = {
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '/': '\\', '\\': '/', b: 'd', d: 'b', p: 'q', q: 'p',
  '«': '»', '»': '«', '‿': '⁀', '⁀': '‿'
}

// 逐字符反转：使用扩展运算符按码点切分，正确处理代理对（emoji 等）
function reverseChars(line) {
  return [...line].reverse().join('')
}

// 逐词反转：保留词与词之间的空白
function reverseWords(line) {
  return line
    .split(/(\s+)/)
    .reverse()
    .join('')
}

function mapChars(str, map) {
  return [...str].map((ch) => (map[ch] !== undefined ? map[ch] : ch)).join('')
}

// 上下颠倒：反序 + 字形替换
function upsideDown(line) {
  return mapChars(reverseChars(line), UPSIDE_MAP)
}

// 镜像：反序 + 成对符号镜像替换
function mirror(line) {
  return mapChars(reverseChars(line), MIRROR_MAP)
}

const output = computed(() => {
  const raw = input.value
  if (!raw) return ''
  const lines = raw.split('\n')
  switch (mode.value) {
    case 'char':
      return lines.map(reverseChars).join('\n')
    case 'word':
      return lines.map(reverseWords).join('\n')
    case 'line':
      return [...lines].reverse().join('\n')
    case 'upside':
      return lines.map(upsideDown).join('\n')
    case 'mirror':
      return lines.map(mirror).join('\n')
    default:
      return ''
  }
})

function flash(kind, msg) {
  if (kind === 'error') {
    error.value = msg
    success.value = ''
    setTimeout(() => { error.value = '' }, 2000)
  } else {
    success.value = msg
    error.value = ''
    setTimeout(() => { success.value = '' }, 2000)
  }
}

async function copyOutput() {
  if (!output.value) return
  if (await copyText(output.value)) {
    flash('success', '结果已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

async function copyInput() {
  if (!input.value) return
  if (await copyText(input.value)) {
    flash('success', '输入已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

function useAsInput() {
  if (!output.value) return
  input.value = output.value
  flash('success', '已把结果转回输入区')
}

function clear() {
  input.value = ''
  mode.value = 'char'
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.mode-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin: 6px 0 10px;
}

.mode-btn {
  padding: 8px 6px;
  font-size: 13px;
  font-family: inherit;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.mode-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
  font-weight: 600;
}

.mode-hint {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 14px;
  line-height: 1.6;
}

.inline-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 900px) {
  .mode-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .mode-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-btn {
    font-size: 12px;
    padding: 10px 4px;
  }

  .mode-hint {
    font-size: 12px;
  }
}
</style>
