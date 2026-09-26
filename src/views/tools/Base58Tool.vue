<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 Base58 编解码</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输入：</label>
              <button
                class="copy-btn"
                title="复制输入"
                :disabled="!input"
                @click="copyInput"
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
              rows="10"
              class="code-input"
              :placeholder="inputMode === 'text'
                ? '输入要编码的文本，或要解码的 Base58 字符串...'
                : '输入十六进制字符串（如 48656C6C6F21）...'"
            ></textarea>

            <div class="check-block">
              <label class="checkbox-label">
                <input type="checkbox" v-model="useCheck" />
                <span>Base58Check（附加 4 字节双 SHA-256 校验和）</span>
              </label>
            </div>

            <div v-if="useCheck" class="check-opts">
              <label class="tool-label">版本字节：</label>
              <select v-model="versionHex" class="code-input-sm">
                <option
                  v-for="p in VERSION_PRESETS"
                  :key="p.value"
                  :value="p.value"
                >{{ p.label }}</option>
              </select>
            </div>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输出：</label>
              <button
                class="copy-btn"
                title="复制输出"
                :disabled="!output"
                @click="copyOutput"
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

            <div class="meta-row">
              <span class="meta-item">输入 {{ inputBytes }} B</span>
              <span class="meta-item">输出 {{ output.length }} 字符</span>
              <span class="meta-item">{{ useCheck ? 'Base58Check' : 'Base58' }}</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="encode">🔐 编码</button>
          <button class="tool-button" @click="decode">🔓 解码</button>
          <button class="tool-button" :disabled="!output" @click="copyOutput">📋 复制</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button" :disabled="!output" @click="swap">⇅ 输出转输入</button>
          <button class="tool-button" @click="loadExample">🎲 载入示例</button>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="successMsg" class="status-success">✅ {{ successMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

// Bitcoin / IPFS 常用 Base58 字母表（去掉 0 O I l）
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const B58_MAP = (() => {
  const m = {}
  for (let i = 0; i < ALPHABET.length; i++) m[ALPHABET[i]] = i
  return m
})()

const VERSION_PRESETS = [
  { value: '00', label: '00 — Bitcoin P2PKH 地址' },
  { value: '05', label: '05 — Bitcoin P2SH 地址' },
  { value: '6f', label: '6f — 测试网 P2PKH 地址' },
  { value: '80', label: '80 — WIF 私钥' },
  { value: 'ef', label: 'ef — 测试网 WIF 私钥' },
  { value: '7a', label: '7a — Zcash 地址' },
  { value: '70', label: '70 — 无版本（纯数据 + 校验和）' }
]

const VERSION_NAMES = {
  '00': 'P2PKH 地址',
  '05': 'P2SH 地址',
  '6f': '测试网 P2PKH 地址',
  '80': 'WIF 私钥',
  'ef': '测试网 WIF 私钥',
  '7a': 'Zcash 地址'
}

const input = ref('')
const output = ref('')
const error = ref('')
const successMsg = ref('')
const inputMode = ref('text')
const outputMode = ref('text')
const useCheck = ref(false)
const versionHex = ref('00')

const inputBytes = computed(() => {
  if (!input.value) return 0
  try {
    return inputMode.value === 'hex'
      ? Math.floor(input.value.replace(/\s+/g, '').replace(/^0x/i, '').length / 2)
      : new TextEncoder().encode(input.value).length
  } catch {
    return 0
  }
})

/* ---------- 字节 / 文本 转换 ---------- */

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

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function hexToBytes(hex) {
  const clean = hex.replace(/^0x/i, '').replace(/[\s:,-]+/g, '')
  if (!clean) throw new Error('Hex 内容为空')
  if (clean.length % 2 !== 0) throw new Error('Hex 字符串长度必须为偶数')
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('Hex 字符串包含非法字符')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

/* ---------- Base58 核心（BigInt 大数运算） ---------- */

function base58Encode(bytes) {
  let n = 0n
  for (const b of bytes) n = (n << 8n) | BigInt(b)

  let out = ''
  while (n > 0n) {
    out = ALPHABET[Number(n % 58n)] + out
    n /= 58n
  }

  // 前导零字节 -> '1'
  let zeros = 0
  for (const b of bytes) {
    if (b === 0) zeros++
    else break
  }
  return '1'.repeat(zeros) + out
}

function base58Decode(str) {
  const clean = str.trim()
  if (!clean) throw new Error('Base58 内容为空')

  let n = 0n
  for (const ch of clean) {
    const idx = B58_MAP[ch]
    if (idx === undefined) {
      throw new Error(`无效的 Base58 字符："${ch}"（字母表不含 0 O I l 及空格等符号）`)
    }
    n = n * 58n + BigInt(idx)
  }

  const bytes = []
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn))
    n >>= 8n
  }

  let zeros = 0
  for (const ch of clean) {
    if (ch === '1') zeros++
    else break
  }

  const out = new Uint8Array(zeros + bytes.length)
  out.set(bytes, zeros)
  return out
}

/* ---------- Base58Check（双 SHA-256 校验和） ---------- */

async function sha256(bytes) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto，无法计算 Base58Check 校验和')
  }
  const buf = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(buf)
}

async function doubleSha256(bytes) {
  return sha256(await sha256(bytes))
}

async function base58CheckEncode(payload) {
  const prefix = hexToBytes(versionHex.value || '00')
  if (prefix.length !== 1) throw new Error('版本字节必须为 1 个字节（2 位 Hex）')
  const body = new Uint8Array(prefix.length + payload.length)
  body.set(prefix, 0)
  body.set(payload, prefix.length)

  const checksum = (await doubleSha256(body)).slice(0, 4)
  const full = new Uint8Array(body.length + 4)
  full.set(body, 0)
  full.set(checksum, body.length)
  return base58Encode(full)
}

async function base58CheckDecode(str) {
  const raw = base58Decode(str)
  if (raw.length < 5) throw new Error('Base58Check 数据过短（至少需要 1 字节版本 + 4 字节校验和）')

  const body = raw.slice(0, raw.length - 4)
  const checksum = raw.slice(raw.length - 4)
  const expect = (await doubleSha256(body)).slice(0, 4)

  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expect[i]) {
      throw new Error('Base58Check 校验和验证失败，数据可能被篡改或并非 Base58Check 编码')
    }
  }

  return { version: body[0], payload: body.slice(1) }
}

/* ---------- 交互逻辑 ---------- */

function inputToBytes() {
  if (!input.value) throw new Error('请输入要编码的内容')
  return inputMode.value === 'hex' ? hexToBytes(input.value) : textToBytes(input.value)
}

function setSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 2500)
}

async function encode() {
  error.value = ''
  successMsg.value = ''
  try {
    const bytes = inputToBytes()
    if (useCheck.value) {
      output.value = await base58CheckEncode(bytes)
      setSuccess('Base58Check 编码成功（已附加 4 字节校验和）')
    } else {
      output.value = base58Encode(bytes)
      setSuccess('Base58 编码成功')
    }
  } catch (e) {
    error.value = '编码失败：' + e.message
    output.value = ''
  }
}

async function decode() {
  error.value = ''
  successMsg.value = ''
  if (!input.value.trim()) {
    error.value = '请输入要解码的 Base58 字符串'
    return
  }
  try {
    if (useCheck.value) {
      const { version, payload } = await base58CheckDecode(input.value.trim())
      const note = writeDecoded(payload)
      const vHex = version.toString(16).padStart(2, '0')
      const name = VERSION_NAMES[vHex]
      setSuccess(note || `Base58Check 解码成功 · 版本字节 0x${vHex}${name ? `（${name}）` : ''}`)
    } else {
      const note = writeDecoded(base58Decode(input.value.trim()))
      setSuccess(note || 'Base58 解码成功')
    }
  } catch (e) {
    error.value = '解码失败：' + e.message
    output.value = ''
  }
}

function writeDecoded(bytes) {
  if (outputMode.value === 'hex') {
    output.value = bytesToHex(bytes)
    return ''
  }
  const text = bytesToText(bytes)
  if (text !== null) {
    output.value = text
    return ''
  }
  output.value = bytesToHex(bytes)
  outputMode.value = 'hex'
  return '解码成功（非 UTF-8 文本，已自动切换为 Hex 显示）'
}

function swap() {
  if (!output.value) return
  input.value = output.value
  // Base58 编码结果一定是 ASCII 文本
  inputMode.value = 'text'
  outputMode.value = 'text'
  // 交换后原输出方向反转，输出清空待重新操作
  output.value = ''
  error.value = ''
  setSuccess('已将输出内容转入输入框')
}

function loadExample() {
  useCheck.value = false
  inputMode.value = 'text'
  outputMode.value = 'text'
  input.value = 'Hello, 403.li! 👋'
  output.value = ''
  error.value = ''
  setSuccess('示例已载入，点击「编码」试试')
}

async function copyInput() {
  if (await copyText(input.value)) setSuccess('已复制输入内容')
}

async function copyOutput() {
  if (await copyText(output.value)) setSuccess('已复制到剪贴板')
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

.check-block {
  margin-top: 1px;
}

.check-opts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 1px;
}

.check-opts select.code-input-sm {
  width: 100%;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  padding: 3px 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  font-size: 12px;
  border-radius: 0;
}

@media (max-width: 640px) {
  .meta-item {
    font-size: 11px;
  }
}
</style>
