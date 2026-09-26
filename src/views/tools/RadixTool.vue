<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔢 进制转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：二进制 + 八进制 -->
          <div class="tool-col">
            <label class="tool-label">二进制 (BIN)：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="bin"
                @input="onInput('bin')"
                placeholder="输入二进制数，如 1010"
              />
              <button class="copy-btn" @click="copyField(bin)" title="复制">📋</button>
            </div>

            <label class="tool-label">八进制 (OCT)：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="oct"
                @input="onInput('oct')"
                placeholder="输入八进制数，如 755"
              />
              <button class="copy-btn" @click="copyField(oct)" title="复制">📋</button>
            </div>
          </div>

          <!-- 右侧：十进制 + 十六进制 -->
          <div class="tool-col">
            <label class="tool-label">十进制 (DEC)：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="dec"
                @input="onInput('dec')"
                placeholder="输入十进制数，如 255"
              />
              <button class="copy-btn" @click="copyField(dec)" title="复制">📋</button>
            </div>

            <label class="tool-label">十六进制 (HEX)：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="hex"
                @input="onInput('hex')"
                placeholder="输入十六进制数，如 FF"
              />
              <button class="copy-btn" @click="copyField(hex)" title="复制">📋</button>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyAll">📋 复制全部</button>
          <button class="tool-button" @click="swapEndian">🔄 字节序翻转</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const bin = ref('')
const oct = ref('')
const dec = ref('')
const hex = ref('')
const error = ref('')
const success = ref('')

// Track which field was last edited to prevent re-entry loops
let updating = false

/**
 * Parse a string in the given base to BigInt.
 * Returns null on invalid input.
 */
function parseValue(raw, base) {
  const s = raw.trim()
  if (!s) return null

  // Strip common prefixes
  let cleaned = s
  if (base === 16) {
    cleaned = cleaned.replace(/^0x/i, '')
  } else if (base === 2) {
    cleaned = cleaned.replace(/^0b/i, '')
  } else if (base === 8) {
    cleaned = cleaned.replace(/^0o/i, '')
  }

  if (!cleaned) return null

  // Validate characters for the given base
  const patterns = {
    2: /^[01]+$/i,
    8: /^[0-7]+$/i,
    10: /^[0-9]+$/,
    16: /^[0-9a-f]+$/i
  }

  if (!patterns[base].test(cleaned)) return null

  // Manual parse for non-hex bases
  if (base === 10) {
    try {
      return BigInt(cleaned)
    } catch {
      return null
    }
  }

  // Parse binary/octal by converting to BigInt digit by digit
  let result = 0n
  const baseBig = BigInt(base)
  for (const ch of cleaned) {
    const digit = BigInt(parseInt(ch, base))
    result = result * baseBig + digit
  }
  return result
}

/**
 * Parse any string to BigInt, auto-detecting base from prefix or context.
 */
function parseAny(s) {
  const trimmed = s.trim()
  if (!trimmed) return null

  if (/^0x/i.test(trimmed)) {
    return parseValue(trimmed, 16)
  }
  if (/^0b/i.test(trimmed)) {
    return parseValue(trimmed, 2)
  }
  if (/^0o/i.test(trimmed)) {
    return parseValue(trimmed, 8)
  }
  // Default: try decimal, then hex if contains letters, then binary if only 0/1
  return parseValue(trimmed, 10)
}

/**
 * Update all fields from a BigInt value.
 */
function updateAll(val) {
  if (val === null) {
    bin.value = ''
    oct.value = ''
    dec.value = ''
    hex.value = ''
    return
  }

  bin.value = val.toString(2)
  oct.value = val.toString(8)
  dec.value = val.toString(10)
  hex.value = val.toString(16).toUpperCase()
}

/**
 * Handle input from a specific field.
 */
function onInput(source) {
  if (updating) return
  error.value = ''
  success.value = ''

  const raw = getFieldValue(source)
  if (!raw.trim()) {
    updating = true
    bin.value = ''
    oct.value = ''
    dec.value = ''
    hex.value = ''
    updating = false
    return
  }

  const sourceBase = { bin: 2, oct: 8, dec: 10, hex: 16 }[source]
  const val = parseValue(raw, sourceBase)

  if (val === null) {
    error.value = `无效的${getFieldLabel(source)}数：「${raw}」`
    // Still update other fields to empty
    updating = true
    clearOtherFields(source)
    updating = false
    return
  }

  updating = true
  updateAll(val)
  updating = false
}

function getFieldValue(source) {
  return { bin: bin.value, oct: oct.value, dec: dec.value, hex: hex.value }[source]
}

function getFieldLabel(source) {
  return { bin: '二进制', oct: '八进制', dec: '十进制', hex: '十六进制' }[source]
}

function clearOtherFields(source) {
  if (source !== 'bin') bin.value = ''
  if (source !== 'oct') oct.value = ''
  if (source !== 'dec') dec.value = ''
  if (source !== 'hex') hex.value = ''
}

async function copyField(text) {
  if (!text.trim()) {
    error.value = '没有内容可复制'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyAll() {
  const decVal = dec.value.trim()
  if (!decVal && !bin.value.trim() && !oct.value.trim() && !hex.value.trim()) {
    error.value = '没有内容可复制'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  const text = [
    `二进制：${bin.value || '—'}`,
    `八进制：${oct.value || '—'}`,
    `十进制：${dec.value || '—'}`,
    `十六进制：${hex.value || '—'}`
  ].join('\n')

  if (await copyText(text)) {
    success.value = '已复制全部到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function swapEndian() {
  error.value = ''
  success.value = ''

  // If hex is empty, populate from other fields first
  if (!hex.value.trim()) {
    const val = parseAny(dec.value || oct.value || bin.value)
    if (val === null) {
      error.value = '请先输入一个数值'
      setTimeout(() => { error.value = '' }, 2000)
      return
    }
    updating = true
    updateAll(val)
    updating = false
  }

  // Pad hex to even length for byte-level swap
  let h = hex.value.trim()
  if (!h) return
  if (h.length % 2 !== 0) {
    h = '0' + h
  }

  const bytes = h.match(/.{2}/g)
  if (!bytes) return
  const swapped = bytes.reverse().join('')
  const val = parseValue(swapped, 16)

  if (val === null) {
    error.value = '字节序翻转失败'
    return
  }

  updating = true
  updateAll(val)
  updating = false
  success.value = '字节序已翻转'
  setTimeout(() => { success.value = '' }, 2000)
}

function clearAll() {
  bin.value = ''
  oct.value = ''
  dec.value = ''
  hex.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.input-with-copy {
  margin-bottom: 14px;
}

.input-with-copy:last-child {
  margin-bottom: 0;
}

.input-with-copy :deep(.copy-btn) {
  top: 50%;
  transform: translateY(-50%);
}
</style>
