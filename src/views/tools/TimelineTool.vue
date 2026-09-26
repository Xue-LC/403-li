<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🕒 时间线生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：数据输入 + 参数配置 ============ -->
          <div class="tool-col">
            <label class="tool-label">事件数据（每行一条）：</label>
            <div class="input-with-copy">
              <textarea
                class="code-input"
                v-model="raw"
                rows="11"
                spellcheck="false"
                placeholder="2024-01-15 | 项目启动&#10;2024-02-20 | 首个原型发布 | 完成核心功能 Demo"
              ></textarea>
              <button class="copy-btn" @click="copyInput" title="复制输入">📋</button>
            </div>
            <div class="hint">格式：<code>日期 | 标题 | 说明</code>，说明可省略；也支持 <code>日期 标题</code> 单行写法。日期支持 <code>YYYY-MM-DD</code> / <code>YYYY/MM/DD</code> / <code>MM-DD</code> / <code>YYYY</code>，可选时间 <code>HH:mm</code>。</div>

            <label class="tool-label">布局方向：</label>
            <div class="radio-group">
              <label v-for="l in layouts" :key="l.key" class="radio-label">
                <input type="radio" v-model="layout" :value="l.key" />
                <span>{{ l.label }}</span>
              </label>
            </div>

            <label class="tool-label">排序方式：</label>
            <div class="radio-group">
              <label v-for="s in sorts" :key="s.key" class="radio-label">
                <input type="radio" v-model="sortMode" :value="s.key" />
                <span>{{ s.label }}</span>
              </label>
            </div>

            <label class="tool-label">配色主题：</label>
            <div class="radio-group">
              <label v-for="t in themes" :key="t.key" class="radio-label">
                <input type="radio" v-model="theme" :value="t.key" />
                <span class="theme-name">
                  <i class="theme-dot" :style="{ backgroundColor: dotColor(t) }"></i>{{ t.label }}
                </span>
              </label>
            </div>

            <label class="tool-label">节点样式：</label>
            <div class="radio-group">
              <label v-for="n in nodeStyles" :key="n.key" class="radio-label">
                <input type="radio" v-model="nodeStyle" :value="n.key" />
                <span>{{ n.label }}</span>
              </label>
            </div>

            <label class="tool-label">显示选项：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.alternate" />
                <span>标签交替排布</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.showIndex" />
                <span>显示序号</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.showDetail" />
                <span>显示说明文字</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.showGrid" />
                <span>显示刻度线</span>
              </label>
            </div>

            <label class="tool-label">节点间距：{{ spacing }} px</label>
            <input class="range-input" type="range" min="60" max="220" step="2" v-model.number="spacing" />

            <label class="tool-label">字号：{{ fontSize }} px</label>
            <input class="range-input" type="range" min="11" max="20" step="1" v-model.number="fontSize" />
          </div>

          <!-- ============ 右栏：预览 + 输出 ============ -->
          <div class="tool-col">
            <label class="tool-label">时间线预览：</label>
            <div class="canvas-outer">
              <div class="canvas-wrapper">
                <canvas ref="canvasRef"></canvas>
              </div>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
            </div>
            <div v-if="info" class="tl-info">{{ info }}</div>

            <div class="tl-list-head">
              <span class="tl-list-title">事件列表（输出）</span>
              <button class="copy-btn-inline" @click="copyOutput" title="复制事件列表">📋</button>
            </div>
            <pre class="tl-list" :class="{ 'tl-empty': !outputText }">{{ outputText || '解析后的时间线文本将显示在这里…' }}</pre>
          </div>
        </div>

        <!-- ============ 双栏外：按钮与状态 ============ -->
        <div class="button-group button-group-4">
          <button class="tool-button" @click="loadSample">📄 载入示例</button>
          <button class="tool-button" @click="copyImage" :disabled="!hasData">🖼️ 复制图片</button>
          <button class="tool-button primary" @click="exportPng" :disabled="!hasData">⬇️ 导出 PNG</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="warn" class="status-error">⚠️ {{ warn }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

/* ================= 常量 ================= */

const MONO = "'Maple Mono NF CN', 'Monaco', 'Consolas', monospace"
const DPR = 2 // 固定 2x 超采样导出高清图

const layouts = [
  { key: 'vertical', label: '垂直' },
  { key: 'horizontal', label: '水平' }
]

const sorts = [
  { key: 'input', label: '输入顺序' },
  { key: 'asc', label: '时间升序' },
  { key: 'desc', label: '时间降序' }
]

/* 配色主题：全部贴合站点绿/黄/橙/红主题，无蓝紫色；dark/light 分别适配深色与纸感浅色主题 */
const themes = [
  { key: 'neon', label: '霓虹绿', dark: '#9dff6b', light: '#1a7a2a' },
  { key: 'forest', label: '森林', dark: '#39d353', light: '#1f6b2f' },
  { key: 'amber', label: '琥珀', dark: '#ffd866', light: '#92400e' },
  { key: 'fire', label: '火焰', dark: '#ff8a8a', light: '#b91c1c' },
  { key: 'mono', label: '极简灰', dark: '#c9d1d9', light: '#4a4a45' }
]

const nodeStyles = [
  { key: 'square', label: '方块' },
  { key: 'diamond', label: '菱形' },
  { key: 'ring', label: '空心' },
  { key: 'cross', label: '十字' }
]

const SAMPLE = `2024-01-15 | 项目启动 | 确定技术选型，搭建基础框架
2024-02-20 | 首个原型发布 | 完成核心功能 Demo
2024-03-18 | 内测上线 | 邀请 50 位用户参与测试
2024-04-26 | 性能优化 | 首屏加载时间降低 40%
2024-06-10 | 公测发布 | 开放注册，上线文档站
2024-07-25 | v1.0 正式版 | 支持导出与团队协作
2024-09-02 | 用户破万 | 日活跃用户突破 3000
2024-10-18 | 国际化 | 新增英文与日文界面`

const MAX_EVENTS = 300

/* ================= 状态 ================= */

const canvasRef = ref(null)
const raw = ref(SAMPLE)
const layout = ref('vertical')
const sortMode = ref('asc')
const theme = ref('neon')
const nodeStyle = ref('square')
const spacing = ref(96)
const fontSize = ref(13)
const opts = ref({
  alternate: true,
  showIndex: true,
  showDetail: true,
  showGrid: true
})

const eventList = ref([])
const outputText = ref('')
const info = ref('')
const warn = ref('')
const error = ref('')
const success = ref('')

const hasData = computed(() => eventList.value.length > 0)

let parseTimer = null
let renderTimer = null
let successTimer = null

/* ================= 通用工具 ================= */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return v && v.trim() ? v.trim() : fallback
}

/** #rgb / #rrggbb / rgb() / rgba() → [r,g,b]，解析失败返回 null */
function parseColor(str) {
  const s = String(str || '').trim()
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('')
    if (h.length !== 6) return null
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (m) return [+m[1], +m[2], +m[3]]
  return null
}

function withAlpha(color, alpha) {
  const rgb = parseColor(color)
  if (!rgb) return color
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
}

/** 判断当前是否浅色主题（显式 data-theme 优先，否则按背景亮度推断） */
function isLightTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light') return true
  if (attr === 'dark') return false
  const rgb = parseColor(cssVar('--bg', '#0d1117'))
  if (!rgb) return false
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 140
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    success.value = ''
  }, 2000)
}

function setError(msg) {
  error.value = msg
}

/* ================= 日期解析 ================= */

function parseDateStr(str) {
  const s = String(str || '').trim()
  if (!s) return null

  // YYYY-MM-DD [HH:mm[:ss]]
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (m) {
    const y = +m[1]
    const mo = +m[2]
    const d = +m[3]
    const dt = new Date(y, mo - 1, d, +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))
    if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
      return { date: dt, hasTime: m[4] !== undefined }
    }
    return null
  }

  // MM-DD [HH:mm[:ss]] → 默认当年
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (m) {
    const mo = +m[1]
    const d = +m[2]
    const y = new Date().getFullYear()
    const dt = new Date(y, mo - 1, d, +(m[3] || 0), +(m[4] || 0), +(m[5] || 0))
    if (dt.getMonth() === mo - 1 && dt.getDate() === d) {
      return { date: dt, hasTime: m[3] !== undefined }
    }
    return null
  }

  // YYYY → 当年 1 月 1 日
  m = s.match(/^(\d{4})$/)
  if (m) return { date: new Date(+m[1], 0, 1), hasTime: false }

  return null
}

const DATE_HEAD_RE = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?|\d{1,2}[-/.]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?|\d{4})\s*[,，:：]?\s*([\s\S]*)$/

/** 数据库里的一行 → 事件对象，解析失败返回 null */
function parseLine(line, lineNo) {
  let s = line.trim()
  if (!s) return null
  if (s.startsWith('#') || s.startsWith('//')) return null

  let dateStr = ''
  let title = ''
  let detail = ''

  if (s.includes('|')) {
    const parts = s.split('|').map(p => p.trim())
    dateStr = parts[0] || ''
    title = parts[1] || ''
    detail = parts.slice(2).filter(Boolean).join(' ')
  } else {
    const m = s.match(DATE_HEAD_RE)
    if (m) {
      dateStr = m[1]
      title = (m[2] || '').trim()
    } else {
      dateStr = s
    }
  }

  const pd = parseDateStr(dateStr)
  if (!pd) return { bad: true, text: s, lineNo }

  return {
    bad: false,
    date: pd.date,
    hasTime: pd.hasTime,
    title: title || `${pd.date.getFullYear()}-${pad2(pd.date.getMonth() + 1)}-${pad2(pd.date.getDate())}`,
    detail
  }
}

/** 格式化为文本日期 */
function fmtDate(d, hasTime) {
  const s = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  return hasTime ? `${s} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : s
}

function spanText(a, b) {
  const ms = Math.abs(b.getTime() - a.getTime())
  if (ms <= 0) return '同一天'
  const days = ms / 86400000
  if (days >= 365) return `${(days / 365).toFixed(1)} 年`
  if (days >= 30) return `${(days / 30).toFixed(1)} 个月`
  if (days >= 1) return `${days % 1 === 0 ? days : days.toFixed(1)} 天`
  const h = ms / 3600000
  if (h >= 1) return `${h.toFixed(1)} 小时`
  return `${Math.max(1, Math.round(ms / 60000))} 分钟`
}

/* ================= 解析全部事件 ================= */

function parse() {
  const text = raw.value
  if (!text || !text.trim()) {
    eventList.value = []
    outputText.value = ''
    info.value = ''
    warn.value = ''
    setError('')
    scheduleRender()
    return
  }

  const bad = []
  const out = []
  text.split(/\r?\n/).forEach((line, i) => {
    const r = parseLine(line, i + 1)
    if (!r) return
    if (r.bad) {
      bad.push(r.lineNo)
      return
    }
    out.push(r)
  })

  // 排序
  if (sortMode.value === 'asc') out.sort((a, b) => a.date - b.date)
  else if (sortMode.value === 'desc') out.sort((a, b) => b.date - a.date)

  let truncated = false
  if (out.length > MAX_EVENTS) {
    out.length = MAX_EVENTS
    truncated = true
  }

  eventList.value = out

  if (bad.length) {
    const shown = bad.slice(0, 8).join('、')
    warn.value = `第 ${shown}${bad.length > 8 ? ' …' : ''} 行无法识别日期，已跳过（共 ${bad.length} 行）`
  } else {
    warn.value = ''
  }
  if (truncated) {
    warn.value = (warn.value ? warn.value + '；' : '') + `事件过多，仅渲染前 ${MAX_EVENTS} 条`
  }

  setError('')
  buildOutput()
  scheduleRender()
}

function buildOutput() {
  const list = eventList.value
  if (!list.length) {
    outputText.value = ''
    info.value = ''
    return
  }
  const dateCols = Math.max(...list.map(e => fmtDate(e.date, e.hasTime).length))
  outputText.value = list
    .map((e, i) => {
      const d = fmtDate(e.date, e.hasTime).padEnd(dateCols, ' ')
      const idx = String(i + 1).padStart(2, '0')
      const detail = e.detail ? ` — ${e.detail}` : ''
      return `[${idx}] ${d}  ${e.title}${detail}`
    })
    .join('\n')
}

/* ================= Canvas 绘制 ================= */

let CW = 760
let CH = 300

function getColors() {
  const t = themes.find(x => x.key === theme.value) || themes[0]
  const light = isLightTheme()
  // 霓虹绿始终跟随站点强调色变量，其余主题按亮/暗主题取色
  const accent = theme.value === 'neon'
    ? cssVar('--green', light ? '#1a7a2a' : '#9dff6b')
    : (light ? t.light : t.dark)
  return {
    bg: cssVar('--panel-2', light ? '#eae6de' : '#0f1317'),
    text: cssVar('--text', light ? '#1a1a16' : '#c9d1d9'),
    muted: cssVar('--muted', light ? '#6a6458' : '#8b949e'),
    dim: cssVar('--dim', light ? '#7a7468' : '#717a87'),
    line: cssVar('--line', light ? '#c4bca8' : '#30363d'),
    accent,
    soft: withAlpha(accent, 0.18),
    axis: withAlpha(accent, 0.45)
  }
}

/** 主题色块（跟随当前亮/暗主题） */
function dotColor(t) {
  if (t.key === 'neon') return cssVar('--green', '#9dff6b')
  return isLightTheme() ? t.light : t.dark
}

function setupCanvas(canvas, w, h) {
  canvas.width = Math.round(w * DPR)
  canvas.height = Math.round(h * DPR)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
}

function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    nextTick(() => render())
  }, 50)
}

function tokenize(text) {
  const tokens = []
  let buf = ''
  for (const ch of text) {
    if (/[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch)) {
      if (buf) {
        tokens.push(buf)
        buf = ''
      }
      tokens.push(ch)
    } else if (ch === ' ') {
      if (buf) {
        tokens.push(buf)
        buf = ''
      }
      tokens.push(' ')
    } else {
      buf += ch
    }
  }
  if (buf) tokens.push(buf)
  return tokens
}

function wrapText(ctx, text, maxW, maxLines, font) {
  ctx.font = font
  const t = String(text || '').trim().replace(/\s+/g, ' ')
  if (!t) return []
  const tokens = tokenize(t)
  const lines = []
  let cur = ''
  let overflow = false

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i]
    const trial = cur + tk
    if (cur && ctx.measureText(trial).width > maxW) {
      lines.push(cur.trim())
      if (lines.length >= maxLines) {
        overflow = true
        cur = ''
        break
      }
      cur = tk === ' ' ? '' : tk
    } else {
      cur = trial
    }
  }
  if (!overflow && cur.trim() && lines.length < maxLines) lines.push(cur.trim())

  if (overflow && lines.length) {
    let last = lines[lines.length - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1)
    lines[lines.length - 1] = `${last}…`
  }
  return lines
}

function drawNode(ctx, x, y, c) {
  const r = 5
  ctx.save()
  ctx.shadowColor = c.accent
  ctx.shadowBlur = 10
  ctx.fillStyle = c.accent
  ctx.strokeStyle = c.accent
  ctx.lineWidth = 2
  switch (nodeStyle.value) {
    case 'diamond': {
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'ring': {
      ctx.strokeRect(x - r, y - r, r * 2, r * 2)
      break
    }
    case 'cross': {
      ctx.beginPath()
      ctx.moveTo(x - r - 1, y)
      ctx.lineTo(x + r + 1, y)
      ctx.moveTo(x, y - r - 1)
      ctx.lineTo(x, y + r + 1)
      ctx.stroke()
      break
    }
    default: {
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
  }
  ctx.restore()
}

function drawAxisLine(ctx, x1, y1, x2, y2, c) {
  ctx.save()
  ctx.strokeStyle = c.axis
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function drawConnect(ctx, x1, y1, x2, y2, c) {
  ctx.save()
  ctx.strokeStyle = c.soft
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

/** 单行截断：超过 maxW 时以省略号收尾 */
function fitText(ctx, text, maxW, font) {
  ctx.font = font
  const s = String(text)
  const w = Math.max(24, maxW)
  if (ctx.measureText(s).width <= w) return s
  let t = s
  while (t.length > 1 && ctx.measureText(`${t}…`).width > w) t = t.slice(0, -1)
  return `${t}…`
}

/** 序号 + 日期 行 */
function metaOf(ev, index) {
  const dateStr = fmtDate(ev.date, ev.hasTime)
  return opts.value.showIndex ? `#${String(index).padStart(2, '0')}  ${dateStr}` : dateStr
}

/** 单个文本块的最大高度上界（1 行日期 + 2 行标题 + 2 行说明） */
function maxBlockHeight(fs) {
  const hasDetail = opts.value.showDetail && eventList.value.some(e => e.detail)
  return Math.ceil(1.5 * (fs - 2 + 2 * fs + (hasDetail ? 2 * (fs - 2) : 0)))
}

/**
 * 绘制一个事件的文本块
 * o = { x, y, dir: 'right'|'left'|'up'|'down', boxW, metaW, fs, c, index, gap, metaX }
 */
function drawEventText(ctx, ev, o) {
  const { x, y, dir, boxW, fs, c } = o
  const gap = o.gap || 16
  const metaFont = `${fs - 2}px ${MONO}`
  const meta = fitText(ctx, metaOf(ev, o.index), o.metaW || boxW, metaFont)

  // 日期单独画在轴的另一侧（垂直非交替布局）
  if (typeof o.metaX === 'number') {
    ctx.font = metaFont
    ctx.fillStyle = c.muted
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(meta, o.metaX, y)
  }

  const lines = []
  if (typeof o.metaX !== 'number') lines.push({ text: meta, size: fs - 2, color: c.muted })
  wrapText(ctx, ev.title, boxW, 2, `bold ${fs}px ${MONO}`).forEach(t =>
    lines.push({ text: t, size: fs, color: c.text, bold: true })
  )
  if (opts.value.showDetail && ev.detail) {
    wrapText(ctx, ev.detail, boxW, 2, `${fs - 2}px ${MONO}`).forEach(t =>
      lines.push({ text: t, size: fs - 2, color: c.muted })
    )
  }
  if (!lines.length) return

  const lh = size => Math.round(size * 1.5)
  const totalH = lines.reduce((a, l) => a + lh(l.size), 0)

  let tx
  let top
  if (dir === 'right' || dir === 'left') {
    // dir 表示标签位于轴的哪一侧：右侧左对齐、左侧右对齐
    ctx.textAlign = dir === 'right' ? 'left' : 'right'
    tx = x
    top = y - totalH / 2
  } else {
    ctx.textAlign = 'center'
    tx = x
    top = dir === 'up' ? y - gap - totalH : y + gap
  }

  ctx.textBaseline = 'middle'
  lines.forEach(l => {
    ctx.font = `${l.bold ? 'bold ' : ''}${l.size}px ${MONO}`
    ctx.fillStyle = l.color
    ctx.fillText(l.text, tx, top + lh(l.size) / 2)
    top += lh(l.size)
  })
}

function drawVertical(ctx, evs, c, plan) {
  const n = evs.length
  const fs = fontSize.value
  const step = plan.step
  const padTop = plan.padTop

  const alternating = opts.value.alternate
  const metaFont = `${fs - 2}px ${MONO}`

  // 非交替布局：左侧日期列宽度按实际文本测量，避免越界
  let axisX = Math.round(CW / 2)
  if (!alternating) {
    ctx.font = metaFont
    let maxMetaW = 0
    evs.forEach((ev, i) => {
      maxMetaW = Math.max(maxMetaW, ctx.measureText(metaOf(ev, i + 1)).width)
    })
    axisX = Math.min(Math.round(CW * 0.45), Math.max(140, Math.ceil(maxMetaW) + 42))
  }

  const firstY = padTop
  const lastY = padTop + (n - 1) * step

  ctx.font = `11px ${MONO}`
  ctx.fillStyle = c.dim
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`TIMELINE · ${n} EVENTS`, 16, 26)

  // 刻度线
  if (opts.value.showGrid) {
    ctx.save()
    ctx.setLineDash([3, 5])
    ctx.strokeStyle = c.line
    ctx.lineWidth = 1
    evs.forEach((ev, i) => {
      const y = firstY + i * step
      ctx.beginPath()
      ctx.moveTo(16, y + 0.5)
      ctx.lineTo(CW - 16, y + 0.5)
      ctx.stroke()
    })
    ctx.restore()
  }

  drawAxisLine(ctx, axisX, Math.max(32, firstY - 26), axisX, Math.min(CH - 12, lastY + 26), c)

  const boxW = alternating
    ? Math.max(150, Math.round(CW / 2) - 84)
    : Math.max(150, CW - axisX - 70)

  evs.forEach((ev, i) => {
    const y = firstY + i * step
    const toRight = alternating ? i % 2 === 0 : true

    if (alternating) {
      drawConnect(ctx, toRight ? axisX + 6 : axisX - 6, y, toRight ? axisX + 22 : axisX - 22, y, c)
      drawEventText(ctx, ev, {
        x: toRight ? axisX + 26 : axisX - 26,
        y,
        dir: toRight ? 'right' : 'left',
        boxW,
        metaW: boxW,
        fs,
        c,
        index: i + 1
      })
    } else {
      drawConnect(ctx, axisX + 6, y, axisX + 22, y, c)
      drawEventText(ctx, ev, {
        x: axisX + 26,
        y,
        dir: 'right',
        boxW,
        metaW: Math.max(40, axisX - 44),
        fs,
        c,
        index: i + 1,
        metaX: axisX - 22
      })
    }

    drawNode(ctx, axisX, y, c)
  })
}

function drawHorizontal(ctx, evs, c, plan) {
  const n = evs.length
  const fs = fontSize.value
  const step = plan.step
  const padL = plan.padL

  const axisY = Math.round(CH / 2)
  const firstX = padL
  const lastX = padL + (n - 1) * step

  ctx.font = `11px ${MONO}`
  ctx.fillStyle = c.dim
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`TIMELINE · ${n} EVENTS`, 16, 26)

  if (opts.value.showGrid) {
    ctx.save()
    ctx.setLineDash([3, 5])
    ctx.strokeStyle = c.line
    ctx.lineWidth = 1
    evs.forEach((ev, i) => {
      const x = firstX + i * step
      ctx.beginPath()
      ctx.moveTo(x + 0.5, 40)
      ctx.lineTo(x + 0.5, CH - 16)
      ctx.stroke()
    })
    ctx.restore()
  }

  drawAxisLine(ctx, firstX - 34, axisY, lastX + 34, axisY, c)

  const alternating = opts.value.alternate
  const boxW = Math.max(88, step - 26)

  evs.forEach((ev, i) => {
    const x = firstX + i * step
    const up = alternating ? i % 2 === 0 : true
    drawConnect(ctx, x, up ? axisY - 6 : axisY + 6, x, up ? axisY - 24 : axisY + 24, c)
    drawEventText(ctx, ev, {
      x,
      y: axisY,
      dir: up ? 'up' : 'down',
      boxW,
      metaW: boxW,
      fs,
      c,
      index: i + 1,
      gap: 26
    })
    drawNode(ctx, x, axisY, c)
  })
}

/* ================= 画布尺寸规划 ================= */

const MAX_CANVAS_H = 4000 // 垂直画布上限（DPR 2 后 8000px，浏览器安全范围）
const MAX_CANVAS_W = 8000 // 水平画布上限（DPR 2 后 16000px，浏览器安全范围）
const MIN_STEP_V = 30 // 垂直最小可读间距
const MIN_STEP_H = 74 // 水平最小可读间距

/** 依据事件数量与间距规划画布尺寸；超出上限时压缩间距，仍然放不下则只渲染前 K 条 */
function buildPlan(evs) {
  const n = evs.length

  if (layout.value === 'vertical') {
    const halfBlock = Math.ceil(maxBlockHeight(fontSize.value) / 2)
    const padTop = Math.max(64, halfBlock + 30)
    const padBottom = Math.max(88, halfBlock + 22)
    const maxInner = MAX_CANVAS_H - padTop - 30
    let step = spacing.value
    let draw = evs
    let truncated = false

    if (n > 1 && (n - 1) * step > maxInner) {
      step = maxInner / (n - 1)
      if (step < MIN_STEP_V) {
        step = MIN_STEP_V
        const fit = Math.max(1, Math.floor(maxInner / MIN_STEP_V) + 1)
        if (fit < n) {
          draw = evs.slice(0, fit)
          truncated = true
        }
      }
    }

    const h = Math.max(320, Math.min(MAX_CANVAS_H, padTop + (draw.length - 1) * step + padBottom))
    return { W: 760, H: Math.round(h), step, draw, truncated, padTop }
  }

  const halfBox = s => Math.max(40, (s - 26) / 2 + 18)
  const basePad = 80
  let step = spacing.value
  let draw = evs
  let truncated = false

  if (n > 1 && halfBox(step) * 2 + (n - 1) * step > MAX_CANVAS_W) {
    step = (MAX_CANVAS_W - basePad * 2) / (n - 1)
    if (step < MIN_STEP_H) {
      step = MIN_STEP_H
      const fit = Math.max(1, Math.floor((MAX_CANVAS_W - basePad * 2) / MIN_STEP_H) + 1)
      if (fit < n) {
        draw = evs.slice(0, fit)
        truncated = true
      }
    }
  }

  // 左右留白需容纳首尾节点居中标签的一半宽度
  let padL = Math.max(basePad, halfBox(step))
  if (padL * 2 + (draw.length - 1) * step > MAX_CANVAS_W) {
    padL = Math.max(basePad, (MAX_CANVAS_W - (draw.length - 1) * step) / 2)
  }

  const w = Math.max(480, Math.min(MAX_CANVAS_W, padL * 2 + (draw.length - 1) * step))
  return { W: Math.round(w), H: 440, step, draw, truncated, padL: Math.round(padL) }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const c = getColors()
  const evs = eventList.value

  if (!evs.length) {
    CW = 760
    CH = 300
    setupCanvas(canvas, CW, CH)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    ctx.fillStyle = c.bg
    ctx.fillRect(0, 0, CW, CH)
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = c.line
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, CW - 1, CH - 1)
    ctx.restore()
    ctx.fillStyle = c.dim
    ctx.font = `13px ${MONO}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('输入事件数据后显示时间线', CW / 2, CH / 2)
    info.value = ''
    return
  }

  const plan = buildPlan(evs)
  CW = plan.W
  CH = plan.H

  setupCanvas(canvas, CW, CH)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, CW, CH)

  if (layout.value === 'vertical') drawVertical(ctx, plan.draw, c, plan)
  else drawHorizontal(ctx, plan.draw, c, plan)

  // 外框
  ctx.save()
  ctx.strokeStyle = c.line
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, CW - 1, CH - 1)
  ctx.restore()

  const dates = evs.map(e => e.date.getTime())
  const span = spanText(new Date(Math.min(...dates)), new Date(Math.max(...dates)))
  info.value =
    `${evs.length} 个事件 · 时间跨度 ${span} · 画布 ${CW}×${CH} px（导出 ${CW * DPR}×${CH * DPR}）` +
    (plan.truncated ? ` · 画布仅绘制前 ${plan.draw.length} 条` : '')
}

/* ================= 交互动作 ================= */

async function copyText(text, msg) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    flashSuccess(msg)
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      flashSuccess(msg)
    } catch (e2) {
      setError('复制失败，请手动选择文本复制')
    }
  }
}

function copyInput() {
  const text = raw.value
  if (!text || !text.trim()) {
    setError('输入为空，没有可复制的内容')
    return
  }
  setError('')
  copyText(text, '已复制输入内容')
}

function copyOutput() {
  const text = outputText.value
  if (!text) {
    setError('暂无输出内容')
    return
  }
  setError('')
  copyText(text, '已复制事件列表')
}

async function copyImage() {
  if (!eventList.value.length) {
    setError('暂无时间线可复制')
    return
  }
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob || !window.ClipboardItem) throw new Error('unsupported')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    setError('')
    flashSuccess('已复制时间线图片')
  } catch (e) {
    setError('当前浏览器不支持复制图片，请使用「导出 PNG」')
  }
}

function exportPng() {
  const canvas = canvasRef.value
  if (!canvas || !eventList.value.length) {
    setError('暂无时间线可导出')
    return
  }
  setError('')
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `timeline-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  flashSuccess('已导出 PNG 图片')
}

function loadSample() {
  raw.value = SAMPLE
  setError('')
}

function clearAll() {
  raw.value = ''
  eventList.value = []
  outputText.value = ''
  info.value = ''
  warn.value = ''
  setError('')
  flashSuccess('已清空')
  scheduleRender()
}

/* ================= 生命周期 ================= */

watch(raw, () => {
  clearTimeout(parseTimer)
  parseTimer = setTimeout(parse, 180)
})

watch(sortMode, () => parse())

watch([layout, theme, nodeStyle, spacing, fontSize], () => scheduleRender())
watch(opts, () => scheduleRender(), { deep: true })

onMounted(() => {
  parse()
  nextTick(() => render())
})
</script>

<style scoped>
.hint {
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  border-left: 2px solid var(--line);
  padding-left: 8px;
}

.hint code {
  color: var(--green);
  background: var(--green-soft);
  padding: 0 4px;
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}

.theme-name {
  display: inline-flex;
  align-items: center;
}

.theme-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border: 1px solid var(--line);
}

.canvas-outer {
  position: relative;
}

.canvas-wrapper {
  overflow: auto;
  max-height: 68vh;
  border: 1px solid var(--line);
  background: var(--panel-2);
  min-height: 200px;
}

.canvas-wrapper canvas {
  display: block;
}

.canvas-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 2px 6px;
}

.canvas-copy:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.tl-info {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  word-break: break-all;
}

.tl-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tl-list-title {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 8px;
  transition: all 0.2s;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.tl-list {
  margin: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 10px 12px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text);
  max-height: 220px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.tl-list.tl-empty {
  color: var(--dim);
}

@media (max-width: 640px) {
  .hint {
    font-size: 11px;
  }

  .canvas-wrapper {
    max-height: 60vh;
  }

  .tl-list {
    font-size: 11px;
    max-height: 180px;
  }
}
</style>
