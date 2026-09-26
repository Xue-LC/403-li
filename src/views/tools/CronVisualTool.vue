<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🗓️ Cron 可视化解析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ===== 左栏：输入与控制 ===== -->
          <div class="tool-col">
            <label class="tool-label">Cron 表达式：</label>
            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="expression"
                spellcheck="false"
                placeholder="例如：*/5 * * * * 或 0 9 * * 1-5" />
              <button class="copy-btn" @click="copyExpression" title="复制表达式">📋</button>
            </div>

            <label class="tool-label">常用宏：</label>
            <div class="chip-group">
              <button
                v-for="m in MACRO_LIST"
                :key="m"
                class="chip"
                :class="{ active: expression.trim().toLowerCase() === m }"
                @click="setExpression(m)">{{ m }}</button>
            </div>

            <label class="tool-label">快速示例：</label>
            <div class="chip-group">
              <button
                v-for="ex in EXAMPLES"
                :key="ex.expr"
                class="chip"
                :class="{ active: expression.trim() === ex.expr }"
                :title="ex.expr"
                @click="setExpression(ex.expr)">{{ ex.name }}</button>
            </div>

            <label class="tool-label">视图模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="view" value="month" />
                <span>月视图</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="view" value="week" />
                <span>周视图</span>
              </label>
            </div>

            <template v-if="parsed.ok">
              <label class="tool-label">表达式含义：</label>
              <div class="result-display">
                {{ parsed.description }}
                <button class="copy-btn" @click="copyDescription" title="复制描述">📋</button>
              </div>

              <label class="tool-label">字段分解：</label>
              <div class="field-list">
                <div v-for="f in parsed.fields" :key="f.label" class="field-item">
                  <span class="field-label">{{ f.label }}</span>
                  <span class="field-value">{{ f.raw }}</span>
                  <span class="field-desc">{{ f.desc }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- ===== 右栏：可视化日历 ===== -->
          <div class="tool-col">
            <div class="cal-head">
              <span class="cal-title">{{ calTitle }}</span>
              <span class="cal-sub">{{ calSubtitle }}</span>
            </div>

            <!-- 月视图 -->
            <div v-if="view === 'month'" class="cal-wrap">
              <div class="cal-grid">
                <span v-for="w in WEEK_HEAD" :key="'w' + w" class="cal-weekday">{{ w }}</span>
              </div>
              <div class="cal-grid">
                <span
                  v-for="c in monthCells"
                  :key="c.key"
                  class="cal-cell"
                  :class="{ blank: c.blank, hit: c.count > 0, today: c.isToday, selected: c.selected, past: c.past }"
                  :style="c.count > 0 ? { '--fill': c.fill } : null"
                  @click="!c.blank && selectDay(c)">
                  <template v-if="!c.blank">
                    <span class="fill-layer"></span>
                    <span class="cell-day">{{ c.day }}</span>
                    <span v-if="c.count > 1" class="cell-count">×{{ c.count }}</span>
                  </template>
                </span>
              </div>
            </div>

            <!-- 周视图 -->
            <div v-else class="cal-wrap">
              <div class="week-scroll">
                <div class="week-grid">
                  <span class="week-corner">时</span>
                  <span v-for="h in 24" :key="'hh' + h" class="hour-head">{{ pad2(h - 1) }}</span>
                  <template v-for="d in weekDays" :key="d.key">
                    <span class="week-day" :class="{ today: d.isToday }">{{ d.label }}</span>
                    <span
                      v-for="(n, h) in d.hours"
                      :key="d.key + '-' + h"
                      class="week-cell"
                      :class="{ hit: n > 0, today: d.isToday, selected: isSelectedSlot(d, h) }"
                      :style="n > 0 ? { '--fill': fillOf(n, 60) } : null"
                      :title="`${d.dateStr} ${pad2(h)}:00 · ${n} 次`"
                      @click="selectSlot(d, h)">
                      <span class="fill-layer"></span>
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <div class="legend">
              <span class="legend-item">
                <span class="legend-swatch"><span class="legend-fill lv1"></span></span>次数少
              </span>
              <span class="legend-item">
                <span class="legend-swatch"><span class="legend-fill lv4"></span></span>次数多
              </span>
              <span class="legend-item">
                <span class="legend-swatch today-swatch"></span>今天
              </span>
              <span class="legend-item">
                <span class="legend-swatch sel-swatch"></span>已选中
              </span>
            </div>

            <!-- 选中时间段明细 -->
            <div v-if="detail" class="detail">
              <div class="section-header">
                <span class="section-title">▼ {{ detail.title }}</span>
                <button class="copy-btn-inline" @click="copyDetail" title="复制执行时刻">📋</button>
              </div>
              <div v-if="detail.total > 0" class="time-chips">
                <span v-for="(t, i) in detail.shown" :key="i" class="time-chip">{{ t }}</span>
              </div>
              <div v-if="detail.total > detail.shown.length" class="detail-more">
                仅显示前 {{ detail.shown.length }} 个时刻，共 {{ detail.total }} 个（复制可得完整列表）
              </div>
              <div v-if="detail.total === 0" class="empty-hint">
                该时间段没有执行计划 —— 换一个日期，或修改 Cron 表达式
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 全宽：导航与操作 ===== -->
        <div class="button-group button-group-3">
          <button class="tool-button" @click="shift(-1)">◀ {{ view === 'month' ? '上一月' : '上一周' }}</button>
          <button class="tool-button" @click="goToday">{{ view === 'month' ? '回到本月' : '回到本周' }}</button>
          <button class="tool-button" @click="shift(1)">{{ view === 'month' ? '下一月' : '下一周' }} ▶</button>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button" @click="copyNextRuns">📋 复制未来执行时间</button>
          <button class="tool-button" @click="copyDetail">📋 复制当前时段明细</button>
        </div>

        <!-- ===== 全宽：统计 ===== -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">下次执行</span>
            <span class="stat-value">{{ nextRunShort }}</span>
            <span class="stat-sub">{{ nextRunRelative }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未来 24 小时</span>
            <span class="stat-value">{{ next24 }} 次</span>
            <span class="stat-sub">从当前时刻起算</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">命中时段执行次数</span>
            <span class="stat-value">{{ parsed.ok ? parsed.perDay : 0 }} 次</span>
            <span class="stat-sub">每个命中日期</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ view === 'month' ? '本月执行次数' : '本周执行次数' }}</span>
            <span class="stat-value">{{ rangeTotal }} 次</span>
            <span class="stat-sub">{{ rangeDays }} 天有任务</span>
          </div>
        </div>

        <!-- ===== 全宽：未来执行时间 ===== -->
        <div class="runs-section">
          <div class="section-header">
            <span class="section-title">▼ 未来执行时间（前 20 次）</span>
            <button class="copy-btn-inline" @click="copyNextRuns" title="复制列表">📋</button>
          </div>
          <div v-if="nextRuns.length" class="runs-list">
            <div v-for="(r, i) in nextRuns" :key="i" class="run-item">
              <span class="run-index">{{ pad2(i + 1) }}</span>
              <span class="run-time">{{ formatDateTime(r) }}</span>
              <span class="run-relative">{{ relativeLabel(r) }}</span>
            </div>
          </div>
          <div v-else class="empty-hint">
            {{ parsed.ok ? '未来 5 年内没有匹配的执行时间' : '表达式有误，修正后即可查看执行计划' }}
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

/* =========================================================
   常量
   ========================================================= */

const WEEK_HEAD = ['一', '二', '三', '四', '五', '六', '日']
const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_ALIAS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 }
const DOW_ALIAS = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }

const MACRO_MAP = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *'
}
const MACRO_LIST = Object.keys(MACRO_MAP)

const EXAMPLES = [
  { name: '每分钟', expr: '* * * * *' },
  { name: '每 5 分钟', expr: '*/5 * * * *' },
  { name: '每 30 分钟', expr: '*/30 * * * *' },
  { name: '每小时整点', expr: '0 * * * *' },
  { name: '每 2 小时', expr: '0 */2 * * *' },
  { name: '每天零点', expr: '0 0 * * *' },
  { name: '每天 9:30', expr: '30 9 * * *' },
  { name: '工作日 9 点', expr: '0 9 * * 1-5' },
  { name: '朝九晚六', expr: '0 9,18 * * *' },
  { name: '每周一零点', expr: '0 0 * * 1' },
  { name: '每月 1 号', expr: '0 0 1 * *' },
  { name: '每月最后一天', expr: '0 0 L * *' },
  { name: '每季度首日', expr: '0 0 1 1,4,7,10 *' },
  { name: '第二个周五', expr: '0 12 * * 5#2' },
  { name: '每年元旦', expr: '0 0 1 1 *' }
]

const DETAIL_LIMIT = 240

/* =========================================================
   表达式解析
   ========================================================= */

const pad2 = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const lastDayOfMonth = (y, m) => new Date(y, m, 0).getDate()
const isAnyField = (f) => f === '*' || f === '?'

function applyAlias(field, alias) {
  let out = field
  for (const key of Object.keys(alias)) {
    out = out.replace(new RegExp(key, 'gi'), String(alias[key]))
  }
  return out
}

function toNum(token, label) {
  if (!/^\d+$/.test(String(token).trim())) {
    throw new Error(`${label}字段无法识别 "${String(token).trim()}"，仅支持数字、*、范围(-)、步长(/)和列表(,)`)
  }
  return parseInt(String(token).trim(), 10)
}

/** 把一个字段展开成可选值集合（支持 * ? 列表 范围 步长 范围/步长 别名） */
function expandField(field, min, max, aliases, label) {
  const set = new Set()
  let f = String(field).trim()
  if (aliases) f = applyAlias(f, aliases)

  if (isAnyField(f)) {
    for (let i = min; i <= max; i++) set.add(i)
    return set
  }

  for (const raw of f.split(',')) {
    const token = raw.trim()
    if (!token) throw new Error(`${label}字段存在空值，请检查逗号分隔`)

    if (isAnyField(token)) {
      for (let i = min; i <= max; i++) set.add(i)
      continue
    }

    const slash = token.indexOf('/')
    let rangePart = token
    let step = 1
    if (slash >= 0) {
      rangePart = token.slice(0, slash)
      const stepStr = token.slice(slash + 1)
      if (!/^\d+$/.test(stepStr) || parseInt(stepStr, 10) <= 0) {
        throw new Error(`${label}字段的步长 "${stepStr}" 无效，应为大于 0 的整数`)
      }
      step = parseInt(stepStr, 10)
    }

    let start
    let end
    if (isAnyField(rangePart)) {
      start = min
      end = max
    } else if (rangePart.includes('-')) {
      const bits = rangePart.split('-')
      if (bits.length !== 2) throw new Error(`${label}字段的范围 "${rangePart}" 无效`)
      start = toNum(bits[0], label)
      end = toNum(bits[1], label)
    } else {
      start = toNum(rangePart, label)
      end = slash >= 0 ? max : start
    }

    if (start < min || start > max || end < min || end > max) {
      throw new Error(`${label}字段 "${token}" 超出取值范围 ${min}-${max}`)
    }
    if (start > end) throw new Error(`${label}字段的范围 "${rangePart}" 起始值大于结束值`)

    for (let v = start; v <= end; v += step) set.add(v)
  }

  if (!set.size) throw new Error(`${label}字段没有解析出任何有效值`)
  return set
}

function dowNum(token, label = '星期') {
  const t = String(token).trim()
  if (/^\d+$/.test(t)) return parseInt(t, 10) % 7
  const key = t.toUpperCase()
  if (DOW_ALIAS[key] === undefined) throw new Error(`${label}字段无法识别 "${t}"`)
  return DOW_ALIAS[key]
}

/** 日期字段：额外支持 L（当月最后一天）与 L-n（倒数第 n 天） */
function parseDomField(field) {
  const res = { set: new Set(), any: false, restricted: false, last: false, lastOffset: 0 }
  const f = String(field).trim()
  if (isAnyField(f)) {
    res.any = true
    return res
  }
  res.restricted = true
  const normal = []
  for (const raw of f.split(',')) {
    const token = raw.trim()
    if (/^L$/i.test(token)) {
      res.last = true
      continue
    }
    const m = token.match(/^L-(\d+)$/i)
    if (m) {
      res.last = true
      res.lastOffset = parseInt(m[1], 10)
      continue
    }
    if (/[A-Za-z]/.test(token)) {
      throw new Error(`日期字段暂不支持 "${token}"（可用 L 表示当月最后一天、L-1 表示倒数第二天）`)
    }
    normal.push(token)
  }
  if (normal.length) res.set = expandField(normal.join(','), 1, 31, null, '日期')
  return res
}

/** 星期字段：额外支持 n#k（第 k 个星期 n）与 nL（最后一个星期 n） */
function parseDowField(field) {
  const res = { set: new Set(), any: false, restricted: false, nth: [], last: [] }
  const f = String(field).trim()
  if (isAnyField(f)) {
    res.any = true
    return res
  }
  res.restricted = true
  const normal = []
  for (const raw of f.split(',')) {
    const token = raw.trim()

    let m = token.match(/^([0-9A-Za-z]{1,3})#(\d+)$/)
    if (m) {
      const k = parseInt(m[2], 10)
      if (k < 1 || k > 5) throw new Error(`星期字段 "${token}" 的第几个星期无效（应为 1-5）`)
      res.nth.push({ dow: dowNum(m[1]), k })
      continue
    }

    m = token.match(/^([0-9A-Za-z]{1,3})L$/i)
    if (m) {
      res.last.push(dowNum(m[1]))
      continue
    }

    if (/(#|L)/i.test(token)) throw new Error(`星期字段 "${token}" 格式无效（可用 5#2 表示第二个周五、5L 表示最后一个周五）`)
    normal.push(token)
  }
  if (normal.length) {
    res.set = expandField(normal.join(','), 0, 7, DOW_ALIAS, '星期')
    if (res.set.has(7)) {
      res.set.delete(7)
      res.set.add(0)
    }
  }
  return res
}

function parseCron(expr) {
  const out = {
    ok: false,
    error: '',
    description: '',
    fields: [],
    minuteSet: new Set(),
    hourSet: new Set(),
    monthSet: new Set(),
    dom: parseDomField('*'),
    dow: parseDowField('*'),
    yearSet: null,
    sortedMinutes: [],
    sortedHours: [],
    perDay: 0
  }

  const raw = String(expr || '').trim()
  if (!raw) {
    out.error = '请输入 Cron 表达式（5 个字段：分 时 日 月 周）'
    return out
  }

  let body = raw
  if (raw.startsWith('@')) {
    const macro = MACRO_MAP[raw.toLowerCase()]
    if (!macro) {
      out.error = `未知宏指令 "${raw}"，仅支持 ${MACRO_LIST.join(' ')}`
      return out
    }
    body = macro
  }

  const parts = body.split(/\s+/)
  if (parts.length !== 5 && parts.length !== 6) {
    out.error = `Cron 表达式应为 5 个字段（分 时 日 月 周），可选第 6 个年份字段，当前为 ${parts.length} 个字段`
    return out
  }

  try {
    out.minuteSet = expandField(parts[0], 0, 59, null, '分钟')
    out.hourSet = expandField(parts[1], 0, 23, null, '小时')
    out.dom = parseDomField(parts[2])
    out.monthSet = expandField(parts[3], 1, 12, MONTH_ALIAS, '月份')
    out.dow = parseDowField(parts[4])
    out.yearSet = parts[5] ? expandField(parts[5], 1970, 2099, null, '年份') : null
  } catch (e) {
    out.error = e.message || '表达式解析失败'
    return out
  }

  out.ok = true
  out.sortedMinutes = [...out.minuteSet].sort((a, b) => a - b)
  out.sortedHours = [...out.hourSet].sort((a, b) => a - b)
  out.perDay = out.sortedMinutes.length * out.sortedHours.length
  out.fields = buildFieldList(parts, out)
  out.description = buildDescription(parts, out)
  return out
}

/* ---------- 字段说明 ---------- */

function listSet(set, limit = 14) {
  const arr = [...set].sort((a, b) => a - b)
  if (arr.length <= limit) return arr.join(',')
  return arr.slice(0, limit).join(',') + ` …（共 ${arr.length} 个）`
}

function buildFieldList(parts, p) {
  const [mF, hF, domF, monF, dowF] = parts
  const fields = [
    { label: '分钟', raw: mF, desc: isAnyField(mF) ? '每分钟' : listSet(p.minuteSet) },
    { label: '小时', raw: hF, desc: isAnyField(hF) ? '每小时' : listSet(p.hourSet) },
    {
      label: '日期',
      raw: domF,
      desc: p.dom.any
        ? '每天'
        : [p.dom.set.size ? listSet(p.dom.set) : '', p.dom.last ? (p.dom.lastOffset ? `倒数第 ${p.dom.lastOffset + 1} 天` : '当月最后一天') : '']
            .filter(Boolean)
            .join(' / ')
    },
    {
      label: '月份',
      raw: monF,
      desc: isAnyField(monF) ? '每月' : [...p.monthSet].sort((a, b) => a - b).map((m) => `${m} 月`).join(',')
    },
    {
      label: '星期',
      raw: dowF,
      desc: p.dow.any
        ? '每天'
        : [
            p.dow.set.size ? [...p.dow.set].sort((a, b) => a - b).map((d) => `周${WEEKDAY_CN[d]}`).join(',') : '',
            ...p.dow.nth.map((n) => `第 ${n.k} 个周${WEEKDAY_CN[n.dow]}`),
            ...p.dow.last.map((d) => `最后一个周${WEEKDAY_CN[d]}`)
          ]
            .filter(Boolean)
            .join(' / ')
    }
  ]
  if (parts[5]) fields.push({ label: '年份', raw: parts[5], desc: `${p.yearSet.size} 个值：${listSet(p.yearSet)}` })
  return fields
}

/* ---------- 人类可读描述 ---------- */

function describeDate(p, parts) {
  const [domF, monF, dowF] = [parts[2], parts[3], parts[4]]
  const monAny = isAnyField(monF)
  const domAny = p.dom.any
  const dowAny = p.dow.any

  if (domAny && monAny && dowAny) return '每天'

  // 单纯按星期
  if (domAny && monAny && !dowAny) {
    const simple = [...p.dow.set].sort((a, b) => a - b)
    if (!p.dow.nth.length && !p.dow.last.length) {
      if (simple.join(',') === '1,2,3,4,5') return '每个工作日'
      if (simple.join(',') === '0,6') return '每周末'
      if (simple.length === 7) return '每天'
      return `每周${simple.map((d) => WEEKDAY_CN[d]).join('、')}`
    }
    const items = [
      simple.map((d) => `周${WEEKDAY_CN[d]}`),
      p.dow.nth.map((n) => `第 ${n.k} 个周${WEEKDAY_CN[n.dow]}`),
      p.dow.last.map((d) => `最后一个周${WEEKDAY_CN[d]}`)
    ]
      .flat()
      .join('、')
    return `每月${items}`
  }

  // 单纯按日期
  if (!domAny && monAny && dowAny) {
    if (p.dom.last && !p.dom.set.size) return p.dom.lastOffset ? `每月倒数第 ${p.dom.lastOffset + 1} 天` : '每月最后一天'
    const set = [...p.dom.set].sort((a, b) => a - b)
    if (set.join(',') === '1') return p.dom.last ? '每月 1 号和最后一天' : '每月 1 号'
    return `每月 ${set.join('、')} 号${p.dom.last ? ' 及最后一天' : ''}`
  }

  // 指定月份
  if (monAny === false) {
    const months = [...p.monthSet].sort((a, b) => a - b)
    const monthStr = months.join('、')
    if (!domAny && dowAny) {
      const set = [...p.dom.set].sort((a, b) => a - b)
      return `${monthStr} 月的 ${set.join('、')} 号${p.dom.last ? ' 及最后一天' : ''}`
    }
    if (domAny && !dowAny) {
      return `${monthStr} 月的每周${[...p.dow.set].sort((a, b) => a - b).map((d) => WEEKDAY_CN[d]).join('、')}`
    }
    return `${monthStr} 月`
  }

  // 日期 + 星期组合（cron 语义为「或」）
  const domStr = p.dom.last
    ? `最后一天${p.dom.set.size ? '、' + [...p.dom.set].sort((a, b) => a - b).join('、') + ' 号' : ''}`
    : `${[...p.dom.set].sort((a, b) => a - b).join('、')} 号`
  const dowStr = [...p.dow.set].sort((a, b) => a - b).map((d) => `周${WEEKDAY_CN[d]}`).join('、')
  return `每月「${domStr}」或「${dowStr}」（cron 为「或」语义）`
}

function describeTime(p, parts) {
  const [mF, hF] = [parts[0], parts[1]]
  const mAny = isAnyField(mF)
  const hAny = isAnyField(hF)

  if (mAny && hAny) return '每分钟执行一次'

  if (hAny) {
    if (parseStep(mF)) return `每 ${parseStep(mF)} 分钟执行一次`
    const mins = [...p.minuteSet].sort((a, b) => a - b)
    if (mins.length === 1 && mins[0] === 0) return '每小时整点执行'
    if (mins.length === 1) return `每小时的第 ${mins[0]} 分执行`
    return `每小时执行（第 ${mins.join('、')} 分）`
  }

  const hours = [...p.hourSet].sort((a, b) => a - b)
  const mins = [...p.minuteSet].sort((a, b) => a - b)
  const mm = mins.map((m) => pad2(m))
  const hStep = parseStep(hF)

  if (hStep) {
    if (mAny) return `每 ${hStep} 小时每分钟执行一次`
    if (mins.length === 1 && mins[0] === 0) return `每 ${hStep} 小时整点执行`
    return `每 ${hStep} 小时执行一次（第 ${mm.join('、')} 分）`
  }

  if (mAny || mins.length > 6) {
    return `${hours.map((h) => pad2(h)).join('、')} 点的每分钟执行`
  }

  const times = []
  for (const h of hours) for (const m of mm) times.push(`${pad2(h)}:${m}`)

  if (hours.length === 1) return `${times[0]} 执行`
  if (times.length <= 12) return `${times.join('、')} 执行`
  return `${hours.map((h) => pad2(h)).join('、')} 点执行（${mm.join('、')} 分）`
}

function parseStep(field) {
  const m = String(field).match(/^\*\/(\d+)$/)
  return m ? m[1] : null
}

function buildDescription(parts, p) {
  const dateDesc = describeDate(p, parts)
  const timeDesc = describeTime(p, parts)
  // 小时字段为 * 或步长时属于高频循环，日期部分用括号补充更易读
  const highFrequency = isAnyField(parts[1]) || !!parseStep(parts[1])
  let base
  if (highFrequency) base = `${timeDesc}（${dateDesc}）`
  else base = dateDesc === '每天' ? `每天 ${timeDesc}` : `${dateDesc} ${timeDesc}`
  return parts[5] ? `${base}（限定年份：${listSet(p.yearSet)}）` : base
}

/* ---------- 日期匹配（含 cron「或」语义） ---------- */

function dayMatches(date, p) {
  if (!p.ok) return false
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const w = date.getDay()

  if (p.yearSet && !p.yearSet.has(y)) return false
  if (!p.monthSet.has(m)) return false

  let domOk = p.dom.any || p.dom.set.has(d)
  if (!domOk && p.dom.last && d === lastDayOfMonth(y, m) - p.dom.lastOffset) domOk = true

  let dowOk = p.dow.any || p.dow.set.has(w)
  if (!dowOk) {
    for (const n of p.dow.nth) {
      if (n.dow === w && Math.ceil(d / 7) === n.k) {
        dowOk = true
        break
      }
    }
  }
  if (!dowOk) {
    for (const n of p.dow.last) {
      if (n === w && d + 7 > lastDayOfMonth(y, m)) {
        dowOk = true
        break
      }
    }
  }

  if (p.dom.restricted && p.dow.restricted) return domOk || dowOk
  return domOk && dowOk
}

/* ---------- 未来执行时间 ---------- */

function computeNextRuns(p, fromMs, count) {
  const out = []
  if (!p.ok || !p.perDay) return out
  const from = new Date(fromMs)
  const startDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())

  for (let i = 0; i <= 1830 && out.length < count; i++) {
    const day = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i)
    if (!dayMatches(day, p)) continue
    for (const h of p.sortedHours) {
      for (const m of p.sortedMinutes) {
        const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0)
        if (t.getTime() > fromMs) {
          out.push(t.getTime())
          if (out.length >= count) break
        }
      }
      if (out.length >= count) break
    }
  }
  return out
}

function countRunsBetween(p, startMs, endMs) {
  if (!p.ok || !p.perDay) return 0
  let n = 0
  const s = new Date(startMs)
  const e = new Date(endMs)
  const day = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const last = new Date(e.getFullYear(), e.getMonth(), e.getDate())
  while (day.getTime() <= last.getTime()) {
    if (dayMatches(day, p)) {
      for (const h of p.sortedHours) {
        for (const m of p.sortedMinutes) {
          const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0).getTime()
          if (t >= startMs && t <= endMs) n++
        }
      }
    }
    day.setDate(day.getDate() + 1)
  }
  return n
}

function formatDateTime(ms) {
  const d = new Date(ms)
  return `${ymd(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())} 周${WEEKDAY_CN[d.getDay()]}`
}

function relativeLabel(ms) {
  const diff = ms - nowTs.value
  if (diff < 0) return '已过期'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '即将执行'
  if (min < 60) return `${min} 分钟后`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时后`
  const day = Math.floor(hour / 24)
  if (day < 31) return `${day} 天后`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} 个月后`
  return `${Math.floor(day / 365)} 年后`
}

/* =========================================================
   状态
   ========================================================= */

const expression = ref('*/5 * * * *')
const view = ref('month')
const anchor = ref(startOfToday())
const selectedDate = ref(startOfToday())
const selectedSlot = ref({ ts: startOfToday().getTime(), hour: new Date().getHours() })
const nowTs = ref(Date.now())
const error = ref('')
const success = ref('')

let flashTimer = null
let clockTimer = null

function startOfToday() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/* =========================================================
   派生数据
   ========================================================= */

const parsed = computed(() => parseCron(expression.value))

const nextRuns = computed(() => computeNextRuns(parsed.value, nowTs.value, 20))

const next24 = computed(() => countRunsBetween(parsed.value, nowTs.value, nowTs.value + 86400000))

const nextRunShort = computed(() => {
  const t = nextRuns.value[0]
  if (!t) return '—'
  const d = new Date(t)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
})

const nextRunRelative = computed(() => (nextRuns.value[0] ? relativeLabel(nextRuns.value[0]) : '无执行计划'))

const monthCells = computed(() => {
  const p = parsed.value
  const y = anchor.value.getFullYear()
  const m = anchor.value.getMonth() + 1
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const todayStr = ymd(new Date())
  const selStr = selectedDate.value ? ymd(selectedDate.value) : ''
  const cells = []
  for (let i = 0; i < lead; i++) cells.push({ key: `b${i}`, blank: true })
  const days = lastDayOfMonth(y, m)
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m - 1, d)
    const dateStr = ymd(date)
    const count = p.ok && dayMatches(date, p) ? p.perDay : 0
    cells.push({
      key: d,
      day: d,
      date,
      count,
      fill: fillOf(count, p.perDay || 1),
      isToday: dateStr === todayStr,
      past: dateStr < todayStr,
      selected: dateStr === selStr
    })
  }
  return cells
})

const weekDays = computed(() => {
  const p = parsed.value
  const a = anchor.value
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate() - ((a.getDay() + 6) % 7))
  const todayStr = ymd(new Date())
  const out = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const dateStr = ymd(date)
    const match = p.ok && dayMatches(date, p)
    const hours = new Array(24).fill(0)
    if (match) for (const h of p.sortedHours) hours[h] = p.minuteSet.size
    out.push({
      key: dateStr,
      ts: date.getTime(),
      date,
      dateStr,
      label: `周${WEEKDAY_CN[date.getDay()]} ${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
      hours,
      isToday: dateStr === todayStr
    })
  }
  return out
})

const calTitle = computed(() => {
  if (view.value === 'month') {
    const d = anchor.value
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
  }
  const days = weekDays.value
  if (!days.length) return ''
  return `${days[0].dateStr} ~ ${days[6].dateStr}`
})

const rangeStats = computed(() => {
  if (view.value === 'month') {
    let total = 0
    let hitDays = 0
    for (const c of monthCells.value) {
      if (c.blank) continue
      if (c.count > 0) {
        total += c.count
        hitDays++
      }
    }
    return { total, days: hitDays }
  }
  let total = 0
  let hitDays = 0
  for (const d of weekDays.value) {
    const sum = d.hours.reduce((a, b) => a + b, 0)
    if (sum > 0) {
      total += sum
      hitDays++
    }
  }
  return { total, days: hitDays }
})

const rangeTotal = computed(() => rangeStats.value.total)
const rangeDays = computed(() => rangeStats.value.days)

const calSubtitle = computed(() => {
  const s = rangeStats.value
  return `${view.value === 'month' ? '本月' : '本周'}共 ${s.total} 次执行 · ${s.days} 天有任务`
})

const detail = computed(() => {
  const p = parsed.value
  if (!p.ok) return null

  if (view.value === 'month') {
    const d = selectedDate.value
    if (!d) return null
    const hit = dayMatches(d, p)
    return {
      title: `${ymd(d)} 周${WEEKDAY_CN[d.getDay()]} · 共 ${hit ? p.perDay : 0} 次执行`,
      total: hit ? p.perDay : 0,
      shown: hit ? buildTimes(p.sortedHours, p.sortedMinutes) : []
    }
  }

  const slot = selectedSlot.value
  if (!slot) return null
  const d = new Date(slot.ts)
  const hit = dayMatches(d, p) && p.hourSet.has(slot.hour)
  return {
    title: `${ymd(d)} 周${WEEKDAY_CN[d.getDay()]} ${pad2(slot.hour)}:00 — ${pad2(slot.hour)}:59 · 共 ${hit ? p.minuteSet.size : 0} 次执行`,
    total: hit ? p.minuteSet.size : 0,
    shown: hit ? buildTimes([slot.hour], p.sortedMinutes) : []
  }
})

function buildTimes(hours, minutes) {
  const out = []
  for (const h of hours) {
    for (const m of minutes) {
      if (out.length >= DETAIL_LIMIT) return out
      out.push(`${pad2(h)}:${pad2(m)}`)
    }
  }
  return out
}

function fillOf(count, max) {
  if (!count || !max) return 0
  return (0.12 + 0.5 * Math.min(1, count / max)).toFixed(3)
}

function isSelectedSlot(d, h) {
  return selectedSlot.value && selectedSlot.value.ts === d.ts && selectedSlot.value.hour === h
}

/* =========================================================
   交互
   ========================================================= */

function setExpression(v) {
  expression.value = v
  clearFlash()
}

function clearFlash() {
  error.value = ''
  success.value = ''
  clearTimeout(flashTimer)
}

function flashSuccess(msg) {
  success.value = msg
  error.value = ''
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (success.value = ''), 2400)
}

function flashError(msg) {
  error.value = msg
  success.value = ''
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (error.value = ''), 3000)
}

function selectDay(cell) {
  if (!cell || cell.blank) return
  selectedDate.value = cell.date
}

function selectSlot(d, h) {
  selectedSlot.value = { ts: d.ts, hour: h }
}

/** 周视图默认选中第一个「有任务」的小时格 */
function pickDefaultSlot() {
  const days = weekDays.value
  if (!days.length) return
  const today = days.find((d) => d.isToday) || days[0]
  for (const d of [today, ...days.filter((x) => x !== today)]) {
    for (let h = 0; h < 24; h++) {
      if (d.hours[h] > 0) {
        selectedSlot.value = { ts: d.ts, hour: h }
        return
      }
    }
  }
  selectedSlot.value = { ts: today.ts, hour: new Date().getHours() }
}

/** 月视图默认选中今天，若今天没有任务则选中当月第一个有任务的日期 */
function pickDefaultDate() {
  const target = selectedDate.value
  if (target && monthCells.value.some((c) => !c.blank && c.selected && c.count > 0)) return
  const first = monthCells.value.find((c) => !c.blank && c.count > 0)
  if (first) selectedDate.value = first.date
}

function shift(n) {
  const a = anchor.value
  if (view.value === 'month') {
    anchor.value = new Date(a.getFullYear(), a.getMonth() + n, 1)
    syncSelectedDate()
    pickDefaultDate()
  } else {
    anchor.value = new Date(a.getFullYear(), a.getMonth(), a.getDate() + n * 7)
    pickDefaultSlot()
  }
  clearFlash()
}

function goToday() {
  const today = startOfToday()
  anchor.value = today
  if (view.value === 'month') {
    selectedDate.value = today
    pickDefaultDate()
  } else {
    pickDefaultSlot()
  }
  clearFlash()
}

function syncSelectedDate() {
  const a = anchor.value
  const sel = selectedDate.value
  const sameMonth = sel && sel.getFullYear() === a.getFullYear() && sel.getMonth() === a.getMonth()
  if (sameMonth) return
  const today = startOfToday()
  if (today.getFullYear() === a.getFullYear() && today.getMonth() === a.getMonth()) {
    selectedDate.value = today
  } else {
    selectedDate.value = new Date(a.getFullYear(), a.getMonth(), 1)
  }
}

/* =========================================================
   复制
   ========================================================= */

async function copyExpression() {
  if (!expression.value.trim()) {
    flashError('表达式为空，没有可复制的内容')
    return
  }
  const ok = await copyText(expression.value.trim())
  ok ? flashSuccess('Cron 表达式已复制') : flashError('复制失败，请手动选择复制')
}

async function copyDescription() {
  if (!parsed.value.ok) {
    flashError('表达式有误，暂时无法复制含义说明')
    return
  }
  const ok = await copyText(parsed.value.description)
  ok ? flashSuccess('表达式含义已复制') : flashError('复制失败，请手动选择复制')
}

async function copyDetail() {
  const d = detail.value
  if (!d) {
    flashError('表达式有误，暂时没有可复制的执行明细')
    return
  }
  if (!d.total) {
    flashError(`${d.title}：该时段没有执行计划`)
    return
  }
  const p = parsed.value
  const all = []
  if (view.value === 'month') {
    for (const h of p.sortedHours) for (const m of p.sortedMinutes) all.push(`${pad2(h)}:${pad2(m)}`)
  } else {
    const slot = selectedSlot.value
    for (const m of p.sortedMinutes) all.push(`${pad2(slot.hour)}:${pad2(m)}`)
  }
  const ok = await copyText(`${d.title}\n${all.join(' ')}`)
  ok ? flashSuccess(`已复制 ${d.total} 个执行时刻`) : flashError('复制失败，请手动选择复制')
}

async function copyNextRuns() {
  if (!parsed.value.ok) {
    flashError('表达式有误，暂时没有可复制的执行时间')
    return
  }
  if (!nextRuns.value.length) {
    flashError('未来 5 年内没有匹配的执行时间')
    return
  }
  const text = nextRuns.value.map((t, i) => `${pad2(i + 1)}. ${formatDateTime(t)}  ${relativeLabel(t)}`).join('\n')
  const ok = await copyText(text)
  ok ? flashSuccess('未来执行时间已复制') : flashError('复制失败，请手动选择复制')
}

/* =========================================================
   监听与生命周期
   ========================================================= */

watch(
  () => parsed.value,
  (p) => {
    if (p.ok) {
      error.value = ''
    } else if (expression.value.trim()) {
      error.value = p.error
      success.value = ''
    } else {
      error.value = ''
    }
  },
  { immediate: true }
)

watch(view, () => {
  anchor.value = startOfToday()
  if (view.value === 'week') pickDefaultSlot()
  else pickDefaultDate()
  clearFlash()
})

onMounted(() => {
  clockTimer = setInterval(() => {
    nowTs.value = Date.now()
  }, 30000)
})

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
/* ---------- 左侧：快捷选项 ---------- */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: all 0.18s;
}

.chip:hover {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.chip.active {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
}

/* ---------- 左侧：字段分解 ---------- */
.field-list {
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.field-item {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 4px 10px;
  padding: 8px 10px;
  font-family: var(--mono);
  font-size: 12px;
  border-bottom: 1px dashed var(--line);
}

.field-item:last-child {
  border-bottom: none;
}

.field-label {
  color: var(--muted);
  flex-shrink: 0;
}

.field-value {
  color: var(--green);
  word-break: break-all;
}

.field-desc {
  grid-column: 2;
  color: var(--text-dim);
  word-break: break-all;
}

/* ---------- 右栏：日历头 ---------- */
.cal-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.cal-title {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--green);
  font-weight: 700;
}

.cal-sub {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

/* ---------- 月视图 ---------- */
.cal-wrap {
  margin-top: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.cal-weekday {
  text-align: center;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  padding: 4px 0;
}

.cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 4px 2px;
  border: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.cal-cell.blank {
  border-color: transparent;
  background: transparent;
  cursor: default;
  min-height: 46px;
}

.cal-cell:not(.blank):hover {
  border-color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.fill-layer {
  position: absolute;
  inset: 0;
  background: var(--green);
  opacity: var(--fill, 0);
  pointer-events: none;
}

.cell-day,
.cell-count {
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

.cal-cell.hit {
  color: var(--green);
  border-color: var(--green);
}

.cal-cell.hit .cell-day {
  font-weight: 700;
}

.cell-count {
  font-size: 10px;
  color: var(--text-dim);
}

.cal-cell.past {
  opacity: 0.55;
}

.cal-cell.today {
  outline: 1px dashed var(--green);
  outline-offset: -3px;
}

.cal-cell.selected {
  border-color: var(--text);
  box-shadow: 0 0 0 1px var(--text) inset;
}

/* ---------- 周视图 ---------- */
.week-scroll {
  overflow-x: auto;
}

.week-grid {
  display: grid;
  grid-template-columns: 74px repeat(24, minmax(16px, 1fr));
  gap: 2px;
  min-width: 640px;
}

.week-corner {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hour-head {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  text-align: center;
  padding-bottom: 2px;
}

.week-day {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  padding-left: 2px;
  white-space: nowrap;
}

.week-day.today {
  color: var(--green);
}

.week-cell {
  position: relative;
  height: 22px;
  border: 1px solid var(--line);
  background: var(--panel);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s;
}

.week-cell:hover {
  border-color: var(--green);
}

.week-cell.hit {
  border-color: var(--line-strong);
}

.week-cell.selected {
  box-shadow: 0 0 0 1px var(--text) inset;
}

.week-cell.today {
  border-color: var(--text-dim);
}

/* ---------- 图例 ---------- */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 14px;
  border: 1px solid var(--line);
  background: var(--panel);
  overflow: hidden;
}

.legend-fill {
  position: absolute;
  inset: 0;
  background: var(--green);
}

.legend-fill.lv1 {
  opacity: 0.18;
}

.legend-fill.lv4 {
  opacity: 0.6;
}

.today-swatch {
  outline: 1px dashed var(--green);
  outline-offset: -3px;
}

.sel-swatch {
  box-shadow: 0 0 0 1px var(--text) inset;
}

/* ---------- 明细 ---------- */
.detail {
  margin-top: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.section-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  word-break: break-all;
}

.copy-btn-inline {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--green);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: all 0.18s;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.time-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  max-height: 168px;
  overflow-y: auto;
}

.time-chip {
  padding: 2px 7px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--green);
  background: var(--green-soft);
  border: 1px solid var(--line);
  border-radius: 0;
}

.detail-more,
.empty-hint {
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.empty-hint {
  padding: 10px;
  border: 1px dashed var(--line);
  background: var(--panel);
}

/* ---------- 统计 ---------- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.stat-value {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--green);
}

.stat-sub {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
}

/* ---------- 未来执行时间 ---------- */
.runs-section {
  margin-top: 12px;
}

.runs-list {
  border: 1px solid var(--line);
  border-top: none;
  background: var(--panel-2);
  max-height: 260px;
  overflow-y: auto;
}

.run-item {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 12px;
  border-bottom: 1px dashed var(--line);
}

.run-item:last-child {
  border-bottom: none;
}

.run-index {
  color: var(--text-dim);
}

.run-time {
  color: var(--text);
  word-break: break-all;
}

.run-relative {
  color: var(--muted);
  white-space: nowrap;
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .cal-cell {
    min-height: 40px;
    font-size: 11px;
  }
  .cell-count {
    font-size: 9px;
  }
  .field-item {
    grid-template-columns: 40px 1fr;
    font-size: 11px;
  }
  .stat-value {
    font-size: 13px;
  }
  .run-item {
    grid-template-columns: 28px 1fr;
    font-size: 11px;
  }
  .run-relative {
    grid-column: 2;
  }
}

@media (max-width: 375px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .cal-cell {
    min-height: 36px;
  }
}
</style>
