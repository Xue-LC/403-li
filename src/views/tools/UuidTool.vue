<template>
  <div class="uuid-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🆔 UUID / ULID 生成器</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 配置选项 -->
          <div class="config-section">
            <div class="config-row">
              <label class="input-label">生成类型：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="uuidType" value="v4" />
                  <span>UUID v4 (随机)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="uuidType" value="v7" />
                  <span>UUID v7 (时间排序)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="uuidType" value="ulid" />
                  <span>ULID (时间排序)</span>
                </label>
              </div>
            </div>

            <div class="config-row">
              <label class="input-label">生成数量：</label>
              <input
                type="number"
                v-model.number="count"
                min="1"
                max="100"
                class="code-input-sm"
                style="width: 80px"
              />
              <span class="hint">(1-100)</span>
            </div>

            <div class="config-row">
              <label class="input-label">格式选项：</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="removeHyphens" />
                  <span>移除横杠</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="uppercase" />
                  <span>大写字母</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <div class="button-group">
            <button class="button primary" @click="generate">
              🎲 生成
            </button>
            <button class="button" @click="copyOutput" :disabled="!output.trim()">
              📋 复制全部
            </button>
            <button class="button danger" @click="clear">
              🗑️ 清空
            </button>
          </div>

          <!-- 输出区域 -->
          <label class="input-label">结果：</label>
          <textarea
            v-model="output"
            readonly
            rows="12"
            class="code-input output"
            placeholder="生成的 ID 将显示在这里..."
          ></textarea>

          <!-- 统计信息 -->
          <div v-if="output.trim()" class="stats">
            <span>共生成 {{ generatedCount }} 个</span>
            <span v-if="generationTime">耗时 {{ generationTime }}ms</span>
          </div>

          <!-- 状态提示 -->
          <div v-if="success" class="status-success">
            ✅ 已复制到剪贴板
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // UUID 工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'UuidTool',
  components: {
    Topbar
  },
  data() {
    return {
      uuidType: 'v4',
      count: 5,
      removeHyphens: false,
      uppercase: false,
      output: '',
      success: false,
      generatedCount: 0,
      generationTime: 0
    }
  },
  methods: {
    generate() {
      const startTime = performance.now()
      const results = []
      const count = Math.min(Math.max(this.count, 1), 100)

      for (let i = 0; i < count; i++) {
        let id
        if (this.uuidType === 'v4') {
          id = this.generateUUIDv4()
        } else if (this.uuidType === 'v7') {
          id = this.generateUUIDv7()
        } else {
          id = this.generateULID()
        }

        // 格式处理
        if (this.removeHyphens) {
          id = id.replace(/-/g, '')
        }
        if (this.uppercase) {
          id = id.toUpperCase()
        }

        results.push(id)
      }

      this.output = results.join('\n')
      this.generatedCount = count
      this.generationTime = Math.round(performance.now() - startTime)
      this.success = false
    },

    generateUUIDv4() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      // 降级方案
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },

    generateUUIDv7() {
      // UUID v7: 时间排序 UUID
      // 48 位时间戳 + 4 位版本(7) + 74 位随机数
      const timestamp = Date.now()
      const timeHex = timestamp.toString(16).padStart(12, '0')

      // 生成随机部分
      const randomBytes = new Uint8Array(10)
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomBytes)
      } else {
        for (let i = 0; i < 10; i++) {
          randomBytes[i] = Math.floor(Math.random() * 256)
        }
      }

      // 设置版本 (0111) 和变体 (10)
      randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70
      randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80

      let uuid = timeHex
      for (let i = 0; i < 10; i++) {
        if (i === 2 || i === 4 || i === 6) {
          uuid += '-'
        }
        uuid += randomBytes[i].toString(16).padStart(2, '0')
      }

      return uuid.slice(0, 8) + '-' + uuid.slice(8, 12) + '-' + uuid.slice(12, 16) + '-' + uuid.slice(16, 20) + '-' + uuid.slice(20, 32)
    },

    generateULID() {
      // ULID: 26 个字符，时间排序
      const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
      const timestamp = Date.now()

      // 时间部分 (10 字符)
      let timePart = ''
      let ts = timestamp
      for (let i = 0; i < 10; i++) {
        timePart = ENCODING[ts % 32] + timePart
        ts = Math.floor(ts / 32)
      }

      // 随机部分 (16 字符)
      let randomPart = ''
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        for (let i = 0; i < 16; i++) {
          randomPart += ENCODING[bytes[i] % 32]
        }
      } else {
        for (let i = 0; i < 16; i++) {
          randomPart += ENCODING[Math.floor(Math.random() * 32)]
        }
      }

      return timePart + randomPart
    },

    async copyOutput() {
      if (!this.output.trim()) return

      try {
        await navigator.clipboard.writeText(this.output)
        this.success = true
        setTimeout(() => {
          this.success = false
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = this.output
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.success = true
        setTimeout(() => {
          this.success = false
        }, 2000)
      }
    },

    clear() {
      this.output = ''
      this.generatedCount = 0
      this.generationTime = 0
      this.success = false
    }
  },
  mounted() {
    // 默认生成一次
    this.generate()
  }
}
</script>

<style scoped>
.uuid-tool {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(255,255,255,0.02);
}

.pane-body {
  padding: 16px;
}

/* === Config Section === */
.config-section {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
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

.input-label {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  min-width: 80px;
}

.hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

/* === Radio & Checkbox === */
.radio-group, .checkbox-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
}

.radio-label input, .checkbox-label input {
  cursor: pointer;
}

/* === Button Group === */
.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.button {
  padding: 10px 20px;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.03);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  border-color: var(--line);
  background: rgba(255,255,255,0.06);
}

.button.primary {
  border-color: rgba(157,255,107,0.4);
  background: var(--green-soft);
  color: var(--green);
}

.button.primary:hover {
  box-shadow: 0 0 15px var(--green-glow);
}

.button.danger {
  border-color: rgba(255,107,125,0.4);
  background: rgba(255,107,125,0.1);
  color: #ff8a8a;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* === Code Input === */
.code-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.code-input:focus {
  outline: none;
  border-color: var(--green);
}

.code-input.output {
  background: rgba(0,0,0,0.2);
}

.code-input-sm {
  padding: 8px 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
}

.code-input-sm:focus {
  outline: none;
  border-color: var(--green);
}

/* === Stats === */
.stats {
  margin-top: 10px;
  display: flex;
  gap: 20px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

/* === Status Messages === */
.status-success {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,0.4);
  background: rgba(157,255,107,0.1);
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
}

/* === Footer === */
.footer {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .uuid-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }

  .pane-body {
    padding: 12px;
  }

  .config-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .radio-group, .checkbox-group {
    flex-direction: column;
    gap: 8px;
  }

  .button-group {
    flex-direction: column;
  }

  .button {
    width: 100%;
  }
}
</style>
