<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔍 HTTP Header 分析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 双栏布局 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">粘贴 HTTP 响应头：</label>
            <textarea
              v-model="input"
              class="code-input"
              rows="12"
              placeholder="粘贴 HTTP 响应头文本，例如：

HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
Cache-Control: public, max-age=3600

提示：可直接粘贴 curl -v 输出或浏览器 Network 面板中复制的响应头"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">分析结果：</label>
            <div class="headers-results-panel">
              <!-- 空状态 -->
              <div v-if="!parsedHeaders.length && !securityReport" class="headers-placeholder">
                请在左侧粘贴 HTTP 响应头，点击「分析」查看结果
              </div>

              <!-- 结果 -->
              <div v-else class="headers-results">
                <!-- 安全评分 -->
                <div v-if="securityReport" class="security-score-section">
                  <div class="score-header">
                    <span class="score-label">安全评分</span>
                    <span class="score-value" :class="scoreClass">{{ securityReport.score }} / 100</span>
                  </div>
                  <div class="score-bar">
                    <div class="score-bar-fill" :class="scoreClass" :style="{ width: securityReport.score + '%' }"></div>
                  </div>
                  <div class="score-verdict" :class="scoreClass">{{ scoreVerdict }}</div>
                  <div class="score-stats">
                    <div class="stat-item">
                      <span class="stat-label">已启用</span>
                      <span class="stat-value green">{{ securityReport.passed }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">未设置</span>
                      <span class="stat-value red">{{ securityReport.failed }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">总计检查</span>
                      <span class="stat-value">{{ securityReport.total }}</span>
                    </div>
                  </div>
                </div>

                <!-- 安全头详情 -->
                <div v-if="securityReport" class="security-details">
                  <div class="section-header">
                    <span class="section-title">🔒 安全头检测</span>
                    <button class="copy-btn-inline" @click="copySecurityReport" title="复制报告">📋</button>
                  </div>
                  <div
                    v-for="item in securityReport.items"
                    :key="item.header"
                    class="security-item"
                    :class="{ 'security-pass': item.status === 'pass', 'security-fail': item.status === 'fail', 'security-warn': item.status === 'warn' }"
                  >
                    <div class="security-item-header">
                      <span class="security-icon">{{ item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌' }}</span>
                      <span class="security-name">{{ item.header }}</span>
                    </div>
                    <div v-if="item.value" class="security-value">{{ item.value }}</div>
                    <div class="security-desc" :class="{ 'desc-pass': item.status === 'pass', 'desc-warn': item.status === 'warn', 'desc-fail': item.status === 'fail' }">
                      {{ item.message }}
                    </div>
                  </div>
                </div>

                <!-- 解析的 Header 表格 -->
                <div v-if="parsedHeaders.length" class="parsed-section">
                  <div class="section-header">
                    <span class="section-title">📋 解析的头字段 ({{ parsedHeaders.length }})</span>
                    <button class="copy-btn-inline" @click="copyAllHeaders" title="复制全部">📋</button>
                  </div>
                  <div class="headers-table">
                    <div
                      v-for="(h, idx) in parsedHeaders"
                      :key="idx"
                      class="header-row"
                    >
                      <span class="header-key">{{ h.key }}</span>
                      <span class="header-val">{{ h.value }}</span>
                      <button class="copy-btn-inline header-copy" @click="copyHeader(idx)" title="复制此字段">📋</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="analyze" :disabled="!input.trim()">
            🔍 分析
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <!-- 示例加载 -->
        <div class="button-group">
          <button class="tool-button" @click="loadExample">📄 加载示例响应头</button>
        </div>

        <div v-if="copyMsg" class="status-success">✅ {{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>

      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

const SECURITY_CHECKS = [
  {
    header: 'Content-Security-Policy',
    weight: 15,
    description: '防止 XSS、点击劫持等代码注入攻击，定义可信内容源',
    passDesc: '已设置 CSP 策略',
    failDesc: '未设置 CSP，站点缺少对内容源的管控',
    check: (raw) => raw ? 'pass' : 'fail'
  },
  {
    header: 'Strict-Transport-Security',
    weight: 12,
    description: '强制浏览器使用 HTTPS 连接，防止 SSL 剥离攻击',
    passDesc: '已启用 HSTS',
    failDesc: '未设置 HSTS，存在降级攻击风险',
    check: (raw) => raw ? 'pass' : 'fail'
  },
  {
    header: 'X-Content-Type-Options',
    weight: 8,
    description: '防止浏览器 MIME 类型嗅探，避免执行非预期类型的响应',
    passDesc: '已设置 nosniff',
    failDesc: '未设置，浏览器可能嗅探 MIME 类型',
    check: (raw) => raw && raw.toLowerCase().includes('nosniff') ? 'pass' : 'fail'
  },
  {
    header: 'X-Frame-Options',
    weight: 10,
    description: '控制页面是否可被嵌入 iframe，防止点击劫持',
    passDesc: '已设置 frame 策略',
    failDesc: '未设置，页面可能被 iframe 嵌入',
    check: (raw) => raw ? 'pass' : 'fail'
  },
  {
    header: 'Referrer-Policy',
    weight: 7,
    description: '控制 Referer 请求头的发送策略，防止信息泄露',
    passDesc: '已设置 Referrer 策略',
    failDesc: '未设置，可能泄露来源 URL 中的敏感信息',
    check: (raw) => raw ? 'pass' : 'fail'
  },
  {
    header: 'Permissions-Policy',
    weight: 6,
    description: '控制浏览器 API 权限（摄像头/麦克风/定位等）',
    passDesc: '已设置权限策略',
    failDesc: '未设置，默认允许所有特性（有警告则显示）',
    check: (raw) => raw ? 'pass' : 'warn'
  },
  {
    header: 'X-XSS-Protection',
    weight: 5,
    description: '启用浏览器内置 XSS 过滤器（现代浏览器已内置，但仍推荐设置）',
    passDesc: '已启用 XSS 保护',
    failDesc: '未设置（现代浏览器已内置 XSS 审计，影响较小）',
    check: (raw) => raw ? 'pass' : 'warn'
  },
  {
    header: 'Cross-Origin-Resource-Policy',
    weight: 6,
    description: '控制跨域资源访问，防止 Spectre 等侧信道攻击',
    passDesc: '已设置跨域资源策略',
    failDesc: '未设置，存在跨域信息泄露风险',
    check: (raw) => raw ? 'pass' : 'fail'
  },
  {
    header: 'Cross-Origin-Opener-Policy',
    weight: 5,
    description: '隔离不同源的顶级文档，防止跨域窗口交互攻击',
    passDesc: '已设置跨域打开策略',
    failDesc: '未设置，不同源的窗口可能相互交互',
    check: (raw) => raw ? 'pass' : 'warn'
  },
  {
    header: 'Cross-Origin-Embedder-Policy',
    weight: 4,
    description: '控制跨域资源嵌入，配合 COOP 启用跨域隔离',
    passDesc: '已设置跨域嵌入策略',
    failDesc: '未设置（非必需，需配合 COOP 使用）',
    check: (raw) => raw ? 'pass' : 'warn'
  },
  {
    header: 'Cache-Control',
    weight: 5,
    description: '控制浏览器和中间代理的缓存行为，防止敏感数据缓存',
    passDesc: '已设置缓存策略',
    failDesc: '未设置，缓存行为由浏览器默认决定',
    check: (raw) => raw ? 'pass' : 'warn'
  },
  {
    header: 'Set-Cookie',
    weight: 8,
    description: '检查 Cookie 安全属性：Secure、HttpOnly、SameSite',
    passDesc: 'Cookie 安全属性配置完整',
    failDesc: '未设置 Cookie 或缺少安全属性',
    check: (raw) => {
      if (!raw) return 'warn'
      const lower = raw.toLowerCase()
      const hasSecure = lower.includes('secure')
      const hasHttpOnly = lower.includes('httponly')
      const hasSameSite = lower.includes('samesite')
      if (hasSecure && hasHttpOnly && hasSameSite) return 'pass'
      if (hasSecure || hasHttpOnly || hasSameSite) return 'warn'
      return 'fail'
    }
  }
]

export default {
  name: 'HttpHeadersTool',
  data() {
    return {
      input: '',
      parsedHeaders: [],
      securityReport: null,
      copyMsg: '',
      error: ''
    }
  },
  computed: {
    scoreClass() {
      if (!this.securityReport) return ''
      const s = this.securityReport.score
      if (s >= 80) return 'score-high'
      if (s >= 50) return 'score-mid'
      return 'score-low'
    },
    scoreVerdict() {
      if (!this.securityReport) return ''
      const s = this.securityReport.score
      if (s >= 90) return '🔒 安全配置优秀'
      if (s >= 80) return '✅ 安全配置良好'
      if (s >= 60) return '⚠️ 安全配置一般，建议改进'
      if (s >= 40) return '⚠️ 安全配置较差，存在明显风险'
      return '❌ 安全配置严重不足，急需修复'
    }
  },
  methods: {
    analyze() {
      this.error = ''
      this.copyMsg = ''
      this.parsedHeaders = []
      this.securityReport = null

      const raw = this.input.trim()
      if (!raw) {
        this.error = '请粘贴 HTTP 响应头'
        return
      }

      try {
        // 解析响应头
        this.parsedHeaders = this.parseRawHeaders(raw)
        if (this.parsedHeaders.length === 0) {
          this.error = '未检测到有效的 HTTP 头字段，请检查输入格式'
          return
        }

        // 构建 header 字典
        const headerDict = {}
        for (const h of this.parsedHeaders) {
          headerDict[h.key.toLowerCase()] = h.value
        }

        // 安全分析
        this.securityReport = this.analyzeSecurity(headerDict)
      } catch (e) {
        this.error = '解析失败：' + e.message
      }
    },

    parseRawHeaders(raw) {
      const headers = []
      const lines = raw.split('\n')
      let firstLine = true

      for (let line of lines) {
        line = line.trim()
        if (!line) continue

        // 跳过 HTTP 状态行（如 HTTP/1.1 200 OK）
        if (firstLine && /^HTTP\/\d/i.test(line)) {
          firstLine = false
          continue
        }
        firstLine = false

        // 尝试解析 Key: Value
        const colonIdx = line.indexOf(':')
        if (colonIdx === -1) {
          // 没有冒号的行，可能是延续行或非 header 行
          // 尝试作为 key: value 之外的独立 header（不太可能）
          // 如果是 Set-Cookie 的延续，追加到上一个
          if (headers.length > 0 && (line.startsWith(' ') || line.startsWith('\t'))) {
            headers[headers.length - 1].value += ' ' + line.trim()
          }
          continue
        }

        const key = line.substring(0, colonIdx).trim()
        const value = line.substring(colonIdx + 1).trim()

        if (key) {
          // 处理重复的 header（如多个 Set-Cookie）
          const existing = headers.find(h => h.key.toLowerCase() === key.toLowerCase())
          if (existing && (key.toLowerCase() === 'set-cookie' || key.toLowerCase() === 'link')) {
            // 追加为新条目
            headers.push({ key, value })
          } else if (existing) {
            existing.value += ', ' + value
          } else {
            headers.push({ key, value })
          }
        }
      }

      return headers
    },

    analyzeSecurity(headerDict) {
      const items = []
      let totalScore = 0
      let maxScore = 0
      let passed = 0
      let failed = 0

      for (const check of SECURITY_CHECKS) {
        const raw = headerDict[check.header.toLowerCase()] || null
        let status = check.check(raw)
        let message = ''

        if (status === 'pass') {
          message = check.passDesc
          totalScore += check.weight
          passed++
        } else if (status === 'warn') {
          message = check.failDesc
          totalScore += Math.floor(check.weight * 0.5)
          failed++
        } else {
          message = check.failDesc
          failed++
        }

        items.push({
          header: check.header,
          weight: check.weight,
          value: raw,
          status: status,
          message: message,
          description: check.description
        })

        maxScore += check.weight
      }

      const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

      return {
        score,
        maxScore,
        total: items.length,
        passed,
        failed,
        items
      }
    },

    loadExample() {
      this.input = `HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 1; mode=block
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store, max-age=0
Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Lax; Path=/
Set-Cookie: preferences=dark; Secure; SameSite=Strict; Path=/
Content-Encoding: gzip
Server: nginx/1.24.0
X-Request-ID: 3f7a2b1c-8e4d-4f5a-9b6c-1d2e3f4a5b6c`
      this.analyze()
    },

    async copyHeader(idx) {
      const h = this.parsedHeaders[idx]
      if (!h) return
      const text = h.key + ': ' + h.value
      if (await copyText(text)) {
        this.copyMsg = '已复制：' + h.key
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },

    async copyAllHeaders() {
      const text = this.parsedHeaders.map(h => h.key + ': ' + h.value).join('\n')
      if (await copyText(text)) {
        this.copyMsg = '已复制全部 ' + this.parsedHeaders.length + ' 个头字段'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },

    async copySecurityReport() {
      if (!this.securityReport) return
      const lines = [
        '=== HTTP 安全头分析报告 ===',
        '安全评分：' + this.securityReport.score + ' / 100',
        '已通过：' + this.securityReport.passed + '  未通过/警告：' + this.securityReport.failed,
        ''
      ]
      for (const item of this.securityReport.items) {
        const icon = item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'
        lines.push(icon + ' ' + item.header + (item.value ? ': ' + item.value : ' (未设置)'))
        lines.push('   ' + item.message)
      }
      if (await copyText(lines.join('\n'))) {
        this.copyMsg = '安全报告已复制'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },

    clear() {
      this.input = ''
      this.parsedHeaders = []
      this.securityReport = null
      this.error = ''
      this.copyMsg = ''
    }
  }
}
</script>

<style scoped>
/* === 结果面板 === */
.headers-results-panel {
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

.headers-placeholder {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  line-height: 1.6;
}

.headers-results {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 安全评分 === */
.security-score-section {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 12px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.score-label {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  text-transform: uppercase;
}

.score-value {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: bold;
}

.score-value.score-high {
  color: var(--green);
}

.score-value.score-mid {
  color: #f0c040;
}

.score-value.score-low {
  color: var(--red);
}

.score-bar {
  height: 6px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  margin-bottom: 6px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.score-bar-fill.score-high {
  background: var(--green);
}

.score-bar-fill.score-mid {
  background: #f0c040;
}

.score-bar-fill.score-low {
  background: var(--red);
}

.score-verdict {
  font-family: var(--mono);
  font-size: 12px;
  margin-bottom: 10px;
}

.score-verdict.score-high {
  color: var(--green);
}

.score-verdict.score-mid {
  color: #f0c040;
}

.score-verdict.score-low {
  color: var(--red);
}

.score-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: bold;
  color: var(--text);
}

.stat-value.green {
  color: var(--green);
}

.stat-value.red {
  color: var(--red);
}

/* === 安全头详情 === */
.security-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  margin-bottom: 4px;
}

.section-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  text-transform: uppercase;
}

.copy-btn-inline {
  padding: 2px 6px;
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

.security-item {
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 8px 10px;
  background: var(--panel-2);
  border-left: 3px solid var(--line);
}

.security-item.security-pass {
  border-left-color: var(--green);
}

.security-item.security-warn {
  border-left-color: #f0c040;
}

.security-item.security-fail {
  border-left-color: var(--red);
}

.security-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.security-icon {
  font-size: 13px;
  flex-shrink: 0;
}

.security-name {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  font-weight: bold;
}

.security-value {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--green);
  word-break: break-all;
  margin-bottom: 4px;
  padding: 3px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
  max-height: 40px;
  overflow-y: auto;
}

.security-desc {
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.4;
}

.desc-pass {
  color: var(--green);
}

.desc-warn {
  color: #f0c040;
}

.desc-fail {
  color: var(--red);
}

/* === 解析表格 === */
.parsed-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.headers-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 0;
}

.header-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
}

.header-row:last-child {
  border-bottom: none;
}

.header-row:nth-child(even) {
  background: var(--panel);
}

.header-key {
  color: var(--accent);
  font-weight: bold;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 0;
}

.header-val {
  color: var(--green);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.header-copy {
  flex-shrink: 0;
  padding: 1px 5px;
  font-size: 11px;
}

@media (max-width: 640px) {
  .score-stats {
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-row {
    flex-wrap: wrap;
  }

  .header-key {
    white-space: normal;
    word-break: break-all;
  }
}
</style>
