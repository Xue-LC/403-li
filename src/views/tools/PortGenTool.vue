<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔌 高位端口生成器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <div class="config-section">
                <div class="config-row">
                  <label class="tool-label">生成数量：</label>
                  <input type="number" v-model.number="count" min="1" max="100" class="code-input-sm" />
                  <span class="hint">(1-100)</span>
                </div>
                <div class="config-row">
                  <label class="tool-label">端口范围：</label>
                  <div class="range-row">
                    <input type="number" v-model.number="minPort" min="1024" max="65535" class="code-input-sm" />
                    <span class="range-sep">—</span>
                    <input type="number" v-model.number="maxPort" min="1024" max="65535" class="code-input-sm" />
                  </div>
                </div>
                <div class="config-row">
                  <label class="tool-label">排除选项：</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="excludeWellKnown" />
                      <span>排除知名端口 (0-1023)</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="excludeRegistered" />
                      <span>排除注册端口 (1024-49151)</span>
                    </label>
                  </div>
                </div>
                <div class="config-row" v-if="excludeCustom">
                  <label class="tool-label">自定义排除：</label>
                  <input
                    type="text"
                    v-model="excludeRangesStr"
                    class="code-input-sm"
                    style="width: 100%;"
                    placeholder="例: 3000-4000, 8080"
                  />
                </div>
                <div class="config-row">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="excludeCustom" />
                    <span>自定义排除范围</span>
                  </label>
                </div>
                <div class="config-row">
                  <label class="tool-label">输出格式：</label>
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" v-model="outputFormat" value="list" />
                      <span>每行一个</span>
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="outputFormat" value="comma" />
                      <span>逗号分隔</span>
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="outputFormat" value="json" />
                      <span>JSON 数组</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="button-group button-group-3">
                <button class="tool-button primary" @click="generate">🎲 生成</button>
                <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">📋 复制</button>
                <button class="tool-button danger" @click="clear">🗑️ 清空</button>
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">结果：</label>
              <textarea
                v-model="output"
                readonly
                rows="14"
                class="code-input output"
                placeholder="点击「生成」按钮生成高位端口…"
              ></textarea>
            </div>
          </div>

          <!-- 统计信息 -->
          <div v-if="output.trim()" class="stats">
            <span>共生成 {{ generatedCount }} 个端口</span>
            <span v-if="generationTime">耗时 {{ generationTime }}ms</span>
            <span>范围 {{ actualMin }}–{{ actualMax }}</span>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="status-error">❌ {{ error }}</div>

          <!-- 成功提示 -->
          <div v-if="success" class="status-success">✅ 已复制到剪贴板</div>

          <!-- 常用端口提示 -->
          <div class="common-ports-section">
            <div class="section-header">
              <span class="section-title">📌 常用端口参考</span>
            </div>
            <div class="common-ports-grid">
              <span v-for="p in commonPorts" :key="p.port" class="port-chip" :class="{ used: isPortUsed(p.port) }" :title="p.desc">
                {{ p.port }} <small>{{ p.desc }}</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

</template>

<script>
import { copyText } from '../../utils/clipboard'
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'

export default {
  name: 'PortGenTool',
  components: {},
  data() {
    return {
      count: 5,
      minPort: 1024,
      maxPort: 65535,
      excludeWellKnown: true,
      excludeRegistered: false,
      excludeCustom: false,
      excludeRangesStr: '',
      outputFormat: 'list',
      output: '',
      error: '',
      success: false,
      generatedCount: 0,
      generationTime: 0,
      actualMin: 0,
      actualMax: 0,
      commonPorts: [
        { port: 20, desc: 'FTP-DATA' },
        { port: 21, desc: 'FTP' },
        { port: 22, desc: 'SSH' },
        { port: 23, desc: 'Telnet' },
        { port: 25, desc: 'SMTP' },
        { port: 53, desc: 'DNS' },
        { port: 80, desc: 'HTTP' },
        { port: 110, desc: 'POP3' },
        { port: 143, desc: 'IMAP' },
        { port: 443, desc: 'HTTPS' },
        { port: 993, desc: 'IMAPS' },
        { port: 995, desc: 'POP3S' },
        { port: 1080, desc: 'SOCKS' },
        { port: 1433, desc: 'MSSQL' },
        { port: 1521, desc: 'Oracle' },
        { port: 3306, desc: 'MySQL' },
        { port: 3389, desc: 'RDP' },
        { port: 5432, desc: 'PostgreSQL' },
        { port: 5900, desc: 'VNC' },
        { port: 6379, desc: 'Redis' },
        { port: 8080, desc: 'HTTP-Alt' },
        { port: 8443, desc: 'HTTPS-Alt' },
        { port: 9092, desc: 'Kafka' },
        { port: 9200, desc: 'ES' },
        { port: 27017, desc: 'MongoDB' },
        { port: 50000, desc: 'DB2' },
        { port: 50070, desc: 'HDFS' }
      ]
    }
  },
  mounted() {
    const saved = loadToolPrefs('port-gen')
    if (saved) {
      if (saved.count !== undefined) this.count = saved.count
      if (saved.minPort !== undefined) this.minPort = saved.minPort
      if (saved.maxPort !== undefined) this.maxPort = saved.maxPort
      if (saved.excludeWellKnown !== undefined) this.excludeWellKnown = saved.excludeWellKnown
      if (saved.excludeRegistered !== undefined) this.excludeRegistered = saved.excludeRegistered
      if (saved.excludeCustom !== undefined) this.excludeCustom = saved.excludeCustom
      if (saved.excludeRangesStr !== undefined) this.excludeRangesStr = saved.excludeRangesStr
      if (saved.outputFormat !== undefined) this.outputFormat = saved.outputFormat
    }
    // 首次自动生成
    this.generate()
  },
  watch: {
    count() { this.savePrefs() },
    minPort() { this.savePrefs() },
    maxPort() { this.savePrefs() },
    excludeWellKnown() { this.savePrefs() },
    excludeRegistered() { this.savePrefs() },
    excludeCustom() { this.savePrefs() },
    excludeRangesStr() { this.savePrefs() },
    outputFormat() { this.savePrefs() }
  },
  methods: {
    savePrefs() {
      saveToolPrefs('port-gen', {
        count: this.count,
        minPort: this.minPort,
        maxPort: this.maxPort,
        excludeWellKnown: this.excludeWellKnown,
        excludeRegistered: this.excludeRegistered,
        excludeCustom: this.excludeCustom,
        excludeRangesStr: this.excludeRangesStr,
        outputFormat: this.outputFormat
      })
    },

    parseExcludeRanges() {
      if (!this.excludeRangesStr.trim()) return []
      const ranges = []
      const parts = this.excludeRangesStr.split(/[,;，；\s]+/)
      for (const part of parts) {
        const trimmed = part.trim()
        if (!trimmed) continue
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10))
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            ranges.push([Math.max(1, start), Math.min(65535, end)])
          }
        } else {
          const val = parseInt(trimmed, 10)
          if (!isNaN(val)) {
            ranges.push([val, val])
          }
        }
      }
      return ranges
    },

    isPortExcluded(port) {
      // 排除知名端口
      if (this.excludeWellKnown && port < 1024) return true
      // 排除注册端口
      if (this.excludeRegistered && port >= 1024 && port < 49152) return true
      // 自定义排除范围
      if (this.excludeCustom) {
        const ranges = this.parseExcludeRanges()
        for (const [start, end] of ranges) {
          if (port >= start && port <= end) return true
        }
      }
      return false
    },

    generate() {
      this.error = ''
      this.success = false

      // 验证范围
      let min = Math.max(1, Math.min(65535, this.minPort))
      let max = Math.max(1, Math.min(65535, this.maxPort))
      if (min > max) {
        [min, max] = [max, min]
      }

      // 验证数量
      const count = Math.min(Math.max(this.count, 1), 100)

      // 构建可用端口列表
      const availablePorts = []
      for (let p = min; p <= max; p++) {
        if (!this.isPortExcluded(p)) {
          availablePorts.push(p)
        }
      }

      if (availablePorts.length === 0) {
        this.error = '当前排除条件下没有可用端口。请调整端口范围或排除选项。'
        this.output = ''
        this.generatedCount = 0
        this.generationTime = 0
        return
      }

      if (availablePorts.length < count) {
        this.error = `可用端口仅 ${availablePorts.length} 个，少于请求的 ${count} 个。已生成全部可用端口。`
      }

      const startTime = performance.now()
      const actualCount = Math.min(count, availablePorts.length)

      // Fisher-Yates 洗牌取前 N 个
      const result = this.cryptoShuffle(availablePorts, actualCount)

      // 排序输出
      result.sort((a, b) => a - b)

      // 格式化输出
      if (this.outputFormat === 'comma') {
        this.output = result.join(', ')
      } else if (this.outputFormat === 'json') {
        this.output = JSON.stringify(result, null, 2)
      } else {
        this.output = result.join('\n')
      }

      this.generatedCount = actualCount
      this.generationTime = Math.round(performance.now() - startTime)
      this.actualMin = result[0] || 0
      this.actualMax = result[result.length - 1] || 0
    },

    cryptoShuffle(arr, count) {
      // 使用 crypto.getRandomValues 进行安全随机洗牌
      const result = []
      const pool = [...arr]

      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        for (let i = 0; i < count && pool.length > 0; i++) {
          const randBytes = new Uint32Array(1)
          crypto.getRandomValues(randBytes)
          const idx = randBytes[0] % pool.length
          result.push(pool[idx])
          // 移除已选元素
          pool[idx] = pool[pool.length - 1]
          pool.pop()
        }
      } else {
        // 降级方案
        for (let i = 0; i < count && pool.length > 0; i++) {
          const idx = Math.floor(Math.random() * pool.length)
          result.push(pool[idx])
          pool[idx] = pool[pool.length - 1]
          pool.pop()
        }
      }

      return result
    },

    isPortUsed(port) {
      // 检查常用端口是否在当前排除范围内
      if (this.excludeWellKnown && port < 1024) return true
      if (this.excludeRegistered && port >= 1024 && port < 49152) return true
      if (port < this.minPort || port > this.maxPort) return true
      if (this.excludeCustom) {
        const ranges = this.parseExcludeRanges()
        for (const [start, end] of ranges) {
          if (port >= start && port <= end) return true
        }
      }
      return false
    },

    async copyOutput() {
      if (await copyText(this.output)) {
        this.success = true
        setTimeout(() => { this.success = false }, 2000)
      }
    },

    clear() {
      this.output = ''
      this.error = ''
      this.success = false
      this.generatedCount = 0
      this.generationTime = 0
    }
  }
}
</script>

<style scoped>
/* === Config Section === */
.config-section {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.config-row:last-child {
  margin-bottom: 0;
}

.hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

/* === Range Input Row === */
.range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-sep {
  color: var(--muted);
  font-family: var(--mono);
}

/* === Stats === */
.stats {
  margin-top: 10px;
  display: flex;
  gap: 20px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  flex-wrap: wrap;
}

/* === Common Ports === */
.common-ports-section {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.common-ports-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.port-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  transition: all 0.2s;
  cursor: default;
}

.port-chip small {
  color: var(--dim);
  font-size: 10px;
}

.port-chip.used {
  opacity: 0.4;
  text-decoration: line-through;
  border-color: var(--dim);
}

.port-chip:hover:not(.used) {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 10px var(--green-glow);
}

/* === Status Messages (scoped versions) === */
.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,0.3);
  background: rgba(255,107,125,0.05);
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,0.3);
  background: var(--green-soft);
}

/* === Section Header === */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .config-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .range-row .code-input-sm {
    width: 90px;
  }

  .stats {
    gap: 12px;
  }
}
</style>
