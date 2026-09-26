<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>✂️ CSS Clip-Path 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">形状类型：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="shapeType" value="circle" />
                <span>圆形</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="shapeType" value="ellipse" />
                <span>椭圆</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="shapeType" value="polygon" />
                <span>多边形</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="shapeType" value="inset" />
                <span>内嵌</span>
              </label>
            </div>

            <!-- 圆形 -->
            <template v-if="shapeType === 'circle'">
              <label class="tool-label">半径：{{ circleRadius }}%</label>
              <input type="range" v-model.number="circleRadius" min="5" max="55" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ circleRadius }}%</span></div>

              <label class="tool-label">圆心 X：{{ circleCx }}%</label>
              <input type="range" v-model.number="circleCx" min="0" max="100" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ circleCx }}%</span></div>

              <label class="tool-label">圆心 Y：{{ circleCy }}%</label>
              <input type="range" v-model.number="circleCy" min="0" max="100" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ circleCy }}%</span></div>
            </template>

            <!-- 椭圆 -->
            <template v-if="shapeType === 'ellipse'">
              <label class="tool-label">半径 X：{{ ellipseRx }}%</label>
              <input type="range" v-model.number="ellipseRx" min="5" max="55" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ ellipseRx }}%</span></div>

              <label class="tool-label">半径 Y：{{ ellipseRy }}%</label>
              <input type="range" v-model.number="ellipseRy" min="5" max="55" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ ellipseRy }}%</span></div>

              <label class="tool-label">中心 X：{{ ellipseCx }}%</label>
              <input type="range" v-model.number="ellipseCx" min="0" max="100" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ ellipseCx }}%</span></div>

              <label class="tool-label">中心 Y：{{ ellipseCy }}%</label>
              <input type="range" v-model.number="ellipseCy" min="0" max="100" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ ellipseCy }}%</span></div>
            </template>

            <!-- 多边形 -->
            <template v-if="shapeType === 'polygon'">
              <label class="tool-label">顶点（{{ polygonPoints.length }} 个）：</label>
              <div class="points-list">
                <div v-for="(pt, idx) in polygonPoints" :key="idx" class="point-item">
                  <span class="point-index">P{{ idx + 1 }}</span>
                  <input type="number" v-model.number="pt.x" min="0" max="100" step="0.5" class="point-input" />%
                  <input type="number" v-model.number="pt.y" min="0" max="100" step="0.5" class="point-input" />%
                  <button
                    v-if="polygonPoints.length > 3"
                    class="point-remove-btn"
                    @click="removePoint(idx)"
                    title="移除此顶点"
                  >✕</button>
                </div>
              </div>
              <div class="button-group button-group-2" style="margin-top:8px">
                <button class="tool-button" @click="addPoint">+ 添加顶点</button>
                <button class="tool-button" @click="resetPolygon">↺ 重置</button>
              </div>
            </template>

            <!-- 内嵌 -->
            <template v-if="shapeType === 'inset'">
              <label class="tool-label">上边距：{{ insetTop }}%</label>
              <input type="range" v-model.number="insetTop" min="0" max="50" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ insetTop }}%</span></div>

              <label class="tool-label">右边距：{{ insetRight }}%</label>
              <input type="range" v-model.number="insetRight" min="0" max="50" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ insetRight }}%</span></div>

              <label class="tool-label">下边距：{{ insetBottom }}%</label>
              <input type="range" v-model.number="insetBottom" min="0" max="50" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ insetBottom }}%</span></div>

              <label class="tool-label">左边距：{{ insetLeft }}%</label>
              <input type="range" v-model.number="insetLeft" min="0" max="50" step="0.5" class="range-input" />
              <div class="length-display"><span>{{ insetLeft }}%</span></div>

              <label class="tool-label">圆角：{{ insetRound }}px</label>
              <input type="range" v-model.number="insetRound" min="0" max="80" step="1" class="range-input" />
              <div class="length-display"><span>{{ insetRound }}px</span></div>
            </template>
          </div>

          <!-- 右栏：预览 + CSS -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div
              class="clip-preview-wrapper"
              :class="'bg-' + previewBg"
              ref="previewEl"
              @mousedown="onWrapperMouseDown"
              @mousemove="onWrapperMouseMove"
              @mouseup="onWrapperMouseUp"
              @mouseleave="onWrapperMouseUp"
              @touchstart.prevent="onWrapperTouchStart"
              @touchmove.prevent="onWrapperTouchMove"
              @touchend="onWrapperTouchUp"
            >
              <div class="clip-preview" :style="{ clipPath: cssValue }"></div>
              <!-- 多边形拖拽手柄 -->
              <template v-if="shapeType === 'polygon'">
                <div
                  v-for="(pt, idx) in polygonPoints"
                  :key="'h-' + idx"
                  class="poly-handle"
                  :class="{ active: dragIdx === idx }"
                  :style="{ left: pt.x + '%', top: pt.y + '%' }"
                  @mousedown.stop="startPointDrag($event, idx)"
                  @touchstart.stop.prevent="startPointDragTouch($event, idx)"
                ></div>
              </template>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea class="code-input output" :value="cssCode" readonly rows="3"></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="randomShape">🎲 随机</button>
            </div>

            <label class="tool-label" style="margin-top:10px">预览背景：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="gradient" />
                <span>渐变</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="pattern" />
                <span>图案</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="image" />
                <span>图片</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="copyMsg" class="status-success">{{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- Shape type ---
const shapeType = ref('polygon')

// --- Circle ---
const circleRadius = ref(30)
const circleCx = ref(50)
const circleCy = ref(50)

// --- Ellipse ---
const ellipseRx = ref(35)
const ellipseRy = ref(25)
const ellipseCx = ref(50)
const ellipseCy = ref(50)

// --- Polygon ---
const polygonPoints = ref([
  { x: 50, y: 0 },
  { x: 100, y: 40 },
  { x: 80, y: 100 },
  { x: 20, y: 100 },
  { x: 0, y: 40 }
])

// --- Inset ---
const insetTop = ref(10)
const insetRight = ref(15)
const insetBottom = ref(20)
const insetLeft = ref(10)
const insetRound = ref(0)

// --- Common ---
const previewBg = ref('gradient')
const previewEl = ref(null)
const copyMsg = ref('')
const error = ref('')

// --- Polygon drag ---
const dragIdx = ref(-1)

// --- Computed: CSS value ---
const cssValue = computed(() => {
  switch (shapeType.value) {
    case 'circle':
      return `circle(${circleRadius.value}% at ${circleCx.value}% ${circleCy.value}%)`
    case 'ellipse':
      return `ellipse(${ellipseRx.value}% ${ellipseRy.value}% at ${ellipseCx.value}% ${ellipseCy.value}%)`
    case 'polygon':
      return `polygon(${polygonPoints.value.map(p => p.x + '% ' + p.y + '%').join(', ')})`
    case 'inset':
      if (insetRound.value > 0) {
        return `inset(${insetTop.value}% ${insetRight.value}% ${insetBottom.value}% ${insetLeft.value}% round ${insetRound.value}px)`
      }
      return `inset(${insetTop.value}% ${insetRight.value}% ${insetBottom.value}% ${insetLeft.value}%)`
    default:
      return ''
  }
})

const cssCode = computed(() => {
  return `clip-path: ${cssValue.value};`
})

// --- Polygon point management ---
function addPoint() {
  const pts = polygonPoints.value
  if (pts.length === 0) {
    polygonPoints.value = [{ x: 50, y: 30 }]
    return
  }
  // Insert at midpoint of last two points
  const last = pts[pts.length - 1]
  const first = pts[0]
  const mx = Math.round((last.x + first.x) / 2)
  const my = Math.round((last.y + first.y) / 2)
  polygonPoints.value = [...pts, { x: mx, y: my }]
}

function removePoint(idx) {
  if (polygonPoints.value.length <= 3) return
  polygonPoints.value = polygonPoints.value.filter((_, i) => i !== idx)
}

function resetPolygon() {
  polygonPoints.value = [
    { x: 50, y: 0 },
    { x: 100, y: 40 },
    { x: 80, y: 100 },
    { x: 20, y: 100 },
    { x: 0, y: 40 }
  ]
}

// --- Point drag ---
function getRelativePos(e) {
  const el = previewEl.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100
  }
}

function getTouchPos(e) {
  const el = previewEl.value
  if (!el || !e.touches || e.touches.length === 0) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: ((e.touches[0].clientX - rect.left) / rect.width) * 100,
    y: ((e.touches[0].clientY - rect.top) / rect.height) * 100
  }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function startPointDrag(e, idx) {
  dragIdx.value = idx
}

function startPointDragTouch(e, idx) {
  dragIdx.value = idx
}

function onWrapperMouseDown(e) {
  // Only handle if polygon and clicking on empty area
  if (shapeType.value !== 'polygon') return
}

function onWrapperMouseMove(e) {
  if (dragIdx.value < 0) return
  const pos = getRelativePos(e)
  const pts = [...polygonPoints.value]
  pts[dragIdx.value] = {
    x: Math.round(clamp(pos.x, 0, 100) * 2) / 2,
    y: Math.round(clamp(pos.y, 0, 100) * 2) / 2
  }
  polygonPoints.value = pts
}

function onWrapperMouseUp() {
  dragIdx.value = -1
}

function onWrapperTouchStart(e) {
  if (shapeType.value !== 'polygon') return
}

function onWrapperTouchMove(e) {
  if (dragIdx.value < 0) return
  const pos = getTouchPos(e)
  const pts = [...polygonPoints.value]
  pts[dragIdx.value] = {
    x: Math.round(clamp(pos.x, 0, 100) * 2) / 2,
    y: Math.round(clamp(pos.y, 0, 100) * 2) / 2
  }
  polygonPoints.value = pts
}

function onWrapperTouchUp() {
  dragIdx.value = -1
}

// --- Random ---
function randomShape() {
  const types = ['circle', 'ellipse', 'polygon', 'inset']
  shapeType.value = types[Math.floor(Math.random() * types.length)]

  const rndPct = () => Math.round((Math.random() * 100) * 2) / 2

  circleRadius.value = 10 + Math.floor(Math.random() * 40)
  circleCx.value = rndPct()
  circleCy.value = rndPct()

  ellipseRx.value = 10 + Math.floor(Math.random() * 40)
  ellipseRy.value = 10 + Math.floor(Math.random() * 40)
  ellipseCx.value = rndPct()
  ellipseCy.value = rndPct()

  const numPts = 3 + Math.floor(Math.random() * 5)
  const pts = []
  for (let i = 0; i < numPts; i++) {
    pts.push({ x: rndPct(), y: rndPct() })
  }
  polygonPoints.value = pts

  insetTop.value = Math.floor(Math.random() * 30)
  insetRight.value = Math.floor(Math.random() * 25)
  insetBottom.value = Math.floor(Math.random() * 35)
  insetLeft.value = Math.floor(Math.random() * 20)
  insetRound.value = Math.floor(Math.random() * 40)
}

// --- Copy ---
async function copyCSS() {
  try {
    await copyText(cssCode.value)
    copyMsg.value = '✅ CSS 已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}
</script>

<style scoped>
/* Preview wrapper */
.clip-preview-wrapper {
  width: 100%;
  min-height: 220px;
  position: relative;
  border: 2px solid var(--green);
  background: var(--panel-2);
  overflow: hidden;
  cursor: default;
  user-select: none;
}

.clip-preview {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  transition: clip-path 0.15s ease;
}

/* Background themes */
.bg-gradient .clip-preview {
  background: linear-gradient(135deg, var(--green), #7c3aed, #f59e0b, var(--green));
}

.bg-pattern .clip-preview {
  background:
    repeating-linear-gradient(45deg, var(--green-soft) 0px, var(--green-soft) 2px, transparent 2px, transparent 8px),
    linear-gradient(135deg, var(--panel), var(--bg));
}

.bg-image .clip-preview {
  background:
    radial-gradient(circle at 20% 30%, #3b82f6 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, var(--green) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #f59e0b 0%, transparent 40%),
    var(--panel);
}

/* Polygon drag handles */
.poly-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--green);
  border: 2px solid var(--bg);
  cursor: grab;
  transform: translate(-50%, -50%);
  z-index: 10;
  box-shadow: 0 0 8px var(--green-glow);
  transition: transform 0.1s;
}

.poly-handle:hover,
.poly-handle.active {
  transform: translate(-50%, -50%) scale(1.3);
  background: var(--text);
  border-color: var(--green);
  z-index: 11;
}

/* Points list (polygon) */
.points-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 4px 8px;
}

.point-index {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 12px;
  min-width: 28px;
}

.point-input {
  width: 48px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  padding: 3px 4px;
  text-align: center;
}

.point-input:focus {
  border-color: var(--green);
  outline: none;
}

.point-remove-btn {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: auto;
}

.point-remove-btn:hover {
  background: var(--red);
  color: var(--bg);
}

/* Range display */
.length-display {
  margin-top: 2px;
}

.length-display span {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 13px;
}

/* Mobile */
@media (max-width: 900px) {
  .clip-preview-wrapper {
    min-height: 240px;
  }
}

@media (max-width: 640px) {
  .clip-preview-wrapper {
    min-height: 200px;
  }
  .poly-handle {
    width: 20px;
    height: 20px;
  }
  .point-input {
    width: 42px;
    font-size: 11px;
  }
}

@media (max-width: 375px) {
  .clip-preview-wrapper {
    min-height: 180px;
  }
}
</style>
