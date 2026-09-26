<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔑 JWT 解码器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入 JWT Token：</label>
              <textarea
                v-model="jwtInput"
                placeholder='eyJhbG...ture'
                rows="6"
                class="code-input"
              ></textarea>
              <label class="tool-label">密钥（可选）：</label>
              <input
                v-model="secretKey"
                type="text"
                placeholder="输入密钥以验证签名"
                class="code-input-sm"
              />
              <div class="button-group button-group-2">
                <button class="tool-button primary" @click="decode" :disabled="!jwtInput.trim()">
                  🔍 解析
                </button>
                <button class="tool-button danger" @click="clear">
                  🗑️ 清空
                </button>
              </div>
            </div>
            <div class="tool-col">
              <!-- Header -->
              <div v-if="header" class="result-display">
                <div class="section-header">
                  <span class="section-title">▼ Header</span>
                  <button class="copy-btn-inline" @click="copy(header)">📋</button>
                </div>
                <pre class="json-content">{{ header }}</pre>
              </div>
              <!-- Payload -->
              <div v-if="payload" class="result-display">
                <div class="section-header">
                  <span class="section-title">▼ Payload</span>
                  <button class="copy-btn-inline" @click="copy(payload)">📋</button>
                </div>
                <pre class="json-content">{{ payload }}</pre>
                <div v-if="expInfo" class="exp-status" :class="{ expired: expInfo.isExpired }">
                  <span class="exp-icon">⏰</span>
                  <span class="exp-text">
                    {{ expInfo.isExpired ? '已过期' : '有效期：' + expInfo.remainingText }}
                  </span>
                </div>
              </div>
              <!-- Signature -->
              <div v-if="signature" class="result-display">
                <div class="section-header">
                  <span class="section-title">▼ Signature</span>
                  <button class="copy-btn-inline" @click="copy(signature)">📋</button>
                </div>
                <div class="signature-content">{{ signature }}</div>
              </div>
              <div v-if="!header && !error" class="result-display" style="color: var(--muted);">解析结果将显示在这里...</div>
            </div>
          </div>

          <!-- 签名验证结果 -->
          <div v-if="signatureValid !== null" class="signature-status" :class="signatureValid ? 'status-success' : 'status-error'">
            {{ signatureValid ? '✅ 签名验证通过' : '❌ 签名验证失败' }}
          </div>
          
          <!-- 错误提示 -->
          <div v-if="error" class="status-error">
            ❌ {{ error }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'JwtTool',
  components: {},
  data() {
    return {
      jwtInput: '',
      secretKey: '',
      header: '',
      payload: '',
      signature: '',
      expInfo: null,
      signatureValid: null,
      error: ''
    }
  },
  methods: {
    async decode() {
      this.error = ''
      this.header = ''
      this.payload = ''
      this.signature = ''
      this.expInfo = null
      this.signatureValid = null
      
      if (!this.jwtInput.trim()) {
        this.error = '请输入 JWT Token'
        return
      }
      
      const jwt = this.jwtInput.trim()
      const parts = jwt.split('.')
      
      if (parts.length !== 3) {
        this.error = '无效的 JWT 格式，需要包含 Header.Payload.Signature 三部分'
        return
      }
      
      try {
        // 解码 Header
        const headerJson = this.base64UrlDecode(parts[0])
        this.header = JSON.stringify(JSON.parse(headerJson), null, 2)
        
        // 解码 Payload
        const payloadJson = this.base64UrlDecode(parts[1])
        const payloadObj = JSON.parse(payloadJson)
        this.payload = JSON.stringify(payloadObj, null, 2)
        
        // 保存 Signature
        this.signature = parts[2]
        
        // 检查过期时间
        if (payloadObj.exp) {
          this.expInfo = this.checkExpiration(payloadObj.exp)
        }
        
        // 如果提供了密钥，验证签名
        if (this.secretKey.trim()) {
          await this.verifySignature(jwt, parts, this.secretKey.trim())
        }
      } catch (e) {
        this.error = '解析失败：' + e.message
      }
    },
    
    base64UrlDecode(str) {
      // Base64Url → Base64
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      // 补齐 padding
      while (base64.length % 4) {
        base64 += '='
      }
      // 解码
      try {
        return atob(base64)
      } catch (e) {
        throw new Error('Base64 解码失败')
      }
    },
    
    checkExpiration(exp) {
      const now = Math.floor(Date.now() / 1000)
      const isExpired = exp < now
      const remaining = exp - now
      
      let remainingText = ''
      if (isExpired) {
        const absRemaining = Math.abs(remaining)
        remainingText = this.formatDuration(absRemaining) + '前'
      } else {
        remainingText = this.formatDuration(remaining)
      }
      
      return {
        isExpired,
        remaining,
        remainingText,
        expDate: new Date(exp * 1000).toLocaleString('zh-CN')
      }
    },
    
    formatDuration(seconds) {
      if (seconds < 60) {
        return seconds + ' 秒'
      }
      if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        return minutes + ' 分钟'
      }
      if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return hours + ' 小时' + (minutes > 0 ? ' ' + minutes + ' 分' : '')
      }
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      return days + ' 天' + (hours > 0 ? ' ' + hours + ' 小时' : '')
    },
    
    async verifySignature(jwt, parts, secret) {
      try {
        const headerJson = this.base64UrlDecode(parts[0])
        const header = JSON.parse(headerJson)
        const algorithm = header.alg
        
        // 支持的算法
        const algoMap = {
          'HS256': 'SHA-256',
          'HS384': 'SHA-384',
          'HS512': 'SHA-512'
        }
        
        if (!algoMap[algorithm]) {
          this.signatureValid = null
          this.error = '不支持的签名算法：' + algorithm
          return
        }
        
        const algo = algoMap[algorithm]
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const message = encoder.encode(parts[0] + '.' + parts[1])
        
        // 导入密钥
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: algo },
          false,
          ['sign']
        )
        
        // 计算签名
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message)
        const signatureArray = new Uint8Array(signatureBuffer)
        
        // 转换为 Base64Url
        const computedSignature = btoa(String.fromCharCode(...signatureArray))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
        
        // 比较签名
        this.signatureValid = computedSignature === parts[2]
      } catch (e) {
        console.error('签名验证失败:', e)
        this.signatureValid = false
        this.error = '签名验证失败：' + e.message
      }
    },
    
    async copy(text) {
      await copyText(text)
    },
    
    clear() {
      this.jwtInput = ''
      this.secretKey = ''
      this.header = ''
      this.payload = ''
      this.signature = ''
      this.expInfo = null
      this.signatureValid = null
      this.error = ''
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.json-content {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.signature-content {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 0;
  overflow-x: auto;
  word-break: break-all;
}

.exp-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
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
  color: #ff8a8a;
}

.copy-btn-inline {
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 14px;
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

/* 浅色模式适配 */
[data-theme="light"] .json-content,
[data-theme="light"] .signature-content {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .exp-status {
  background: rgba(22, 163, 74, 0.1);
  border-color: rgba(22, 163, 74, 0.3);
}

[data-theme="light"] .exp-status.expired {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

[data-theme="light"] .exp-status.expired .exp-text {
  color: #dc2626;
}

[data-theme="light"] .signature-status.valid {
  background: rgba(22, 163, 74, 0.1);
  border-color: rgba(22, 163, 74, 0.3);
}

[data-theme="light"] .signature-status.invalid {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

[data-theme="light"] .signature-status.invalid .status-text {
  color: #dc2626;
}
</style>