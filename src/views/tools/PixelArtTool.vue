<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖌️ 像素画编辑器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左栏：画布 -->
          <div class="tool-col">
            <label class="tool-label">画布预览</label>
            <div class="canvas-wrap">
              <canvas
                ref="canvasRef"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointerleave="onPointerUp"
                @contextmenu.prevent
              ></canvas>
            </div>
            <div class="canvas-info">
              <span class="info-chip">网格 {{ gridSize }}×{{ gridSize }}</span>
              <span class="info-chip">分辨率 {{ gridSize * cellSize }}×{{ gridSize * cellSize }}px</span>
              <label class="checkbox-label grid-toggle">
                <input type="checkbox" v-model="showGrid" @change="render" />
                <span>显示网格</span>
              </label>
            </div>
          </div>

          <!-- 右栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">绘制工具</label>
            <div class="button-group button-group-4 tool-picker">
              <button
                v-for="t in toolList"
                :key="t.id"
                :class="['tool-button', { primary: tool === t.id }]"
                @click="selectTool(t.id)"
              >{{ t.label }}</button>
            </div>

            <label class="tool-label">调色板</label>
            <div class="palette">
              <button
                v-for="c in palette"
                :key="c"
                :class="['swatch', { active: color === c }]"
                :style="{ backgroundColor: c }"
                :title="c"
                @click="pickColor(c)"
              ></button>
              <label
                class="swatch custom"
                :class="{ active: !palette.includes(color) }"
                :style="{ backgroundColor: color }"
                title="自定义颜色"
              >
                <input type="color" v-model="color" @input="render" />
              </label>
            </div>
            <div class="current-color">
              <span class="current-color-label">当前颜色</span>
              <span class="current-color-hex">{{ color }}</span>
            </div>

            <label class="tool-label">画布大小</label>
            <input
              type="range"
              v-model.number="gridSize"
              min="8"
              max="64"
              step="1"
              class="range-input"
              @input="onSizeInput"
              @change="onSizeCommit"
            />
            <div class="size-hint">拖动改变网格大小（{{ gridSize }}×{{ gridSize }}，原图自动缩放保留）</div>

            <label class="tool-label">快捷键</label>
            <div class="keys-hint">
              <span class="key">B</span> 画笔
              <span class="key">E</span> 橡皮
              <span class="key">F</span> 填充
              <span class="key">I</span> 取色
              <span class="key">Ctrl+Z</span> 撤销
              <span class="key">Ctrl+Y</span> 重做
            </div>
          </div>
        </div>

        <!-- 操作按钮组（双栏外） -->
        <div class="button-group button-group-4">
          <button class="tool-button" @click="undo" :disabled="!canUndo">↩ 撤销</button>
          <button class="tool-button" @click="redo" :disabled="!canRedo">↪ 重做</button>
          <button class="tool-button danger" @click="clearCanvas">🗑 清空</button>
          <button class="tool-button primary" @click="downloadPng">⬇ 导出 PNG</button>
        </div>
        <div class="button-group button-group-2">
          <button class="tool-button" @click="copyImage">📋 复制图片</button>
          <button class="tool-button" @click="randomFill">🎲 随机填充</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="status" class="status-success">✅ {{ status }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/* ==================== 状态 ==================== */
const gridSize = ref(16)
const cellSize = ref(16)          // 每格渲染像素
const tool = ref('brush')
const color = ref('#9dff6b')      // 默认画笔色 = 主题绿
const showGrid = ref(true)
const status = ref('')
const error = ref('')

const canvasRef = ref(null)

const toolList = [
  { id: 'brush', label: '✏️ 画笔' },
  { id: 'eraser', label: '🧽 橡皮' },
  { id: 'fill', label: '🪣 填充' },
  { id: 'picker', label: '💉 取色' }
]

const palette = [
  '#000000', '#444444', '#888888', '#ffffff',
  '#ff4444', '#ff8800', '#ffee00', '#88ff44',
  '#44ff88', '#00ddcc', '#4488ff', '#aa44ff',
  '#ff44aa', '#dd8844', '#88aa44', '#445588'
]

/* grid[y][x] = 颜色字符串 | null */
const grid = ref([])
const undoStack = ref([])
const redoStack = ref([])

const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

let drawing = false
let lastPos = null
let hoverCell = null
let sizeDragging = false
let statusTimer = null

/* ==================== 工具函数 ==================== */
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function initGrid(size = gridSize.value) {
  grid.value = Array.from({ length: size }, () => Array(size).fill(null))
}

function snapshot() {
  return { size: gridSize.value, grid: grid.value.map(r => [...r]) }
}

function restore(snap) {
  gridSize.value = snap.size
  grid.value = snap.grid.map(r => [...r])
  render()
}

function pushHistory() {
  undoStack.value.push(snapshot())
  if (undoStack.value.length > 60) undoStack.value.shift()
  redoStack.value = []
}

function undo() {
  const snap = undoStack.value.pop()
  if (!snap) return
  redoStack.value.push(snapshot())
  restore(snap)
}

function redo() {
  const snap = redoStack.value.pop()
  if (!snap) return
  undoStack.value.push(snapshot())
  restore(snap)
}

function showStatus(msg) {
  status.value = msg
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.value = '' }, 3000)
}

function showError(msg) {
  error.value = msg
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { error.value = '' }, 4000)
}

function cellFromEvent(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * gridSize.value)
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * gridSize.value)
  if (x < 0 || y < 0 || x >= gridSize.value || y >= gridSize.value) return null
  return { x, y }
}

function paintCell(x, y) {
  const g = grid.value
  const target = tool.value === 'eraser' ? null : color.value
  if (g[y][x] === target) return
  g[y][x] = target
}

function floodFill(sx, sy) {
  const g = grid.value
  const n = gridSize.value
  const targetColor = g[sy][sx]
  const newColor = color.value
  if (targetColor === newColor) return
  const stack = [[sx, sy]]
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= n || y >= n) continue
    if (g[y][x] !== targetColor) continue
    g[y][x] = newColor
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
}

/* Bresenham 直线插值，保证快速拖动时线条连续 */
function lineBetween(x0, y0, x1, y1, fn) {
  let dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  while (true) {
    fn(x0, y0)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x0 += sx }
    if (e2 < dx) { err += dx; y0 += sy }
  }
}

/* ==================== 渲染 ==================== */
function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const n = gridSize.value
  const px = cellSize.value
  canvas.width = n * px
  canvas.height = n * px

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  ctx.fillStyle = cssVar('--panel-2', '#111111')
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const g = grid.value
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const c = g[y] && g[y][x]
      if (c) {
        ctx.fillStyle = c
        ctx.fillRect(x * px, y * px, px, px)
      }
    }
  }

  if (showGrid.value) {
    ctx.strokeStyle = cssVar('--line', '#333333')
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < n; i++) {
      ctx.moveTo(i * px + 0.5, 0)
      ctx.lineTo(i * px + 0.5, canvas.height)
      ctx.moveTo(0, i * px + 0.5)
      ctx.lineTo(canvas.width, i * px + 0.5)
    }
    ctx.stroke()
  }

  if (hoverCell && (tool.value === 'brush' || tool.value === 'eraser')) {
    ctx.strokeStyle = 'rgba(157,255,107,0.85)'
    ctx.lineWidth = 2
    ctx.strokeRect(hoverCell.x * px + 1, hoverCell.y * px + 1, px - 2, px - 2)
  }
}

/* ==================== 指针交互 ==================== */
function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  e.preventDefault()
  const cell = cellFromEvent(e)
  if (!cell) return

  if (tool.value === 'picker') {
    const c = grid.value[cell.y] && grid.value[cell.y][cell.x]
    if (c) {
      color.value = c
      showStatus(`已取色 ${c}`)
    } else {
      showError('该格为空白，无法取色')
    }
    return
  }

  drawing = true
  lastPos = cell
  try { canvasRef.value.setPointerCapture(e.pointerId) } catch (_) {}

  if (tool.value === 'fill') {
    pushHistory()
    floodFill(cell.x, cell.y)
    render()
  } else {
    pushHistory()
    paintCell(cell.x, cell.y)
    render()
  }
}

function onPointerMove(e) {
  const cell = cellFromEvent(e)
  if (!cell) return
  if (drawing && tool.value !== 'fill') {
    if (lastPos) {
      lineBetween(lastPos.x, lastPos.y, cell.x, cell.y, (x, y) => paintCell(x, y))
    } else {
      paintCell(cell.x, cell.y)
    }
    lastPos = cell
    render()
  } else {
    hoverCell = cell
    render()
  }
}

function onPointerUp() {
  if (!drawing) {
    hoverCell = null
    render()
  }
  drawing = false
  lastPos = null
}

/* ==================== 操作 ==================== */
function selectTool(id) {
  tool.value = id
}

function pickColor(c) {
  color.value = c
}

function clearCanvas() {
  pushHistory()
  initGrid()
  render()
  showStatus('画布已清空')
}

function randomFill() {
  pushHistory()
  const n = gridSize.value
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      grid.value[y][x] = Math.random() < 0.4
        ? palette[Math.floor(Math.random() * palette.length)]
        : null
    }
  }
  render()
  showStatus('已随机填充')
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  render()
  try {
    const link = document.createElement('a')
    link.download = `pixel-art-${gridSize.value}x${gridSize.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showStatus('PNG 已导出')
  } catch (_) {
    showError('导出失败，浏览器不支持')
  }
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  render()
  try {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
    if (!blob) throw new Error('toBlob failed')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    showStatus('图片已复制到剪贴板')
  } catch (_) {
    showError('复制失败，请改用「导出 PNG」下载')
  }
}

/* ==================== 画布大小 ==================== */
function resizeGrid(newSize) {
  const old = grid.value
  const oldSize = old.length || 0
  const ng = Array.from({ length: newSize }, (_, y) =>
    Array.from({ length: newSize }, (_, x) => {
      if (oldSize === 0) return null
      const ox = Math.min(oldSize - 1, Math.floor((x * oldSize) / newSize))
      const oy = Math.min(oldSize - 1, Math.floor((y * oldSize) / newSize))
      return (old[oy] && old[oy][ox]) || null
    })
  )
  grid.value = ng
  render()
}

function onSizeInput() {
  if (!sizeDragging) {
    sizeDragging = true
    pushHistory()
  }
  resizeGrid(gridSize.value)
}

function onSizeCommit() {
  sizeDragging = false
}

/* ==================== 键盘快捷键 ==================== */
function onKeydown(e) {
  const tag = e.target && e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    if (!(e.target.type === 'color')) return
  }
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase()
    if (k === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    } else if (k === 'y') {
      e.preventDefault()
      redo()
    }
    return
  }
  switch (e.key.toLowerCase()) {
    case 'b': tool.value = 'brush'; break
    case 'e': tool.value = 'eraser'; break
    case 'f': tool.value = 'fill'; break
    case 'i': tool.value = 'picker'; break
  }
}

/* ==================== 生命周期 ==================== */
onMounted(() => {
  initGrid()
  color.value = cssVar('--green', '#9dff6b')
  render()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(statusTimer)
})
</script>

<style scoped>
/* ===== 画布 ===== */
.canvas-wrap {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  display: flex;
  justify-content: center;
}

.canvas-wrap canvas {
  width: 100%;
  max-width: 480px;
  height: auto;
  aspect-ratio: 1;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: crosshair;
  touch-action: none;
  background: var(--panel-2);
  user-select: none;
  -webkit-user-select: none;
}

.canvas-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.info-chip {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 4px 8px;
}

.grid-toggle {
  margin-left: auto;
  font-size: 13px;
}

/* ===== 工具选择 ===== */
.tool-picker {
  margin: 0 0 4px;
}

/* ===== 调色板 ===== */
.palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.swatch {
  aspect-ratio: 1;
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: all 0.15s;
}

.swatch:hover {
  transform: scale(1.08);
  border-color: var(--text);
}

.swatch.active {
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
  outline: 1px solid var(--green);
  outline-offset: 1px;
}

.swatch.custom input[type="color"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}

.current-color {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 12px;
}

.current-color-label {
  color: var(--muted);
}

.current-color-hex {
  color: var(--green);
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 3px 8px;
}

/* ===== 提示 ===== */
.size-hint,
.keys-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
}

.key {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: var(--green);
  padding: 0 6px;
  margin: 0 2px;
  font-size: 11px;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .palette {
    gap: 5px;
  }
  .grid-toggle {
    margin-left: 0;
  }
}
</style>
