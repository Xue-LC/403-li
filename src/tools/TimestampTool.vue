<template>
  <div class="timestamp-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>⏱️ 时间戳转换</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 当前时间显示 -->
          <div class="current-time">
            <div class="time-display">
              <span class="label">当前时间戳：</span>
              <span class="value">{{ currentTimestamp }}</span>
              <button class="copy-btn" @click="copyTimestamp">📋 复制</button>
            </div>
            <div class="time-display">
              <span class="label">当前日期：</span>
              <span class="value">{{ currentDateTime }}</span>
              <button class="copy-btn" @click="copyDateTime">📋 复制</button>
            </div>
            <div v-if="copySuccess" class="copy-success">✓ 已复制 {{ copySuccess }}</div>
            <button class="button" @click="updateCurrentTime">🔄 刷新</button>
          </div>
          
          <!-- 时间戳转日期 -->
          <label class="input-label">时间戳转日期：</label>
          <input 
            type="text" 
            v-model="timestampInput" 
            placeholder="输入时间戳（如：1712345678）"
            class="code-input"
          />
          <div class="result-display" v-if="timestampResult">
            {{ timestampResult }}
          </div>
          
          <!-- 日期转时间戳 -->
          <label class="input-label">日期转时间戳：</label>
          <input 
            type="text" 
            v-model="dateTimeInput" 
            placeholder="输入日期（如：2024-01-01 12:00:00）"
            class="code-input"
          />
          <div class="result-display" v-if="dateTimeResult">
            秒：{{ dateTimeResult.seconds }}<br>
            毫秒：{{ dateTimeResult.milliseconds }}
          </div>
          
          <div class="button-group">
            <button class="button primary" @click="convertTimestamp">🔄 时间戳转日期</button>
            <button class="button primary" @click="convertDateTime">🔄 日期转时间戳</button>
            <button class="button danger full-width" @click="clear">🗑️ 清空</button>
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
    <footer class="footer">
      <span>403.li // 时间戳工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'TimestampTool',
  components: {
    Topbar
  },
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
    copyTimestamp() {
      navigator.clipboard.writeText(this.currentTimestamp)
      this.copySuccess = '时间戳'
      setTimeout(() => {
        this.copySuccess = ''
      }, 2000)
    },
    copyDateTime() {
      navigator.clipboard.writeText(this.currentDateTime)
      this.copySuccess = '日期'
      setTimeout(() => {
        this.copySuccess = ''
      }, 2000)
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
@import '../assets/styles.css';

.timestamp-tool {
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
  background: rgba(18,22,27,0.94);
}

.pane-body {
  padding: 12px;
}

.tool-body {
  margin-top: 1rem;
}

/* === Current Time Display === */
.current-time {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 1rem;
  margin-bottom: 1rem;
}

.time-display {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.copy-btn {
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
  min-height: 32px;
}

.copy-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.copy-success {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  margin: 8px 0;
  padding: 4px 8px;
  background: var(--green-soft);
  border: 1px solid var(--green);
  border-radius: 0;
}

.time-display .label {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
}

.time-display .value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
}

/* === Input Label === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

/* === Input === */
.code-input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  border-radius: 0;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === Result Display === */
.result-display {
  background: var(--green-soft);
  border: 1px solid var(--green);
  border-radius: 0;
  padding: 10px 12px;
  margin: 10px 0;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--green);
}

/* === Button Group === */
.button-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 1rem 0;
}

.button {
  padding: 10px 16px;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  border-radius: 0;
}

.button:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.button.primary:hover:not(:disabled) {
  background: #9dff6b33;
  box-shadow: 0 0 20px var(--green-glow);
}

.button.danger {
  border-color: var(--red);
  color: var(--red);
}

.button.danger:hover:not(:disabled) {
  background: #ff6b7d1a;
  box-shadow: 0 0 15px #ff6b7d4d;
}

.button.full-width {
  grid-column: 1 / -1;
}

/* === Status Messages === */
.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,.3);
  background: #ff6b7d0d;
  border-radius: 0;
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,.3);
  background: var(--green-soft);
  border-radius: 0;
}

/* === Responsive === */
@media (max-width: 640px) {
  .timestamp-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
  
  .button-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .button.full-width {
    grid-column: 1 / -1;
  }
}

@media (max-width: 375px) {
  .button-group {
    grid-template-columns: 1fr;
  }
}
</style>
