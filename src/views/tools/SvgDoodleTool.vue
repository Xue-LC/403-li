<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>✏️ SVG 涂鸦板</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ========== 双栏：左设置 / 右画布 ========== -->
        <div class="tool-two-col">
          <!-- 左栏：绘图设置 -->
          <div class="tool-col">
            <label class="tool-label">绘图工具：</label>
            <div class="mode-grid">
              <button
                v-for="m in modes"
                :key="m.key"
                type="button"
                class="mode-btn"
                :class="{ active: mode === m.key }"
                :title="m.hint"
                @click="setMode(m.key)"
              >
                <span class="mode-icon">{{ m.icon }}</span>
                <span class="mode-name">{{ m.name }}</span>
              </button>
            </div>

            <label class="tool-label">线条颜色：</label>
            <div class="color-row">
              <input type="color" class="color-input" v-model="style.stroke" title="自定义颜色" />
              <div class="swatches">
                <button
                  v-for="c in palette"
                  :key="c"
                  type="button"
                  class="swatch"
                  :class="{ active: sameColor(c, style.stroke) }"
                  :style="{ background: c }"
                  :title="c"
                  @click="style.stroke = c"
                ></button>
              </div>
            </div>

            <label class="tool-label">线宽：{{ style.strokeWidth }} px</label>
            <input type="range" class="range-input" min="1" max="24" step="1" v-model.number="style.strokeWidth" />

            <label class="tool-label">填充方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="style.fillMode" value="none" />
                <span>无填充</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="style.fillMode" value="soft" />
                <span>半透明</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="style.fillMode" value="solid" />
                <span>实心</span>
              </label>
            </div>

            <label class="tool-label">网格与吸附：</label>
            <div class="opts-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showGrid" />
                <span>显示网格</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="snapToGrid" />
                <span>吸附网格</span>
              </label>
              <input
                class="num-input"
                type="number"
                min="2"
                max="100"
                step="1"
                v-model.number="gridSize"
                title="网格间距"
              />
            </div>

            <label class="tool-label">画布尺寸（viewBox）：</label>
            <div class="opts-row">
              <input class="num-input" type="number" min="50" max="2000" step="10" v-model.number="canvasW" />
              <span class="opts-sep">×</span>
              <input class="num-input" type="number" min="50" max="2000" step="10" v-model.number="canvasH" />
            </div>
          </div>

          <!-- 右栏：绘图区 -->
          <div class="tool-col">
            <label class="tool-label">绘制区（在下方区域绘制）：</label>
            <div class="canvas-frame" :style="{ aspectRatio: canvasW + ' / ' + canvasH }">
              <svg
                ref="svgRef"
                class="doodle-svg"
                :viewBox="`0 0 ${canvasW} ${canvasH}`"
                preserveAspectRatio="xMidYMid meet"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @dblclick="onDblClick"
                @contextmenu.prevent
              >
                <defs>
                  <pattern id="doodle-grid" :width="gridStep" :height="gridStep" patternUnits="userSpaceOnUse">
                    <path
                      class="grid-line"
                      :d="`M ${gridStep} 0 L 0 0 0 ${gridStep}`"
                      fill="none"
                      stroke-width="1"
                    />
                  </pattern>
                </defs>

                <rect
                  v-if="showGrid"
                  class="grid-rect"
                  :width="canvasW"
                  :height="canvasH"
                  fill="url(#doodle-grid)"
                />

                <!-- 已提交图元 -->
                <path
                  v-for="s in shapes"
                  :key="s.id"
                  :d="shapeToPath(s)"
                  :fill="fillOf(s)"
                  :fill-opacity="fillOpacityOf(s)"
                  :stroke="s.style.stroke"
                  :stroke-width="s.style.strokeWidth"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- 拖拽中的草稿 -->
                <path
                  v-if="draft"
                  class="draft-path"
                  :d="shapeToPath(draft)"
                  :fill="fillOf(draft)"
                  :fill-opacity="fillOpacityOf(draft)"
                  :stroke="draft.style.stroke"
                  :stroke-width="draft.style.strokeWidth"
                  stroke-dasharray="6 4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- 多点模式的预览 -->
                <path
                  v-if="pendingPreviewPath"
                  class="draft-path"
                  :d="pendingPreviewPath"
                  fill="none"
                  :stroke="style.stroke"
                  :stroke-width="style.strokeWidth"
                  stroke-dasharray="6 4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <circle
                  v-for="(p, i) in pending"
                  :key="'dot' + i"
                  class="pending-dot"
                  :cx="p.x"
                  :cy="p.y"
                  r="4"
                />
              </svg>

              <div v-if="!shapes.length && !pending.length && !draft" class="canvas-empty">
                <span>点击 / 拖拽画布开始绘制</span>
                <span class="canvas-empty-hint">{{ modeHint }}</span>
              </div>
            </div>

            <div class="canvas-meta">
              <span>图元：{{ shapes.length }}</span>
              <span>撤销栈：{{ past.length }}</span>
              <span>{{ activeMode.name }}</span>
            </div>
            <div class="mode-hint">💡 {{ modeHint }}</div>
          </div>
        </div>

        <!-- ========== 操作按钮（双栏之外） ========== -->
        <div class="button-group button-group-4">
          <button class="tool-button" :disabled="!canUndo" @click="undo">↩ 撤销</button>
          <button class="tool-button" :disabled="!canRedo" @click="redo">↪ 重做</button>
          <button class="tool-button" :disabled="!shapes.length" @click="removeLast">⌫ 删除</button>
          <button class="tool-button danger" :disabled="!shapes.length && !pending.length" @click="clearAll">🗑 清空</button>
        </div>

        <div v-if="isMultiClick" class="button-group button-group-2">
          <button class="tool-button primary" :disabled="pending.length < 2" @click="finishPath">
            ✓ 完成路径（Enter）
          </button>
          <button class="tool-button" :disabled="!pending.length" @click="cancelPending">
            ✕ 取消当前（Esc）
          </button>
        </div>

        <!-- ========== SVG 代码输出 ========== -->
        <label class="tool-label">SVG 代码：</label>
        <div class="input-with-copy">
          <textarea
            class="code-input output"
            readonly
            rows="8"
            :value="svgCode"
            placeholder="绘制图形后自动生成 SVG 代码..."
          ></textarea>
          <button class="copy-btn" title="复制 SVG 代码" @click="copyCode">📋</button>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" :disabled="!hasContent" @click="copyCode">📋 复制 SVG 代码</button>
          <button class="tool-button primary" :disabled="!hasContent" @click="downloadSvg">⬇ 导出 SVG 文件</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

defineOptions({ name: 'SvgDoodleTool' })

/* ---------------- 工具定义 ---------------- */
const modes = [
  { key: 'line', name: '直线', icon: '╱', hint: '按住并拖拽，从起点画到终点' },
  { key: 'rect', name: '矩形', icon: '▭', hint: '按住并拖拽出矩形范围' },
  { key: 'circle', name: '圆形', icon: '◯', hint: '拖拽：起点为圆心，拖出的距离为半径' },
  { key: 'ellipse', name: '椭圆', icon: '⬭', hint: '拖拽出椭圆的包围盒' },
  { key: 'polyline', name: '折线', icon: '⌇', hint: '逐点单击，双击或 Enter 完成' },
  { key: 'polygon', name: '多边形', icon: '⬠', hint: '逐点单击，双击或 Enter 闭合' },
  { key: 'quad', name: '二次贝塞尔', icon: '∿', hint: '依次点击：起点 → 控制点 → 终点' },
  { key: 'cubic', name: '三次贝塞尔', icon: '∾', hint: '依次点击：起点 → 控制点1 → 控制点2 → 终点' }
]

const palette = ['#9dff6b', '#c9ff8f', '#f5ea7a', '#f0c040', '#ff9d6b', '#ff6b7d', '#ffffff', '#8b949e']

/* ---------------- 状态 ---------------- */
const svgRef = ref(null)

const mode = ref('line')
const style = reactive({ stroke: '#9dff6b', strokeWidth: 3, fillMode: 'none' })

const shapes = ref([])
const past = ref([])
const future = ref([])

const draft = ref(null)
const pending = ref([])
const cursor = ref(null)
const drawing = ref(false)

const canvasW = ref(640)
const canvasH = ref(400)
const showGrid = ref(true)
const snapToGrid = ref(true)
const gridSize = ref(20)

const error = ref('')
const success = ref('')

let uid = 0

/* ---------------- 派生 ---------------- */
const activeMode = computed(() => modes.find(m => m.key === mode.value) || modes[0])
const modeHint = computed(() => activeMode.value.hint)
const isMultiClick = computed(() => ['polyline', 'polygon', 'quad', 'cubic'].includes(mode.value))
const canUndo = computed(() => past.value.length > 0)
const canRedo = computed(() => future.value.length > 0)
const hasContent = computed(() => shapes.value.length > 0)

const gridStep = computed(() => Math.max(2, Math.min(200, Number(gridSize.value) || 20)))

const fillOf = s => (s.style.fillMode === 'none' ? 'none' : s.style.stroke)
const fillOpacityOf = s => (s.style.fillMode === 'soft' ? 0.25 : s.style.fillMode === 'solid' ? 1 : 0)

/* 多点模式的预览路径 */
const pendingPreviewPath = computed(() => {
  if (!pending.value.length || !cursor.value) return ''
  const pts = pending.value
  const c = cursor.value
  if (mode.value === 'polyline' || mode.value === 'polygon') {
    return 'M ' + pts.map(fmtPt).join(' L ') + ' L ' + fmt(c.x) + ' ' + fmt(c.y)
  }
  if (mode.value === 'quad') {
    if (pts.length === 1) return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} L ${fmt(c.x)} ${fmt(c.y)}`
    return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} Q ${fmt(pts[1].x)} ${fmt(pts[1].y)} ${fmt(c.x)} ${fmt(c.y)}`
  }
  if (mode.value === 'cubic') {
    if (pts.length === 1) return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} L ${fmt(c.x)} ${fmt(c.y)}`
    if (pts.length === 2) {
      return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} Q ${fmt(pts[1].x)} ${fmt(pts[1].y)} ${fmt(c.x)} ${fmt(c.y)}`
    }
    return `M ${fmt(pts[0].x)} ${fmt(pts[0].y)} C ${fmt(pts[1].x)} ${fmt(pts[1].y)} ${fmt(pts[2].x)} ${fmt(pts[2].y)} ${fmt(c.x)} ${fmt(c.y)}`
  }
  return ''
})

/* ---------------- 工具函数 ---------------- */
const fmt = n => {
  const v = Math.round(Number(n) * 10) / 10
  return Number.isFinite(v) ? String(v) : '0'
}
const fmtPt = p => `${fmt(p.x)} ${fmt(p.y)}`
const clone = obj => JSON.parse(JSON.stringify(obj))
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const sameColor = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

function snap(p) {
  const step = gridStep.value
  if (!snapToGrid.value || step <= 1) return p
  return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step }
}

function clampPoint(p) {
  return {
    x: Math.max(0, Math.min(canvasW.value, p.x)),
    y: Math.max(0, Math.min(canvasH.value, p.y))
  }
}

/* 屏幕坐标 → viewBox 坐标 */
function toSvgPoint(e) {
  const el = svgRef.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return { x: 0, y: 0 }
  const x = ((e.clientX - rect.left) / rect.width) * canvasW.value
  const y = ((e.clientY - rect.top) / rect.height) * canvasH.value
  return snap(clampPoint({ x, y }))
}

function newStyle() {
  return { stroke: style.stroke, strokeWidth: Number(style.strokeWidth) || 1, fillMode: style.fillMode }
}

/* ---------------- 形状工厂 ---------------- */
function makeDraft(type, a, b) {
  const s = { id: ++uid, type, style: newStyle() }
  if (type === 'line') {
    s.x1 = a.x
    s.y1 = a.y
    s.x2 = b.x
    s.y2 = b.y
  } else if (type === 'rect') {
    s.x = Math.min(a.x, b.x)
    s.y = Math.min(a.y, b.y)
    s.w = Math.abs(b.x - a.x)
    s.h = Math.abs(b.y - a.y)
  } else if (type === 'circle') {
    s.cx = a.x
    s.cy = a.y
    s.r = dist(a, b)
  } else if (type === 'ellipse') {
    s.cx = (a.x + b.x) / 2
    s.cy = (a.y + b.y) / 2
    s.rx = Math.abs(b.x - a.x) / 2
    s.ry = Math.abs(b.y - a.y) / 2
  }
  if (type === 'rect' || type === 'ellipse') s.anchor = { x: a.x, y: a.y }
  return s
}

function makeMulti(type, pts) {
  const s = { id: ++uid, type, style: newStyle() }
  s.pts = pts.map(p => ({ x: p.x, y: p.y }))
  return s
}

/* ---------------- 形状 → path d ---------------- */
function shapeToPath(s) {
  if (!s) return ''
  switch (s.type) {
    case 'line':
      return `M ${fmt(s.x1)} ${fmt(s.y1)} L ${fmt(s.x2)} ${fmt(s.y2)}`
    case 'rect':
      return `M ${fmt(s.x)} ${fmt(s.y)} H ${fmt(s.x + s.w)} V ${fmt(s.y + s.h)} H ${fmt(s.x)} Z`
    case 'circle':
      return ellipsePath(s.cx, s.cy, s.r, s.r)
    case 'ellipse':
      return ellipsePath(s.cx, s.cy, s.rx, s.ry)
    case 'polyline':
      return 'M ' + s.pts.map(fmtPt).join(' L ')
    case 'polygon':
      return 'M ' + s.pts.map(fmtPt).join(' L ') + ' Z'
    case 'quad':
      return `M ${fmtPt(s.pts[0])} Q ${fmtPt(s.pts[1])} ${fmtPt(s.pts[2])}`
    case 'cubic':
      return `M ${fmtPt(s.pts[0])} C ${fmtPt(s.pts[1])} ${fmtPt(s.pts[2])} ${fmtPt(s.pts[3])}`
    default:
      return ''
  }
}

function ellipsePath(cx, cy, rx, ry) {
  const x1 = cx - rx
  const x2 = cx + rx
  return (
    `M ${fmt(x1)} ${fmt(cy)} ` +
    `A ${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(x2)} ${fmt(cy)} ` +
    `A ${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(x1)} ${fmt(cy)} Z`
  )
}

/* ---------------- 历史 ---------------- */
function pushHistory() {
  past.value.push(clone(shapes.value))
  if (past.value.length > 100) past.value.shift()
  future.value = []
}

function commitShape(s) {
  pushHistory()
  shapes.value.push(s)
  error.value = ''
}

function undo() {
  if (!past.value.length) return
  future.value.push(clone(shapes.value))
  shapes.value = past.value.pop()
  error.value = ''
}

function redo() {
  if (!future.value.length) return
  past.value.push(clone(shapes.value))
  shapes.value = future.value.pop()
  error.value = ''
}

function removeLast() {
  if (!shapes.value.length) return
  pushHistory()
  shapes.value.pop()
}

function clearAll() {
  if (!shapes.value.length && !pending.value.length) return
  pushHistory()
  shapes.value = []
  pending.value = []
  draft.value = null
  drawing.value = false
}

/* ---------------- 指针交互 ---------------- */
function onPointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  const p = toSvgPoint(e)
  error.value = ''

  if (isMultiClick.value) {
    pending.value.push(p)
    checkAutoFinish()
    return
  }

  drawing.value = true
  draft.value = makeDraft(mode.value, p, p)
  if (svgRef.value && svgRef.value.setPointerCapture) {
    try {
      svgRef.value.setPointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
  }
}

function onPointerMove(e) {
  const p = toSvgPoint(e)
  cursor.value = p
  if (!drawing.value || !draft.value) return
  if (draft.value.type === 'line') {
    draft.value.x2 = p.x
    draft.value.y2 = p.y
    return
  }
  if (draft.value.type === 'circle') {
    draft.value.r = dist({ x: draft.value.cx, y: draft.value.cy }, p)
    return
  }
  const d = draft.value
  const a = d.anchor
  if (!a) return
  if (d.type === 'rect') {
    d.x = Math.min(a.x, p.x)
    d.y = Math.min(a.y, p.y)
    d.w = Math.abs(p.x - a.x)
    d.h = Math.abs(p.y - a.y)
  } else if (d.type === 'ellipse') {
    d.cx = (a.x + p.x) / 2
    d.cy = (a.y + p.y) / 2
    d.rx = Math.abs(p.x - a.x) / 2
    d.ry = Math.abs(p.y - a.y) / 2
  }
}

function onPointerUp(e) {
  if (!drawing.value || !draft.value) return
  drawing.value = false
  const d = draft.value
  draft.value = null
  if (svgRef.value && svgRef.value.releasePointerCapture) {
    try {
      svgRef.value.releasePointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
  }

  let valid = false
  if (d.type === 'line') valid = dist({ x: d.x1, y: d.y1 }, { x: d.x2, y: d.y2 }) > 2
  else if (d.type === 'rect') valid = d.w > 2 && d.h > 2
  else if (d.type === 'circle') valid = d.r > 2
  else if (d.type === 'ellipse') valid = d.rx > 2 && d.ry > 2

  if (valid) {
    delete d.anchor
    commitShape(d)
    success.value = '已添加图元'
    setTimeout(() => (success.value = ''), 1200)
  } else {
    error.value = '图形太小，请拖拽出更大的范围（或检查是否开启了网格吸附）'
    setTimeout(() => (error.value = ''), 2500)
  }
}

function onDblClick() {
  if (mode.value === 'polyline' || mode.value === 'polygon') finishPath()
}

function checkAutoFinish() {
  const need = mode.value === 'quad' ? 3 : mode.value === 'cubic' ? 4 : 0
  if (need && pending.value.length >= need) {
    const pts = pending.value.slice(0, need)
    commitShape(makeMulti(mode.value, pts))
    pending.value = pending.value.slice(need)
    if (pending.value.length) pending.value = []
  }
}

function finishPath() {
  if (mode.value === 'polyline' || mode.value === 'polygon') {
    let pts = pending.value.slice()
    if (pts.length > 1 && dist(pts[pts.length - 1], pts[pts.length - 2]) < 1) pts.pop()
    if (pts.length < 2) {
      error.value = '至少需要 2 个点才能生成路径'
      setTimeout(() => (error.value = ''), 2200)
      return
    }
    commitShape(makeMulti(mode.value, pts))
    pending.value = []
    success.value = mode.value === 'polygon' ? '已添加多边形' : '已添加折线'
    setTimeout(() => (success.value = ''), 1200)
    return
  }
  if (mode.value === 'quad' && pending.value.length === 3) checkAutoFinish()
  else if (mode.value === 'cubic' && pending.value.length === 4) checkAutoFinish()
  else error.value = `还需再点击 ${(mode.value === 'quad' ? 3 : 4) - pending.value.length} 个点`
}

function cancelPending() {
  pending.value = []
  error.value = ''
}

function setMode(key) {
  mode.value = key
  pending.value = []
  draft.value = null
  drawing.value = false
  error.value = ''
}

/* ---------------- 代码生成 ---------------- */
const svgCode = computed(() => {
  if (!shapes.value.length) return ''
  const w = Math.round(canvasW.value)
  const h = Math.round(canvasH.value)
  const lines = shapes.value.map(s => {
    const parts = [`d="${shapeToPath(s)}"`]
    parts.push(`fill="${fillOf(s)}"`)
    if (fillOf(s) !== 'none' && fillOpacityOf(s) !== 1) parts.push(`fill-opacity="${fillOpacityOf(s)}"`)
    parts.push(`stroke="${s.style.stroke}"`)
    parts.push(`stroke-width="${s.style.strokeWidth}"`)
    parts.push('stroke-linecap="round"')
    parts.push('stroke-linejoin="round"')
    return `  <path ${parts.join(' ')} />`
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    ...lines,
    '</svg>'
  ].join('\n')
})

/* ---------------- 复制 / 导出 ---------------- */
async function copyText(text) {
  if (!text) {
    error.value = '没有可复制的内容'
    setTimeout(() => (error.value = ''), 2000)
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    success.value = '已复制到剪贴板'
    error.value = ''
    setTimeout(() => (success.value = ''), 1600)
  } catch (err) {
    error.value = '复制失败，请手动选择文本复制'
    setTimeout(() => (error.value = ''), 2500)
  }
}

function copyCode() {
  copyText(svgCode.value)
}

function downloadSvg() {
  if (!shapes.value.length) {
    error.value = '还没有绘制任何图形'
    setTimeout(() => (error.value = ''), 2200)
    return
  }
  try {
    const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    a.href = url
    a.download = `doodle-${stamp}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    success.value = 'SVG 文件已导出'
    setTimeout(() => (success.value = ''), 1800)
  } catch (err) {
    error.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  }
}

/* ---------------- 键盘快捷键 ---------------- */
function onKeydown(e) {
  const tag = e.target && e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
    return
  }
  if (e.key === 'Escape') {
    cancelPending()
    draft.value = null
    drawing.value = false
    return
  }
  if (e.key === 'Enter' && (mode.value === 'polyline' || mode.value === 'polygon')) {
    e.preventDefault()
    finishPath()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* === 模式选择按钮 === */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  min-height: 58px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.mode-btn:hover {
  border-color: var(--line-strong);
  color: var(--accent);
  background: var(--green-soft);
}

.mode-btn.active {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 14px var(--green-glow);
}

.mode-icon {
  font-size: 16px;
  line-height: 1;
}

.mode-name {
  white-space: nowrap;
}

/* === 颜色选择 === */
.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.color-input {
  width: 44px;
  height: 40px;
  padding: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  cursor: pointer;
  border-radius: 0;
  appearance: none;
  -webkit-appearance: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.swatches {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.swatch {
  width: 24px;
  height: 24px;
  border: 1px solid var(--line);
  cursor: pointer;
  padding: 0;
  border-radius: 0;
  transition: all 0.2s;
}

.swatch:hover {
  transform: scale(1.1);
}

.swatch.active {
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}

/* === 选项行 === */
.opts-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.opts-sep {
  color: var(--muted);
  font-family: var(--mono);
}

.num-input {
  width: 82px;
  height: 40px;
  padding: 0 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  box-sizing: border-box;
  border-radius: 0;
}

.num-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === 画布 === */
.canvas-frame {
  position: relative;
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.doodle-svg {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.grid-line {
  stroke: var(--line);
  opacity: 0.45;
}

.grid-rect {
  pointer-events: none;
}

.draft-path {
  pointer-events: none;
}

.pending-dot {
  fill: var(--green);
  stroke: var(--panel);
  stroke-width: 1.5;
  pointer-events: none;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--dim);
  text-align: center;
  padding: 12px;
}

.canvas-empty-hint {
  font-size: 11px;
  color: var(--muted);
  opacity: 0.8;
}

.canvas-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.mode-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  line-height: 1.5;
  padding: 8px 10px;
  border: 1px dashed var(--line);
  background: var(--green-soft);
}

@media (max-width: 900px) {
  .mode-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .mode-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-btn {
    min-height: 52px;
  }

  .num-input {
    width: 70px;
    height: 38px;
  }

  .canvas-empty {
    font-size: 12px;
  }
}
</style>
