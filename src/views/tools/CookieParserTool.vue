<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🍪 Cookie 解析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 解析模式 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">Cookie 字符串：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="parseMode" value="cookie" />
                <span>Cookie 请求头</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="parseMode" value="set-cookie" />
                <span>Set-Cookie 响应头</span>
              </label>
            </div>
            <textarea
              v-model="input"
              :placeholder="parseMode === 'cookie'
                ? 'name1=value1; name2=value2'
                : 'sessionId=abc123; Domain=.example.com; Path=/; Secure; HttpOnly; SameSite=Lax'"
              rows="8"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">解析结果：</label>
            <div class="cookie-results-panel">
              <div v-if="!input.trim()" class="cookie-placeholder">
                请在左侧输入 Cookie 字符串，点击「解析」查看结果
              </div>
              <div v-else-if="parsedCookies.length === 0 && !input.trim()" class="cookie-placeholder">
                请在左侧输入 Cookie 字符串，点击「解析」查看结果
              </div>
              <div v-else-if="parsedCookies.length === 0" class="cookie-placeholder">
                点击「解析」按钮查看结果
              </div>
              <div v-else class="cookie-results">
                <div v-for="(cookie, idx) in parsedCookies" :key="idx" class="cookie-card">
                  <div class="cookie-card-header">
                    <span class="cookie-name">{{ cookie.name }}</span>
                    <button class="copy-btn-inline" @click="copyCookie(idx)" title="复制此 Cookie">📋</button>
                  </div>
                  <div class="cookie-value">{{ cookie.value }}</div>
                  <div v-if="cookie.attrs && cookie.attrs.length" class="cookie-attrs">
                    <span
                      v-for="(attr, ai) in cookie.attrs"
                      :key="ai"
                      class="cookie-attr-tag"
                      :class="{ 'attr-flag': !attr.value }"
                    >{{ attr.key }}<template v-if="attr.value">={{ attr.value }}</template></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="parseCookies" :disabled="!input.trim()">
            🔍 解析
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copyMsg" class="status-success">✅ {{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>

        <!-- Set-Cookie 构造器 -->
        <div class="builder-section">
          <div class="builder-header" @click="showBuilder = !showBuilder">
            <span>✏️ 构造 Set-Cookie</span>
            <span class="builder-toggle">{{ showBuilder ? '▲' : '▼' }}</span>
          </div>
          <div v-if="showBuilder" class="builder-body">
            <div class="builder-grid">
              <div class="builder-field">
                <label class="tool-label">名称：</label>
                <input v-model="builder.name" class="code-input-sm" placeholder="cookieName" />
              </div>
              <div class="builder-field">
                <label class="tool-label">值：</label>
                <input v-model="builder.value" class="code-input-sm" placeholder="cookieValue" />
              </div>
              <div class="builder-field">
                <label class="tool-label">Domain：</label>
                <input v-model="builder.domain" class="code-input-sm" placeholder=".example.com" />
              </div>
              <div class="builder-field">
                <label class="tool-label">Path：</label>
                <input v-model="builder.path" class="code-input-sm" placeholder="/" />
              </div>
              <div class="builder-field">
                <label class="tool-label">Expires：</label>
                <input v-model="builder.expires" class="code-input-sm" placeholder="Wed, 21 Oct 2025 07:28:00 GMT" />
              </div>
              <div class="builder-field">
                <label class="tool-label">Max-Age（秒）：</label>
                <input v-model="builder.maxAge" class="code-input-sm" placeholder="3600" type="number" />
              </div>
              <div class="builder-field">
                <label class="tool-label">SameSite：</label>
                <select v-model="builder.sameSite" class="code-input-sm">
                  <option value="">(不设置)</option>
                  <option value="Strict">Strict</option>
                  <option value="Lax">Lax</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div class="builder-field builder-checkboxes">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="builder.secure" />
                  <span>Secure</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="builder.httpOnly" />
                  <span>HttpOnly</span>
                </label>
              </div>
            </div>
            <div v-if="builtCookie" class="result-display">
              {{ builtCookie }}
              <button class="copy-btn" @click="copyBuilt" title="复制">📋</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'CookieParserTool',
  data() {
    return {
      input: '',
      parseMode: 'cookie',
      parsedCookies: [],
      copyMsg: '',
      error: '',
      showBuilder: false,
      builder: {
        name: '',
        value: '',
        domain: '',
        path: '',
        expires: '',
        maxAge: '',
        sameSite: '',
        secure: false,
        httpOnly: false
      }
    }
  },
  computed: {
    builtCookie() {
      const b = this.builder
      if (!b.name.trim()) return ''
      let parts = [b.name.trim() + '=' + b.value]
      if (b.domain.trim()) parts.push('Domain=' + b.domain.trim())
      if (b.path.trim()) parts.push('Path=' + b.path.trim())
      if (b.expires.trim()) parts.push('Expires=' + b.expires.trim())
      if (b.maxAge.trim()) parts.push('Max-Age=' + b.maxAge.trim())
      if (b.sameSite) parts.push('SameSite=' + b.sameSite)
      if (b.secure) parts.push('Secure')
      if (b.httpOnly) parts.push('HttpOnly')
      return parts.join('; ')
    }
  },
  methods: {
    parseCookies() {
      this.error = ''
      this.parsedCookies = []
      this.copyMsg = ''

      const raw = this.input.trim()
      if (!raw) {
        this.error = '请输入 Cookie 字符串'
        return
      }

      try {
        if (this.parseMode === 'cookie') {
          this.parsedCookies = this.parseCookieHeader(raw)
        } else {
          this.parsedCookies = this.parseSetCookie(raw)
        }
        if (this.parsedCookies.length === 0) {
          this.error = '未解析到有效 Cookie，请检查输入格式'
        }
      } catch (e) {
        this.error = '解析失败：' + e.message
      }
    },

    parseCookieHeader(raw) {
      // Cookie 请求头格式: name1=value1; name2=value2
      const cookies = []
      const pairs = raw.split(';')
      for (const pair of pairs) {
        const trimmed = pair.trim()
        if (!trimmed) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        const name = trimmed.substring(0, eqIdx).trim()
        const value = trimmed.substring(eqIdx + 1).trim()
        if (name) {
          cookies.push({ name, value })
        }
      }
      return cookies
    },

    parseSetCookie(raw) {
      // Set-Cookie 响应头格式: name=value; Attr1=val1; Attr2; Attr3=val3
      // 支持多行：每行一个完整的 Set-Cookie
      const cookies = []
      const lines = raw.split('\n')
      for (let line of lines) {
        line = line.trim()
        if (!line) continue

        const attrs = []
        // 使用更健壮的分割：按 ; 分割但保留空值
        const parts = line.split(';')
        let name = ''
        let value = ''

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (!part) continue

          if (i === 0) {
            // 第一个部分是 name=value
            const eqIdx = part.indexOf('=')
            if (eqIdx === -1) {
              name = part
              value = ''
            } else {
              name = part.substring(0, eqIdx).trim()
              value = part.substring(eqIdx + 1).trim()
            }
          } else {
            // 后续部分是属性
            const eqIdx = part.indexOf('=')
            if (eqIdx === -1) {
              // 无值的标志属性，如 Secure, HttpOnly
              attrs.push({ key: part, value: null })
            } else {
              const attrKey = part.substring(0, eqIdx).trim()
              const attrVal = part.substring(eqIdx + 1).trim()
              attrs.push({ key: attrKey, value: attrVal })
            }
          }
        }

        if (name) {
          cookies.push({ name, value, attrs: attrs.length ? attrs : undefined })
        }
      }

      // 如果按行分割没有结果，尝试按 ; 分割整个输入作为单个 Set-Cookie
      if (cookies.length === 0) {
        const attrs = []
        const parts = raw.split(';')
        let name = ''
        let value = ''

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (!part) continue
          if (i === 0) {
            const eqIdx = part.indexOf('=')
            if (eqIdx === -1) {
              name = part
              value = ''
            } else {
              name = part.substring(0, eqIdx).trim()
              value = part.substring(eqIdx + 1).trim()
            }
          } else {
            const eqIdx = part.indexOf('=')
            if (eqIdx === -1) {
              attrs.push({ key: part, value: null })
            } else {
              attrs.push({ key: part.substring(0, eqIdx).trim(), value: part.substring(eqIdx + 1).trim() })
            }
          }
        }
        if (name) {
          cookies.push({ name, value, attrs: attrs.length ? attrs : undefined })
        }
      }

      return cookies
    },

    async copyCookie(idx) {
      const c = this.parsedCookies[idx]
      if (!c) return
      let text = c.name + '=' + c.value
      if (c.attrs && c.attrs.length) {
        for (const attr of c.attrs) {
          if (attr.value) {
            text += '; ' + attr.key + '=' + attr.value
          } else {
            text += '; ' + attr.key
          }
        }
      }
      if (await copyText(text)) {
        this.copyMsg = '已复制：' + c.name
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },

    async copyBuilt() {
      if (!this.builtCookie) return
      if (await copyText(this.builtCookie)) {
        this.copyMsg = 'Set-Cookie 已复制'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },

    clear() {
      this.input = ''
      this.parsedCookies = []
      this.error = ''
      this.copyMsg = ''
    }
  }
}
</script>

<style scoped>
/* === Cookie 结果面板 === */
.cookie-results-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 10px;
  min-height: 200px;
  height: 100%;
  display: flex;
  align-items: stretch;
  overflow-y: auto;
}

.cookie-placeholder {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.cookie-results {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* === Cookie 卡片 === */
.cookie-card {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 10px 12px;
}

.cookie-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cookie-name {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--accent);
  font-weight: bold;
  word-break: break-all;
}

.cookie-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
  margin-bottom: 6px;
}

.cookie-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cookie-attr-tag {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 2px 6px;
  white-space: nowrap;
}

.cookie-attr-tag.attr-flag {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
}

/* === 行内复制按钮 === */
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

/* === Set-Cookie 构造器 === */
.builder-section {
  margin-top: 16px;
  border: 1px solid var(--line);
  border-radius: 0;
}

.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  text-transform: uppercase;
  user-select: none;
  transition: background 0.2s;
}

.builder-header:hover {
  background: var(--panel-2);
}

.builder-toggle {
  font-size: 12px;
  color: var(--muted);
}

.builder-body {
  padding: 14px;
}

.builder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.builder-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.builder-field .tool-label {
  font-size: 12px;
  margin: 0;
}

.builder-checkboxes {
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  padding-top: 8px;
}

.builder-body .result-display {
  margin-top: 14px;
}

/* === 响应式 === */
@media (max-width: 640px) {
  .builder-grid {
    grid-template-columns: 1fr;
  }

  .builder-checkboxes {
    flex-direction: column;
    gap: 10px;
  }

  .cookie-results-panel {
    min-height: 160px;
  }
}

@media (max-width: 375px) {
  .cookie-attrs {
    gap: 3px;
  }

  .cookie-attr-tag {
    font-size: 10px;
    padding: 2px 4px;
  }
}
</style>
