<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔢 Base62 编解码</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输入：</label>
              <button
                class="copy-btn"
                title="复制输入"
                @click="copyInput"
                :disabled="!input.trim()"
              >📋</button>
            </div>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="inputMode" value="text" />
                <span>文本</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="inputMode" value="number" />
                <span>数字</span>
              </label>
            </div>
            <textarea
              v-model="input"
              :placeholder="inputMode === 'text'
                ? '输入要编码的文本或要解码的 Base62 字符串...'
                : '输入十进制整数（如 123456789，支持超大数）...'"
              rows="10"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输出：</label>
              <button
                class="copy-btn"
                title="复制输出"
                @click="copyOutput"
                :disabled="!output"
              >📋</button>
            </div>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="outputMode" value="text" />
                <span>文本</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="outputMode" value="number" />
                <span>数字</span>
              </label>
            </div>
            <textarea
              :value="output"
              readonly
              rows="10"
              class="code-input output"
              placeholder="结果显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="encode">
            🔐 编码
          </button>
          <button class="tool-button" @click="decode">
            🔓 解码
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output">
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
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

// 标准 Base62 字母表：数字 + 大写字母 + 小写字母
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const inputMode = ref('text')
const outputMode = ref('text')

// ---------- 工具函数 ----------

function stringToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function bytesToBigInt(bytes) {
  let n = 0n
  for (const b of bytes) {
    n = (n << 8n) | BigInt(b)
  }
  return n
}

function bigIntToBytes(n) {
  if (n === 0n) return new Uint8Array(0)
  const bytes = []
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn))
    n >>= 8n
  }
  return new Uint8Array(bytes)
}

function bigIntToBase62(n) {
  if (n === 0n) return '0'
  let result = ''
  while (n > 0n) {
    result = ALPHABET[Number(n % 62n)] + result
    n /= 62n
  }
  return result
}

function base62ToBigInt(str) {
  let n = 0n
  for (const ch of str) {
    const idx = ALPHABET.indexOf(ch)
    if (idx === -1) {
      throw new Error(`无效的 Base62 字符: "${ch}"`)
    }
    n = n * 62n + BigInt(idx)
  }
  return n
}

// 文本 -> Base62（保留前导零字节）
function textToBase62(str) {
  const bytes = stringToBytes(str)
  let leadingZeros = 0
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++
  }
  const n = bytesToBigInt(bytes)
  if (n === 0n) return '0'.repeat(leadingZeros)
  return '0'.repeat(leadingZeros) + bigIntToBase62(n)
}

// Base62 -> 字节（还原前导零字节）
function base62ToBytes(str) {
  if (str.length === 0) return new Uint8Array(0)
  let leadingZeros = 0
  while (leadingZeros < str.length && str[leadingZeros] === '0') {
    leadingZeros++
  }
  const rest = str.slice(leadingZeros)
  if (rest.length === 0) return new Uint8Array(leadingZeros)
  const n = base62ToBigInt(rest)
  const bytes = bigIntToBytes(n)
  const full = new Uint8Array(leadingZeros + bytes.length)
  full.set(bytes, leadingZeros)
  return full
}

// 数字 -> Base62（支持负号）
function numberToBase62(str) {
  let neg = false
  let digits = str
  if (digits.startsWith('-')) {
    neg = true
    digits = digits.slice(1)
  }
  if (!/^\d+$/.test(digits)) {
    throw new Error('数字格式无效，仅支持十进制整数')
  }
  let n = BigInt(digits)
  const encoded = bigIntToBase62(n < 0n ? -n : n)
  return (neg ? '-' : '') + encoded
}

// Base62 -> 数字字符串
function base62ToNumber(str) {
  let neg = false
  let body = str
  if (body.startsWith('-')) {
    neg = true
    body = body.slice(1)
  }
  const n = base62ToBigInt(body)
  return (neg ? '-' : '') + n.toString()
}

// ---------- 操作 ----------

function encode() {
  error.value = ''
  successMsg.value = ''

  const raw = input.value.trim()
  if (!raw) {
    error.value = '请输入要编码的内容'
    return
  }

  try {
    if (inputMode.value === 'number') {
      output.value = numberToBase62(raw)
    } else {
      output.value = textToBase62(raw)
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

  // Base62 字符集中不含空白，去除输入中的空白字符（换行/空格）
  const raw = input.value.replace(/\s+/g, '')
  if (!raw) {
    error.value = '请输入要解码的 Base62 字符串'
    return
  }

  try {
    if (outputMode.value === 'number') {
      output.value = base62ToNumber(raw)
    } else {
      const bytes = base62ToBytes(raw)
      const text = bytesToText(bytes)
      if (text !== null) {
        output.value = text
      } else {
        error.value = '解码结果不是有效的 UTF-8 文本，请将输出模式切换为「数字」查看数值形式'
        output.value = ''
        return
      }
    }
    successMsg.value = '解码成功'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (e) {
    error.value = '解码失败：' + e.message
    output.value = ''
  }
}

async function copyInput() {
  if (await copyText(input.value)) {
    successMsg.value = '已复制输入内容'
    setTimeout(() => { successMsg.value = '' }, 2000)
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
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
