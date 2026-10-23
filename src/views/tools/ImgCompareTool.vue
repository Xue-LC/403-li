<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 图片对比滑块</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ===== 左栏：上传 + 设置 ===== -->
          <div class="tool-col">
            <label class="tool-label">图片 A（左侧 / 原图）：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragA }"
              @dragover.prevent="dragA = true"
              @dragleave.prevent="dragA = false"
              @drop.prevent="handleDrop($event, 'A')"
              @click="$refs.fileA.click()"
            >
              <input
                ref="fileA"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFile($event, 'A')"
              />
              <div class="upload-content">
                <span class="upload-icon">{{ a.loaded ? '🖼️' : '📁' }}</span>
                <span class="upload-text">{{ a.loaded ? a.filename : '点击、拖拽或粘贴图片 A' }}</span>
                <span class="upload-hint">
                  {{ a.loaded ? `${a.w} × ${a.h} px` : '支持 PNG / JPEG / WebP / GIF / BMP' }}
                </span>
              </div>
            </div>

            <label class="tool-label">图片 B（右侧 / 对比图）：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragB }"
              @dragover.prevent="dragB = true"
              @dragleave.prevent="dragB = false"
              @drop.prevent="handleDrop($event, 'B')"
              @click="$refs.fileB.click()"
            >
              <input
                ref="fileB"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFile($event, 'B')"
              />
              <div class="upload-content">
                <span class="upload-icon">{{ b.loaded ? '🖼️' : '📁' }}</span>
                <span class="upload-text">{{ b.loaded ? b.filename : '点击、拖拽或粘贴图片 B' }}</span>
                <span class="upload-hint">
                  {{ b.loaded ? `${b.w} × ${b.h} px` : '支持 PNG / JPEG / WebP / GIF / BMP' }}
                </span>
              </div>
            </div>

            <div class="control-section">
              <label class="tool-label">对比方式：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="mode" value="slider" />
                  <span>滑块对比</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="mode" value="side" />
                  <span>并排对比</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="mode" value="overlay" />
                  <span>叠加对比</span>
                </label>
              </div>
            </div>

            <div class="control-section">
              <label class="tool-label">方向：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="direction" value="horizontal" />
                  <span>水平（左右）</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="direction" value="vertical" />
                  <span>垂直（上下）</span>
                </label>
              </div>
            </div>

            <div class="control-section" v-if="mode === 'slider'">
              <label class="tool-label">分割位置：{{ posPercent }}%</label>
              <input type="range" class="range-input" v-model.number="posPercent" min="0" max="100" />
            </div>

            <div class="control-section" v-if="mode === 'overlay'">
              <label class="tool-label">B 图透明度：{{ overlayOpacity }}%</label>
              <input type="range" class="range-input" v-model.number="overlayOpacity" min="0" max="100" />
            </div>

            <div class="control-section">
              <label class="tool-label">显示选项：</label>
              <div class="options-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="showLabels" />
                  <span>显示 A / B 标签</span>
                </label>
                <label class="checkbox-label" v-if="mode === 'slider'">
                  <input type="checkbox" v-model="showLine" />
                  <span>显示分割线</span>
                </label>
                <label class="checkbox-label" v-if="mode !== 'side'">
                  <input type="checkbox" v-model="fitFill" />
                  <span>拉伸填满画布</span>
                </label>
              </div>
            </div>

            <div class="control-section" v-if="showLabels">
              <div class="label-inputs">
                <input class="code-input-sm" v-model="labelA" placeholder="A 标签文字" />
                <input class="code-input-sm" v-model="labelB" placeholder="B 标签文字" />
              </div>
            </div>
          </div>

          <!-- ===== 右栏：预览 ===== -->
          <div class="tool-col">
            <div class="preview-head">
              <label class="tool-label">对比预览：</label>
              <span class="pos-badge">{{ modeText }}</span>
            </div>

            <div
              v-if="anyImage"
              class="canvas-wrapper"
              :class="{ 'is-dragging': dragging, 'is-grab': mode === 'slider' && bothImages }"
            >
              <canvas
                ref="canvasRef"
                class="compare-canvas"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
                @pointerleave="onPointerUp"
              ></canvas>
            </div>
            <div v-else class="placeholder-preview">
              <span>上传两张图片后在此拖拽滑块对比差异</span>
            </div>

            <div class="hint-text">{{ hintText }}</div>

            <div class="image-info" v-if="anyImage">
              <span class="info-item">🅰️ {{ a.loaded ? `${a.w} × ${a.h} px · ${formatSize(a.bytes)}` : '未上传' }}</span>
              <span class="info-item">🅱️ {{ b.loaded ? `${b.w} × ${b.h} px · ${formatSize(b.bytes)}` : '未上传' }}</span>
              <span v-if="ratioMismatch" class="info-item info-warn">⚠️ 两图宽高比不同，预览按各自比例居中</span>
            </div>
          </div>
        </div>

        <!-- ===== 按钮组（双栏外） ===== -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!anyImage" @click="exportPng">💾 导出 PNG</button>
          <button class="tool-button" :disabled="!anyImage" @click="copyImage">📋 复制图片</button>
          <button class="tool-button" :disabled="!bothImages" @click="swapImages">🔄 交换 A/B</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

/* ===== 常量 ===== */
const MAX_EDGE = 2000 // 预览画布长边上限
const MAX_BYTES = 30 * 1024 * 1024

/* ===== DOM 引用 ===== */
const fileA = ref(null)
const fileB = ref(null)
const canvasRef = ref(null)

/* ===== 图片（Image 元素放在普通变量里，避免被响应式代理） ===== */
let imgA = null
let imgB = null
const a = reactive({ loaded: false, filename: '', name: 'image-a', w: 0, h: 0, bytes: 0 })
const b = reactive({ loaded: false, filename: '', name: 'image-b', w: 0, h: 0, bytes: 0 })

/* ===== 交互状态 ===== */
const dragA = ref(false)
const dragB = ref(false)
const dragging = ref(false)
const error = ref('')
const success = ref('')
let successTimer = null

/* ===== 配置项 ===== */
const mode = ref('slider') // slider | side | overlay
const direction = ref('horizontal') // horizontal | vertical
const fitFill = ref(false)
const showLabels = ref(true)
const showLine = ref(true)
const posPercent = ref(50)
const overlayOpacity = ref(50)
const labelA = ref('原图')
const labelB = ref('对比图')

/* ===== 派生状态 ===== */
const anyImage = computed(() => a.loaded || b.loaded)
const bothImages = computed(() => a.loaded && b.loaded)
const modeText = computed(() => {
  const m = { slider: '滑块对比', side: '并排对比', overlay: '叠加对比' }[mode.value] || '滑块对比'
  const d = direction.value === 'horizontal' ? '水平' : '垂直'
  return `${m} · ${d}`
})
const ratioMismatch = computed(() => {
  if (!bothImages.value) return false
  const ra = a.w / a.h
  const rb = b.w / b.h
  return Math.abs(ra - rb) / Math.max(ra, rb) > 0.01
})
const hintText = computed(() => {
  if (!anyImage.value) return '提示：可点击上传区域，也可直接拖拽图片文件，或 Ctrl+V 粘贴剪贴板中的图片。'
  if (!bothImages.value) return '已加载一张图片，再上传另一张即可开始对比。'
  if (mode.value === 'slider') {
    return direction.value === 'horizontal'
      ? '在预览图上左右拖拽即可移动分割线，左侧显示图片 A，右侧显示图片 B。'
      : '在预览图上上下拖拽即可移动分割线，上方显示图片 A，下方显示图片 B。'
  }
  if (mode.value === 'overlay') return '叠加模式下图片 B 以指定透明度覆盖在图片 A 之上，调低透明度可看清两张图的差异。'
  return '并排模式下两张图片按同一比例横向/纵向排列，便于逐区域比对。'
})

/* ===== 工具函数 ===== */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function setSuccess(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

function themeColor(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return (v && v.trim()) || fallback
}

/* ===== 文件载入 ===== */
function handleFile(e, slot) {
  const file = e.target.files && e.target.files[0]
  if (file) loadFile(file, slot)
}

function handleDrop(e, slot) {
  if (slot === 'A') dragA.value = false
  else dragB.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadFile(file, slot)
}

function handlePaste(e) {
  const items = (e.clipboardData && e.clipboardData.items) || []
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const file = it.getAsFile()
      if (file) {
        // 优先填入空槽位
        const slot = !a.loaded ? 'A' : 'B'
        loadFile(file, slot)
        e.preventDefault()
        return
      }
    }
  }
}

function loadFile(file, slot) {
  error.value = ''
  success.value = ''
  if (!file.type || !file.type.startsWith('image/')) {
    error.value = '请选择图片文件（PNG / JPEG / WebP / GIF / BMP）'
    return
  }
  if (file.size > MAX_BYTES) {
    error.value = '图片过大，请选择小于 30MB 的文件'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const target = slot === 'A' ? a : b
      if (slot === 'A') imgA = img
      else imgB = img
      target.loaded = true
      target.filename = file.name || (slot === 'A' ? 'image-a' : 'image-b')
      target.name = (file.name || 'image').replace(/\.[^.]+$/, '')
      target.w = img.naturalWidth
      target.h = img.naturalHeight
      target.bytes = file.size
      nextTick(render)
    }
    img.onerror = () => {
      error.value = '图片解析失败，文件可能已损坏'
    }
    img.src = reader.result
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

/* ===== 布局计算 ===== */
function computeLayout() {
  const hasA = a.loaded && !!imgA
  const hasB = b.loaded && !!imgB
  if (!hasA && !hasB) return null

  if (mode.value === 'side' && hasA && hasB) {
    if (direction.value === 'horizontal') {
      const rawW = a.w + b.w
      const rawH = Math.max(a.h, b.h)
      const s = Math.min(1, MAX_EDGE / Math.max(rawW, rawH))
      return { kind: 'side-h', s, cw: Math.max(1, Math.round(rawW * s)), ch: Math.max(1, Math.round(rawH * s)) }
    }
    const rawW = Math.max(a.w, b.w)
    const rawH = a.h + b.h
    const s = Math.min(1, MAX_EDGE / Math.max(rawW, rawH))
    return { kind: 'side-v', s, cw: Math.max(1, Math.round(rawW * s)), ch: Math.max(1, Math.round(rawH * s)) }
  }

  const boxW = Math.max(hasA ? a.w : 0, hasB ? b.w : 0)
  const boxH = Math.max(hasA ? a.h : 0, hasB ? b.h : 0)
  if (!boxW || !boxH) return null
  const s = Math.min(1, MAX_EDGE / Math.max(boxW, boxH))
  return {
    kind: mode.value === 'overlay' ? 'overlay' : 'slider',
    s,
    cw: Math.max(1, Math.round(boxW * s)),
    ch: Math.max(1, Math.round(boxH * s))
  }
}

/* ===== 渲染 ===== */
function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const L = computeLayout()
  if (!L) return

  canvas.width = L.cw
  canvas.height = L.ch
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, L.cw, L.ch)

  const green = themeColor('--green', '#9dff6b')
  const panel = themeColor('--panel', '#0b0f0b')
  const hasA = a.loaded && !!imgA
  const hasB = b.loaded && !!imgB

  // 背景底色
  ctx.fillStyle = panel
  ctx.fillRect(0, 0, L.cw, L.ch)

  // 适应方式：contain（居中按比例）或 fill（拉伸填满）
  const dest = (info) => {
    if (fitFill.value) return { dx: 0, dy: 0, dw: L.cw, dh: L.ch }
    const k = Math.min(L.cw / info.w, L.ch / info.h)
    const dw = info.w * k
    const dh = info.h * k
    return { dx: (L.cw - dw) / 2, dy: (L.ch - dh) / 2, dw, dh }
  }

  // 标签绘制
  const drawTag = (text, x, y, color, alignRight) => {
    if (!text) return
    const fontPx = clamp(Math.round(Math.min(L.cw, L.ch) / 28), 12, 30)
    ctx.font = `600 ${fontPx}px 'MapleMono NF CN', ui-monospace, monospace`
    ctx.textBaseline = 'top'
    const tw = ctx.measureText(text).width
    const pad = Math.round(fontPx * 0.45)
    const bw = tw + pad * 2
    const bh = fontPx + pad
    const bx = alignRight ? Math.max(0, x - bw) : Math.min(x, Math.max(0, L.cw - bw))
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(bx, y, bw, bh)
    ctx.fillStyle = color
    ctx.fillText(text, bx + pad, y + pad / 2)
  }

  const tagPad = clamp(Math.round(Math.min(L.cw, L.ch) / 40), 6, 18)
  const white = '#ffffff'

  if (L.kind === 'side-h' || L.kind === 'side-v') {
    if (L.kind === 'side-h') {
      const wA = Math.max(1, Math.round(a.w * L.s))
      const hA = Math.max(1, Math.round(a.h * L.s))
      const wB = Math.max(1, Math.round(b.w * L.s))
      const hB = Math.max(1, Math.round(b.h * L.s))
      if (hasA) ctx.drawImage(imgA, 0, 0, wA, hA)
      if (hasB) ctx.drawImage(imgB, wA, 0, wB, hB)
      if (hasA && hasB) {
        ctx.fillStyle = green
        ctx.fillRect(wA - 1, 0, 2, L.ch)
      }
      if (showLabels.value) {
        if (hasA) drawTag(labelA.value, tagPad, tagPad, white, false)
        if (hasB) drawTag(labelB.value, wA + tagPad, tagPad, green, false)
      }
    } else {
      const wA = Math.max(1, Math.round(a.w * L.s))
      const hA = Math.max(1, Math.round(a.h * L.s))
      const wB = Math.max(1, Math.round(b.w * L.s))
      const hB = Math.max(1, Math.round(b.h * L.s))
      if (hasA) ctx.drawImage(imgA, 0, 0, wA, hA)
      if (hasB) ctx.drawImage(imgB, 0, hA, wB, hB)
      if (hasA && hasB) {
        ctx.fillStyle = green
        ctx.fillRect(0, hA - 1, L.cw, 2)
      }
      if (showLabels.value) {
        if (hasA) drawTag(labelA.value, tagPad, tagPad, white, false)
        if (hasB) drawTag(labelB.value, tagPad, hA + tagPad, green, false)
      }
    }
    return
  }

  if (L.kind === 'overlay') {
    const rA = dest(a.loaded ? a : b)
    if (hasA) ctx.drawImage(imgA, rA.dx, rA.dy, rA.dw, rA.dh)
    if (hasB) {
      const rB = dest(b)
      ctx.globalAlpha = clamp(overlayOpacity.value / 100, 0, 1)
      ctx.drawImage(imgB, rB.dx, rB.dy, rB.dw, rB.dh)
      ctx.globalAlpha = 1
    }
    if (showLabels.value) {
      if (hasA) drawTag(labelA.value, tagPad, tagPad, white, false)
      if (hasB) drawTag(labelB.value, L.cw - tagPad, tagPad, green, true)
    }
    return
  }

  // 滑块模式
  const rA = dest(a.loaded ? a : b)
  if (hasB) {
    const rB = dest(b)
    ctx.drawImage(imgB, rB.dx, rB.dy, rB.dw, rB.dh)
  }
  const frac = clamp(posPercent.value / 100, 0, 1)
  const horizontal = direction.value === 'horizontal'

  if (hasA && hasB) {
    // 分割线前的区域显示图片 A
    ctx.save()
    ctx.beginPath()
    if (horizontal) ctx.rect(0, 0, Math.round(frac * L.cw), L.ch)
    else ctx.rect(0, 0, L.cw, Math.round(frac * L.ch))
    ctx.clip()
    ctx.drawImage(imgA, rA.dx, rA.dy, rA.dw, rA.dh)
    ctx.restore()

    if (showLine.value) {
      const lw = Math.max(2, Math.round(Math.min(L.cw, L.ch) / 400))
      ctx.fillStyle = green
      if (horizontal) ctx.fillRect(Math.round(frac * L.cw) - Math.round(lw / 2), 0, lw, L.ch)
      else ctx.fillRect(0, Math.round(frac * L.ch) - Math.round(lw / 2), L.cw, lw)
    }

    if (showLabels.value) {
      if (horizontal) {
        drawTag(labelA.value, tagPad, tagPad, white, false)
        drawTag(labelB.value, L.cw - tagPad, tagPad, green, true)
      } else {
        drawTag(labelA.value, tagPad, tagPad, white, false)
        drawTag(labelB.value, tagPad, L.ch - tagPad, green, false)
      }
    }
  } else if (hasA) {
    ctx.drawImage(imgA, rA.dx, rA.dy, rA.dw, rA.dh)
  }
}

/* ===== 滑块交互 ===== */
function pointerFrac(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  if (direction.value === 'horizontal') {
    if (!rect.width) return null
    return clamp((e.clientX - rect.left) / rect.width, 0, 1)
  }
  if (!rect.height) return null
  return clamp((e.clientY - rect.top) / rect.height, 0, 1)
}

function onPointerDown(e) {
  if (!bothImages.value || mode.value !== 'slider') return
  const fx = pointerFrac(e)
  if (fx == null) return
  dragging.value = true
  try {
    canvasRef.value.setPointerCapture(e.pointerId)
  } catch {
    /* 忽略 */
  }
  posPercent.value = Math.round(fx * 100)
}

function onPointerMove(e) {
  if (!dragging.value) return
  const fx = pointerFrac(e)
  if (fx == null) return
  posPercent.value = Math.round(fx * 100)
}

function onPointerUp(e) {
  if (!dragging.value) return
  dragging.value = false
  try {
    canvasRef.value.releasePointerCapture(e.pointerId)
  } catch {
    /* 忽略 */
  }
}

/* ===== 操作 ===== */
function swapImages() {
  const tmpImg = imgA
  imgA = imgB
  imgB = tmpImg
  const snapA = { loaded: a.loaded, filename: a.filename, name: a.name, w: a.w, h: a.h, bytes: a.bytes }
  const snapB = { loaded: b.loaded, filename: b.filename, name: b.name, w: b.w, h: b.h, bytes: b.bytes }
  Object.assign(a, snapB)
  Object.assign(b, snapA)
  render()
  setSuccess('已交换 A / B 图片')
}

function exportPng() {
  const canvas = canvasRef.value
  if (!canvas || !anyImage.value) return
  canvas.toBlob((blob) => {
    if (!blob) {
      error.value = '导出失败，请重试'
      return
    }
    const base = bothImages.value ? 'compare' : a.loaded ? a.name : b.name
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${base || 'image'}-compare.png`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setSuccess('已导出 PNG 图片')
  }, 'image/png')
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas || !anyImage.value) return
  error.value = ''
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('生成图片失败')
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setSuccess('已复制图片到剪贴板')
    } else {
      throw new Error('当前浏览器不支持复制图片，请改用导出 PNG')
    }
  } catch (err) {
    error.value = '复制失败：' + (err.message || '浏览器不支持')
  }
}

function clearAll() {
  imgA = null
  imgB = null
  Object.assign(a, { loaded: false, filename: '', name: 'image-a', w: 0, h: 0, bytes: 0 })
  Object.assign(b, { loaded: false, filename: '', name: 'image-b', w: 0, h: 0, bytes: 0 })
  dragging.value = false
  posPercent.value = 50
  error.value = ''
  success.value = ''
  if (fileA.value) fileA.value.value = ''
  if (fileB.value) fileB.value.value = ''
}

/* ===== 配置变化自动重绘 ===== */
watch(
  [mode, direction, fitFill, showLabels, showLine, posPercent, overlayOpacity, labelA, labelB],
  () => render()
)

onMounted(() => window.addEventListener('paste', handlePaste))
onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
/* ===== 上传区域 ===== */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.25rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--panel-2);
  margin-bottom: 0.75rem;
}
.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
}
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.upload-icon {
  font-size: 1.6rem;
}
.upload-text {
  color: var(--text);
  font-size: 0.85rem;
  word-break: break-all;
}
.upload-hint {
  color: var(--muted);
  font-size: 0.72rem;
}

/* ===== 设置区 ===== */
.control-section {
  margin-bottom: 0.75rem;
}
.label-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.options-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

/* ===== 预览 ===== */
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.preview-head .tool-label {
  margin: 0;
}
.pos-badge {
  color: var(--green);
  border: 1px solid var(--line);
  background: var(--green-soft);
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  white-space: nowrap;
}
.canvas-wrapper {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.canvas-wrapper.is-grab {
  cursor: ew-resize;
}
.canvas-wrapper.is-dragging {
  cursor: ew-resize;
}
.compare-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  touch-action: none;
}
.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 4rem 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  background: var(--panel-2);
}
.hint-text {
  color: var(--muted);
  font-size: 0.75rem;
  margin-top: 0.5rem;
  line-height: 1.6;
}
.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: var(--muted);
}
.info-warn {
  color: var(--green);
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1rem 0.75rem;
  }
  .preview-head {
    flex-wrap: wrap;
  }
  .compare-canvas {
    max-width: 100%;
  }
  .canvas-wrapper {
    padding: 0.35rem;
  }
}

@media (max-width: 375px) {
  .label-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
