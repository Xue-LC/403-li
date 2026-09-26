<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 Base85 编解码</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入：</label>
            <textarea
              v-model="input"
              class="code-input"
              placeholder="输入要编码的文本或要解码的 Base85 字符串..."
              rows="10"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              :value="output"
              class="code-input output"
              readonly
              rows="10"
              placeholder="结果显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="variant" value="ascii85" />
            <span>ASCII85（Adobe / btoa）</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="variant" value="z85" />
            <span>Z85（ZeroMQ）</span>
          </label>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="encode">
            🔐 编码
          </button>
          <button class="tool-button" @click="decode">
            🔓 解码
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制输出
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div class="button-group">
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">
            📋 复制输入
          </button>
        </div>

        <div v-if="error" class="status-error">
          ❌ 错误：{{ error }}
        </div>

        <div v-if="successMsg" class="status-success">
          ✅ {{ successMsg }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

// ─── ASCII85 ────────────────────────────────────────────────
// ASCII85 alphabet: characters '!' (33) through 'u' (117)
const ASCII85_START = 33
const ASCII85_RANGE = 85

function ascii85EncodeGroup(bytes, offset, count) {
  // Build 32-bit big-endian value from up to 4 bytes
  let value = 0
  const actual = Math.min(count, 4)
  for (let i = 0; i < actual; i++) {
    value = (value << 8) | bytes[offset + i]
  }
  // Pad: shift remaining bytes as if padded with zeros
  if (actual < 4) {
    value <<= (4 - actual) * 8
  }

  if (actual === 4 && value === 0) {
    return 'z'
  }

  let result = ''
  // Encode 5 base-85 digits
  for (let i = 4; i >= 0; i--) {
    const divisor = Math.pow(85, i)
    const digit = Math.floor(value / divisor) % 85
    result += String.fromCharCode(ASCII85_START + digit)
  }

  // Truncate for partial groups: output ceil(count * 5 / 4) chars
  if (actual < 4) {
    const outLen = Math.ceil(actual * 5 / 4)
    result = result.slice(0, outLen)
  }

  return result
}

function ascii85Encode(bytes) {
  const parts = []
  const len = bytes.length

  for (let i = 0; i < len; i += 4) {
    const remaining = Math.min(4, len - i)
    parts.push(ascii85EncodeGroup(bytes, i, remaining))
  }

  parts.push('~>')
  return parts.join('')
}

function ascii85Decode(str) {
  // Remove whitespace
  str = str.replace(/\s+/g, '')

  // Strip '~>' end marker
  const endIdx = str.indexOf('~>')
  if (endIdx >= 0) {
    str = str.slice(0, endIdx)
  }

  if (str.length === 0) return new Uint8Array(0)

  const result = []
  let group = ''

  for (const ch of str) {
    if (ch === 'z') {
      // 'z' expands to 4 zero bytes
      result.push(0, 0, 0, 0)
      continue
    }

    const code = ch.charCodeAt(0)
    if (code < ASCII85_START || code >= ASCII85_START + ASCII85_RANGE) {
      throw new Error(`无效的 ASCII85 字符: "${ch}"`)
    }

    group += ch
    if (group.length === 5) {
      // Decode 5 chars → 4 bytes
      let value = 0
      for (const c of group) {
        value = value * 85 + (c.charCodeAt(0) - ASCII85_START)
      }
      result.push((value >> 24) & 0xff)
      result.push((value >> 16) & 0xff)
      result.push((value >> 8) & 0xff)
      result.push(value & 0xff)
      group = ''
    }
  }

  // Handle partial final group: N chars → floor(N * 4 / 5) bytes
  if (group.length > 0) {
    const origLen = group.length
    // Pad with max-value chars ('u') to make 5 for decoding
    while (group.length < 5) {
      group += 'u'
    }
    let value = 0
    for (const c of group) {
      value = value * 85 + (c.charCodeAt(0) - ASCII85_START)
    }
    const byteCount = Math.floor(origLen * 4 / 5)
    for (let i = 0; i < byteCount; i++) {
      result.push((value >>> (24 - i * 8)) & 0xff)
    }
  }

  return new Uint8Array(result)
}

// ─── Z85 (ZeroMQ) ───────────────────────────────────────────

const Z85_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#'

function buildZ85Reverse() {
  const rev = {}
  for (let i = 0; i < Z85_ALPHABET.length; i++) {
    rev[Z85_ALPHABET[i]] = i
  }
  return rev
}

const Z85_REVERSE = buildZ85Reverse()

function z85Encode(bytes) {
  if (bytes.length % 4 !== 0) {
    throw new Error('Z85 编码要求输入字节数为 4 的倍数，请在末尾补 0x00 或使用 ASCII85')
  }

  let result = ''
  for (let i = 0; i < bytes.length; i += 4) {
    let value =
      ((bytes[i] << 24) >>> 0) |
      (bytes[i + 1] << 16) |
      (bytes[i + 2] << 8) |
      bytes[i + 3]

    let encoded = ''
    for (let j = 0; j < 5; j++) {
      encoded = Z85_ALPHABET[value % 85] + encoded
      value = Math.floor(value / 85)
    }
    result += encoded
  }

  return result
}

function z85Decode(str) {
  str = str.replace(/\s+/g, '')

  if (str.length % 5 !== 0) {
    throw new Error('Z85 编码的字符串长度必须是 5 的倍数')
  }

  const result = new Uint8Array((str.length / 5) * 4)
  let byteIdx = 0

  for (let i = 0; i < str.length; i += 5) {
    let value = 0
    for (let j = 0; j < 5; j++) {
      const ch = str[i + j]
      if (!(ch in Z85_REVERSE)) {
        throw new Error(`无效的 Z85 字符: "${ch}"`)
      }
      value = value * 85 + Z85_REVERSE[ch]
    }

    result[byteIdx] = (value >>> 24) & 0xff
    result[byteIdx + 1] = (value >>> 16) & 0xff
    result[byteIdx + 2] = (value >>> 8) & 0xff
    result[byteIdx + 3] = value & 0xff
    byteIdx += 4
  }

  return result
}

// ─── Helpers ─────────────────────────────────────────────────

function stringToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToString(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

// ─── Component state ─────────────────────────────────────────

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const variant = ref('ascii85')

function encode() {
  error.value = ''
  successMsg.value = ''

  if (!input.value.trim()) {
    error.value = '请输入要编码的内容'
    return
  }

  try {
    const bytes = stringToBytes(input.value)

    if (variant.value === 'ascii85') {
      output.value = ascii85Encode(bytes)
    } else {
      // Z85: pad input to multiple of 4 bytes
      let paddedBytes = bytes
      const remainder = bytes.length % 4
      if (remainder !== 0) {
        const padded = new Uint8Array(bytes.length + (4 - remainder))
        padded.set(bytes)
        paddedBytes = padded
        successMsg.value =
          `编码成功（输入已自动补 ${4 - remainder} 个 \\x00 至 4 字节对齐）`
        setTimeout(() => { successMsg.value = '' }, 3000)
        output.value = z85Encode(paddedBytes)
        return
      }
      output.value = z85Encode(bytes)
    }

    successMsg.value = '编码成功'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (e) {
    error.value = '编码失败：' + e.message
    output.value = ''
  }
}

function decode() {
  error.value = ''
  successMsg.value = ''

  if (!input.value.trim()) {
    error.value = '请输入要解码的 Base85 字符串'
    return
  }

  try {
    let bytes

    if (variant.value === 'ascii85') {
      bytes = ascii85Decode(input.value)
    } else {
      bytes = z85Decode(input.value)
    }

    output.value = bytesToString(bytes)
    successMsg.value = '解码成功'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (e) {
    error.value = '解码失败：' + e.message
    output.value = ''
  }
}

async function copyOutput() {
  if (await copyText(output.value)) {
    successMsg.value = '输出已复制到剪贴板'
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}

async function copyInput() {
  if (await copyText(input.value)) {
    successMsg.value = '输入已复制到剪贴板'
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  successMsg.value = ''
}
</script>

<style scoped>
.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
}

.radio-label input[type='radio'] {
  accent-color: var(--green);
}

.button-group {
  margin-top: 8px;
}
</style>
