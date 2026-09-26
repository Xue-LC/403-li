<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 HMAC 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区 -->
          <div class="tool-col">
            <label class="tool-label">消息内容：</label>
            <textarea
              v-model="message"
              class="code-input"
              rows="6"
              placeholder="输入要计算 HMAC 的消息"
            ></textarea>

            <label class="tool-label" style="margin-top: 1rem;">密钥 (Secret Key)：</label>
            <div class="input-with-copy">
              <input
                v-model="secretKey"
                class="code-input-sm"
                :placeholder="keyFormat === 'hex' ? '十六进制密钥（如 aabbccdd）' : '输入密钥字符串'"
              />
            </div>

            <label class="tool-label" style="margin-top: 1rem;">密钥格式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="keyFormat" value="text" />
                <span>文本</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="keyFormat" value="hex" />
                <span>Hex</span>
              </label>
            </div>

            <label class="tool-label" style="margin-top: 1rem;">哈希算法：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="SHA-1" />
                <span>SHA-1</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="SHA-256" />
                <span>SHA-256</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="SHA-384" />
                <span>SHA-384</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="algorithm" value="SHA-512" />
                <span>SHA-512</span>
              </label>
            </div>

            <label class="tool-label" style="margin-top: 1rem;">输出格式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="outputFormat" value="hex" />
                <span>Hex</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="outputFormat" value="base64" />
                <span>Base64</span>
              </label>
            </div>
          </div>

          <!-- 右侧：输出区 -->
          <div class="tool-col">
            <label class="tool-label">HMAC 结果：</label>
            <div v-if="result" class="result-display">
              <code class="hmac-result-text">{{ result }}</code>
              <button class="copy-btn" @click="copyResult" title="复制">📋</button>
            </div>
            <div v-else class="result-display" style="color: var(--muted);">
              HMAC 结果将显示在这里...
            </div>

            <div v-if="result && outputFormat === 'hex'" class="hmac-uppercase" style="margin-top: 0.5rem;">
              <label class="tool-label">大写：</label>
              <code class="hash-value" style="display:block;word-break:break-all;">{{ result.toUpperCase() }}</code>
            </div>
          </div>
        </div>

        <!-- 按钮区 -->
        <div class="button-group button-group-2" style="margin-top: 1rem;">
          <button class="tool-button primary" @click="computeHmac" :disabled="computing">
            {{ computing ? '计算中...' : '🔐 计算 HMAC' }}
          </button>
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

const message = ref('')
const secretKey = ref('')
const keyFormat = ref('text')
const algorithm = ref('SHA-256')
const outputFormat = ref('hex')
const result = ref('')
const error = ref('')
const success = ref('')
const computing = ref(false)

function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '')
  if (clean.length % 2 !== 0) {
    throw new Error('Hex 密钥长度必须是偶数')
  }
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error('Hex 密钥包含非法字符（仅允许 0-9, a-f, A-F）')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function bytesToBase64(bytes) {
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('')
  return btoa(binary)
}

async function computeHmac() {
  error.value = ''
  success.value = ''
  result.value = ''

  if (!message.value.trim()) {
    error.value = '请输入消息内容'
    return
  }
  if (!secretKey.value.trim()) {
    error.value = '请输入密钥'
    return
  }

  computing.value = true
  try {
    let keyBytes
    if (keyFormat.value === 'hex') {
      keyBytes = hexToBytes(secretKey.value)
    } else {
      keyBytes = new TextEncoder().encode(secretKey.value)
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: algorithm.value },
      false,
      ['sign']
    )

    const msgBytes = new TextEncoder().encode(message.value)
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes)
    const sigArray = new Uint8Array(signature)

    if (outputFormat.value === 'hex') {
      result.value = bytesToHex(sigArray)
    } else {
      result.value = bytesToBase64(sigArray)
    }

    success.value = '计算成功！'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = '计算失败：' + e.message
  } finally {
    computing.value = false
  }
}

async function copyResult() {
  if (!result.value) return
  if (await copyText(result.value)) {
    success.value = '已复制到剪贴板！'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

function clearAll() {
  message.value = ''
  secretKey.value = ''
  result.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.hmac-result-text {
  font-family: var(--mono);
  font-size: 13px;
  word-break: break-all;
  color: var(--green);
  user-select: all;
}

.hmac-uppercase .hash-value {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  background: rgba(255,255,255,0.02);
  padding: 8px;
  border: 1px solid var(--line);
}

@media (max-width: 640px) {
  .hmac-result-text {
    font-size: 11px;
  }
}
</style>
