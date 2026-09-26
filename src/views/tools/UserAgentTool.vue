<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔍 User-Agent 解析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">User-Agent 字符串：</label>
            <textarea
              v-model="uaString"
              placeholder="粘贴或输入 User-Agent 字符串..."
              rows="10"
              class="code-input"
            ></textarea>
            <div class="ua-actions">
              <button class="tool-button" @click="pasteMyUA">
                📋 粘贴我的 UA
              </button>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">解析结果：</label>
            <div class="stats-section">
              <div v-if="!uaString.trim()" class="stats-placeholder">
                请在左侧输入或粘贴 User-Agent 字符串，解析结果将显示在这里
              </div>
              <div v-else-if="parseError" class="stats-placeholder error-placeholder">
                ❌ {{ parseError }}
              </div>
              <div v-else class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">🌐 浏览器</span>
                  <span class="stat-value">{{ result.browser }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">💻 操作系统</span>
                  <span class="stat-value">{{ result.os }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">📱 设备类型</span>
                  <span class="stat-value">{{ result.device }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">⚙️ 渲染引擎</span>
                  <span class="stat-value">{{ result.engine }}</span>
                </div>
                <div class="stat-item full-width">
                  <span class="stat-label">🔗 完整版本</span>
                  <span class="stat-value version-value">{{ result.fullVersion }}</span>
                </div>
                <div class="stat-item full-width">
                  <span class="stat-label">📄 架构</span>
                  <span class="stat-value">{{ result.arch }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button" @click="copyResult" :disabled="!result">
            📋 复制结果
          </button>
          <button class="tool-button" @click="copyRawUA" :disabled="!uaString.trim()">
            📋 复制 UA
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copyMsg" class="status-success">✅ {{ copyMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'UserAgentTool',
  data() {
    return {
      uaString: '',
      copyMsg: ''
    }
  },
  computed: {
    result() {
      if (!this.uaString.trim()) return null
      return this.parseUA(this.uaString.trim())
    },
    parseError() {
      if (!this.uaString.trim()) return ''
      const r = this.result
      if (!r || r.browser === '未知浏览器') {
        return '无法解析此 User-Agent 字符串，请检查格式。'
      }
      return ''
    }
  },
  methods: {
    pasteMyUA() {
      this.uaString = navigator.userAgent
      this.copyMsg = ''
    },
    parseUA(ua) {
      if (!ua || ua.length < 5) return null

      // --- Browser detection ---
      let browser = '未知浏览器'
      let browserVersion = ''
      let fullVersion = ''

      // Edge (Chromium) - must be checked before Chrome
      const edgeMatch = ua.match(/Edg\/([\d.]+)/)
      if (edgeMatch) {
        browser = 'Microsoft Edge'
        browserVersion = edgeMatch[1]
      }

      // Opera/OPR
      if (browser === '未知浏览器') {
        const operaMatch = ua.match(/OPR\/([\d.]+)/)
        if (operaMatch) {
          browser = 'Opera'
          browserVersion = operaMatch[1]
        }
      }

      // Brave
      if (browser === '未知浏览器') {
        if (ua.includes('Brave')) {
          browser = 'Brave'
          const braveMatch = ua.match(/Chrome\/([\d.]+)/)
          if (braveMatch) browserVersion = braveMatch[1]
        }
      }

      // Vivaldi
      if (browser === '未知浏览器') {
        const vivaldiMatch = ua.match(/Vivaldi\/([\d.]+)/)
        if (vivaldiMatch) {
          browser = 'Vivaldi'
          browserVersion = vivaldiMatch[1]
        }
      }

      // Samsung Browser
      if (browser === '未知浏览器') {
        const samsungMatch = ua.match(/SamsungBrowser\/([\d.]+)/)
        if (samsungMatch) {
          browser = 'Samsung Internet'
          browserVersion = samsungMatch[1]
        }
      }

      // Chrome
      if (browser === '未知浏览器') {
        const chromeMatch = ua.match(/Chrome\/([\d.]+)/)
        if (chromeMatch && !ua.includes('Edg/')) {
          browser = 'Google Chrome'
          browserVersion = chromeMatch[1]
        }
      }

      // Safari (must be after Chrome, as Safari UAs also contain "Chrome" sometimes)
      if (browser === '未知浏览器') {
        const safariMatch = ua.match(/Version\/([\d.]+).*Safari/)
        if (safariMatch && !ua.includes('Chrome') && !ua.includes('CriOS')) {
          browser = 'Safari'
          browserVersion = safariMatch[1]
        }
      }

      // Chrome on iOS (CriOS)
      if (browser === '未知浏览器') {
        const criosMatch = ua.match(/CriOS\/([\d.]+)/)
        if (criosMatch) {
          browser = 'Chrome (iOS)'
          browserVersion = criosMatch[1]
        }
      }

      // Firefox
      if (browser === '未知浏览器') {
        const firefoxMatch = ua.match(/Firefox\/([\d.]+)/)
        if (firefoxMatch) {
          browser = 'Mozilla Firefox'
          browserVersion = firefoxMatch[1]
        }
      }

      // IE
      if (browser === '未知浏览器') {
        const ieMatch = ua.match(/(?:MSIE |rv:)([\d.]+)/)
        if (ieMatch && (ua.includes('Trident') || ua.includes('MSIE'))) {
          browser = 'Internet Explorer'
          browserVersion = ieMatch[1]
        }
      }

      // UC Browser
      if (browser === '未知浏览器') {
        const ucMatch = ua.match(/UCBrowser\/([\d.]+)/)
        if (ucMatch) {
          browser = 'UC Browser'
          browserVersion = ucMatch[1]
        }
      }

      // QQ Browser
      if (browser === '未知浏览器') {
        const qqMatch = ua.match(/QQBrowser\/([\d.]+)/)
        if (qqMatch) {
          browser = 'QQ 浏览器'
          browserVersion = qqMatch[1]
        }
      }

      // WeChat
      if (browser === '未知浏览器') {
        const wxMatch = ua.match(/MicroMessenger\/([\d.]+)/)
        if (wxMatch) {
          browser = '微信内置浏览器'
          browserVersion = wxMatch[1]
        }
      }

      fullVersion = browserVersion ? `${browser} ${browserVersion}` : browser

      // --- OS detection ---
      let os = '未知操作系统'
      let osVersion = ''

      if (ua.includes('Windows NT 10.0')) {
        os = 'Windows'
        osVersion = '10 / 11'
      } else if (ua.includes('Windows NT 6.3')) {
        os = 'Windows'
        osVersion = '8.1'
      } else if (ua.includes('Windows NT 6.2')) {
        os = 'Windows'
        osVersion = '8'
      } else if (ua.includes('Windows NT 6.1')) {
        os = 'Windows'
        osVersion = '7'
      } else if (ua.includes('Windows NT 6.0')) {
        os = 'Windows'
        osVersion = 'Vista'
      } else if (ua.includes('Windows NT 5.1')) {
        os = 'Windows'
        osVersion = 'XP'
      } else if (ua.includes('Windows')) {
        os = 'Windows'
      }

      if (os === '未知操作系统') {
        const macMatch = ua.match(/Mac OS X ([\d_.]+)/)
        if (macMatch) {
          os = 'macOS'
          osVersion = macMatch[1].replace(/_/g, '.')
        }
      }

      if (os === '未知操作系统') {
        if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
          const iosMatch = ua.match(/OS ([\d_]+) like Mac OS X/)
          if (iosMatch) {
            os = 'iOS'
            osVersion = iosMatch[1].replace(/_/g, '.')
          } else {
            os = 'iOS'
          }
        }
      }

      if (os === '未知操作系统') {
        const androidMatch = ua.match(/Android ([\d.]+)/)
        if (androidMatch) {
          os = 'Android'
          osVersion = androidMatch[1]
        }
      }

      if (os === '未知操作系统') {
        if (ua.includes('Linux') && !ua.includes('Android')) {
          const linuxMatch = ua.match(/Linux ([^;)]+)/)
          if (linuxMatch) {
            os = 'Linux'
            osVersion = linuxMatch[1].trim()
          } else {
            os = 'Linux'
          }
        }
      }

      if (os === '未知操作系统') {
        if (ua.includes('CrOS')) {
          os = 'Chrome OS'
          const crosMatch = ua.match(/CrOS [^\s]+ ([\d.]+)/)
          if (crosMatch) osVersion = crosMatch[1]
        }
      }

      const osDisplay = osVersion ? `${os} ${osVersion}` : os

      // --- Device type ---
      let device = '桌面端 🖥️'
      let arch = '—'

      // Architecture
      const archMatch = ua.match(/(?:x86_64|x64|Win64|WOW64|amd64|Intel Mac OS X)/)
      const armMatch = ua.match(/(?:arm|aarch64|ARM64)/)
      if (archMatch) {
        if (ua.includes('x86_64') || ua.includes('x64') || ua.includes('Win64') || ua.includes('amd64') || ua.includes('Intel')) {
          arch = 'x86_64 (64-bit)'
        } else if (ua.includes('WOW64')) {
          arch = 'x86 (WOW64)'
        }
      }
      if (armMatch) {
        arch = ua.includes('64') || ua.includes('aarch64') ? 'ARM64 (64-bit)' : 'ARM (32-bit)'
      }

      // Check for bots/crawlers
      const bots = ['bot', 'crawler', 'spider', 'scraper', 'wget', 'curl', 'headless', 'python-requests', 'Go-http-client', 'java/', 'libwww']
      const isBot = bots.some(b => ua.toLowerCase().includes(b))

      if (isBot) {
        device = '爬虫/机器人 🤖'
        // Try to identify specific bot
        if (ua.includes('Googlebot')) { browser = 'Googlebot'; fullVersion = 'Googlebot' }
        else if (ua.includes('Bingbot')) { browser = 'Bingbot'; fullVersion = 'Bingbot' }
        else if (ua.includes('Baiduspider')) { browser = '百度蜘蛛'; fullVersion = '百度蜘蛛' }
        else if (ua.includes('YandexBot')) { browser = 'YandexBot'; fullVersion = 'YandexBot' }
        else if (ua.includes('python-requests')) { browser = 'Python Requests'; fullVersion = 'Python Requests' }
        else if (ua.includes('curl')) { browser = 'cURL'; fullVersion = 'cURL' }
        else { browser = '爬虫程序'; fullVersion = '爬虫程序' }
      } else if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('iPod') ||
          (ua.includes('Android') && !ua.includes('Tablet') && !ua.includes('TV'))) {
        device = '移动端 📱'
      } else if (ua.includes('iPad') || (ua.includes('Android') && ua.includes('Tablet'))) {
        device = '平板 📋'
      } else if (ua.includes('TV') || ua.includes('SmartTV')) {
        device = '智能电视 📺'
      }

      // --- Engine detection ---
      let engine = '未知引擎'

      if (ua.includes('Gecko') && ua.includes('Firefox')) {
        const geckoMatch = ua.match(/Gecko\/([\d.]+)/)
        engine = geckoMatch ? `Gecko (Firefox ${browserVersion})` : 'Gecko'
      } else if (ua.includes('AppleWebKit')) {
        const webkitMatch = ua.match(/AppleWebKit\/([\d.]+)/)
        if (webkitMatch) {
          if (browser === 'Safari') {
            engine = `WebKit ${webkitMatch[1]}`
          } else if (browser === 'Google Chrome' || browser === 'Microsoft Edge' ||
                     browser === 'Opera' || browser === 'Brave' || browser === 'Vivaldi' ||
                     browser === 'Samsung Internet') {
            engine = 'Blink (Chromium)'
          } else {
            engine = `WebKit ${webkitMatch[1]}`
          }
        } else {
          engine = 'WebKit'
        }
      } else if (ua.includes('Trident')) {
        const tridentMatch = ua.match(/Trident\/([\d.]+)/)
        engine = tridentMatch ? `Trident ${tridentMatch[1]}` : 'Trident'
      } else if (ua.includes('Presto')) {
        engine = 'Presto'
      } else if (ua.includes('Gecko')) {
        const geckoMatch = ua.match(/Gecko\/([\d.]+)/)
        engine = geckoMatch ? `Gecko ${geckoMatch[1]}` : 'Gecko'
      }

      return {
        browser: fullVersion || '未知浏览器',
        os: osDisplay,
        device,
        engine,
        fullVersion: ua.length > 120 ? ua.substring(0, 120) + '...' : ua,
        arch
      }
    },
    async copyResult() {
      if (!this.result) return
      const r = this.result
      const text = [
        '=== User-Agent 解析结果 ===',
        '浏览器：' + r.browser,
        '操作系统：' + r.os,
        '设备类型：' + r.device.replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ''),
        '渲染引擎：' + r.engine,
        '架构：' + r.arch,
        '原始 UA：' + this.uaString
      ].join('\n')

      if (await copyText(text)) {
        this.copyMsg = '解析结果已复制'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },
    async copyRawUA() {
      if (!this.uaString.trim()) return
      if (await copyText(this.uaString)) {
        this.copyMsg = 'UA 字符串已复制'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },
    clear() {
      this.uaString = ''
      this.copyMsg = ''
    }
  }
}
</script>

<style scoped>
.ua-actions {
  margin-top: 8px;
}

.ua-actions .tool-button {
  width: 100%;
}

.stats-section {
  background: #0d0d1a;
  border: 1px solid var(--accent);
  border-radius: 0;
  padding: 12px;
  min-height: 200px;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.stats-placeholder {
  color: #555;
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 13px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.error-placeholder {
  color: #ff5c5c;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  align-content: start;
}

.stat-item {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item.full-width {
  grid-column: 1 / -1;
}

.stat-label {
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 14px;
  color: var(--accent);
  font-weight: bold;
  word-break: break-all;
}

.version-value {
  font-size: 11px;
  color: #6af;
  font-weight: normal;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-item.full-width {
    grid-column: 1;
  }
  .stat-value {
    font-size: 13px;
  }
}
</style>
