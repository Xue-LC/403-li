<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔢 Base91 编解码</span>
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
                :disabled="!input"
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
                ? '输入要编码的文本，或要解码的 Base91 字符串...'
                : '输入十六进制字节串（如 48656c6c6f），用于编码...'"
              rows="12"
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
              rows="12"
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

        <div v-if="stats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">原始字节</span>
              <span class="stat-value">{{ stats.bytes }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Base91 长度</span>
              <span class="stat-value">{{ stats.b91 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Base64 长度</span>
              <span class="stat-value">{{ stats.b64 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">较 Base64 节省</span>
              <span class="stat-value">{{ stats.saving }}</span>
            </div>
          </div>
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

// 官方 basE91 字母表（91 个字符，顺序不可更改）
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"'

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const inputMode = ref('text')
const outputMode = ref('text')
const stats = ref(null)

// ---------- 字节编解码工具 ----------

function textToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '')
  if (clean.length === 0) return new Uint8Array(0)
  if (clean.length % 2 !== 0) {
    throw new Error('Hex 长度必须为偶数')
  }
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error('包含非法的 Hex 字符')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  let s = ''
  for (const b of bytes) {
    s += b.toString(16).padStart(2, '0')
  }
  return s
}

function bytesToBase64Length(n) {
  return n === 0 ? 0 : Math.ceil(n / 3) * 4
}

// ---------- basE91 核心算法（Joachim Henke 参考实现，纯字节流） ----------

function encodeBytes(bytes) {
  let queue = 0
  let nbits = 0
  let out = ''

  for (let i = 0; i < bytes.length; i++) {
    queue |= bytes[i] << nbits
    nbits += 8

    if (nbits > 13) {
      let v = queue & 8191
      if (v > 88) {
        queue >>>= 13
        nbits -= 13
      } else {
        v = queue & 16383
        queue >>>= 14
        nbits -= 14
      }
      out += ALPHABET[v % 91] + ALPHABET[Math.floor(v / 91)]
    }
  }

  if (nbits) {
    out += ALPHABET[queue % 91]
    if (nbits > 7 || queue > 90) {
      out += ALPHABET[Math.floor(queue / 91)]
    }
  }

  return out
}

function decodeBytes(str) {
  const out = []
  let queue = 0
  let nbits = 0
  let v = -1

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const d = ALPHABET.indexOf(ch)
    if (d === -1) {
      // 字母表中不含空白，忽略换行/空格等空白字符
      if (/\s/.test(ch)) continue
      throw new Error(`无效的 Base91 字符: "${ch}"`)
    }

    if (v < 0) {
      v = d
    } else {
      v += d * 91
      queue |= v << nbits
      nbits += (v & 8191) > 88 ? 13 : 14

      while (nbits > 7) {
        out.push(queue & 255)
        queue >>>= 8
        nbits -= 8
      }
      v = -1
    }
  }

  if (v !== -1) {
    out.push((queue | (v << nbits)) & 255)
  }

  return new Uint8Array(out)
}

// ---------- 统计信息 ----------

function updateStats(bytes, b91Len) {
  const n = bytes.length
  const b64 = bytesToBase64Length(n)
  let saving = '—'
  if (b64 > 0) {
    const pct = ((b64 - b91Len) / b64) * 100
    saving = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
  }
  stats.value = { bytes: n, b91: b91Len, b64, saving }
}

// ---------- 操作 ----------

function encode() {
  error.value = ''
  successMsg.value = ''
  stats.value = null

  const raw = input.value
  if (!raw.trim()) {
    error.value = '请输入要编码的内容'
    return
  }

  try {
    const bytes = inputMode.value === 'hex' ? hexToBytes(raw) : textToBytes(raw)
    if (bytes.length === 0) {
      error.value = '没有可编码的字节'
      return
    }
    const result = encodeBytes(bytes)
    output.value = result
    updateStats(bytes, result.length)
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
  stats.value = null

  const raw = input.value.replace(/\s+/g, '')
  if (!raw) {
    error.value = '请输入要解码的 Base91 字符串'
    return
  }

  try {
    const bytes = decodeBytes(raw)
    if (outputMode.value === 'hex') {
      output.value = bytesToHex(bytes)
    } else {
      const text = bytesToText(bytes)
      if (text === null) {
        error.value = '解码结果不是有效的 UTF-8 文本，请将输出模式切换为「Hex」查看字节'
        output.value = ''
        return
      }
      output.value = text
    }
    updateStats(bytes, raw.length)
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
  stats.value = null
}
</script>

<style scoped>
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
