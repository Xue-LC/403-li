<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🕐 Cron 表达式解析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入 -->
          <div class="tool-col">
            <label class="tool-label">Cron 表达式：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="expression"
                placeholder="例如: */5 * * * * 或 @hourly"
                @input="parseCron"
              />
              <button class="copy-btn" @click="copyExpression" title="复制">📋</button>
            </div>

            <label class="tool-label" style="margin-top: 12px;">常用宏：</label>
            <div class="template-group">
              <button
                v-for="tpl in macros"
                :key="tpl.name"
                class="template-btn"
                :class="{ active: expression === tpl.expr }"
                @click="applyMacro(tpl.expr)"
              >
                {{ tpl.name }}
              </button>
            </div>

            <label class="tool-label" style="margin-top: 12px;">快速示例：</label>
            <div class="template-group">
              <button
                v-for="tpl in examples"
                :key="tpl.name"
                class="template-btn"
                :class="{ active: expression === tpl.expr }"
                @click="applyMacro(tpl.expr)"
              >
                {{ tpl.name }}
              </button>
            </div>
          </div>

          <!-- 右侧：输出 -->
          <div class="tool-col">
            <label class="tool-label">解析结果：</label>

            <!-- 人类可读描述 -->
            <div v-if="parsed.description" class="result-display">
              <div class="desc-text">{{ parsed.description }}</div>
              <button class="copy-btn" @click="copyDesc" title="复制描述">📋</button>
            </div>

            <!-- 字段解析 -->
            <div v-if="parsed.fields.length" class="fields-section" style="margin-top: 10px;">
              <label class="tool-label">字段分解：</label>
              <div class="field-grid">
                <div v-for="f in parsed.fields" :key="f.label" class="field-item">
                  <span class="field-label">{{ f.label }}</span>
                  <span class="field-value">{{ f.value }}</span>
                  <span class="field-desc">{{ f.desc }}</span>
                </div>
              </div>
            </div>

            <!-- 未来 10 次执行时间 -->
            <div v-if="parsed.nextRuns.length" style="margin-top: 12px;">
              <label class="tool-label">未来 10 次执行时间：</label>
              <div class="runs-list">
                <div v-for="(run, idx) in parsed.nextRuns" :key="idx" class="run-item">
                  <span class="run-number">{{ idx + 1 }}.</span>
                  <span class="run-time">{{ run }}</span>
                  <span class="run-relative">{{ runRelative(run) }}</span>
                </div>
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

<script setup>
import { ref, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

const expression = ref('*/5 * * * *')
const error = ref('')
const success = ref('')

const parsed = reactive({
  description: '',
  fields: [],
  nextRuns: []
})

const macros = [
  { name: '@yearly', expr: '@yearly' },
  { name: '@annually', expr: '@annually' },
  { name: '@monthly', expr: '@monthly' },
  { name: '@weekly', expr: '@weekly' },
  { name: '@daily', expr: '@daily' },
  { name: '@midnight', expr: '@midnight' },
  { name: '@hourly', expr: '@hourly' },
  { name: '@reboot', expr: '@reboot' }
]

const examples = [
  { name: '每分钟', expr: '* * * * *' },
  { name: '每5分钟', expr: '*/5 * * * *' },
  { name: '每小时', expr: '0 * * * *' },
  { name: '每天零点', expr: '0 0 * * *' },
  { name: '每天3点', expr: '0 3 * * *' },
  { name: '工作日9点', expr: '0 9 * * 1-5' },
  { name: '每周一0点', expr: '0 0 * * 1' },
  { name: '每月1号', expr: '0 0 1 * *' },
  { name: '每季度', expr: '0 0 1 1,4,7,10 *' },
  { name: '每年', expr: '0 0 1 1 *' },
  { name: '30分钟间隔', expr: '*/30 * * * *' },
  { name: '每2小时', expr: '0 */2 * * *' }
]

// ── 解析入口 ──
function parseCron() {
  error.value = ''
  parsed.description = ''
  parsed.fields = []
  parsed.nextRuns = []

  const expr = expression.value.trim()
  if (!expr) return

  try {
    let fields = []

    // 处理宏
    const macroMap = {
      '@yearly': '0 0 1 1 *',
      '@annually': '0 0 1 1 *',
      '@monthly': '0 0 1 * *',
      '@weekly': '0 0 * * 0',
      '@daily': '0 0 * * *',
      '@midnight': '0 0 * * *',
      '@hourly': '0 * * * *'
    }

    if (expr === '@reboot') {
      parsed.description = '系统启动时执行一次 (由系统调度器处理，不按时间循环)'
      parsed.fields = [{ label: '宏', value: '@reboot', desc: '启动时' }]
      return
    }

    const resolvedExpr = macroMap[expr] || expr
    const parts = resolvedExpr.trim().split(/\s+/)

    if (parts.length < 5 || parts.length > 6) {
      error.value = `Cron 表达式需要 5 或 6 个字段，当前 ${parts.length} 个字段`
      return
    }

    const labels = ['分钟', '小时', '日期', '月份', '星期']
    if (parts.length === 6) labels.push('年份')

    fields = parts.map((p, i) => ({
      label: labels[i],
      value: p,
      desc: describeField(p, i, parts)
    }))

    // 校验每个字段
    validateFields(parts)

    parsed.fields = fields
    parsed.description = buildFullDescription(fields, expr)

    // 计算未来执行时间
    parsed.nextRuns = calculateNextRuns(resolvedExpr, 10)

  } catch (e) {
    error.value = e.message || '解析失败'
  }
}

// ── 字段描述 ──
function describeField(field, index, allParts) {
  if (field === '*') return '任意'

  // 步长 */n
  const stepMatch = field.match(/^\*\/(\d+)$/)
  if (stepMatch) {
    return `每 ${stepMatch[1]} ${fieldUnitName(index)}`
  }

  // 范围 a-b
  const rangeMatch = field.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1])
    const b = parseInt(rangeMatch[2])
    if (index === 3) return `${a}月 到 ${b}月`
    if (index === 4) return `${weekdayName(a)} 到 ${weekdayName(b)}`
    return `${a} 到 ${b}`
  }

  // 范围+步长 a-b/n
  const rangeStepMatch = field.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (rangeStepMatch) {
    const a = parseInt(rangeStepMatch[1])
    const b = parseInt(rangeStepMatch[2])
    const n = parseInt(rangeStepMatch[3])
    if (index === 3) return `${a}月-${b}月 每${n}个月`
    if (index === 4) return `${weekdayName(a)}-${weekdayName(b)} 每${n}天`
    return `${a}-${b} 每${n}${fieldUnitName(index)}`
  }

  // 列表 a,b,c
  const listMatch = field.match(/^[\d,]+$/)
  if (listMatch) {
    const vals = field.split(',').map(v => parseInt(v))
    if (index === 3) return vals.map(v => `${v}月`).join('、')
    if (index === 4) return vals.map(v => weekdayName(v)).join('、')
    return vals.join('、')
  }

  // 单值
  const singleMatch = field.match(/^(\d+)$/)
  if (singleMatch) {
    const v = parseInt(singleMatch[1])
    if (index === 0) return `第 ${v} 分`
    if (index === 1) return `${v} 点`
    if (index === 2) return `${v} 号`
    if (index === 3) return `${v} 月`
    if (index === 4) return weekdayName(v)
    if (index === 5) return `${v} 年`
  }

  return field
}

function fieldUnitName(index) {
  const names = ['分钟', '小时', '天', '个月', '天']
  return names[index] || ''
}

function weekdayName(n) {
  const names = ['日', '一', '二', '三', '四', '五', '六']
  return names[n % 7] !== undefined ? `周${names[n % 7]}` : String(n)
}

// ── 字段校验 ──
function validateFields(parts) {
  const ranges = [
    { min: 0, max: 59, name: '分钟' },
    { min: 0, max: 23, name: '小时' },
    { min: 1, max: 31, name: '日期' },
    { min: 1, max: 12, name: '月份' },
    { min: 0, max: 7, name: '星期' }
  ]
  if (parts.length === 6) ranges.push({ min: 1970, max: 2099, name: '年份' })

  for (let i = 0; i < Math.min(parts.length, ranges.length); i++) {
    const field = parts[i]
    const range = ranges[i]

    if (field === '*') continue
    if (field.match(/^\*\/\d+$/)) continue

    // Check all numeric values in the field
    const nums = field.match(/\d+/g)
    if (!nums) continue

    for (const n of nums) {
      const val = parseInt(n)
      if (val < range.min || val > range.max) {
        throw new Error(`${range.name}字段值 ${val} 超出范围 (${range.min}-${range.max})`)
      }
    }
  }
}

// ── 构建完整描述 ──
function buildFullDescription(fields, originalExpr) {
  // 识别常见模式给出简洁描述
  const parts = fields.map(f => f.value)

  // 每分钟
  if (parts[0] === '*' && parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    return '每分钟执行'
  }

  // 每小时
  if (parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    const m = parts[0]
    if (m === '0') return '每小时整点执行'
    if (m.startsWith('*/')) return `每 ${m.slice(2)} 分钟执行一次`
    if (m === '*') return '每分钟执行'
    return `${describeField(parts[0], 0, parts)} 执行`
  }

  // 每天
  if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
    const m = parts[0]
    const h = parts[1]
    if (m === '0' && h !== '*') {
      // 具体小时
      const hDesc = h === '*' ? '每小时' : describeField(h, 1, parts)
      return `每天 ${hDesc} 整点执行`
    }
    if (m === '0' && h === '0') return '每天零点执行'
  }

  // 工作日
  if (parts[4] === '1-5' && parts[2] === '*' && parts[3] === '*') {
    const m = parts[0]
    const h = parts[1]
    const timeStr = h === '*' ? (m === '0' ? '' : describeField(m, 0, parts)) :
      `${describeField(h, 1, parts)}:${parts[0].padStart(2, '0')}`
    return `每个工作日${timeStr ? ' ' + timeStr : ''}执行`.trim()
  }

  // 通用：拼接所有非任意字段
  const meaningful = fields.filter(f => f.value !== '*')
  if (meaningful.length === 0) return '每分钟执行'

  const parts_desc = fields.map((f, i) => {
    if (f.value === '*') return ''
    const labels = ['分钟', '小时', '日期', '月份', '星期', '年份']
    return `${labels[i]}：${f.desc}`
  }).filter(Boolean)

  return parts_desc.join('，')
}

// ── 计算未来执行时间 ──
function calculateNextRuns(expr, count) {
  const results = []
  const now = new Date()
  // 从当前分钟开始
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes(), 0, 0)

  // 安全限制：最多搜索 5 年
  const maxIter = 365 * 5 * 24 * 60
  let iter = 0

  const parts = expr.trim().split(/\s+/)
  if (parts.length === 5) parts.push('*') // 补年份

  while (results.length < count && iter < maxIter) {
    cursor = new Date(cursor.getTime() + 60000) // +1 分钟
    iter++

    if (matchCron(cursor, parts)) {
      results.push(formatDateTime(cursor))
      // 防止同一分钟重复匹配（skip to next minute is handled above, but for */1 it could match every minute)
      // Already handled by the +60000 increment
    }
  }

  return results
}

function matchCron(date, parts) {
  const minute = date.getMinutes()
  const hour = date.getHours()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const weekday = date.getDay() // 0=Sun
  const year = date.getFullYear()

  return (
    fieldMatches(minute, parts[0]) &&
    fieldMatches(hour, parts[1]) &&
    fieldMatches(day, parts[2]) &&
    fieldMatches(month, parts[3]) &&
    fieldMatches(weekday, parts[4]) &&
    fieldMatches(year, parts[5])
  )
}

function fieldMatches(value, field) {
  if (field === '*') return true

  // 处理 */n 步长
  const stepMatch = field.match(/^\*\/(\d+)$/)
  if (stepMatch) {
    const step = parseInt(stepMatch[1])
    return value % step === 0
  }

  // 处理 a-b/n 范围加步长
  const rangeStepMatch = field.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (rangeStepMatch) {
    const a = parseInt(rangeStepMatch[1])
    const b = parseInt(rangeStepMatch[2])
    const n = parseInt(rangeStepMatch[3])
    return value >= a && value <= b && (value - a) % n === 0
  }

  // 处理 a-b 范围
  const rangeMatch = field.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1])
    const b = parseInt(rangeMatch[2])
    return value >= a && value <= b
  }

  // 处理列表 a,b,c
  if (field.includes(',')) {
    const vals = field.split(',').map(v => parseInt(v))
    return vals.includes(value)
  }

  // 处理单值
  const singleMatch = field.match(/^(\d+)$/)
  if (singleMatch) {
    return value === parseInt(singleMatch[1])
  }

  // 无法解析的字段，宽容匹配
  return false
}

// ── 日期格式化 ──
function formatDateTime(date) {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${y}-${mo}-${d} ${h}:${mi}:${s} ${weekdays[date.getDay()]}`
}

function runRelative(dateStr) {
  const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!parts) return ''
  const target = new Date(
    parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]),
    parseInt(parts[4]), parseInt(parts[5]), parseInt(parts[6])
  )
  const now = new Date()
  const diffMs = target - now
  if (diffMs < 0) return '已过期'

  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '即将'
  if (diffMin < 60) return `${diffMin} 分钟后`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时后`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay} 天后`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth} 个月后`
  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear} 年后`
}

// ── 工具方法 ──
function applyMacro(expr) {
  expression.value = expr
  parseCron()
}

async function copyExpression() {
  if (await copyText(expression.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyDesc() {
  if (await copyText(parsed.description)) {
    success.value = '描述已复制'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

// ── 初始化 ──
parseCron()
</script>

<style scoped>
.template-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.template-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-family: inherit;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
}

.template-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.template-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.desc-text {
  line-height: 1.6;
  padding-right: 30px;
}

.fields-section {
  margin-top: 10px;
}

.field-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  font-size: 13px;
}

.field-label {
  color: var(--green);
  font-family: inherit;
  min-width: 36px;
  font-weight: 600;
}

.field-value {
  color: var(--text);
  font-family: inherit;
  min-width: 60px;
}

.field-desc {
  color: var(--muted);
  font-size: 12px;
}

.runs-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 6px;
}

.run-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  font-size: 12px;
}

.run-number {
  color: var(--green);
  min-width: 18px;
}

.run-time {
  color: var(--text);
  flex: 1;
  font-family: inherit;
}

.run-relative {
  color: var(--muted);
  font-size: 11px;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .field-item {
    flex-wrap: wrap;
  }

  .run-item {
    flex-wrap: wrap;
  }
}
</style>
