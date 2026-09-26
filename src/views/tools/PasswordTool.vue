<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔐 密码生成</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">密码长度：{{ passwordLength }} 位</label>
              <input type="range" v-model="passwordLength" min="8" max="32" class="range-input" />
              <div class="length-display"><span>{{ passwordLength }}</span></div>
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
              <button class="tool-button primary" @click="generatePassword">
                🔐 生成密码
              </button>
            </div>
            <div class="tool-col">
              <label class="tool-label">生成结果：</label>
              <div class="password-display" v-if="generatedPassword">
                <span class="password-value">{{ generatedPassword }}</span>
                <button class="copy-btn" @click="copyPassword" title="复制密码">📋</button>
              </div>
              <div class="strength-indicator" v-if="generatedPassword">
                <div class="strength-bar" :class="strengthClass"></div>
                <span class="strength-text">{{ strengthText }}</span>
              </div>
              <div v-else class="result-display" style="color: var(--muted);">生成的密码将显示在这里...</div>
            </div>
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
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'

export default {
  name: 'PasswordTool',
  components: {},
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
  mounted() {
    const saved = loadToolPrefs('password')
    if (saved) {
      if (saved.passwordLength !== undefined) this.passwordLength = saved.passwordLength
      if (saved.options) Object.assign(this.options, saved.options)
    }
  },
  watch: {
    passwordLength() {
      saveToolPrefs('password', { passwordLength: this.passwordLength, options: this.options })
    },
    options: {
      deep: true,
      handler() {
        saveToolPrefs('password', { passwordLength: this.passwordLength, options: this.options })
      }
    }
  },
  computed: {
    strengthClass() {
      if (this.strength <= 30) return 'weak'
      if (this.strength <= 60) return 'medium'
      return 'strong'
    },
    strengthText() {
      if (this.strength <= 30) return '弱'
      if (this.strength <= 60) return '中'
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
    async copyPassword() {
      if (await copyText(this.generatedPassword)) {
        this.success = '复制成功！'
        setTimeout(() => { this.success = '' }, 2000)
      }
    },
    calculateStrength(password) {
      let strength = 0
      
      // 长度评分（最高 40 分）
      if (password.length >= 8) strength += 10
      if (password.length >= 12) strength += 15
      if (password.length >= 16) strength += 10
      if (password.length >= 20) strength += 5
      
      // 字符种类评分（最高 40 分）
      const hasUpper = /[A-Z]/.test(password)
      const hasLower = /[a-z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const hasSymbol = /[^A-Za-z0-9]/.test(password)
      
      const charTypes = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length
      strength += charTypes * 10
      
      // 连续性惩罚
      if (/(.)\1{2,}/.test(password)) strength -= 10  // 连续相同字符
      if (/^(123|abc|qwe)/.test(password.toLowerCase())) strength -= 10  // 常见模式
      
      // 确保分数在 0-100 之间
      this.strength = Math.max(0, Math.min(100, strength))
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

/* 长度显示 */
.length-display {
  text-align: center;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  margin-top: -5px;
}

/* 选项组 - 使用全局 checkbox-label */
.options-group {
  margin: 1rem 0;
}

/* 密码显示 */
.password-display {
  position: relative;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 12px 14px;
  margin: 1rem 0;
  font-family: var(--mono);
  font-size: 14px;
  word-break: break-all;
}

.password-value {
  color: var(--green);
}

.password-display .copy-btn {
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

.password-display .copy-btn:hover {
  color: var(--text);
}

/* 强度指示器 */
.strength-indicator {
  margin: 1rem 0;
}

.strength-bar {
  height: 4px;
  background: var(--line);
  border-radius: 0;
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

@media (max-width: 375px) {
  .password-display {
    font-size: 12px;
  }
}
</style>