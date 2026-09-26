<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔍 密码强度检测器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入区域 -->
          <div class="tool-col">
            <label class="tool-label">输入密码：</label>
            <div class="password-input-wrap">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="code-input-sm"
                v-model="password"
                placeholder="输入或粘贴密码..."
                @input="analyze"
              />
              <button
                class="toggle-btn"
                @click="showPassword = !showPassword"
                :title="showPassword ? '隐藏密码' : '显示密码'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>

            <div class="quick-actions">
              <button class="tool-button" @click="loadSample('weak')">弱密码示例</button>
              <button class="tool-button" @click="loadSample('medium')">中等示例</button>
              <button class="tool-button" @click="loadSample('strong')">强密码示例</button>
            </div>
          </div>

          <!-- 右栏：分析结果 -->
          <div class="tool-col">
            <label class="tool-label">检测结果：</label>

            <div v-if="password.length === 0" class="result-display" style="color: var(--muted);">
              输入密码后将显示强度分析...
            </div>

            <div v-else class="analysis-results">
              <!-- 评分圆环 -->
              <div class="score-section">
                <div class="score-ring" :class="scoreLevel">
                  <span class="score-number">{{ score }}</span>
                  <span class="score-label">{{ scoreText }}</span>
                </div>
                <div class="crack-time">
                  <span class="crack-label">预估破解时间</span>
                  <span class="crack-value">{{ crackTime }}</span>
                </div>
              </div>

              <!-- 强度条 -->
              <div class="strength-indicator">
                <div class="strength-bar-track">
                  <div class="strength-bar-fill" :style="{ width: score + '%' }" :class="scoreLevel"></div>
                </div>
              </div>

              <!-- 详细分析 -->
              <div class="detail-section">
                <div class="detail-title">▼ 详细分析</div>
                <div class="detail-list">
                  <div class="detail-item" v-for="(item, idx) in details" :key="idx" :class="item.type">
                    <span class="detail-icon">{{ item.type === 'pass' ? '✅' : item.type === 'warn' ? '⚠️' : '❌' }}</span>
                    <span>{{ item.text }}</span>
                  </div>
                </div>
              </div>

              <!-- 建议 -->
              <div v-if="suggestions.length > 0" class="detail-section">
                <div class="detail-title">▼ 改进建议</div>
                <div class="detail-list">
                  <div class="detail-item" v-for="(s, idx) in suggestions" :key="idx">
                    <span class="detail-icon">💡</span>
                    <span>{{ s }}</span>
                  </div>
                </div>
              </div>

              <!-- 复制按钮 -->
              <div class="button-group button-group-2">
                <button class="tool-button primary" @click="copyScore">
                  📋 复制结果
                </button>
                <button class="tool-button danger" @click="clearAll">
                  🗑️ 清空
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'

// 常见弱密码列表
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '123456789', '12345', '1234567',
  '1234567890', 'qwerty', 'abc123', 'monkey', 'dragon', 'master',
  'admin', 'admin123', 'letmein', 'welcome', 'iloveyou', 'trustno1',
  'sunshine', 'princess', 'football', 'shadow', 'superman', 'michael',
  'login', 'starwars', 'passw0rd', 'qwerty123', '1q2w3e4r',
  'zaq12wsx', 'qazwsx', 'password1', 'p@ssword', 'p@ssw0rd',
  '111111', '000000', '123123', '654321', '696969', '112233',
  '102030', '121212', '123321', '666666', '888888', '999999',
  'aaaaaa', 'abcdef', 'abcdefg', 'qwertyuiop', 'asdfghjkl',
  'zxcvbnm', '1qaz2wsx', 'qweasdzxc', 'password123',
  'administrator', 'administrator123', 'root', 'root123',
  'test', 'test123', 'user', 'user123', 'guest', 'guest123'
])

// 常见英文单词（简化检测）
const COMMON_WORDS = new Set([
  'password', 'admin', 'hello', 'world', 'love', 'ilove', 'money',
  'secret', 'summer', 'winter', 'spring', 'autumn', 'happy', 'sad',
  'cool', 'super', 'great', 'awesome', 'cute', 'loveyou', 'baby',
  'angel', 'devil', 'heaven', 'master', 'slave', 'winner', 'loser',
  'freedom', 'liberty', 'justice', 'honor', 'glory', 'victory',
  'champion', 'legend', 'ninja', 'samurai', 'warrior', 'knight',
  'king', 'queen', 'prince', 'princess', 'lord', 'lady', 'star',
  'moon', 'sun', 'fire', 'water', 'earth', 'wind', 'thunder',
  'lightning', 'storm', 'rain', 'snow', 'ice', 'steel', 'iron',
  'gold', 'silver', 'bronze', 'copper', 'diamond', 'crystal',
  'dragon', 'phoenix', 'tiger', 'lion', 'eagle', 'wolf', 'bear',
  'shark', 'snake', 'spider', 'raven', 'hawk', 'falcon', 'jaguar',
  'cheetah', 'panther', 'cobra', 'viper', 'scorpion'
])

// 键盘序列模式（小写）
const KEYBOARD_SEQUENCES = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  'qwertzuiop', 'asdfghjkl', 'yxcvbnm',
  'qazwsxedc', 'wsxedcrfv', 'edcrfvtgb',
  'rfvtgbyhn', 'tgbyhnujm', 'yhnujmik',
  '1qaz2wsx', '2wsx3edc', '3edc4rfv',
  '4rfv5tgb', '5tgb6yhn', '6yhn7ujm',
  '7ujm8ik', '8ik9ol', '9ol0p',
  'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
  'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
  'zxc', 'xcv', 'cvb', 'vbn', 'bnm',
  'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi',
  '012', '123', '234', '345', '456', '567', '678', '789', '890'
]

export default {
  name: 'PasswordStrengthTool',
  data() {
    return {
      password: '',
      showPassword: false,
      score: 0,
      scoreText: '-',
      scoreLevel: '',
      crackTime: '-',
      details: [],
      suggestions: [],
      error: '',
      success: ''
    }
  },
  mounted() {
    const saved = loadToolPrefs('password-strength')
    if (saved && saved.password) {
      this.password = saved.password
      this.$nextTick(() => this.analyze())
    }
  },
  methods: {
    analyze() {
      this.error = ''
      this.success = ''
      saveToolPrefs('password-strength', { password: this.password })

      const pwd = this.password
      if (pwd.length === 0) {
        this.score = 0
        this.scoreText = '-'
        this.scoreLevel = ''
        this.crackTime = '-'
        this.details = []
        this.suggestions = []
        return
      }

      let score = 0
      const details = []
      const suggestions = []

      // 1. 长度检查
      if (pwd.length < 6) {
        details.push({ type: 'fail', text: `长度过短（${pwd.length} 字符），建议至少 12 位` })
        suggestions.push('密码长度至少 12 位（当前仅 ' + pwd.length + ' 位）')
      } else if (pwd.length < 8) {
        score += 5
        details.push({ type: 'warn', text: `长度偏短（${pwd.length} 字符），建议至少 12 位` })
        suggestions.push('密码长度至少 12 位以获得更好安全性')
      } else if (pwd.length < 12) {
        score += 15
        details.push({ type: 'warn', text: `长度一般（${pwd.length} 字符），12 位以上更安全` })
      } else if (pwd.length < 16) {
        score += 25
        details.push({ type: 'pass', text: `长度良好（${pwd.length} 字符）` })
      } else if (pwd.length < 20) {
        score += 30
        details.push({ type: 'pass', text: `长度优秀（${pwd.length} 字符）` })
      } else {
        score += 35
        details.push({ type: 'pass', text: `长度极佳（${pwd.length} 字符）` })
      }

      // 2. 常见弱密码检测
      if (COMMON_PASSWORDS.has(pwd.toLowerCase())) {
        score -= 40
        details.push({ type: 'fail', text: '检测为常见弱密码，极易被字典攻击破解' })
        suggestions.push('这是最常见弱密码之一，请更换为随机字符串')
      }

      // 3. 字符种类
      const hasUpper = /[A-Z]/.test(pwd)
      const hasLower = /[a-z]/.test(pwd)
      const hasDigit = /[0-9]/.test(pwd)
      const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
      const charTypes = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length

      if (hasUpper) {
        score += 10
        details.push({ type: 'pass', text: '包含大写字母' })
      } else {
        details.push({ type: 'warn', text: '缺少大写字母' })
        suggestions.push('添加大写字母 (A-Z)')
      }

      if (hasLower) {
        score += 10
        details.push({ type: 'pass', text: '包含小写字母' })
      } else {
        details.push({ type: 'warn', text: '缺少小写字母' })
        suggestions.push('添加小写字母 (a-z)')
      }

      if (hasDigit) {
        score += 10
        details.push({ type: 'pass', text: '包含数字' })
      } else {
        details.push({ type: 'warn', text: '缺少数字' })
        suggestions.push('添加数字 (0-9)')
      }

      if (hasSymbol) {
        score += 10
        details.push({ type: 'pass', text: '包含特殊字符' })
      } else {
        details.push({ type: 'warn', text: '缺少特殊字符' })
        suggestions.push('添加特殊字符 (!@#$%^&*)')
      }

      // 4. 重复字符检测
      const repeatMatch = pwd.match(/(.)\1{2,}/)
      if (repeatMatch) {
        score -= 10
        details.push({ type: 'fail', text: `存在连续重复字符 "${repeatMatch[0]}"` })
        suggestions.push('避免连续重复字符（如 aaa、111）')
      } else {
        details.push({ type: 'pass', text: '无连续重复字符' })
      }

      // 5. 键盘序列检测
      let foundSeq = false
      const lowerPwd = pwd.toLowerCase()
      for (const seq of KEYBOARD_SEQUENCES) {
        if (seq.length >= 3 && lowerPwd.includes(seq)) {
          foundSeq = true
          score -= 10
          details.push({ type: 'fail', text: `包含键盘序列模式 "${seq}"` })
          break
        }
      }
      if (!foundSeq) {
        details.push({ type: 'pass', text: '无键盘序列模式' })
      } else {
        suggestions.push('避免键盘序列（如 qwerty、asdfgh、123456）')
      }

      // 6. 顺序字符检测 (abc, 123, etc.)
      if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(pwd)) {
        score -= 8
        details.push({ type: 'fail', text: '包含字母顺序模式（abc, def 等）' })
        suggestions.push('避免字母顺序排列（如 abc、xyz）')
      } else {
        details.push({ type: 'pass', text: '无字母顺序模式' })
      }

      if (/012|123|234|345|456|567|678|789/.test(pwd)) {
        score -= 8
        details.push({ type: 'fail', text: '包含数字顺序模式（123, 456 等）' })
        suggestions.push('避免数字顺序排列（如 123、789）')
      } else {
        details.push({ type: 'pass', text: '无数字顺序模式' })
      }

      // 7. 常见单词检测（检测密码中是否包含字典单词）
      let wordFound = false
      for (const word of COMMON_WORDS) {
        if (word.length >= 4 && lowerPwd.includes(word)) {
          wordFound = true
          break
        }
      }
      if (wordFound) {
        score -= 8
        details.push({ type: 'warn', text: '包含常见字典词汇，易受字典攻击' })
        suggestions.push('避免使用常见单词（如 password、admin、love 等）')
      } else {
        details.push({ type: 'pass', text: '不包含常见字典词汇' })
      }

      // 8. 大小写分布
      if (hasUpper && hasLower) {
        const upperCount = (pwd.match(/[A-Z]/g) || []).length
        const lowerCount = (pwd.match(/[a-z]/g) || []).length
        if (upperCount > 0 && lowerCount > 0) {
          details.push({ type: 'pass', text: `大小写分布合理（大写${upperCount}位，小写${lowerCount}位）` })
        }
      }

      // 9. 数字不在开头/结尾
      if (hasDigit && hasLower) {
        if (/^\d+/.test(pwd) || /\d+$/.test(pwd)) {
          score -= 5
          details.push({ type: 'warn', text: '数字集中在开头或结尾，容易被猜测' })
          suggestions.push('将数字分散到密码中间位置')
        } else {
          details.push({ type: 'pass', text: '数字分布合理（不在开头/结尾）' })
        }
      }

      // 10. 日期模式检测
      if (/\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(pwd) || /\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(pwd) ||
          /\b(19|20)\d{2}\b/.test(pwd)) {
        score -= 10
        details.push({ type: 'fail', text: '检测到日期/年份模式，容易被社会工程学破解' })
        suggestions.push('避免使用日期或出生年份')
      }

      // 限制分数
      score = Math.max(0, Math.min(100, score))

      // 设置分数和等级
      this.score = score
      if (score < 30) {
        this.scoreLevel = 'weak'
        this.scoreText = '弱'
      } else if (score < 55) {
        this.scoreLevel = 'fair'
        this.scoreText = '较弱'
      } else if (score < 70) {
        this.scoreLevel = 'medium'
        this.scoreText = '中等'
      } else if (score < 85) {
        this.scoreLevel = 'good'
        this.scoreText = '良好'
      } else {
        this.scoreLevel = 'strong'
        this.scoreText = '强'
      }

      // 破解时间估算
      this.crackTime = this.estimateCrackTime(pwd, score)

      this.details = details
      // 去重建议
      this.suggestions = [...new Set(suggestions)]
    },

    estimateCrackTime(pwd, score) {
      // 计算字符集大小
      let charsetSize = 0
      if (/[a-z]/.test(pwd)) charsetSize += 26
      if (/[A-Z]/.test(pwd)) charsetSize += 26
      if (/[0-9]/.test(pwd)) charsetSize += 10
      if (/[^A-Za-z0-9]/.test(pwd)) charsetSize += 32

      const combinations = Math.pow(charsetSize, pwd.length)
      // 假设每秒 10^9 次尝试（中等 GPU 集群）
      const seconds = combinations / 1e9

      if (seconds < 1) return '瞬间破解'
      if (seconds < 60) return Math.round(seconds) + ' 秒'
      if (seconds < 3600) return Math.round(seconds / 60) + ' 分钟'
      if (seconds < 86400) return Math.round(seconds / 3600) + ' 小时'
      if (seconds < 31536000) return Math.round(seconds / 86400) + ' 天'
      if (seconds < 31536000 * 100) return Math.round(seconds / 31536000) + ' 年'
      if (seconds < 31536000 * 1000) return Math.round(seconds / (31536000 * 100)) + ' 百年'
      if (seconds < 31536000 * 1e6) return Math.round(seconds / (31536000 * 1e3)) + ' 千年'
      if (seconds < 31536000 * 1e9) return Math.round(seconds / (31536000 * 1e6)) + ' 百万年'
      if (seconds < 31536000 * 1e12) return Math.round(seconds / (31536000 * 1e9)) + ' 十亿年'
      return '远超宇宙年龄'
    },

    loadSample(type) {
      const samples = {
        weak: 'password123',
        medium: 'Summer2024!',
        strong: 'Tr0ub4dor&3Mango!Wax'
      }
      this.password = samples[type]
      this.analyze()
    },

    async copyScore() {
      const report = [
        '=== 密码强度检测报告 ===',
        `评分：${this.score}/100 (${this.scoreText})`,
        `预估破解时间：${this.crackTime}`,
        '',
        '详细分析：',
        ...this.details.map(d => `${d.type === 'pass' ? '✅' : d.type === 'warn' ? '⚠️' : '❌'} ${d.text}`),
        this.suggestions.length > 0 ? '\n改进建议：' : '',
        ...this.suggestions.map(s => `💡 ${s}`)
      ].join('\n')

      if (await copyText(report)) {
        this.success = '复制成功！'
        setTimeout(() => { this.success = '' }, 2000)
      } else {
        this.error = '复制失败'
      }
    },

    clearAll() {
      this.password = ''
      this.showPassword = false
      this.score = 0
      this.scoreText = '-'
      this.scoreLevel = ''
      this.crackTime = '-'
      this.details = []
      this.suggestions = []
      this.error = ''
      this.success = ''
      saveToolPrefs('password-strength', { password: '' })
    }
  }
}
</script>

<style scoped>
/* 密码输入行 */
.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrap .code-input-sm {
  flex: 1;
  padding-right: 40px;
}

.toggle-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  transition: color 0.2s;
  line-height: 1;
}

.toggle-btn:hover {
  color: var(--green);
}

/* 快捷按钮 */
.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.quick-actions .tool-button {
  flex: 1;
  min-width: 80px;
  font-size: 12px;
  padding: 6px 10px;
}

/* 评分圆环 */
.score-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
}

.score-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--line);
  background: var(--panel-2);
  flex-shrink: 0;
  transition: all 0.3s;
}

.score-ring.weak {
  border-color: var(--red);
  box-shadow: 0 0 12px rgba(255, 75, 75, 0.3);
}

.score-ring.fair {
  border-color: #ff8c42;
  box-shadow: 0 0 12px rgba(255, 140, 66, 0.3);
}

.score-ring.medium {
  border-color: var(--amber);
  box-shadow: 0 0 12px rgba(255, 193, 7, 0.3);
}

.score-ring.good {
  border-color: #66bb6a;
  box-shadow: 0 0 12px rgba(102, 187, 106, 0.3);
}

.score-ring.strong {
  border-color: var(--green);
  box-shadow: 0 0 12px rgba(157, 255, 107, 0.3);
}

.score-number {
  font-family: var(--mono);
  font-size: 24px;
  font-weight: bold;
  color: var(--text);
  line-height: 1;
}

.score-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  margin-top: 2px;
}

/* 破解时间 */
.crack-time {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crack-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.crack-value {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--green);
  font-weight: bold;
}

/* 强度条 */
.strength-indicator {
  margin: 8px 0 12px;
}

.strength-bar-track {
  height: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.strength-bar-fill {
  height: 100%;
  transition: width 0.4s ease, background 0.3s;
  background: var(--red);
}

.strength-bar-fill.weak { background: var(--red); }
.strength-bar-fill.fair { background: #ff8c42; }
.strength-bar-fill.medium { background: var(--amber); }
.strength-bar-fill.good { background: #66bb6a; }
.strength-bar-fill.strong { background: var(--green); }

/* 分析结果区域 */
.analysis-results {
  display: flex;
  flex-direction: column;
}

/* 详细分析 */
.detail-section {
  margin-top: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.detail-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}

.detail-list {
  padding: 6px 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 10px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text);
  word-break: break-all;
}

.detail-item.fail {
  color: var(--red);
}

.detail-item.warn {
  color: var(--amber);
}

.detail-item.pass {
  color: var(--green);
}

.detail-icon {
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

/* 按钮组 */
.analysis-results .button-group {
  margin-top: 12px;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .score-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quick-actions .tool-button {
    font-size: 11px;
    padding: 5px 8px;
  }
}

@media (max-width: 375px) {
  .quick-actions {
    flex-direction: column;
  }

  .score-ring {
    width: 64px;
    height: 64px;
  }

  .score-number {
    font-size: 20px;
  }
}
</style>
