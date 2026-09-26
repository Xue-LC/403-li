<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>💰 数字转中文金额</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">输入金额：</label>
              <button
                class="copy-btn"
                title="复制输入"
                @click="copyInput"
                :disabled="!input.trim()"
              >📋</button>
            </div>
            <input
              v-model="input"
              class="code-input-sm amount-input"
              placeholder="例如：12345.67"
              inputmode="decimal"
              spellcheck="false"
            />
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="mode" value="upper" />
                <span>大写金额（壹贰叁）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="lower" />
                <span>小写金额（一二三）</span>
              </label>
            </div>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="withWhole" />
                <span>无小数时输出「整」</span>
              </label>
            </div>
            <label class="tool-label">常用示例：</label>
            <div class="example-group">
              <button
                v-for="ex in examples"
                :key="ex"
                class="example-chip"
                @click="useExample(ex)"
              >{{ ex }}</button>
            </div>
          </div>
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">转换结果：</label>
              <button
                class="copy-btn"
                title="复制结果"
                @click="copyOutput"
                :disabled="!output"
              >📋</button>
            </div>
            <div class="result-display amount-result" :class="{ muted: !output }">
              {{ output || '输入数字后实时转换…' }}
            </div>
            <div class="stats-section">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">整数位数</span>
                  <span class="stat-value">{{ intDigits }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">小数位数</span>
                  <span class="stat-value">{{ fracDigits }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">转换模式</span>
                  <span class="stat-value">{{ mode === 'upper' ? '大写' : '小写' }}</span>
                </div>
              </div>
              <div v-if="roundedNote" class="round-note">
                ⚠️ {{ roundedNote }}
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="copyOutput" :disabled="!output">
            📋 复制结果
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">
          ❌ 错误：{{ error }}
        </div>
        <div v-if="successMsg" class="status-success">
          ✅ {{ successMsg }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const UPPER = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const LOWER = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const UPPER_POS = ['', '拾', '佰', '仟']
const LOWER_POS = ['', '十', '百', '千']
const BIG_UNITS = ['', '万', '亿', '兆']

const input = ref('')
const mode = ref('upper')
const withWhole = ref(true)
const output = ref('')
const error = ref('')
const successMsg = ref('')
const intDigits = ref(0)
const fracDigits = ref(0)
const roundedNote = ref('')

const examples = ['8888.88', '100000000.01', '0.08', '1234567.89']

// 转换 4 位一组（已补零），处理组内零的读法
function convertGroup(g, digits, posUnits) {
  let s = ''
  let pendingZero = false
  for (let i = 0; i < 4; i++) {
    const d = g[i]
    if (d === '0') {
      pendingZero = true
    } else {
      if (pendingZero && s) s += digits[0]
      pendingZero = false
      s += digits[Number(d)] + posUnits[3 - i]
    }
  }
  return s
}

// 整数部分转中文（按亿/万/个 4 位分组，处理跨组零）
function intToChinese(intStr, isUpper) {
  const digits = isUpper ? UPPER : LOWER
  const posUnits = isUpper ? UPPER_POS : LOWER_POS
  const groups = []
  let s = intStr
  while (s.length > 4) {
    groups.unshift(s.slice(-4))
    s = s.slice(0, -4)
  }
  groups.unshift(s)
  const count = groups.length
  // 该组之后是否还有非零组（决定全零组是否读「零」）
  const hasLater = groups.map((g, i) => groups.slice(i + 1).some(x => x !== '0000'))
  let out = ''
  groups.forEach((g, i) => {
    const big = BIG_UNITS[count - 1 - i]
    if (g === '0000') {
      if (hasLater[i] && out && !out.endsWith(digits[0])) out += digits[0]
      return
    }
    const padded = g.padStart(4, '0')
    const gstr = convertGroup(padded, digits, posUnits)
    // 非首组以 0 开头时补「零」（如 一亿零一十万）
    if (out && padded[0] === '0' && !out.endsWith(digits[0])) out += digits[0]
    out += gstr + big
  })
  // 小写读法中「一十」→「十」（如 15 → 十五）
  if (!isUpper && out.startsWith('一十')) out = out.slice(1)
  return out
}

function convert() {
  error.value = ''
  successMsg.value = ''
  output.value = ''
  intDigits.value = 0
  fracDigits.value = 0
  roundedNote.value = ''

  const raw = input.value.trim().replace(/[,\s]/g, '')
  if (!raw) return

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    error.value = '请输入有效的数字金额，例如 12345.67（不支持字母、符号）'
    return
  }

  let neg = false
  let body = raw
  if (body.startsWith('-')) {
    neg = true
    body = body.slice(1)
  }

  let [intPart, fracPart = ''] = body.split('.')
  intPart = intPart.replace(/^0+(?=\d)/, '')
  if (intPart === '') intPart = '0'
  intDigits.value = intPart.length
  fracDigits.value = fracPart.length

  // 超过两位小数时四舍五入到分
  if (fracPart.length > 2) {
    const keep = fracPart.slice(0, 2)
    let next = Number(fracPart[2]) >= 5 ? 1 : 0
    let n = parseInt(keep, 10) + next
    if (n === 100) {
      n = 0
      intPart = (BigInt(intPart) + 1n).toString()
    }
    fracPart = String(n).padStart(2, '0')
    roundedNote.value = '输入超过两位小数，已自动四舍五入到分'
  }
  fracPart = fracPart.padEnd(2, '0')

  if (intPart.length > 16) {
    error.value = '金额过大：整数部分超过 16 位，超出「兆」级转换范围'
    return
  }

  const isUpper = mode.value === 'upper'
  const digits = isUpper ? UPPER : LOWER
  const isZeroInt = /^0+$/.test(intPart)

  let text = ''
  if (!isZeroInt) {
    text = intToChinese(intPart, isUpper) + '元'
  }
  if (fracPart === '00') {
    if (isZeroInt) text = digits[0] + '元'
    if (withWhole.value) text += '整'
  } else {
    const jiao = fracPart[0]
    const fen = fracPart[1]
    if (isZeroInt) {
      // 0.5 → 伍角；0.05 → 伍分
      if (jiao !== '0') text += digits[Number(jiao)] + '角'
      if (fen !== '0') text += digits[Number(fen)] + '分'
    } else {
      if (jiao !== '0') {
        text += digits[Number(jiao)] + '角'
      } else {
        text += digits[0] // 有分无角，补「零」
      }
      if (fen !== '0') text += digits[Number(fen)] + '分'
    }
  }
  if (neg) text = '负' + text
  output.value = text
}

function useExample(ex) {
  input.value = ex
  convert()
}

async function copyInput() {
  if (await copyText(input.value)) {
    successMsg.value = '已复制输入内容'
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}

async function copyOutput() {
  if (await copyText(output.value)) {
    successMsg.value = '已复制到剪贴板'
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  successMsg.value = ''
  intDigits.value = 0
  fracDigits.value = 0
  roundedNote.value = ''
}

watch([input, mode, withWhole], convert)
</script>

<style scoped>
.label-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-input {
  font-size: 14px;
}

.options-group {
  margin: 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-chip {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.example-chip:hover {
  border-color: var(--green);
  box-shadow: var(--green-glow);
}

.amount-result {
  min-height: 96px;
  margin: 0.5rem 0 0;
  font-size: 15px;
  line-height: 1.8;
  display: flex;
  align-items: center;
}

.amount-result.muted {
  color: var(--muted);
  font-size: 13px;
}

.stats-section {
  margin-top: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 6px;
  text-align: center;
  min-width: 0;
}

.stat-label {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  display: block;
  font-family: var(--mono);
  font-size: 15px;
  color: var(--green);
  margin-top: 4px;
  word-break: break-all;
}

.round-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
