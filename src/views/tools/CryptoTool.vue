<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 文本加密解密</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 密码输入（全宽） -->
        <div class="input-with-copy" style="margin-bottom: 14px;">
          <input
            class="code-input-sm"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="输入加密/解密密码..."
            style="padding-right: 70px;"
          />
          <button
            class="copy-btn"
            @click="showPassword = !showPassword"
            :title="showPassword ? '隐藏密码' : '显示密码'"
            style="right: 32px;"
          >{{ showPassword ? '🙈' : '👁️' }}</button>
          <button class="copy-btn" @click="copyPassword" title="复制密码">📋</button>
        </div>

        <!-- 双栏：输入 / 输出 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              placeholder="输入要加密的文本，或粘贴 Base64 密文进行解密..."
              rows="10"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出结果：</label>
            <textarea
              v-model="output"
              readonly
              rows="10"
              class="code-input output"
              placeholder="结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="encrypt" :disabled="!password || !input.trim()">
            🔐 加密
          </button>
          <button class="tool-button" @click="decrypt" :disabled="!password || !input.trim()">
            🔓 解密
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制结果
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <!-- 状态提示 -->
        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ successMsg }}</div>

        <!-- 提示信息 -->
        <div class="tool-hint" style="margin-top: 16px; color: var(--muted); font-size: 12px; font-family: var(--mono); line-height: 1.8;">
          <p>🔹 使用 <strong>AES-GCM</strong> 加密算法，基于浏览器 <strong>Web Crypto API</strong></p>
          <p>🔹 密钥通过 <strong>PBKDF2</strong> 从密码派生（100,000 次迭代）</p>
          <p>🔹 所有运算均在本地浏览器完成，数据不会上传到任何服务器</p>
          <p>🔹 加密结果格式：<strong>Base64(salt + IV + ciphertext)</strong></p>
          <p>🔹 解密时请使用<strong>相同的密码</strong></p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const password = ref('')
const input = ref('')
const output = ref('')
const error = ref('')
const success = ref(false)
const successMsg = ref('')
const showPassword = ref(false)

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

function showSuccess(msg) {
  success.value = true
  successMsg.value = msg
  setTimeout(() => {
    success.value = false
    successMsg.value = ''
  }, 2500)
}

async function deriveKey(passwordStr, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passwordStr),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function encrypt() {
  error.value = ''
  success.value = false

  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  if (!input.value.trim()) {
    error.value = '请输入要加密的文本'
    return
  }

  try {
    const enc = new TextEncoder()
    const plaintext = enc.encode(input.value)

    // 生成随机 salt 和 IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // 派生密钥
    const key = await deriveKey(password.value, salt)

    // 加密
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    )

    // 拼接: salt + iv + ciphertext
    const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength)
    combined.set(salt, 0)
    combined.set(iv, SALT_LENGTH)
    combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)

    output.value = arrayBufferToBase64(combined.buffer)
    showSuccess('加密成功')
  } catch (e) {
    error.value = '加密失败：' + e.message
    output.value = ''
  }
}

async function decrypt() {
  error.value = ''
  success.value = false

  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  if (!input.value.trim()) {
    error.value = '请输入要解密的 Base64 密文'
    return
  }

  try {
    // 解析 Base64 输入
    const combined = new Uint8Array(base64ToArrayBuffer(input.value.trim()))

    if (combined.length < SALT_LENGTH + IV_LENGTH + 1) {
      error.value = '解密失败：密文格式无效或数据不完整'
      return
    }

    // 提取 salt, iv, ciphertext
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

    // 派生密钥
    const key = await deriveKey(password.value, salt)

    // 解密
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )

    const dec = new TextDecoder()
    output.value = dec.decode(plaintext)
    showSuccess('解密成功')
  } catch (e) {
    if (e.name === 'OperationError') {
      error.value = '解密失败：密码错误或密文已损坏'
    } else if (e.name === 'InvalidCharacterError') {
      error.value = '解密失败：输入不是有效的 Base64 格式'
    } else {
      error.value = '解密失败：' + e.message
    }
    output.value = ''
  }
}

async function copyOutput() {
  if (await copyText(output.value)) {
    showSuccess('已复制到剪贴板')
  } else {
    error.value = '复制失败，请手动复制'
  }
}

async function copyPassword() {
  if (password.value && await copyText(password.value)) {
    showSuccess('密码已复制到剪贴板')
  }
}

function clear() {
  input.value = ''
  output.value = ''
  password.value = ''
  error.value = ''
  success.value = false
  successMsg.value = ''
}
</script>

<style scoped>
/* 提示区域样式 */
.tool-hint p {
  margin: 0;
}
</style>
