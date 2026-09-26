<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔢 数字格式化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入和选项 -->
          <div class="tool-col">
            <label class="tool-label">输入数字：</label>
            <input
              type="text"
              v-model="input"
              class="code-input-sm"
              placeholder="输入数字，例如 1234567.89"
              @input="format"
            />

            <label class="tool-label">格式风格：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="style" value="decimal" @change="format" />
                <span>千分位 (Decimal)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="style" value="currency" @change="format" />
                <span>货币 (Currency)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="style" value="percent" @change="format" />
                <span>百分比 (Percent)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="style" value="scientific" @change="format" />
                <span>科学计数法</span>
              </label>
            </div>

            <label class="tool-label">语言/地区：</label>
            <select v-model="locale" class="locale-select" @change="format">
              <option v-for="l in locales" :key="l.value" :value="l.value">
                {{ l.label }}
              </option>
            </select>

            <template v-if="style === 'currency'">
              <label class="tool-label">货币：</label>
              <select v-model="currency" class="locale-select" @change="format">
                <option v-for="c in currencies" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>

              <label class="tool-label">货币显示：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="currencyDisplay" value="symbol" @change="format" />
                  <span>符号 (¥)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="currencyDisplay" value="code" @change="format" />
                  <span>代码 (CNY)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="currencyDisplay" value="name" @change="format" />
                  <span>名称</span>
                </label>
              </div>
            </template>

            <label class="tool-label">小数位数：</label>
            <div class="fraction-row">
              <span class="fraction-label">最少</span>
              <input
                type="number"
                v-model.number="minDigits"
                class="code-input-sm fraction-input"
                min="0"
                max="20"
                @input="format"
              />
              <span class="fraction-label">最多</span>
              <input
                type="number"
                v-model.number="maxDigits"
                class="code-input-sm fraction-input"
                min="0"
                max="20"
                @input="format"
              />
            </div>

            <label class="tool-label">符号显示：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="signDisplay" value="auto" @change="format" />
                <span>自动</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="signDisplay" value="always" @change="format" />
                <span>始终显示符号</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="signDisplay" value="never" @change="format" />
                <span>不显示符号</span>
              </label>
            </div>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <label class="tool-label">格式化结果：</label>
            <textarea
              :value="output"
              readonly
              rows="4"
              class="code-input output result-textarea"
              placeholder="输入数字后自动格式化..."
            ></textarea>

            <label class="tool-label">原始数字：</label>
            <div class="result-display">
              {{ parsedNumber !== null ? parsedNumber : '—' }}
              <button
                class="copy-btn"
                @click="copyRaw"
                :disabled="parsedNumber === null"
                title="复制原始数字"
              >📋</button>
            </div>

            <div v-if="localesDetail" class="locale-detail">
              <span class="locale-detail-label">{{ localesDetail }}</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="copyResult" :disabled="!output">
            📋 复制结果
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('1234567.89')
const style = ref('decimal')
const locale = ref('zh-CN')
const currency = ref('CNY')
const currencyDisplay = ref('symbol')
const minDigits = ref(0)
const maxDigits = ref(2)
const signDisplay = ref('auto')
const output = ref('')
const error = ref('')
const success = ref(false)

const locales = [
  { value: 'zh-CN', label: '🇨🇳 中文（中国）' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'en-GB', label: '🇬🇧 English (UK)' },
  { value: 'ja-JP', label: '🇯🇵 日本語' },
  { value: 'ko-KR', label: '🇰🇷 한국어' },
  { value: 'de-DE', label: '🇩🇪 Deutsch' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
  { value: 'es-ES', label: '🇪🇸 Español' },
  { value: 'pt-BR', label: '🇧🇷 Português (BR)' },
  { value: 'ru-RU', label: '🇷🇺 Русский' },
  { value: 'ar-SA', label: '🇸🇦 العربية' },
  { value: 'hi-IN', label: '🇮🇳 हिन्दी' },
  { value: 'en-IN', label: '🇮🇳 English (India)' },
]

const currencies = [
  { value: 'CNY', label: 'CNY - 人民币 ¥' },
  { value: 'USD', label: 'USD - 美元 $' },
  { value: 'EUR', label: 'EUR - 欧元 €' },
  { value: 'GBP', label: 'GBP - 英镑 £' },
  { value: 'JPY', label: 'JPY - 日元 ¥' },
  { value: 'KRW', label: 'KRW - 韩元 ₩' },
  { value: 'HKD', label: 'HKD - 港币 HK$' },
  { value: 'TWD', label: 'TWD - 新台币 NT$' },
  { value: 'INR', label: 'INR - 印度卢比 ₹' },
  { value: 'RUB', label: 'RUB - 俄罗斯卢布 ₽' },
  { value: 'BRL', label: 'BRL - 巴西雷亚尔 R$' },
  { value: 'SGD', label: 'SGD - 新加坡元 S$' },
  { value: 'CHF', label: 'CHF - 瑞士法郎 CHF' },
  { value: 'AUD', label: 'AUD - 澳元 A$' },
  { value: 'CAD', label: 'CAD - 加元 C$' },
]

const parsedNumber = computed(() => {
  const raw = input.value.trim()
  if (raw === '') return null
  const n = parseFloat(raw)
  if (isNaN(n)) return null
  return n
})

const localesDetail = computed(() => {
  try {
    const fmt = new Intl.NumberFormat(locale.value, { style: 'decimal' })
    const parts = fmt.formatToParts(1234567.89)
    const group = parts.find(p => p.type === 'group')?.value || ''
    const decimal = parts.find(p => p.type === 'decimal')?.value || '.'
    return `分组符: "${group}"  小数点: "${decimal}"  示例: ${fmt.format(1234567.89)}`
  } catch {
    return ''
  }
})

function buildOptions() {
  const opts = {
    style: style.value,
    minimumFractionDigits: minDigits.value,
    maximumFractionDigits: maxDigits.value,
    signDisplay: signDisplay.value,
  }

  if (style.value === 'currency') {
    opts.currency = currency.value
    opts.currencyDisplay = currencyDisplay.value
  }

  // scientific notation via notation option
  if (style.value === 'scientific') {
    opts.style = 'decimal'
    opts.notation = 'scientific'
    delete opts.currency
    delete opts.currencyDisplay
  }

  // percent style needs no currency
  if (style.value === 'percent') {
    delete opts.currency
    delete opts.currencyDisplay
  }

  return opts
}

function format() {
  error.value = ''
  success.value = false

  if (input.value.trim() === '') {
    output.value = ''
    return
  }

  const n = parsedNumber.value
  if (n === null) {
    output.value = ''
    error.value = '请输入有效数字'
    return
  }

  try {
    const opts = buildOptions()
    const formatter = new Intl.NumberFormat(locale.value, opts)
    output.value = formatter.format(n)
  } catch (e) {
    output.value = ''
    error.value = e.message || '格式化失败'
  }
}

async function copyResult() {
  if (!output.value) return
  if (await copyText(output.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyRaw() {
  if (parsedNumber.value === null) return
  if (await copyText(String(parsedNumber.value))) {
    success.value = '原始数字已复制'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = false
}

// 初始化
format()
</script>

<style scoped>
.locale-select {
  width: 100%;
  padding: 8px 10px;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 13px;
  outline: none;
  border-radius: 0;
  appearance: none;
  cursor: pointer;
  margin-bottom: 4px;
}

.locale-select:focus {
  border-color: var(--green);
}

.locale-select option {
  background: var(--panel);
  color: var(--text);
}

.fraction-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fraction-label {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  min-width: 32px;
}

.fraction-input {
  flex: 1;
  min-width: 0;
}

.result-textarea {
  font-size: 20px !important;
  font-weight: bold;
  min-height: 50px !important;
}

.locale-detail {
  margin-top: 12px;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
}

.locale-detail-label {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--mono);
}

.result-display {
  position: relative;
}

@media (max-width: 640px) {
  .result-textarea {
    font-size: 16px !important;
  }
}
</style>
