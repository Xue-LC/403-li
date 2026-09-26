<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📊 JSON 图表可视化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：数据输入 + 图表配置 -->
          <div class="tool-col">
            <label class="tool-label">JSON 数据：</label>
            <div class="input-with-copy json-area">
              <textarea
                class="code-input"
                v-model="raw"
                rows="11"
                spellcheck="false"
                placeholder='粘贴 JSON 数组，如 [{"月份": "1月", "销量": 320}]'
              ></textarea>
              <button class="copy-btn" @click="copyInput" title="复制输入">📋</button>
            </div>

            <!-- 字段识别结果 -->
            <div v-if="fields.length" class="field-stats">
              <span class="field-stat-label">已识别 {{ dataRows.length }} 行 · {{ fields.length }} 个字段</span>
              <span
                v-for="f in fields"
                :key="f.key"
                class="field-chip"
                :class="f.type === 'num' ? 'chip-num' : 'chip-str'"
              >{{ f.key }} · {{ f.type === 'num' ? '数值' : '文本' }}</span>
            </div>

            <label class="tool-label">图表类型：</label>
            <div class="radio-group">
              <label v-for="t in chartTypes" :key="t.key" class="radio-label">
                <input type="radio" v-model="chartType" :value="t.key" />
                <span>{{ t.label }}</span>
              </label>
            </div>

            <template v-if="fields.length">
              <!-- 散点图：双数值字段 -->
              <template v-if="chartType === 'scatter'">
                <label class="tool-label">X 数值字段：</label>
                <select class="field-select" v-model="xNum">
                  <option v-for="f in numFields" :key="f.key" :value="f.key">{{ f.key }}</option>
                </select>
                <label class="tool-label">Y 数值字段：</label>
                <select class="field-select" v-model="yNum">
                  <option v-for="f in numFields" :key="f.key" :value="f.key">{{ f.key }}</option>
                </select>
              </template>

              <!-- 折线图：X 用任意字段（数值自动升序），Y 数值 -->
              <template v-else>
                <label class="tool-label">{{ chartType === 'line' ? 'X 轴字段：' : '分类字段：' }}</label>
                <select class="field-select" v-model="labelField">
                  <option v-for="f in fields" :key="f.key" :value="f.key">{{ f.key }}</option>
                </select>
                <label class="tool-label">数值字段（Y 轴）：</label>
                <select class="field-select" v-model="valueField">
                  <option v-for="f in numFields" :key="f.key" :value="f.key">{{ f.key }}</option>
                </select>
                <div v-if="chartType === 'bar' || chartType === 'pie'" class="agg-row">
                  <label class="tool-label">重复分类聚合：</label>
                  <select class="field-select field-select-sm" v-model="aggMode">
                    <option value="sum">求和</option>
                    <option value="avg">平均</option>
                    <option value="count">计数</option>
                  </select>
                </div>
              </template>
            </template>

            <label class="tool-label">配色方案：</label>
            <div class="radio-group">
              <label v-for="p in palettes" :key="p.key" class="radio-label">
                <input type="radio" v-model="palette" :value="p.key" />
                <span class="palette-name">
                  <span class="palette-dots">
                    <i
                      v-for="(c, i) in p.colors.slice(0, 4)"
                      :key="i"
                      :style="{ backgroundColor: c }"
                    ></i>
                  </span>
                  {{ p.label }}
                </span>
              </label>
            </div>

            <div class="chart-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showGrid" />
                <span>显示网格</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showValues" />
                <span>显示数值</span>
              </label>
            </div>
          </div>

          <!-- 右栏：图表预览 -->
          <div class="tool-col">
            <label class="tool-label">图表预览：</label>
            <div class="canvas-scroll">
              <div class="canvas-wrapper">
                <canvas ref="canvasRef"></canvas>
                <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
              </div>
            </div>
            <div v-if="chartInfo" class="chart-info">{{ chartInfo }}</div>
            <div v-if="pieLegend.length" class="pie-legend">
              <div v-for="(item, i) in pieLegend" :key="i" class="legend-item">
                <i class="legend-swatch" :style="{ backgroundColor: item.color }"></i>
                <span class="legend-name" :title="item.label">{{ item.label }}</span>
                <span class="legend-value">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 双栏外：按钮 -->
        <div class="button-group button-group-2">
          <button class="tool-button" @click="loadSample">📄 载入示例</button>
          <button class="tool-button primary" @click="downloadPng" :disabled="!hasData">⬇️ 导出 PNG</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ================= 常量 ================= */

const MONO = "'Maple Mono NF CN', 'Monaco', 'Consolas', monospace"
const W = 720 // 逻辑宽度
const H = 450 // 逻辑高度
const DPR = 2 // 固定 2x 超采样，保证高清屏锐利

const chartTypes = [
  { key: 'bar', label: '柱状图' },
  { key: 'line', label: '折线图' },
  { key: 'pie', label: '饼图' },
  { key: 'scatter', label: '散点图' }
]

/* 调色板：严格遵守站点主题（绿/黄/橙/红），不含蓝紫色 */
const palettes = [
  {
    key: 'neon',
    label: '霓虹',
    colors: ['#9dff6b', '#ffd866', '#ff8a8a', '#7ee787', '#ffa657', '#e3b341', '#56d364', '#ff7b72']
  },
  {
    key: 'amber',
    label: '琥珀',
    colors: ['#ffd866', '#e3b341', '#ffa657', '#f0883e', '#ffb26b', '#d29922', '#ff8a8a', '#ffe97b']
  },
  {
    key: 'fire',
    label: '火焰',
    colors: ['#ff8a8a', '#ffa657', '#ffd866', '#ff7b72', '#f0883e', '#fff3b3', '#e3b341', '#ffc77b']
  },
  {
    key: 'forest',
    label: '森林',
    colors: ['#39d353', '#56d364', '#7ee787', '#9dff6b', '#2ea043', '#aff5b4', '#238636', '#b5e8a3']
  }
]

const SAMPLE = `[
  { "月份": "1月", "销量": 320, "利润": 86 },
  { "月份": "2月", "销量": 210, "利润": 45 },
  { "月份": "3月", "销量": 280, "利润": 70 },
  { "月份": "4月", "销量": 260, "利润": 66 },
  { "月份": "5月", "销量": 390, "利润": 102 },
  { "月份": "6月", "销量": 450, "利润": 118 },
  { "月份": "7月", "销量": 520, "利润": 140 },
  { "月份": "8月", "销量": 610, "利润": 158 },
  { "月份": "9月", "销量": 430, "利润": 110 },
  { "月份": "10月", "销量": 350, "利润": 88 },
  { "月份": "11月", "销量": 300, "利润": 74 },
  { "月份": "12月", "销量": 480, "利润": 126 }
]`

/* ================= 状态 ================= */

const canvasRef = ref(null)
const raw = ref(SAMPLE)
const chartType = ref('bar')
const labelField = ref('')
const valueField = ref('')
const xNum = ref('')
const yNum = ref('')
const aggMode = ref('sum')
const palette = ref('neon')
const showGrid = ref(true)
const showValues = ref(true)

const dataRows = ref([])   // 规范化后的行数组
const fields = ref([])     // [{ key, type }]
const error = ref('')
const success = ref('')
const chartInfo = ref('')
const pieLegend = ref([])

const hasData = computed(() => dataRows.value.length > 0)
const numFields = computed(() => fields.value.filter(f => f.type === 'num'))
const paletteColors = computed(() => {
  const p = palettes.find(p => p.key === palette.value) || palettes[0]
  return p.colors
})

let parseTimer = null
let renderTimer = null
let successTimer = null

/* ================= 工具函数 ================= */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return (v && v.trim()) ? v.trim() : fallback
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ]
}

function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function toNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  if (typeof v === 'string') {
    const s = v.trim().replace(/,/g, '')
    if (!s) return NaN
    const n = Number(s)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function trimNum(n, digits) {
  if (!Number.isFinite(n)) return '0'
  const s = n.toFixed(digits)
  return String(Number(s))
}

function fmtVal(v) {
  if (!Number.isFinite(v)) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e9) return trimNum(v / 1e9, 2) + 'B'
  if (abs >= 1e6) return trimNum(v / 1e6, 2) + 'M'
  if (abs >= 1e4) return trimNum(v / 1e3, 1) + 'k'
  if (Number.isInteger(v)) return String(v)
  return trimNum(v, 2)
}

/* 计算漂亮的坐标轴最大值 */
function niceMax(maxV) {
  if (!Number.isFinite(maxV) || maxV <= 0) return 1
  const rawStep = maxV / 5
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const err = rawStep / pow
  let factor = 1
  if (err > 5) factor = 10
  else if (err > 2.5) factor = 5
  else if (err > 2) factor = 2.5
  else if (err > 1) factor = 2
  const step = factor * pow
  return Math.ceil(maxV / step) * step
}

function truncateText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
    s = s.slice(0, -1)
  }
  return s + '…'
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

/* ================= 数据解析与字段识别 ================= */

function parseData() {
  clearTimeout(parseTimer)
  const text = raw.value.trim()
  if (!text) {
    dataRows.value = []
    fields.value = []
    error.value = ''
    return
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    error.value = `JSON 解析失败：${e && e.message ? e.message : '语法错误'}`
    return
  }

  // 单对象 → [{ key, value }] 形式
  let arr = parsed
  if (!Array.isArray(arr)) {
    if (arr !== null && typeof arr === 'object') {
      arr = Object.entries(arr).map(([k, v]) => ({ key: k, value: v }))
    } else {
      error.value = '数据应为对象数组或对象，请检查输入'
      return
    }
  }
  if (!arr.length) {
    error.value = 'JSON 数组为空，请检查输入'
    return
  }

  // 规范化：非对象元素 → { value }
  const rows = arr.map((r, i) => {
    if (r !== null && typeof r === 'object' && !Array.isArray(r)) return r
    return { value: r }
  })

  // 字段类型识别
  const keyTypes = {}
  rows.forEach(r => {
    Object.keys(r).forEach(k => {
      const v = r[k]
      if (v === null || v === undefined) return
      const sv = typeof v === 'string' ? v.trim().replace(/,/g, '') : ''
      const isNum = typeof v === 'number' || (typeof v === 'string' && sv.length > 0 && Number.isFinite(Number(sv)))
      const t = isNum ? 'num' : 'str'
      if (keyTypes[k] === undefined) keyTypes[k] = t
      else if (keyTypes[k] !== t) keyTypes[k] = 'str' // 类型混用按文本
    })
  })
  const detected = Object.keys(keyTypes).map(k => ({ key: k, type: keyTypes[k] }))

  dataRows.value = rows
  fields.value = detected
  error.value = ''
  autoAssignFields()
}

function autoAssignFields() {
  const strFields = fields.value.filter(f => f.type === 'str')
  const numF = numFields.value
  // label 字段：优先保留原有选择，其次文本字段，再次数值字段
  if (!labelField.value || !fields.value.some(f => f.key === labelField.value)) {
    labelField.value = (strFields[0] || numF[0] || fields.value[0] || {}).key || ''
  }
  if (!valueField.value || !numF.some(f => f.key === valueField.value)) {
    valueField.value = (numF[0] || {}).key || ''
  }
  if (!xNum.value || !numF.some(f => f.key === xNum.value)) {
    xNum.value = (numF[0] || {}).key || ''
  }
  if (!yNum.value || !numF.some(f => f.key === yNum.value)) {
    yNum.value = (numF[1] || numF[0] || {}).key || ''
  }
}

/* ================= 数据预处理 ================= */

/* 聚合：重复分类求和 / 平均 / 计数 */
function aggregateRows(getLabel, getValue) {
  const map = new Map()
  dataRows.value.forEach((r, i) => {
    const label = getLabel(r, i)
    const v = toNum(getValue(r))
    if (!map.has(label)) map.set(label, { sum: 0, n: 0, valid: 0 })
    const item = map.get(label)
    item.n++
    if (Number.isFinite(v)) {
      item.sum += v
      item.valid++
    }
  })
  const out = []
  map.forEach((item, label) => {
    let value = 0
    if (aggMode.value === 'count') value = item.valid
    else if (aggMode.value === 'avg') value = item.valid ? item.sum / item.valid : 0
    else value = item.sum
    out.push({ label: String(label), value })
  })
  return out
}

/* 柱状图数据 */
function barData() {
  const list = aggregateRows(
    (r, i) => (labelField.value ? r[labelField.value] ?? `#${i + 1}` : `#${i + 1}`),
    r => (valueField.value ? r[valueField.value] : NaN)
  )
  const maxBars = 40
  let truncated = false
  if (list.length > maxBars) {
    truncated = true
    list.length = maxBars
  }
  return { list, truncated }
}

/* 折线图数据：数值 X 升序 */
function lineData() {
  const pts = []
  dataRows.value.forEach((r, i) => {
    const xRaw = labelField.value ? r[labelField.value] : i
    const xNumVal = toNum(xRaw)
    const y = toNum(valueField.value ? r[valueField.value] : NaN)
    if (Number.isFinite(y)) {
      pts.push({
        xNum: Number.isFinite(xNumVal) ? xNumVal : null,
        xCat: String(xRaw),
        y
      })
    }
  })
  const xIsNumeric = pts.length > 0 && pts.every(p => p.xNum !== null)
  if (xIsNumeric) pts.sort((a, b) => a.xNum - b.xNum)
  return { pts, xIsNumeric }
}

/* 饼图数据：聚合后降序，取前 12 项，其余并入「其他」 */
function pieData() {
  let list = aggregateRows(
    (r, i) => (labelField.value ? r[labelField.value] ?? `#${i + 1}` : `#${i + 1}`),
    r => (valueField.value ? r[valueField.value] : NaN)
  )
  list = list.filter(d => Number.isFinite(d.value) && d.value >= 0)
  if (!list.length) return { slices: [] }
  list.sort((a, b) => b.value - a.value)
  if (list.length > 12) {
    const head = list.slice(0, 11)
    const rest = list.slice(11).reduce((s, d) => s + d.value, 0)
    head.push({ label: '其他', value: rest })
    list = head
  }
  const total = list.reduce((s, d) => s + d.value, 0) || 1
  return { slices: list, total }
}

/* 散点图数据 */
function scatterData() {
  const pts = []
  dataRows.value.forEach(r => {
    const x = toNum(r[xNum.value])
    const y = toNum(r[yNum.value])
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y })
  })
  const maxPts = 3000
  let sampled = pts
  if (pts.length > maxPts) {
    const step = Math.ceil(pts.length / maxPts)
    sampled = pts.filter((_, i) => i % step === 0)
  }
  return sampled
}

/* ================= Canvas 渲染 ================= */

function getCtx() {
  const canvas = canvasRef.value
  if (!canvas) return null
  canvas.width = W * DPR
  canvas.height = H * DPR
  const ctx = canvas.getContext('2d')
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  return ctx
}

function drawPlaceholder(ctx, msg, color) {
  const bg = cssVar('--bg', '#0d1117')
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color || cssVar('--dim', '#717a87')
  ctx.font = `13px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(msg, W / 2, H / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/* 通用直角坐标系：网格 + 坐标轴 + Y 刻度 */
function drawAxesBase(ctx, area, yMax, tickCount, gridColor, axisColor, labelColor, fmtTick) {
  const { left, right, top, bottom } = area
  const plotH = bottom - top
  const plotW = right - left
  const n = tickCount

  // 横向网格 + Y 刻度
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= n; i++) {
    const y = bottom - (plotH * i) / n
    if (showGrid.value) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, Math.round(y) + 0.5)
      ctx.lineTo(right, Math.round(y) + 0.5)
      ctx.stroke()
    }
    ctx.fillStyle = labelColor
    ctx.fillText(fmtTick((yMax * i) / n), left - 8, y)
  }

  // 边框（直角坐标系）
  ctx.strokeStyle = axisColor
  ctx.lineWidth = 1
  ctx.strokeRect(left, top, plotW, plotH)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function renderBar(ctx, colors, textColor, axisColor, gridColor, labelColor) {
  const { list, truncated } = barData()
  if (!list.length) {
    drawPlaceholder(ctx, '没有可绘制的数值数据', cssVar('--red', '#ff8a8a'))
    return
  }
  const yMax = niceMax(Math.max(...list.map(d => d.value), 1))
  const left = 64
  const right = W - 18
  const top = 22
  const bottom = H - 52
  const plotW = right - left
  const plotH = bottom - top
  const n = list.length
  const slot = plotW / n
  const barW = Math.max(2, Math.min(44, slot * 0.62))

  drawAxesBase(ctx, { left, right, top, bottom }, yMax, 5, gridColor, axisColor, labelColor, fmtVal)

  // X 轴标签（过密时跳绘）
  ctx.font = `10px ${MONO}`
  ctx.fillStyle = labelColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const maxXLabels = 12
  const stride = Math.max(1, Math.ceil(n / maxXLabels))
  for (let i = 0; i < n; i += stride) {
    const x = left + slot * i + slot / 2
    const t = truncateText(ctx, list[i].label, Math.max(24, slot - 2))
    ctx.fillText(t, x, bottom + 8)
  }
  ctx.textAlign = 'left'

  const barColor = colors[0]
  // 柱体
  for (let i = 0; i < n; i++) {
    const h = Math.max(0, (list[i].value / yMax) * plotH)
    const x = left + slot * i + (slot - barW) / 2
    const y = bottom - h
    ctx.fillStyle = withAlpha(barColor, 0.88)
    ctx.fillRect(x, y, barW, h)
    // 顶部高亮线
    if (h > 0) {
      ctx.fillStyle = barColor
      ctx.fillRect(x, y, barW, 1.5)
    }
    // 数值
    if (showValues.value && n <= 24 && list[i].value !== 0) {
      ctx.fillStyle = textColor
      ctx.font = `10px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(fmtVal(list[i].value), x + barW / 2, y - 4)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
  }
  return truncated
}

function renderLine(ctx, colors, textColor, axisColor, gridColor, labelColor) {
  const { pts, xIsNumeric } = lineData()
  if (!pts.length) {
    drawPlaceholder(ctx, '没有可绘制的数值数据', cssVar('--red', '#ff8a8a'))
    return
  }
  const left = 64
  const right = W - 18
  const top = 22
  const bottom = H - 52
  const plotW = right - left
  const plotH = bottom - top

  let xMin = 0
  let xMax = 1
  if (xIsNumeric) {
    xMin = Math.min(...pts.map(p => p.xNum))
    xMax = Math.max(...pts.map(p => p.xNum))
    if (xMin === xMax) {
      xMax = xMin + 1
    }
  }
  const yMax = niceMax(Math.max(...pts.map(p => p.y), 1))

  drawAxesBase(ctx, { left, right, top, bottom }, yMax, 5, gridColor, axisColor, labelColor, fmtVal)

  const px = (idx, p) => {
    if (xIsNumeric) return left + ((p.xNum - xMin) / (xMax - xMin)) * plotW
    return left + (idx / Math.max(1, pts.length - 1)) * plotW
  }
  const py = p => bottom - (p.y / yMax) * plotH

  // 竖向网格（数值 X 时）
  if (showGrid.value && xIsNumeric) {
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    for (let i = 1; i < 5; i++) {
      const x = left + (plotW * i) / 5
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, top)
      ctx.lineTo(Math.round(x) + 0.5, bottom)
      ctx.stroke()
    }
  }

  // 折线
  const lineColor = colors[0]
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  pts.forEach((p, i) => {
    const x = px(i, p)
    const y = py(p)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // 面积渐变
  const grad = ctx.createLinearGradient(0, top, 0, bottom)
  grad.addColorStop(0, withAlpha(lineColor, 0.18))
  grad.addColorStop(1, withAlpha(lineColor, 0.01))
  ctx.fillStyle = grad
  ctx.lineTo(px(pts.length - 1, pts[pts.length - 1]), bottom)
  ctx.lineTo(px(0, pts[0]), bottom)
  ctx.closePath()
  ctx.fill()

  // 数据点 + 数值
  const maxDots = 400
  const dotEvery = Math.max(1, Math.ceil(pts.length / maxDots))
  ctx.font = `9px ${MONO}`
  for (let i = 0; i < pts.length; i += dotEvery) {
    const p = pts[i]
    const x = px(i, p)
    const y = py(p)
    if (showValues.value) {
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(fmtVal(p.y), x, y - 6)
    }
    ctx.fillStyle = cssVar('--bg', '#0d1117')
    ctx.beginPath()
    ctx.arc(x, y, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // X 轴标签
  const maxXLabels = 10
  ctx.font = `10px ${MONO}`
  ctx.fillStyle = labelColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  if (xIsNumeric) {
    for (let i = 0; i <= maxXLabels; i++) {
      const v = xMin + ((xMax - xMin) * i) / maxXLabels
      const x = left + (plotW * i) / maxXLabels
      ctx.fillText(fmtVal(v), x, bottom + 8)
    }
  } else {
    const stride = Math.max(1, Math.ceil(pts.length / maxXLabels))
    for (let i = 0; i < pts.length; i += stride) {
      const p = pts[i]
      const x = px(i, p)
      const t = truncateText(ctx, p.xCat, 60)
      ctx.fillText(t, x, bottom + 8)
    }
  }
  ctx.textAlign = 'left'
}

function renderPie(ctx, colors, textColor, axisColor) {
  const { slices, total } = pieData()
  if (!slices.length) {
    drawPlaceholder(ctx, '没有可绘制的数值数据', cssVar('--red', '#ff8a8a'))
    return
  }
  const cx = W / 2 - 60
  const cy = H / 2 + 10
  const radius = Math.min(W * 0.26, H * 0.38)
  const inner = radius * 0.6 // 环形（甜甜圈）

  let angle = -Math.PI / 2
  const bg = cssVar('--bg', '#0d1117')

  const legend = []
  slices.forEach((d, i) => {
    const frac = d.value / total
    const end = angle + frac * Math.PI * 2
    const color = colors[i % colors.length]
    const pct = Math.round(frac * 1000) / 10
    legend.push({ label: d.label, value: d.value, pct, color })

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, angle, end)
    ctx.closePath()
    ctx.fillStyle = withAlpha(color, 0.92)
    ctx.fill()
    ctx.strokeStyle = bg
    ctx.lineWidth = 2
    ctx.stroke()

    // 百分比标注（扇区足够大时）
    if (showValues.value && frac > 0.07) {
      const mid = angle + frac * Math.PI
      const lx = cx + Math.cos(mid) * radius * 0.72
      const ly = cy + Math.sin(mid) * radius * 0.72
      ctx.fillStyle = cssVar('--bg', '#0d1117')
      ctx.font = `10px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${pct}%`, lx, ly)
    }
    angle = end
  })

  // 中心环
  ctx.beginPath()
  ctx.arc(cx, cy, inner, 0, Math.PI * 2)
  ctx.fillStyle = cssVar('--panel', '#161b22')
  ctx.fill()
  ctx.strokeStyle = axisColor
  ctx.lineWidth = 1
  ctx.stroke()

  // 中心文本
  ctx.fillStyle = cssVar('--muted', '#8b949e')
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TOTAL', cx, cy - 10)
  ctx.fillStyle = textColor
  ctx.font = `bold 14px ${MONO}`
  ctx.fillText(fmtVal(total), cx, cy + 8)
  ctx.textAlign = 'left'

  pieLegend.value = legend
}

function renderScatter(ctx, colors, textColor, axisColor, gridColor, labelColor) {
  const pts = scatterData()
  if (!pts.length) {
    drawPlaceholder(ctx, '需要两个数值字段才能绘制散点图', cssVar('--red', '#ff8a8a'))
    return
  }
  const left = 64
  const right = W - 18
  const top = 22
  const bottom = H - 52
  const plotW = right - left
  const plotH = bottom - top

  let xMin = Math.min(...pts.map(p => p.x))
  let xMax = Math.max(...pts.map(p => p.x))
  const yMin = Math.min(...pts.map(p => p.y))
  let yMaxRaw = Math.max(...pts.map(p => p.y))
  if (xMin === xMax) xMax = xMin + 1
  if (yMin === yMaxRaw) yMaxRaw = yMin + 1

  // 用实际范围绘制网格刻度（自适应）
  const n = 5
  const yRange = yMaxRaw - yMin || 1
  const xRange = xMax - xMin || 1
  ctx.font = `10px ${MONO}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= n; i++) {
    const y = bottom - (plotH * i) / n
    if (showGrid.value) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(left, Math.round(y) + 0.5)
      ctx.lineTo(right, Math.round(y) + 0.5)
      ctx.stroke()
    }
    const v = yMin + (yRange * i) / n
    ctx.fillStyle = labelColor
    ctx.fillText(fmtVal(v), left - 8, y)
  }
  ctx.textAlign = 'center'
  for (let i = 0; i <= n; i++) {
    const x = left + (plotW * i) / n
    if (showGrid.value) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, top)
      ctx.lineTo(Math.round(x) + 0.5, bottom)
      ctx.stroke()
    }
    const v = xMin + (xRange * i) / n
    ctx.fillStyle = labelColor
    ctx.textBaseline = 'top'
    ctx.fillText(fmtVal(v), x, bottom + 8)
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.strokeStyle = axisColor
  ctx.lineWidth = 1
  ctx.strokeRect(left, top, plotW, plotH)

  // 数据点
  const pointColor = colors[1] || colors[0]
  pts.forEach(p => {
    const x = left + ((p.x - xMin) / xRange) * plotW
    const y = bottom - ((p.y - yMin) / yRange) * plotH
    ctx.fillStyle = withAlpha(pointColor, 0.55)
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = withAlpha(pointColor, 0.9)
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

function render() {
  const ctx = getCtx()
  if (!ctx) return
  const t0 = performance.now()

  // 主题色（跟随明暗主题）
  const textColor = cssVar('--text', '#c9d1d9')
  const labelColor = cssVar('--muted', '#8b949e')
  const axisColor = cssVar('--line-strong', '#39424d')
  const gridColor = cssVar('--line', '#30363d')
  const colors = paletteColors.value

  const bg = cssVar('--bg', '#0d1117')
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  pieLegend.value = []

  if (!dataRows.value.length) {
    drawPlaceholder(ctx, '等待数据…粘贴 JSON 后自动绘制')
    chartInfo.value = ''
    return
  }

  // 数据可用性检查
  if (!fields.value.length) {
    drawPlaceholder(ctx, '未识别到字段，请检查 JSON 结构', cssVar('--red', '#ff8a8a'))
    chartInfo.value = ''
    return
  }
  if (chartType.value !== 'scatter' && !numFields.value.length) {
    drawPlaceholder(ctx, '数据中没有数值字段，无法绘图', cssVar('--red', '#ff8a8a'))
    chartInfo.value = ''
    return
  }
  if (chartType.value === 'scatter' && numFields.value.length < 2) {
    drawPlaceholder(ctx, '散点图需要至少两个数值字段', cssVar('--red', '#ff8a8a'))
    chartInfo.value = ''
    return
  }

  let truncated = false
  if (chartType.value === 'bar') truncated = renderBar(ctx, colors, textColor, axisColor, gridColor, labelColor)
  else if (chartType.value === 'line') renderLine(ctx, colors, textColor, axisColor, gridColor, labelColor)
  else if (chartType.value === 'pie') renderPie(ctx, colors, textColor, axisColor)
  else renderScatter(ctx, colors, textColor, axisColor, gridColor, labelColor)

  const t = Math.round(performance.now() - t0)

  let info = `共 ${dataRows.value.length} 行 · 渲染 ${t}ms`
  if (truncated) info += ' · 仅显示前 40 项'
  chartInfo.value = info
}

function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 30)
}

/* ================= 交互 ================= */

function copyInput() {
  const text = raw.value
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => flashSuccess('输入已复制到剪贴板'))
    .catch(() => {
      error.value = '复制失败，请手动选择复制'
      setTimeout(() => (error.value = ''), 2500)
    })
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('png 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      error.value = '当前浏览器不支持复制图片，请使用「导出 PNG」'
      setTimeout(() => (error.value = ''), 2500)
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('图片已复制到剪贴板')
  } catch (e) {
    error.value = '复制图片失败：' + (e && e.message ? e.message : '未知错误')
    setTimeout(() => (error.value = ''), 2500)
  }
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `json_chart_${chartType.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

function loadSample() {
  raw.value = SAMPLE
  chartType.value = 'bar'
  parseData()
  render()
  flashSuccess('已载入示例数据')
}

/* ================= 生命周期 ================= */

watch([chartType, labelField, valueField, xNum, yNum, aggMode, palette, showGrid, showValues], () => scheduleRender())

// 输入内容变化 → 防抖解析 + 重绘
watch(raw, () => {
  clearTimeout(parseTimer)
  parseTimer = setTimeout(() => {
    parseData()
    scheduleRender()
  }, 350)
})

onMounted(() => {
  parseData()
  render()
})

onBeforeUnmount(() => {
  clearTimeout(parseTimer)
  clearTimeout(renderTimer)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* ===== 输入区 ===== */
.json-area {
  align-items: stretch;
}

.field-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.field-stat-label {
  width: 100%;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}

.field-chip {
  font-family: var(--mono);
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  color: var(--text);
  background: var(--panel-2);
}

.field-chip.chip-num {
  color: var(--green);
  border-color: rgba(157, 255, 107, 0.35);
}

.field-chip.chip-str {
  color: var(--amber);
  border-color: rgba(255, 216, 102, 0.3);
}

/* ===== 下拉框 ===== */
.field-select {
  width: 100%;
  height: 40px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0 10px;
  box-sizing: border-box;
  transition: all 0.2s;
}

.field-select:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.field-select option {
  background: var(--panel);
  color: var(--text);
}

.field-select-sm {
  height: 34px;
  width: 110px;
}

.agg-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.agg-row .tool-label {
  margin: 0;
}

/* ===== 调色板选项 ===== */
.palette-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.palette-dots {
  display: inline-flex;
  gap: 2px;
}

.palette-dots i {
  width: 10px;
  height: 10px;
  display: inline-block;
}

.chart-options {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* ===== 预览区 ===== */
.canvas-scroll {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  overflow-x: auto;
}

.canvas-wrapper {
  position: relative;
  min-width: 560px;
}

canvas {
  width: 100%;
  height: auto;
  display: block;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

.chart-info {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin-top: 6px;
}

/* ===== 饼图图例 ===== */
.pie-legend {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  color: var(--muted);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .canvas-scroll {
    padding: 6px;
  }
  .canvas-wrapper {
    min-width: 500px;
  }
}
</style>
