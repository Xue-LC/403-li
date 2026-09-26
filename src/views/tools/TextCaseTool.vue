<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔤 文本大小写转换</span>
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
            <div v-if="detectedFormat" class="detected-hint">
              🔍 检测到源格式：<strong>{{ detectedFormat }}</strong>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">转换结果（{{ targetLabel }}）：</label>
            <textarea
              :value="converted"
              readonly
              rows="12"
              class="code-input output"
              :placeholder="input.trim() ? '正在转换...' : '输入文本后自动转换...'"
            ></textarea>
          </div>
        </div>

        <label class="tool-label">目标格式（点击选择）：</label>
        <div class="format-grid">
          <button
            v-for="fmt in formats"
            :key="fmt.value"
            :class="['format-btn', { active: targetFormat === fmt.value }]"
            @click="targetFormat = fmt.value"
          >
            {{ fmt.icon }} {{ fmt.label }}
          </button>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyOutput" :disabled="!converted.trim()">
            📋 复制结果
          </button>
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">
            📋 复制输入
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
const targetFormat = ref('lower')
const error = ref('')
const success = ref(false)

const formats = [
  { value: 'lower',  label: 'lower case',    icon: '🔡' },
  { value: 'upper',  label: 'UPPER CASE',    icon: '🔠' },
  { value: 'title',  label: 'Title Case',    icon: '📝' },
  { value: 'camel',  label: 'camelCase',     icon: '🐪' },
  { value: 'pascal', label: 'PascalCase',    icon: '📦' },
  { value: 'snake',  label: 'snake_case',    icon: '🐍' },
  { value: 'kebab',  label: 'kebab-case',    icon: '🍢' },
  { value: 'constant', label: 'CONSTANT_CASE', icon: '🔊' }
]

const formatLabels = {
  lower: 'lower case',
  upper: 'UPPER CASE',
  title: 'Title Case',
  camel: 'camelCase',
  pascal: 'PascalCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  constant: 'CONSTANT_CASE'
}

const targetLabel = computed(() => formatLabels[targetFormat.value] || targetFormat.value)

/**
 * Split text into words, handling multiple format patterns:
 * - space-separated (lower case, UPPER CASE, Title Case)
 * - camelCase / PascalCase
 * - snake_case / CONSTANT_CASE
 * - kebab-case
 */
function splitWords(text) {
  if (!text.trim()) return []

  // First, normalize the separators:
  // Replace underscores and hyphens with spaces
  let s = text.replace(/[_]/g, ' ').replace(/[-]/g, ' ')

  // Split camelCase boundaries: "helloWorld" → "hello World"
  // "PascalCase" → "Pascal Case"
  // Handle consecutive uppercase: "XMLParser" → "XML Parser"
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2')
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  // Split by whitespace and filter empty
  return s.split(/\s+/).filter(w => w.length > 0)
}

function toUpperCase(words) {
  return words.map(w => w.toUpperCase()).join(' ')
}

function toLowerCase(words) {
  return words.map(w => w.toLowerCase()).join(' ')
}

function toTitleCase(words) {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function toCamelCase(words) {
  return words
    .map((w, i) => {
      const lowered = w.toLowerCase()
      return i === 0 ? lowered : lowered.charAt(0).toUpperCase() + lowered.slice(1)
    })
    .join('')
}

function toPascalCase(words) {
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

function toSnakeCase(words) {
  return words.map(w => w.toLowerCase()).join('_')
}

function toKebabCase(words) {
  return words.map(w => w.toLowerCase()).join('-')
}

function toConstantCase(words) {
  return words.map(w => w.toUpperCase()).join('_')
}

const converters = {
  lower: toLowerCase,
  upper: toUpperCase,
  title: toTitleCase,
  camel: toCamelCase,
  pascal: toPascalCase,
  snake: toSnakeCase,
  kebab: toKebabCase,
  constant: toConstantCase
}

const converted = computed(() => {
  const words = splitWords(input.value)
  if (words.length === 0) return ''
  const convert = converters[targetFormat.value]
  return convert ? convert(words) : ''
})

/** Auto-detect the source format of input text */
const detectedFormat = computed(() => {
  const t = input.value.trim()
  if (!t) return ''

  const hasUnderscore = t.includes('_')
  const hasHyphen = t.includes('-') && !t.includes(' ')
  const hasSpace = /\s/.test(t)
  const hasUppercase = /[A-Z]/.test(t)
  const hasLowercase = /[a-z]/.test(t)
  const allUpper = !hasLowercase && hasUppercase
  const allLower = !hasUppercase && hasLowercase
  const mixedCase = hasUppercase && hasLowercase

  if (hasUnderscore) {
    return allUpper ? 'CONSTANT_CASE' : 'snake_case'
  }
  if (hasHyphen) {
    return 'kebab-case'
  }
  if (hasSpace) {
    if (allUpper) return 'UPPER CASE'
    if (allLower) return 'lower case'
    // Check Title Case: each word starts with uppercase
    const words = t.split(/\s+/).filter(Boolean)
    if (words.every(w => w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase())) {
      return 'Title Case'
    }
    return 'mixed case'
  }
  // No spaces, no common separators
  if (allUpper) return 'CONSTANT_CASE / UPPERCASE'
  if (allLower) return 'lowercase'
  if (mixedCase) {
    return t[0] === t[0].toLowerCase() ? 'camelCase' : 'PascalCase'
  }
  return '未知'
})

async function copyOutput() {
  if (await copyText(converted.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyInput() {
  if (await copyText(input.value)) {
    success.value = '输入已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  targetFormat.value = 'lower'
  error.value = ''
  success.value = false
}
</script>

<style scoped>
.format-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 6px 0 14px;
}

.format-btn {
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

.format-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.format-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
  font-weight: 600;
}

.detected-hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.detected-hint strong {
  color: var(--green);
}

@media (max-width: 640px) {
  .format-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .format-btn {
    font-size: 12px;
    padding: 10px 4px;
  }
}
</style>
