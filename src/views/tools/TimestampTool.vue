<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>⏱️ 时间戳转换</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <!-- 当前时间显示 -->
          <div class="current-time">
            <div class="time-display">
              <span class="label">当前时间戳：</span>
              <span class="value">{{ currentTimestamp }}</span>
              <button class="copy-btn" @click="copyTimestamp">📋</button>
            </div>
            <div class="time-display">
              <span class="label">当前日期：</span>
              <span class="value">{{ currentDateTime }}</span>
              <button class="copy-btn" @click="copyDateTime">📋</button>
            </div>
            <div v-if="copySuccess" class="copy-success">✓ 已复制 {{ copySuccess }}</div>
          </div>
          
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">时间戳转日期：</label>
              <input
                type="text"
                v-model="timestampInput"
                placeholder="输入时间戳（如：1712345678）"
                class="code-input-sm"
              />
              <div class="result-display" v-if="timestampResult">
                {{ timestampResult }}
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">日期转时间戳：</label>
              <input
                type="text"
                v-model="dateTimeInput"
                placeholder="输入日期（如：2024-01-01 12:00:00）"
                class="code-input-sm"
              />
              <div class="result-display" v-if="dateTimeResult && dateTimeResult.seconds">
                秒：{{ dateTimeResult.seconds }}<br>
                毫秒：{{ dateTimeResult.milliseconds }}
              </div>
            </div>
          </div>
          <div class="button-group button-group-2">
            <button class="tool-button primary" @click="convertTimestamp">🔄 时间戳转日期</button>
            <button class="tool-button primary" @click="convertDateTime">🔄 日期转时间戳</button>
            <button class="tool-button danger full-width" @click="clear">🗑️ 清空</button>
          </div>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="success" class="status-success">
            ✅ {{ success }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'TimestampTool',
  components: {},
  data() {
    return {
      currentTimestamp: '',
      currentDateTime: '',
      timestampInput: '',
      timestampResult: '',
      dateTimeInput: '',
      dateTimeResult: { seconds: '', milliseconds: '' },
      error: '',
      success: '',
      copySuccess: '',
      timer: null
    }
  },
  methods: {
    updateCurrentTime() {
      const now = Date.now()
      this.currentTimestamp = now
      this.currentDateTime = new Date().toLocaleString('zh-CN')
    },
    async copyTimestamp() {
      if (await copyText(this.currentTimestamp)) {
        this.copySuccess = '时间戳'
        setTimeout(() => { this.copySuccess = '' }, 2000)
      }
    },
    async copyDateTime() {
      if (await copyText(this.currentDateTime)) {
        this.copySuccess = '日期'
        setTimeout(() => { this.copySuccess = '' }, 2000)
      }
    },
    convertTimestamp() {
      this.error = ''
      this.success = ''
      
      if (!this.timestampInput.trim()) {
        this.error = '请输入时间戳'
        return
      }
      
      try {
        // 将时间戳转换为日期
        let ts = parseInt(this.timestampInput.trim())
        
        if (isNaN(ts)) {
          this.error = '无效的时间戳格式'
          return
        }
        
        // 自动检测秒/毫秒（10 位数字是秒，13 位是毫秒）
        if (ts.toString().length === 10) {
          ts *= 1000
        }
        
        const date = new Date(ts)
        
        if (isNaN(date.getTime())) {
          this.error = '无效的时间戳'
          return
        }
        
        this.timestampResult = date.toLocaleString('zh-CN')
        this.success = '转换成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '转换失败：' + e.message
      }
    },
    convertDateTime() {
      this.error = ''
      this.success = ''
      
      if (!this.dateTimeInput.trim()) {
        this.error = '请输入日期时间'
        return
      }
      
      try {
        // 将日期转换为时间戳
        const date = new Date(this.dateTimeInput.trim())
        
        if (isNaN(date.getTime())) {
          this.error = '无效的日期格式'
          return
        }
        
        this.dateTimeResult = {
          seconds: Math.floor(date.getTime() / 1000),
          milliseconds: date.getTime()
        }
        this.success = '转换成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '转换失败：' + e.message
      }
    },
    clear() {
      this.timestampInput = ''
      this.timestampResult = ''
      this.dateTimeInput = ''
      this.dateTimeResult = { seconds: '', milliseconds: '' }
      this.error = ''
      this.success = ''
    }
  },
  mounted() {
    this.updateCurrentTime()
    this.timer = setInterval(this.updateCurrentTime, 1000)  // 每秒更新
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

/* 当前时间显示区 */
.current-time {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.time-display {
  overflow: hidden;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.time-display .value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-display .label {
  flex-shrink: 0;
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
}

.time-display .value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
}

/* 复制按钮 (inline版本，与密码工具统一) */
.time-display .copy-btn {
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 14px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: static !important;  /* 覆盖全局 .copy-btn 的 absolute */
}

.time-display .copy-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--text);
  transform: none;  /* 覆盖全局的 scale */
}

@media (max-width: 640px) {
  .current-time {
    padding: 1rem;
  }
  
  .time-display .label {
  flex-shrink: 0;
    font-size: 12px;
  }
  
  .time-display .value {
    font-size: 13px;
  }
}
</style>