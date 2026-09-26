<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🦠 生命游戏</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">网格大小：{{ gridSize }} × {{ gridSize }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="gridSize" min="16" max="100" step="1" />
              <span class="range-value">{{ gridSize }}</span>
            </div>

            <label class="tool-label">播放速度：{{ speed }} 代/秒</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="speed" min="1" max="60" step="1" />
              <span class="range-value">{{ speed }}/s</span>
            </div>

            <label class="tool-label">随机填充密度：{{ density }}%</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="density" min="5" max="90" step="1" />
              <span class="range-value">{{ density }}%</span>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="wrap" />
                <span>边界环绕（环面）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showGrid" />
                <span>显示网格线</span>
              </label>
            </div>

            <label class="tool-label">图案预设：</label>
            <div class="preset-chips">
              <button v-for="p in patternList" :key="p.key" class="preset-chip" @click="placePattern(p.key)">
                {{ p.name }}
              </button>
            </div>
          </div>

          <!-- 右栏：画布预览 -->
          <div class="tool-col">
            <label class="tool-label">画布预览：</label>
            <div class="canvas-wrapper">
              <canvas
                ref="canvasRef"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @pointerleave="onPointerLeave"></canvas>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
            </div>
            <div class="canvas-hint">点击切换细胞，按住拖拽连续绘制（从死细胞开始 = 画，从活细胞开始 = 擦除）</div>
            <div class="stats-row">
              <span>第 {{ gen }} 代</span>
              <span>活细胞 {{ live }}</span>
              <span :class="running ? 'stat-running' : 'stat-paused'">{{ running ? '● 运行中' : '○ 已暂停' }}</span>
            </div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="toggleRun">{{ running ? '⏸ 暂停' : '▶ 播放' }}</button>
          <button class="tool-button" @click="stepBtn" :disabled="running">⏭ 单步</button>
          <button class="tool-button" @click="randomFill">🎲 随机</button>
          <button class="tool-button danger" @click="clearBoard">🗑 清空</button>
        </div>
        <div class="button-group button-group-2">
          <button class="tool-button" @click="downloadPng">⬇ 导出 PNG</button>
          <button class="tool-button" @click="copyImage">📋 复制画布图片</button>
        </div>

        <div class="rule-note">
          <span class="rule-title">生命规则 B3/S23</span>
          <span>活细胞周围少于 2 或多于 3 个活邻居 → 死亡；死细胞周围恰有 3 个活邻居 → 复活。</span>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 常量与图案库 ---------- */

const DR = [-1, -1, -1, 0, 0, 1, 1, 1]
const DC = [-1, 0, 1, -1, 1, -1, 0, 1]

const d = (n) => '.'.repeat(n)
const PATTERNS = {
  glider: {
    name: '滑翔机',
    rows: ['.O.', '..O', 'OOO']
  },
  lwss: {
    name: '轻型飞船',
    rows: ['.O..O', 'O....', 'O...O', 'OOOO.']
  },
  toad: {
    name: '蟾蜍',
    rows: ['.OOO', 'OOO.']
  },
  rpento: {
    name: 'R-五连骨牌',
    rows: ['.OO', 'OO.', '.O.']
  },
  gosper: {
    name: '滑翔机枪',
    rows: [
      d(24) + 'O' + d(11),
      d(22) + 'O.O' + d(11),
      d(12) + 'OO' + d(6) + 'OO' + d(12) + 'OO',
      d(11) + 'O' + d(3) + 'O' + d(4) + 'OO' + d(12) + 'OO',
      'OO' + d(8) + 'O' + d(5) + 'O' + d(3) + 'OO' + d(14),
      'OO' + d(8) + 'O' + d(3) + 'O.OO' + d(4) + 'O.O' + d(11),
      d(10) + 'O' + d(5) + 'O' + d(7) + 'O' + d(11),
      d(11) + 'O' + d(3) + 'O' + d(20),
      d(12) + 'OO' + d(22)
    ]
  }
}
const patternList = [
  { key: 'glider', name: '滑翔机' },
  { key: 'lwss', name: '轻型飞船' },
  { key: 'toad', name: '蟾蜍' },
  { key: 'rpento', name: 'R-五连骨牌' },
  { key: 'gosper', name: '滑翔机枪' }
]

/* ---------- 状态 ---------- */

const canvasRef = ref(null)
const gridSize = ref(40)
const speed = ref(12)
const density = ref(25)
const wrap = ref(true)
const showGrid = ref(true)
const running = ref(false)
const gen = ref(0)
const live = ref(0)
const error = ref('')
const success = ref('')

/* 非响应式内部状态 */
let board = null // { cur, alt, cols, rows }
let runTimer = null
let dragging = false
let brushVal = 0
let hoverCell = null
let successTimer = null
let errorTimer = null
let resizeObserver = null
let themeObserver = null

/* Canvas 配色（从 CSS 变量读取，随主题切换刷新） */
let colBg = '#0f1317'
let colCell = '#9dff6b'
let colGrid = 'rgba(48,54,61,0.4)'
let colHover = 'rgba(201,209,217,0.6)'

/* ---------- 工具函数 ---------- */

function readCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function parseRgb(s, fb) {
  if (!s) return fb
  s = String(s).trim()
  if (s[0] === '#') {
    let h = s.slice(1)
    if (h.length === 3) h = h.split('').map((x) => x + x).join('')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const parts = m[1].split(/[,\s/]+/).map(Number)
    return [parts[0] || fb[0], parts[1] || fb[1], parts[2] || fb[2]]
  }
  return fb
}

function captureColors() {
  colBg = readCssVar('--panel-2', '#0f1317')
  colCell = readCssVar('--green', '#9dff6b')
  const line = parseRgb(readCssVar('--line', '#30363d'), [48, 54, 61])
  const text = parseRgb(readCssVar('--text', '#c9d1d9'), [201, 209, 217])
  colGrid = `rgba(${line[0]},${line[1]},${line[2]},0.45)`
  colHover = `rgba(${text[0]},${text[1]},${text[2]},0.6)`
}

/* ---------- 棋盘 ---------- */

function makeBoard(size) {
  board = {
    cur: new Uint8Array(size * size),
    alt: new Uint8Array(size * size),
    cols: size,
    rows: size
  }
}

function resizeBoard(size) {
  const old = board
  const nb = {
    cur: new Uint8Array(size * size),
    alt: new Uint8Array(size * size),
    cols: size,
    rows: size
  }
  const mw = Math.min(old.cols, size)
  const mh = Math.min(old.rows, size)
  for (let r = 0; r < mh; r++) {
    for (let c = 0; c < mw; c++) {
      nb.cur[r * size + c] = old.cur[r * old.cols + c]
    }
  }
  board = nb
}

function countLive() {
  const a = board.cur
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i]) n++
  return n
}

function setCellAt(r, c, val) {
  const b = board
  const i = r * b.cols + c
  if (i < 0 || i >= b.cur.length) return
  if (b.cur[i] === val) return
  b.cur[i] = val
  live.value += val ? 1 : -1
}

/* ---------- 演化 ---------- */

function computeNext() {
  const b = board
  const W = b.cols
  const H = b.rows
  const src = b.cur
  const dst = b.alt
  const wrapEnabled = wrap.value
  let liveN = 0
  let changedN = 0
  for (let r = 0; r < H; r++) {
    const rowBase = r * W
    for (let c = 0; c < W; c++) {
      let nb = 0
      for (let k = 0; k < 8; k++) {
        let nr = r + DR[k]
        let nc = c + DC[k]
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) {
          if (!wrapEnabled) continue
          nr = (nr + H) % H
          nc = (nc + W) % W
        }
        if (src[nr * W + nc]) nb++
      }
      const i = rowBase + c
      const cur = src[i]
      let nxt = 0
      if (cur) {
        if (nb === 2 || nb === 3) nxt = 1
      } else if (nb === 3) {
        nxt = 1
      }
      dst[i] = nxt
      if (nxt) liveN++
      if (nxt !== cur) changedN++
    }
  }
  b.cur = dst
  b.alt = src
  live.value = liveN
  return changedN
}

function advance() {
  const changed = computeNext()
  gen.value++
  render()
  return changed
}

function stopRun() {
  running.value = false
  clearTimeout(runTimer)
}

function scheduleRun() {
  clearTimeout(runTimer)
  const interval = Math.max(16, Math.round(1000 / speed.value))
  runTimer = setTimeout(runTick, interval)
}

function runTick() {
  if (!running.value) return
  const changed = advance()
  if (live.value === 0) {
    stopRun()
    flashSuccess('所有细胞死亡，种群灭绝，已自动暂停')
    return
  }
  if (changed === 0) {
    stopRun()
    flashSuccess('种群已进入静止状态，已自动暂停')
    return
  }
  scheduleRun()
}

function toggleRun() {
  if (running.value) {
    stopRun()
    return
  }
  if (live.value === 0) {
    flashError('棋盘是空的：先点击 / 拖拽绘制、随机填充或放置一个图案')
    return
  }
  running.value = true
  scheduleRun()
}

function stepBtn() {
  if (running.value) return
  if (live.value === 0) {
    flashError('棋盘是空的：先点击 / 拖拽绘制、随机填充或放置一个图案')
    return
  }
  advance()
}

function randomFill() {
  stopRun()
  const a = board.cur
  const p = density.value / 100
  for (let i = 0; i < a.length; i++) a[i] = Math.random() < p ? 1 : 0
  live.value = countLive()
  gen.value = 0
  render()
  flashSuccess(`已随机填充（密度 ${density.value}%）`)
}

function clearBoard() {
  stopRun()
  board.cur.fill(0)
  board.alt.fill(0)
  live.value = 0
  gen.value = 0
  render()
}

function placePattern(key, silent) {
  stopRun()
  const p = PATTERNS[key]
  if (!p) return
  const W = board.cols
  const H = board.rows
  const h = p.rows.length
  const w = p.rows[0].length
  if (h > H || w > W) {
    if (!silent) {
      flashError(`图案「${p.name}」需要 ${w}×${h} 的网格，当前 ${W}×${H} 放不下，请调大网格`)
    }
    return
  }
  board.cur.fill(0)
  board.alt.fill(0)
  const r0 = Math.floor((H - h) / 2)
  const c0 = Math.floor((W - w) / 2)
  for (let r = 0; r < h; r++) {
    const line = p.rows[r]
    for (let c = 0; c < line.length; c++) {
      if (line[c] === 'O') board.cur[(r0 + r) * W + (c0 + c)] = 1
    }
  }
  live.value = countLive()
  gen.value = 0
  render()
  if (!silent) flashSuccess(`已放置图案「${p.name}」`)
}

/* ---------- 画布绘制 ---------- */

function render() {
  const cv = canvasRef.value
  if (!cv || !board) return
  const w = cv.clientWidth
  if (w < 10) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  const px = Math.round(w * dpr)
  if (cv.width !== px) {
    cv.width = px
    cv.height = px
  }
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = colBg
  ctx.fillRect(0, 0, w, w)

  const b = board
  const W = b.cols
  const H = b.rows
  const cells = b.cur
  const cs = w / Math.max(W, H)

  ctx.fillStyle = colCell
  const inset = cs > 6 ? 0.6 : Math.max(0.25, cs * 0.08)
  const s = cs - inset * 2
  for (let r = 0; r < H; r++) {
    const rowBase = r * W
    const y = r * cs + inset
    for (let c = 0; c < W; c++) {
      if (cells[rowBase + c]) ctx.fillRect(c * cs + inset, y, s, s)
    }
  }

  if (showGrid.value) {
    ctx.strokeStyle = colGrid
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < W; i++) {
      const x = Math.round(i * cs) + 0.5
      ctx.moveTo(x, 0)
      ctx.lineTo(x, w)
    }
    for (let j = 1; j < H; j++) {
      const y = Math.round(j * cs) + 0.5
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke()
  }

  if (hoverCell && hoverCell.r >= 0 && hoverCell.r < H && hoverCell.c >= 0 && hoverCell.c < W) {
    ctx.strokeStyle = colHover
    ctx.lineWidth = 1.5
    ctx.strokeRect(hoverCell.c * cs + 0.75, hoverCell.r * cs + 0.75, cs - 1.5, cs - 1.5)
  }
}

/* ---------- 鼠标 / 触摸交互 ---------- */

function getCell(e) {
  const cv = canvasRef.value
  if (!cv) return null
  const rect = cv.getBoundingClientRect()
  const b = board
  const c = Math.floor(((e.clientX - rect.left) / rect.width) * b.cols)
  const r = Math.floor(((e.clientY - rect.top) / rect.height) * b.rows)
  if (c < 0 || r < 0 || c >= b.cols || r >= b.rows) return null
  return { r, c }
}

function onPointerDown(e) {
  const cv = canvasRef.value
  const cell = getCell(e)
  if (!cell || !cv) return
  try {
    cv.setPointerCapture(e.pointerId)
  } catch (err) {
    /* 忽略捕获失败 */
  }
  dragging = true
  const idx = cell.r * board.cols + cell.c
  brushVal = board.cur[idx] ? 0 : 1
  hoverCell = null
  setCellAt(cell.r, cell.c, brushVal)
  render()
}

function onPointerMove(e) {
  const cell = getCell(e)
  if (dragging) {
    if (cell) {
      setCellAt(cell.r, cell.c, brushVal)
      render()
    }
    return
  }
  const key = cell ? cell.r * board.cols + cell.c : null
  const oldKey = hoverCell ? hoverCell.r * board.cols + hoverCell.c : null
  if (key !== oldKey) {
    hoverCell = cell
    render()
  }
}

function onPointerUp() {
  dragging = false
  render()
}

function onPointerLeave() {
  if (dragging) return
  if (hoverCell) {
    hoverCell = null
    render()
  }
}

/* ---------- 复制 / 导出 ---------- */

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2600)
}

function flashError(msg) {
  error.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (error.value = ''), 3200)
}

async function copyImage() {
  const cv = canvasRef.value
  if (!cv) return
  try {
    const blob = await new Promise((resolve, reject) => {
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error('png 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      flashError('当前浏览器不支持复制图片，请使用「导出 PNG」')
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('画布图片已复制到剪贴板')
  } catch (err) {
    flashError('复制图片失败：' + (err && err.message ? err.message : '未知错误'))
  }
}

function downloadPng() {
  const cv = canvasRef.value
  if (!cv) return
  const link = document.createElement('a')
  link.download = `game_of_life_${board.cols}x${board.rows}_gen${gen.value}.png`
  link.href = cv.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

/* ---------- 监听与生命周期 ---------- */

watch(gridSize, (v) => {
  stopRun()
  resizeBoard(v)
  live.value = countLive()
  gen.value = 0
  render()
})

watch(speed, () => {
  if (running.value) scheduleRun()
})

watch(showGrid, () => render())

onMounted(() => {
  captureColors()
  makeBoard(gridSize.value)
  placePattern('glider', true)

  const cv = canvasRef.value
  if (cv) {
    resizeObserver = new ResizeObserver(() => render())
    resizeObserver.observe(cv)
    render()
  }

  /* 主题切换（data-theme 属性变化）时刷新画布配色 */
  themeObserver = new MutationObserver(() => {
    captureColors()
    render()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
})

onBeforeUnmount(() => {
  stopRun()
  clearTimeout(successTimer)
  clearTimeout(errorTimer)
  if (resizeObserver) resizeObserver.disconnect()
  if (themeObserver) themeObserver.disconnect()
})
</script>

<style scoped>
/* 滑动条行 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-wrapper .range-input {
  flex: 1;
  min-width: 0;
  margin: 6px 0;
}

.range-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  min-width: 42px;
  text-align: right;
  flex-shrink: 0;
}

.options-group {
  margin-top: 6px;
}

/* 图案预设 */
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-chip {
  padding: 6px 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-chip:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
  color: var(--green);
}

/* 预览区 */
.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
}

canvas {
  width: 100%;
  max-width: 520px;
  height: auto;
  aspect-ratio: 1 / 1;
  background: var(--panel-2);
  border: 1px solid var(--line);
  display: block;
  cursor: crosshair;
  touch-action: none;
  border-radius: 0;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
  border-radius: 0;
}

.canvas-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin-top: 6px;
}

/* 状态统计行 */
.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
}

.stat-running {
  color: var(--green);
}

.stat-paused {
  color: var(--red);
}

/* 规则说明 */
.rule-note {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 4px 0 0;
  padding: 10px 12px;
  border: 1px dashed var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.rule-title {
  color: var(--green);
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 38px;
  }
  .canvas-hint,
  .stats-row,
  .rule-note {
    font-size: 11px;
  }
}
</style>
