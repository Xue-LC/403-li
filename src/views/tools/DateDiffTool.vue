<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📅 日期差计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 差值计算 -->
        <div class="tool-two-col">
          <!-- 左：输入 -->
          <div class="tool-col">
            <label class="tool-label">开始日期时间：</label>
            <input type="datetime-local" step="1" v-model="start" class="code-input-sm date-input" />

            <label class="tool-label">结束日期时间：</label>
            <input type="datetime-local" step="1" v-model="end" class="code-input-sm date-input" />

            <label class="tool-label">统计选项：</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="excludeWeekend" />
                <span>工作日统计排除周末</span>
              </label>
            </div>

            <label class="tool-label">自定义节假日（每行一个，YYYY-MM-DD）：</label>
            <textarea
              class="code-input holidays-input"
              rows="4"
              v-model="holidays"
              placeholder="2026-01-01&#10;2026-05-01&#10;2026-10-01"
            ></textarea>
          </div>

          <!-- 右：输出 -->
          <div class="tool-col">
            <label class="tool-label">精确差值：</label>
            <div class="result-display result-box">
              <div v-if="diffResult" class="diff-lines">
                <div class="diff-main">{{ humanDiff }}</div>
                <div class="diff-sub">
                  共 {{ diffResult.totalDays }} 天 · 约 {{ diffResult.totalWeeks }} 周
                  <span v-if="diffResult.swapped">（已自动交换首尾）</span>
                </div>
              </div>
              <span v-else class="placeholder">请选择完整的开始与结束时间…</span>
              <button class="copy-btn" @click="copyDiff" title="复制">📋</button>
            </div>

            <label class="tool-label">工作日统计：</label>
            <div class="result-display result-box">
              <div v-if="workStats" class="diff-lines">
                <div class="diff-main">{{ workStats.work }} 个工作日</div>
                <div class="diff-sub">
                  自然日 {{ workStats.calendar }} 天 ·
                  已扣除 {{ workStats.removed }} 天（
                  <template v-if="excludeWeekend">周末/节假日</template>
                  <template v-else>节假日</template>）
                </div>
              </div>
              <span v-else class="placeholder">—</span>
              <button class="copy-btn" @click="copyWork" title="复制">📋</button>
            </div>

            <div v-if="diffResult" class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">总秒数</span>
                <span class="stat-value">{{ formatNum(diffResult.totalSeconds) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总分钟</span>
                <span class="stat-value">{{ formatNum(diffResult.totalMinutes) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总小时</span>
                <span class="stat-value">{{ formatNum(diffResult.totalHours) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总天数</span>
                <span class="stat-value">{{ formatNum(diffResult.totalDays) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总月数（约）</span>
                <span class="stat-value">{{ (diffResult.totalDays / 30.4375).toFixed(2) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总年数（约）</span>
                <span class="stat-value">{{ (diffResult.totalDays / 365.25).toFixed(3) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="setEndNow">📆 结束 = 现在</button>
          <button class="tool-button" @click="swap">⇄ 交换首尾</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 日期推算 -->
        <div class="section-divider">日期推算（以开始日期为基准）</div>

        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">加减方向：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="addDir" value="add" />
                <span>向后加</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="addDir" value="sub" />
                <span>向前减</span>
              </label>
            </div>

            <label class="tool-label">偏移量：</label>
            <div class="offset-grid">
              <div class="offset-item">
                <span class="offset-label">年</span>
                <input type="number" class="code-input-sm offset-input" v-model.number="offset.y" min="0" />
              </div>
              <div class="offset-item">
                <span class="offset-label">月</span>
                <input type="number" class="code-input-sm offset-input" v-model.number="offset.m" min="0" />
              </div>
              <div class="offset-item">
                <span class="offset-label">天</span>
                <input type="number" class="code-input-sm offset-input" v-model.number="offset.d" min="0" />
              </div>
              <div class="offset-item">
                <span class="offset-label">时</span>
                <input type="number" class="code-input-sm offset-input" v-model.number="offset.h" min="0" />
              </div>
              <div class="offset-item">
                <span class="offset-label">分</span>
                <input type="number" class="code-input-sm offset-input" v-model.number="offset.min" min="0" />
              </div>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">推算结果：</label>
            <div class="result-display result-box">
              <div v-if="projected" class="diff-lines">
                <div class="diff-main">{{ projected.text }}</div>
                <div class="diff-sub">星期{{ projected.weekday }}</div>
              </div>
              <span v-else class="placeholder">请先设置开始日期…</span>
              <button class="copy-btn" @click="copyProjected" title="复制">📋</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const start = ref('')
const end = ref('')
const excludeWeekend = ref(true)
const holidays = ref('')
const addDir = ref('add')
const offset = reactive({ y: 0, m: 0, d: 0, h: 0, min: 0 })
const error = ref('')
const success = ref('')

const pad = (n) => String(n).padStart(2, '0')

function toLocalInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatNum(n) {
  return n.toLocaleString('en-US')
}

function formatFull(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 解析两个输入
const parsed = computed(() => {
  const a = start.value ? new Date(start.value) : null
  const b = end.value ? new Date(end.value) : null
  return {
    a: a && !isNaN(a.getTime()) ? a : null,
    b: b && !isNaN(b.getTime()) ? b : null
  }
})

// 在日期上增加 n 个月（自动处理月末天数截断，如 1/31 + 1 月 = 2/29）
function addMonths(date, n) {
  const d = new Date(date)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const daysInTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, daysInTarget))
  return d
}

// 日历感知的年月日时分秒差值
function diffYMD(s, e) {
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  let anchor = addMonths(s, months)
  if (anchor.getTime() > e.getTime()) {
    months--
    anchor = addMonths(s, months)
  }
  let rest = e.getTime() - anchor.getTime()
  const y = Math.floor(months / 12)
  const m = months % 12
  const d = Math.floor(rest / 86400000)
  rest -= d * 86400000
  const h = Math.floor(rest / 3600000)
  rest -= h * 3600000
  const mi = Math.floor(rest / 60000)
  rest -= mi * 60000
  const sec = Math.floor(rest / 1000)
  return { y, m, d, h, mi, sec }
}

const diffResult = computed(() => {
  const { a, b } = parsed.value
  if (!a || !b) return null
  const swapped = a.getTime() > b.getTime()
  const s = swapped ? b : a
  const e = swapped ? a : b
  const ms = e.getTime() - s.getTime()
  const totalSeconds = Math.floor(ms / 1000)
  const totalMinutes = Math.floor(ms / 60000)
  const totalHours = Math.floor(ms / 3600000)
  const totalDays = Math.floor(ms / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)
  const ymd = diffYMD(s, e)
  return { swapped, ms, totalSeconds, totalMinutes, totalHours, totalDays, totalWeeks, ...ymd }
})

const humanDiff = computed(() => {
  const r = diffResult.value
  if (!r) return ''
  const parts = []
  if (r.y) parts.push(`${r.y} 年`)
  if (r.m) parts.push(`${r.m} 个月`)
  if (r.d) parts.push(`${r.d} 天`)
  if (r.h) parts.push(`${r.h} 小时`)
  if (r.mi) parts.push(`${r.mi} 分钟`)
  if (r.sec) parts.push(`${r.sec} 秒`)
  return parts.length ? parts.join(' ') : '0 秒（两个时间相同）'
})

// 节假日集合
const holidaySet = computed(() => {
  const set = new Set()
  holidays.value.split(/[\n,，;；\s]+/).forEach((raw) => {
    const token = raw.trim()
    if (!token) return
    const d = new Date(token)
    if (!isNaN(d.getTime())) set.add(dateKey(d))
  })
  return set
})

const workStats = computed(() => {
  const { a, b } = parsed.value
  if (!a || !b) return null
  const s = a.getTime() <= b.getTime() ? a : b
  const e = a.getTime() <= b.getTime() ? b : a
  const iso = excludeWeekend.value
  const set = holidaySet.value
  let work = 0
  let calendar = 0
  let cur = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate())
  while (cur.getTime() <= endDay.getTime()) {
    calendar++
    const dow = cur.getDay()
    const isWeekend = dow === 0 || dow === 6
    const isHoliday = set.has(dateKey(cur))
    if (isHoliday) {
      // 节假日永远不计入工作日
    } else if (iso && isWeekend) {
      // 排除周末
    } else {
      work++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return { work, calendar, removed: calendar - work }
})

const projected = computed(() => {
  const base = parsed.value.a ? new Date(parsed.value.a) : new Date()
  const sign = addDir.value === 'sub' ? -1 : 1
  const n = (v) => (Number(v) || 0) * sign
  base.setFullYear(base.getFullYear() + n(offset.y))
  base.setMonth(base.getMonth() + n(offset.m))
  base.setDate(base.getDate() + n(offset.d))
  base.setHours(base.getHours() + n(offset.h))
  base.setMinutes(base.getMinutes() + n(offset.min))
  if (isNaN(base.getTime())) return null
  return { text: formatFull(base), weekday: WEEKDAYS[base.getDay()] }
})

function flash(msg) {
  success.value = msg
  setTimeout(() => { if (success.value === msg) success.value = '' }, 2000)
}

async function copyDiff() {
  if (!diffResult.value) { error.value = '暂无结果可复制'; return }
  const r = diffResult.value
  const text = `${humanDiff.value}（共 ${r.totalDays} 天，${formatNum(r.totalSeconds)} 秒）`
  if (await copyText(text)) { error.value = ''; flash('已复制差值') }
}

async function copyWork() {
  if (!workStats.value) { error.value = '暂无结果可复制'; return }
  const w = workStats.value
  const text = `工作日 ${w.work} 天（自然日 ${w.calendar} 天，扣除 ${w.removed} 天）`
  if (await copyText(text)) { error.value = ''; flash('已复制工作日统计') }
}

async function copyProjected() {
  if (!projected.value) { error.value = '暂无结果可复制'; return }
  if (await copyText(projected.value.text)) { error.value = ''; flash('已复制推算结果') }
}

function setEndNow() {
  end.value = toLocalInput(new Date())
  error.value = ''
  flash('结束时间已设为现在')
}

function swap() {
  const tmp = start.value
  start.value = end.value
  end.value = tmp
  error.value = ''
}

function clearAll() {
  start.value = ''
  end.value = ''
  holidays.value = ''
  offset.y = 0
  offset.m = 0
  offset.d = 0
  offset.h = 0
  offset.min = 0
  addDir.value = 'add'
  excludeWeekend.value = true
  error.value = ''
  success.value = ''
}

// 默认：开始 = 今天 00:00，结束 = 现在
const now = new Date()
start.value = toLocalInput(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
end.value = toLocalInput(now)
</script>

<style scoped>
/* 日期输入框：避免全局 .code-input-sm 的右侧 44px 内边距遮挡原生选择器图标 */
.date-input {
  padding-right: 12px;
}

.holidays-input {
  min-height: 90px;
}

/* 结果盒子 */
.result-box {
  margin: 0;
  min-height: 62px;
}

.diff-lines {
  padding-right: 34px;
}

.diff-main {
  color: var(--green);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.diff-sub {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.placeholder {
  color: var(--muted);
  font-size: 13px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: var(--green);
  font-size: 15px;
  font-family: var(--mono);
  word-break: break-all;
}

/* 分隔标题 */
.section-divider {
  margin: 1.5rem 0 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 偏移量输入网格 */
.offset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.offset-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.offset-label {
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
}

.offset-input {
  padding: 0 10px;
  height: 38px;
  line-height: 38px;
  text-align: center;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .offset-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .diff-main {
    font-size: 14px;
  }
}
</style>
