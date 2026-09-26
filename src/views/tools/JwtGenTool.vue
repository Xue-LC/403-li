<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 JWT 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：配置 -->
          <div class="tool-col">
            <label class="tool-label">签名算法：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="algo in algorithms" :key="algo.value">
                <input type="radio" v-model="algorithm" :value="algo.value" />
                <span>{{ algo.label }}</span>
              </label>
            </div>

            <label class="tool-label">密钥（Secret Key）：</label>
            <input
              class="code-input-sm"
              v-model="secretKey"
              type="text"
              placeholder="输入 HMAC 签名密钥（必填）"
            />

            <label class="tool-label">过期时间：</label>
            <div class="expiry-row">
              <select v-model.number="expiryValue" class="expiry-select">
                <option v-for="v in expiryOptions" :key="v" :value="v">{{ v }}</option>
              </select>
              <select v-model="expiryUnit" class="expiry-select">
                <option value="minutes">分钟</option>
                <option value="hours">小时</option>
                <option value="days">天</option>
              </select>
            </div>

            <label class="tool-label">Header（JSON）：</label>
            <textarea
              class="code-input"
              v-model="headerJson"
              rows="4"
              placeholder='{"alg":"HS256","typ":"JWT"}'
            ></textarea>

            <label class="tool-label">Payload（JSON）：</label>
            <textarea
              class="code-input"
              v-model="payloadJson"
              rows="8"
              placeholder='{"sub":"1234567890","name":"John Doe"}'
            ></textarea>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <label class="tool-label">生成的 JWT Token：</label>
            <textarea
              class="code-input output"
              :value="generatedToken"
              readonly
              rows="8"
              placeholder="点击生成按钮后，Token 将显示在这里..."
            ></textarea>
            <button
              v-if="generatedToken"
              class="copy-btn-inline"
              @click="copyToken"
            >📋 复制 Token</button>

            <!-- 三部分拆分显示 -->
            <div v-if="tokenParts" class="token-breakdown">
              <div class="section-header">
                <span class="section-title">▼ Token 结构</span>
              </div>
              <div class="token-part header-part">
                <span class="part-label">HEADER</span>
                <span class="part-color-header">{{ tokenParts.header }}</span>
                <button class="mini-copy" @click="copyPartial(tokenParts.header)" title="复制 Header">📋</button>
              </div>
              <div class="token-part payload-part">
                <span class="part-label">PAYLOAD</span>
                <span class="part-color-payload">{{ tokenParts.payload }}</span>
                <button class="mini-copy" @click="copyPartial(tokenParts.payload)" title="复制 Payload">📋</button>
              </div>
              <div class="token-part sig-part">
                <span class="part-label">SIGNATURE</span>
                <span class="part-color-sig">{{ tokenParts.signature }}</span>
                <button class="mini-copy" @click="copyPartial(tokenParts.signature)" title="复制 Signature">📋</button>
              </div>
            </div>

            <!-- 解码预览 -->
            <div v-if="decodedHeader" class="result-display" style="margin-top: 12px;">
              <div class="section-header">
                <span class="section-title">▼ 解码预览 — Header</span>
                <button class="copy-btn-inline" @click="copyPartial(decodedHeader)">📋</button>
              </div>
              <pre class="json-content">{{ decodedHeader }}</pre>
            </div>
            <div v-if="decodedPayload" class="result-display">
              <div class="section-header">
                <span class="section-title">▼ 解码预览 — Payload</span>
                <button class="copy-btn-inline" @click="copyPartial(decodedPayload)">📋</button>
              </div>
              <pre class="json-content">{{ decodedPayload }}</pre>
              <div v-if="expInfo" class="exp-status" :class="{ expired: expInfo.isExpired }">
                <span class="exp-icon">⏰</span>
                <span class="exp-text">
                  过期时间：{{ expInfo.expDate }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="generate" :disabled="!canGenerate">
            🔐 生成 Token
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// ---- State ----
const algorithm = ref('HS256')
const secretKey = ref('')
const expiryValue = ref(30)
const expiryUnit = ref('minutes')
const headerJson = ref('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
const payloadJson = ref('{\n  "sub": "1234567890",\n  "name": "Anonymous"\n}')
const generatedToken = ref('')
const error = ref('')
const success = ref('')

const algorithms = [
  { value: 'HS256', label: 'HS256' },
  { value: 'HS384', label: 'HS384' },
  { value: 'HS512', label: 'HS512' }
]

const expiryOptions = [5, 15, 30, 60, 120, 1440, 10080]

// ---- Derived ----
const canGenerate = computed(() => secretKey.value.trim().length > 0)

const tokenParts = computed(() => {
  if (!generatedToken.value) return null
  const parts = generatedToken.value.split('.')
  if (parts.length !== 3) return null
  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2]
  }
})

const decodedHeader = computed(() => {
  if (!tokenParts.value) return null
  try {
    const decoded = base64UrlDecode(tokenParts.value.header)
    return JSON.stringify(JSON.parse(decoded), null, 2)
  } catch {
    return null
  }
})

const decodedPayload = computed(() => {
  if (!tokenParts.value) return null
  try {
    const decoded = base64UrlDecode(tokenParts.value.payload)
    const obj = JSON.parse(decoded)
    return JSON.stringify(obj, null, 2)
  } catch {
    return null
  }
})

const expInfo = computed(() => {
  if (!tokenParts.value) return null
  try {
    const decoded = base64UrlDecode(tokenParts.value.payload)
    const obj = JSON.parse(decoded)
    if (!obj.exp) return null
    const now = Math.floor(Date.now() / 1000)
    return {
      isExpired: obj.exp < now,
      expDate: new Date(obj.exp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
    }
  } catch {
    return null
  }
})

// ---- Watchers ----
watch(algorithm, (newAlgo) => {
  // Auto-update header alg field
  try {
    const header = JSON.parse(headerJson.value)
    header.alg = newAlgo
    headerJson.value = JSON.stringify(header, null, 2)
  } catch {
    // If header is invalid, don't auto-update
  }
})

// ---- Utility ----
function base64UrlEncode(str) {
  const base64 = btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return decodeURIComponent(escape(atob(str)))
}

function base64UrlEncodeFromBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function calculateExp() {
  const now = Math.floor(Date.now() / 1000)
  const multiplier = expiryUnit.value === 'minutes' ? 60 : expiryUnit.value === 'hours' ? 3600 : 86400
  return now + expiryValue.value * multiplier
}

// ---- Actions ----
async function generate() {
  error.value = ''
  success.value = ''
  generatedToken.value = ''

  if (!secretKey.value.trim()) {
    error.value = '请输入密钥（Secret Key）'
    return
  }

  // Parse and validate Header
  let headerObj
  try {
    headerObj = JSON.parse(headerJson.value)
  } catch (e) {
    error.value = 'Header JSON 解析失败：' + e.message
    return
  }
  if (typeof headerObj !== 'object' || headerObj === null || Array.isArray(headerObj)) {
    error.value = 'Header 必须是一个 JSON 对象'
    return
  }

  // Parse and validate Payload
  let payloadObj
  try {
    payloadObj = JSON.parse(payloadJson.value)
  } catch (e) {
    error.value = 'Payload JSON 解析失败：' + e.message
    return
  }
  if (typeof payloadObj !== 'object' || payloadObj === null || Array.isArray(payloadObj)) {
    error.value = 'Payload 必须是一个 JSON 对象'
    return
  }

  // Set algorithm and standard claims
  headerObj.alg = algorithm.value
  headerObj.typ = 'JWT'
  payloadObj.iat = Math.floor(Date.now() / 1000)
  payloadObj.exp = calculateExp()

  try {
    const algoMap = {
      HS256: 'SHA-256',
      HS384: 'SHA-384',
      HS512: 'SHA-512'
    }

    const headerEncoded = base64UrlEncode(JSON.stringify(headerObj))
    const payloadEncoded = base64UrlEncode(JSON.stringify(payloadObj))
    const message = headerEncoded + '.' + payloadEncoded

    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey.value.trim())
    const messageData = encoder.encode(message)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: algoMap[algorithm.value] },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const signatureEncoded = base64UrlEncodeFromBuffer(signatureBuffer)

    generatedToken.value = message + '.' + signatureEncoded
    success.value = 'JWT Token 生成成功！'

    // Update header display to include actual alg
    headerJson.value = JSON.stringify(headerObj, null, 2)
    payloadJson.value = JSON.stringify(payloadObj, null, 2)
  } catch (e) {
    error.value = '生成失败：' + e.message
    console.error('JWT generation error:', e)
  }
}

async function copyToken() {
  const ok = await copyText(generatedToken.value)
  if (ok) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { if (success.value === '已复制到剪贴板') success.value = '' }, 2000)
  } else {
    error.value = '复制失败'
  }
}

async function copyPartial(text) {
  await copyText(text)
}

function clearAll() {
  secretKey.value = ''
  generatedToken.value = ''
  error.value = ''
  success.value = ''
  expiryValue.value = 30
  expiryUnit.value = 'minutes'
  headerJson.value = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'
  payloadJson.value = '{\n  "sub": "1234567890",\n  "name": "Anonymous"\n}'
  algorithm.value = 'HS256'
}
</script>

<style scoped>
/* === 过期时间行 === */
.expiry-row {
  display: flex;
  gap: 8px;
}

.expiry-select {
  flex: 1;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 0 10px;
  height: 40px;
  outline: none;
  cursor: pointer;
  border-radius: 0;
}

.expiry-select:focus {
  border-color: var(--green);
}

/* === Token 结构拆分 === */
.token-breakdown {
  margin-top: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.token-part {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  word-break: break-all;
}

.part-label {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
  padding-top: 2px;
  min-width: 80px;
}

.part-color-header {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  flex: 1;
  word-break: break-all;
}

.header-part .part-color-header {
  color: var(--red);
}
.payload-part .part-color-payload {
  color: var(--green);
}
.sig-part .part-color-sig {
  color: var(--muted);
}

.mini-copy {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  flex-shrink: 0;
  border-radius: 0;
}

.mini-copy:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

/* === 复制按钮 === */
.copy-btn-inline {
  padding: 6px 12px;
  font-family: var(--mono);
  font-size: 13px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

/* === JSON 内容 === */
.json-content {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  background: var(--panel);
  padding: 12px;
  border-radius: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* === 过期状态 === */
.exp-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(157, 255, 107, 0.1);
  border: 1px solid rgba(157, 255, 107, 0.3);
  border-radius: 0;
}

.exp-status.expired {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
}

.exp-icon {
  font-size: 16px;
}

.exp-text {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
}

.exp-status.expired .exp-text {
  color: var(--red);
}

/* === 浅色模式 === */
[data-theme="light"] .json-content {
  background: var(--panel);
}

[data-theme="light"] .exp-status {
  background: rgba(22, 163, 74, 0.1);
  border-color: rgba(22, 163, 74, 0.3);
}

[data-theme="light"] .exp-status.expired {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

[data-theme="light"] .exp-status .exp-text {
  color: #16a34a;
}

[data-theme="light"] .exp-status.expired .exp-text {
  color: #dc2626;
}

@media (max-width: 640px) {
  .expiry-row {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
