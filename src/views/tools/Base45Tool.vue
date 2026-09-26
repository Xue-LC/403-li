<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 Base45 编解码</span>
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
                <input type="radio" v-model="inputMode" value="hex" />
                <span>Hex</span>
              </label>
            </div>
            <textarea
              v-model="input"
              :placeholder="inputMode === 'text'
                ? '输入要编码的文本或要解码的 Base45 字符串...'
                : '输入十六进制字符串（如 48656C6C6F21）...'"
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
                <input type="radio" v-model="outputMode" value="hex" />
                <span>Hex</span>
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

// RFC 9285 标准字母表（注意包含空格字符，解码时不能去除空白）
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const inputMode = ref('text')
const outputMode = ref('text')

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

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function hexToBytes(hex) {
  const clean = hex.replace(/^0x/i, '').replace(/\s+/g, '')
  if (clean.length === 0) throw new Error('Hex 内容为空')
  if (clean.length % 2 !== 0) throw new Error('Hex 字符串长度必须为偶数')
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('Hex 字符串包含非法字符')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

function base45Encode(bytes) {
  let result = ''
  const len = bytes.length
  let i = 0

  while (i < len) {
    if (i + 1 < len) {
      // 两个字节 -> 三个 Base45 字符
      const value = bytes[i] * 256 + bytes[i + 1]
      result += ALPHABET[value % 45]
      result += ALPHABET[Math.floor(value / 45) % 45]
      result += ALPHABET[Math.floor(value / 2025)]
    } else {
      // 一个字节 -> 两个 Base45 字符
      const value = bytes[i]
      result += ALPHABET[value % 45]
      result += ALPHABET[Math.floor(value / 45)]
    }
    i += 2
  }

  return result
}

function base45Decode(str) {
  if (str.length === 0) throw new Error('Base45 内容为空')

  // 长度必须是 3 的倍数或 3 的倍数 + 2（不允许单独剩 1 个字符）
  if (str.length % 3 === 1) {
    throw new Error('Base45 字符串长度无效（必须为 3n 或 3n+2）')
  }

  const reverse = {}
  for (let i = 0; i < ALPHABET.length; i++) {
    reverse[ALPHABET[i]] = i
  }

  const bytes = []
  let i = 0
  while (i < str.length) {
    const chunkLen = Math.min(3, str.length - i)
    let value = 0
    for (let j = 0; j < chunkLen; j++) {
      const ch = str[i + j]
      const idx = reverse[ch]
      if (idx === undefined) {
        throw new Error(`无效的 Base45 字符: "${ch}"`)
      }
      value += idx * Math.pow(45, j)
    }

    if (chunkLen === 3) {
      if (value > 65535) throw new Error('无效的 Base45 数据（3 字符块数值超出 0xFFFF）')
      bytes.push(Math.floor(value / 256), value % 256)
    } else {
      if (value > 255) throw new Error('无效的 Base45 数据（2 字符块数值超出 0xFF）')
      bytes.push(value)
    }
    i += chunkLen
  }

  return new Uint8Array(bytes)
}

function encode() {
  error.value = ''
  successMsg.value = ''

  if (!input.value) {
    error.value = '请输入要编码的内容'
    return
  }

  try {
    const bytes = inputMode.value === 'hex' ? hexToBytes(input.value) : stringToBytes(input.value)
    output.value = base45Encode(bytes)
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
    error.value = '请输入要解码的 Base45 字符串'
    return
  }

  try {
    const bytes = base45Decode(input.value)
    if (outputMode.value === 'hex') {
      output.value = bytesToHex(bytes)
    } else {
      const text = bytesToText(bytes)
      if (text !== null) {
        output.value = text
      } else {
        // 解码结果不是合法 UTF-8 文本时，自动输出 Hex 形式
        output.value = bytesToHex(bytes)
        outputMode.value = 'hex'
        successMsg.value = '解码成功（非 UTF-8 文本，已自动切换为 Hex 显示）'
        setTimeout(() => { successMsg.value = '' }, 3000)
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
