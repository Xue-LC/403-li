<template>
  <div class="password-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔐 密码生成</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 密码长度 -->
          <label class="input-label">密码长度：{{ passwordLength }} 位</label>
          <input 
            type="range" 
            v-model="passwordLength" 
            min="8" 
            max="32"
            class="range-input"
          />
          <div class="length-display">
            <span>{{ passwordLength }}</span>
          </div>
          
          <!-- 密码选项 -->
          <div class="options-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="options.uppercase" />
              <span>大写字母 (A-Z)</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="options.lowercase" checked />
              <span>小写字母 (a-z)</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="options.numbers" checked />
              <span>数字 (0-9)</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="options.symbols" />
              <span>特殊字符 (!@#$%^&*)</span>
            </label>
          </div>
          
          <!-- 生成按钮 -->
          <button class="button primary full-width" @click="generatePassword">
            🔐 生成密码
          </button>
          
          <!-- 密码显示 -->
          <div class="password-display" v-if="generatedPassword">
            <span class="password-value">{{ generatedPassword }}</span>
            <button class="copy-btn" @click="copyPassword" title="复制密码">📋</button>
          </div>
          
          <!-- 密码强度 -->
          <div class="strength-indicator" v-if="generatedPassword">
            <div class="strength-bar" :class="strengthClass"></div>
            <span class="strength-text">{{ strengthText }}</span>
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
      <span>403.li // 密码生成工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'PasswordTool',
  components: {
    Topbar
  },
  data() {
    return {
      passwordLength: 16,
      options: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false
      },
      generatedPassword: '',
      strength: 0,
      error: '',
      success: ''
    }
  },
  computed: {
    strengthClass() {
      if (this.strength < 40) return 'weak'
      if (this.strength < 70) return 'medium'
      return 'strong'
    },
    strengthText() {
      if (this.strength < 40) return '弱'
      if (this.strength < 70) return '中'
      return '强'
    }
  },
  methods: {
    generatePassword() {
      this.error = ''
      this.success = ''
      
      let chars = ''
      if (this.options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (this.options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
      if (this.options.numbers) chars += '0123456789'
      if (this.options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
      
      if (chars === '') {
        this.error = '请至少选择一个选项'
        return
      }
      
      let password = ''
      for (let i = 0; i < this.passwordLength; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      this.generatedPassword = password
      this.calculateStrength(password)
      
      this.success = '密码生成成功！'
      setTimeout(() => {
        this.success = ''
      }, 3000)
    },
    copyPassword() {
      navigator.clipboard.writeText(this.generatedPassword)
      this.success = '复制成功！'
      setTimeout(() => {
        this.success = ''
      }, 2000)
    },
    calculateStrength(password) {
      let strength = 0
      if (password.length >= 8) strength += 20
      if (password.length >= 12) strength += 20
      if (/[A-Z]/.test(password)) strength += 15
      if (/[a-z]/.test(password)) strength += 15
      if (/[0-9]/.test(password)) strength += 15
      if (/[^A-Za-z0-9]/.test(password)) strength += 15
      this.strength = Math.min(100, strength)
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.password-tool {
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
  margin-top: 1.5rem;
}

/* === Input Label === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.75rem;
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

/* === Range Input === */
.range-input {
  width: 100%;
  margin: 10px 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

.range-input:focus {
  outline: 0;
}

.range-input::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--green);
  border: none;
  border-radius: 0;
  cursor: pointer;
  margin-top: -7px;
  box-shadow: 0 0 10px var(--green-glow);
}

.range-input::-moz-range-track {
  width: 100%;
  height: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
}

.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--green);
  border: none;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 0 0 10px var(--green-glow);
}

.length-display {
  text-align: center;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  margin-top: -5px;
}

/* === Options Group === */
.options-group {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  cursor: pointer;
  color: var(--text);
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--green);
  cursor: pointer;
}

.checkbox-label:hover {
  color: var(--green);
}

/* === Button === */
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

.button.full-width {
  width: 100%;
}

/* === Password Display === */
.password-display {
  position: relative;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 12px 14px;
  margin: 1rem 0;
  font-family: var(--mono);
  font-size: 14px;
  word-break: break-all;
  border-radius: 0;
}

.password-value {
  color: var(--green);
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: var(--text);
}

/* === Strength Indicator === */
.strength-indicator {
  margin: 1rem 0;
}

.strength-bar {
  height: 4px;
  background: var(--line);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
  transition: background 0.3s;
}

.strength-bar.weak {
  background: var(--red);
}

.strength-bar.medium {
  background: var(--amber);
}

.strength-bar.strong {
  background: var(--green);
}

.strength-text {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

/* === Status Messages === */
.status-error {
  color: var(--red);
  margin-top: 1.25rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(255,107,125,.3);
  background: #ff6b7d0d;
  border-radius: 0;
}

.status-success {
  color: var(--green);
  margin-top: 1.25rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(157,255,107,.3);
  background: var(--green-soft);
  border-radius: 0;
}

/* === Responsive === */
@media (max-width: 640px) {
  .password-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
}

@media (max-width: 375px) {
  .password-display {
    font-size: 12px;
  }
}
</style>
