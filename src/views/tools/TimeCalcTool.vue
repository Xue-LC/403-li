<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⏱️ 时间计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入控制 -->
          <div class="tool-col">
            <label class="tool-label">计算模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="mode" value="diff" />
                <span>时间差计算</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="arithmetic" />
                <span>日期加减</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="workday" />
                <span>工作日计算</span>
              </label>
            </div>

            <!-- 时间差模式 -->
            <template v-if="mode === 'diff'">
              <label class="tool-label">起始日期：</label>
              <input type="date" v-model="diffStart" class="code-input-sm" />
              <label class="tool-label">结束日期：</label>
              <input type="date" v-model="diffEnd" class="code-input-sm" />
            </template>

            <!-- 日期加减模式 -->
            <template v-if="mode === 'arithmetic'">
              <label class="tool-label">基准日期：</label>
              <input type="date" v-model="arithDate" class="code-input-sm" />
              <label class="tool-label">操作：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="arithOp" value="add" />
                  <span>加 (+)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="arithOp" value="subtract" />
                  <span>减 (−)</span>
                </label>
              </div>
              <div style="display: flex; gap: 8px;">
                <input type="number" v-model.number="arithAmount" min="0" max="99999"
                  class="code-input-sm" style="flex: 2;" placeholder="数量" />
                <select v-model="arithUnit" class="code-input-sm" style="flex: 1; padding-right: 8px;">
                  <option value="days">天</option>
                  <option value="months">月</option>
                  <option value="years">年</option>
                </select>
              </div>
            </template>

            <!-- 工作日模式 -->
            <template v-if="mode === 'workday'">
              <label class="tool-label">起始日期：</label>
              <input type="date" v-model="workStart" class="code-input-sm" />
              <label class="tool-label">结束日期：</label>
              <input type="date" v-model="workEnd" class="code-input-sm" />
            </template>
          </div>

          <!-- 右侧：结果 -->
          <div class="tool-col">
            <label class="tool-label">计算结果：</label>
            <div class="result-display" v-if="resultText">
              <pre class="result-content">{{ resultText }}</pre>
              <button class="copy-btn" @click="copyResult" title="复制结果">📋</button>
            </div>
            <div v-else class="result-display" style="opacity: 0.5;">
              <span class="result-placeholder">设置参数后点击「计算」查看结果</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="calculate">⚡ 计算</button>
          <button class="tool-button" @click="copyResult" :disabled="!resultText">📋 复制</button>
          <button class="tool-button danger" @click="reset">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const mode = ref('diff')
const resultText = ref('')
const error = ref('')
const success = ref('')

// 时间差模式
const diffStart = ref('')
const diffEnd = ref('')

// 日期加减模式
const arithDate = ref('')
const arithOp = ref('add')
const arithAmount = ref(0)
const arithUnit = ref('days')

// 工作日模式
const workStart = ref('')
const workEnd = ref('')

// 初始化日期为今天
const today = new Date().toISOString().split('T')[0]
diffStart.value = today
diffEnd.value = today
arithDate.value = today
workStart.value = today
workEnd.value = today

// 监听模式切换，清空结果
watch(mode, () => {
  resultText.value = ''
  error.value = ''
  success.value = ''
})

function getWeekdayName(date) {
  const names = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return names[date.getDay()]
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 计算两个日期之间的天数差（绝对值） */
function daysBetween(d1, d2) {
  const ms = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

/** 计算工作日数量（含首尾） */
function countWorkdays(start, end) {
  let count = 0
  let cur = new Date(start)
  let endDate = new Date(end)
  // 确保 start <= end
  if (cur > endDate) {
    const tmp = cur
    cur = endDate
    endDate = tmp
  }
  cur.setHours(0, 0, 0, 0)
  const endTime = endDate.getTime()
  while (cur.getTime() <= endTime) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function calculate() {
  error.value = ''
  success.value = ''

  try {
    if (mode.value === 'diff') {
      if (!diffStart.value || !diffEnd.value) {
        error.value = '请选择起始日期和结束日期'
        return
      }
      const d1 = new Date(diffStart.value + 'T00:00:00')
      const d2 = new Date(diffEnd.value + 'T00:00:00')
      if (isNaN(d1) || isNaN(d2)) {
        error.value = '日期格式无效'
        return
      }

      const diffMs = Math.abs(d2.getTime() - d1.getTime())
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffWeeks = (diffDays / 7).toFixed(1)
      const diffMonths = ((d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()))

      const sign = d2 >= d1 ? '' : '（结束日期早于起始日期）'
      resultText.value = [
        `起始日期：${diffStart.value}`,
        `结束日期：${diffEnd.value}`,
        ``,
        `相差天数：${diffDays} 天${sign}`,
        `相差周数：${diffWeeks} 周`,
        `相差月数：约 ${diffMonths} 个月`,
        ``,
        `总小时数：${diffHours.toLocaleString()} 小时`,
        `总分钟数：${diffMinutes.toLocaleString()} 分钟`,
        `总秒数：${diffSeconds.toLocaleString()} 秒`,
      ].join('\n')
    }

    else if (mode.value === 'arithmetic') {
      if (!arithDate.value) {
        error.value = '请选择基准日期'
        return
      }
      if (!arithAmount.value || arithAmount.value <= 0) {
        error.value = '请输入大于 0 的数量'
        return
      }

      const base = new Date(arithDate.value + 'T00:00:00')
      if (isNaN(base)) {
        error.value = '日期格式无效'
        return
      }

      const sign = arithOp.value === 'add' ? 1 : -1
      const amount = arithAmount.value * sign
      const result = new Date(base)

      if (arithUnit.value === 'days') {
        result.setDate(result.getDate() + amount)
      } else if (arithUnit.value === 'months') {
        result.setMonth(result.getMonth() + amount)
      } else if (arithUnit.value === 'years') {
        result.setFullYear(result.getFullYear() + amount)
      }

      const opSymbol = arithOp.value === 'add' ? '+' : '−'
      const unitName = { days: '天', months: '个月', years: '年' }[arithUnit.value]
      resultText.value = [
        `基准日期：${arithDate.value}`,
        `操作：${opSymbol} ${arithAmount.value} ${unitName}`,
        ``,
        `结果日期：${formatDate(result)}`,
        `星期：${getWeekdayName(result)}`,
      ].join('\n')
    }

    else if (mode.value === 'workday') {
      if (!workStart.value || !workEnd.value) {
        error.value = '请选择起始日期和结束日期'
        return
      }
      const d1 = new Date(workStart.value + 'T00:00:00')
      const d2 = new Date(workEnd.value + 'T00:00:00')
      if (isNaN(d1) || isNaN(d2)) {
        error.value = '日期格式无效'
        return
      }

      const calendarDays = daysBetween(d1, d2) + 1
      const workdays = countWorkdays(d1, d2)
      const weekendDays = calendarDays - workdays

      resultText.value = [
        `起始日期：${workStart.value}`,
        `结束日期：${workEnd.value}`,
        ``,
        `日历天数：${calendarDays} 天`,
        `工作日：${workdays} 天（周一至周五）`,
        `周末天数：${weekendDays} 天`,
      ].join('\n')
    }

  } catch (e) {
    error.value = '计算出错：' + e.message
  }
}

async function copyResult() {
  if (!resultText.value) return
  if (await copyText(resultText.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function reset() {
  const t = new Date().toISOString().split('T')[0]
  diffStart.value = t
  diffEnd.value = t
  arithDate.value = t
  arithOp.value = 'add'
  arithAmount.value = 0
  arithUnit.value = 'days'
  workStart.value = t
  workEnd.value = t
  resultText.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.result-content {
  margin: 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.7;
}

.result-placeholder {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
}

/* 日期输入框和下拉选择器适配主题 */
:deep(input[type="date"]) {
  color-scheme: dark;
}

:deep(select) {
  appearance: none;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  height: 40px;
  padding: 0 12px;
  border-radius: 0;
  cursor: pointer;
}

:deep(input[type="number"]) {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  border-radius: 0;
}

:deep(select:focus),
:deep(input[type="number"]:focus) {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.result-display {
  padding-right: 44px;
}
</style>
