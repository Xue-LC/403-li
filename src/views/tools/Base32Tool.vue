<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 Base32 编解码</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入：</label>
            <textarea
              v-model="input"
              placeholder="输入要编码/解码的文本或 Base32 字符串..."
              rows="10"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              :value="output"
              readonly
              rows="10"
              class="code-input output"
              placeholder="结果显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="alphabet" value="rfc4648" />
            <span>RFC 4648 (A-Z, 2-7)</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="alphabet" value="extended-hex" />
            <span>扩展十六进制 (0-9, A-V)</span>
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
            📋 复制
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
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
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const RFC4648_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const EXTENDED_HEX_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUV'

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const alphabet = ref('rfc4648')

const currentAlphabet = computed(() => {
  return alphabet.value === 'rfc4648' ? RFC4648_ALPHABET : EXTENDED_HEX_ALPHABET
})

function base32Encode(bytes, table) {
  let result = ''
  const len = bytes.length
  let i = 0

  while (i < len) {
    const remaining = len - i
    const b0 = bytes[i]
    const b1 = remaining > 1 ? bytes[i + 1] : 0
    const b2 = remaining > 2 ? bytes[i + 2] : 0
    const b3 = remaining > 3 ? bytes[i + 3] : 0
    const b4 = remaining > 4 ? bytes[i + 4] : 0

    // 32-bit safe: extract 8 quintets using explicit byte-level bit ops
    result += table[(b0 >> 3) & 0x1f]
    result += table[((b0 & 0x07) << 2) | ((b1 >> 6) & 0x03)]
    result += table[(b1 >> 1) & 0x1f]
    result += table[((b1 & 0x01) << 4) | ((b2 >> 4) & 0x0f)]
    result += table[((b2 & 0x0f) << 1) | ((b3 >> 7) & 0x01)]
    result += table[(b3 >> 2) & 0x1f]
    result += table[((b3 & 0x03) << 3) | ((b4 >> 5) & 0x07)]
    result += table[b4 & 0x1f]

    i += 5
  }

  // Padding based on input length modulo 5
  const remainder = len % 5
  const padLen = remainder === 0 ? 0 : 8 - Math.ceil(remainder * 8 / 5)
  result += '='.repeat(padLen)

  return result
}

function base32Decode(str, table) {
  // Remove whitespace and make uppercase, strip padding
  str = str.replace(/\s+/g, '').toUpperCase().replace(/=+$/, '')

  if (str.length === 0) return new Uint8Array(0)

  // Build reverse lookup table
  const reverse = {}
  for (let i = 0; i < table.length; i++) {
    reverse[table[i]] = i
    // Also add lowercase mapping
    reverse[table[i].toLowerCase()] = i
  }

  // Validate characters
  for (const ch of str) {
    if (!(ch in reverse)) {
      throw new Error(`无效的 Base32 字符: "${ch}"`)
    }
  }

  const result = []
  let buffer = 0
  let bits = 0

  for (const ch of str) {
    buffer = (buffer << 5) | reverse[ch]
    bits += 5

    if (bits >= 8) {
      bits -= 8
      result.push((buffer >>> bits) & 0xff)
    }
  }

  return new Uint8Array(result)
}

function stringToBytes(str) {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

function bytesToString(bytes) {
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(bytes)
}

function encode() {
  error.value = ''
  successMsg.value = ''

  if (!input.value) {
    error.value = '请输入要编码的内容'
    return
  }

  try {
    const bytes = stringToBytes(input.value)
    output.value = base32Encode(bytes, currentAlphabet.value)
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

  if (!input.value) {
    error.value = '请输入要解码的 Base32 字符串'
    return
  }

  try {
    const bytes = base32Decode(input.value, currentAlphabet.value)
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
    successMsg.value = '已复制到剪贴板'
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
</style>
