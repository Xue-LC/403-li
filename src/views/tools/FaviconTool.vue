<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>Favicon 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：配置 -->
          <div class="tool-col">
            <label class="tool-label">图标内容（文字 / Emoji / 字母）：</label>
            <input
              class="code-input-sm"
              v-model="content"
              maxlength="8"
              placeholder="如 A、403、🚀、◆"
            />

            <label class="tool-label">背景色：</label>
            <div class="color-row">
              <input
                type="color"
                class="color-input"
                v-model="bgColor"
                :disabled="transparent"
                title="背景色"
              />
              <input
                class="code-input-sm hex-input"
                v-model="bgColor"
                :disabled="transparent"
                placeholder="#111111"
              />
              <label class="checkbox-label transparent-toggle">
                <input type="checkbox" v-model="transparent" />
                <span>透明</span>
              </label>
            </div>

            <label class="tool-label">前景色：</label>
            <div class="color-row">
              <input
                type="color"
                class="color-input"
                v-model="fgColor"
                title="前景色"
              />
              <input
                class="code-input-sm hex-input"
                v-model="fgColor"
                placeholder="#9dff6b"
              />
            </div>

            <label class="tool-label">字体：</label>
            <select class="code-input-sm" v-model="fontFamily">
              <option v-for="f in fontOptions" :key="f.value" :value="f.value">
                {{ f.label }}
              </option>
            </select>

            <label class="tool-label">字重：</label>
            <select class="code-input-sm" v-model.number="fontWeight">
              <option v-for="w in [400, 500, 600, 700, 800, 900]" :key="w" :value="w">
                {{ w }}
              </option>
            </select>

            <label class="tool-label">形状：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="shape" value="square" />
                <span>方形</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="shape" value="rounded" />
                <span>圆角</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="shape" value="circle" />
                <span>圆形</span>
              </label>
            </div>

            <template v-if="shape === 'rounded'">
              <label class="tool-label">圆角半径：{{ Math.round(radiusRatio * 100) }}%</label>
              <input
                type="range"
                class="range-input"
                v-model.number="radiusRatio"
                min="0.05"
                max="0.5"
                step="0.01"
              />
            </template>

            <label class="tool-label">内边距：{{ Math.round(padding * 100) }}%</label>
            <input
              type="range"
              class="range-input"
              v-model.number="padding"
              min="0"
              max="0.4"
              step="0.01"
            />

            <label class="tool-label">字号占比：{{ Math.round(fontScale * 100) }}%</label>
            <input
              type="range"
              class="range-input"
              v-model.number="fontScale"
              min="0.2"
              max="1.4"
              step="0.01"
            />
          </div>

          <!-- 右栏：预览 -->
          <div class="tool-col">
            <label class="tool-label">浏览器标签预览：</label>
            <div class="tab-mock">
              <div class="tab-mock-item active">
                <img class="tab-favicon" :src="previews[0]?.url" alt="favicon" />
                <span class="tab-mock-title">403.li</span>
              </div>
              <div class="tab-mock-item">
                <img class="tab-favicon" :src="previews[0]?.url" alt="favicon" />
                <span class="tab-mock-title">新标签页</span>
              </div>
            </div>

            <label class="tool-label">各尺寸预览：</label>
            <div class="size-grid">
              <div v-for="p in previews" :key="p.size" class="size-cell">
                <div class="size-canvas" :class="{ checker: transparent }">
                  <img :src="p.url" :alt="p.size + 'px'" :width="p.size" :height="p.size" />
                </div>
                <span class="size-label">{{ p.size }}px</span>
                <button class="tool-button size-dl" @click="downloadPng(p.size)">PNG</button>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="downloadIco">
            [ 下载 favicon.ico ]
          </button>
          <button class="tool-button" @click="downloadPng(512)">
            [ 下载 PNG 512×512 ]
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const content = ref('A')
const bgColor = ref('#111111')
const fgColor = ref('#9dff6b')
const transparent = ref(false)
const fontFamily = ref('system-ui, sans-serif')
const fontWeight = ref(700)
const shape = ref('rounded')
const radiusRatio = ref(0.22)
const padding = ref(0.12)
const fontScale = ref(0.8)

const error = ref('')
const success = ref('')
const previews = ref([])

const fontOptions = [
  { label: '系统无衬线', value: 'system-ui, sans-serif' },
  { label: '无衬线 Sans', value: 'Arial, Helvetica, sans-serif' },
  { label: '衬线 Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: '等宽 Mono', value: '"Courier New", Consolas, monospace' },
  { label: '手写 Cursive', value: 'cursive' },
  { label: '艺术 Fantasy', value: 'fantasy' },
  { label: 'Emoji', value: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }
]

const PREVIEW_SIZES = [16, 32, 48, 64, 128, 180, 192, 512]
const ICO_SIZES = [16, 32, 48]

/* 计算圆角半径路径（含原生 roundRect 回退） */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/* 在给定 canvas 上绘制指定尺寸的图标 */
function paint(canvas, size) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)

  const radius =
    shape.value === 'circle'
      ? size / 2
      : shape.value === 'rounded'
        ? size * radiusRatio.value
        : 0

  if (!transparent.value) {
    ctx.fillStyle = bgColor.value || '#111111'
    if (shape.value === 'circle') {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      roundRect(ctx, 0, 0, size, size, radius)
      ctx.fill()
    }
  }

  const text = (content.value || '').trim()
  if (!text) return

  const pad = size * padding.value
  const maxW = Math.max(1, size - pad * 2)
  const maxH = Math.max(1, size - pad * 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fgColor.value || '#9dff6b'

  const fontFor = (fs) => `${fontWeight.value} ${fs}px ${fontFamily.value}`
  let fontSize = size * fontScale.value
  ctx.font = fontFor(fontSize)

  // 自动缩放以适配边界
  const m = ctx.measureText(text)
  const w = m.width || 1
  let h = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0)
  if (!h) h = fontSize
  const scale = Math.min(maxW / w, maxH / h, 1)
  fontSize *= scale
  ctx.font = fontFor(fontSize)
  ctx.fillText(text, size / 2, size / 2)
}

function renderPreviewCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  paint(canvas, size)
  return canvas
}

function renderAll() {
  try {
    previews.value = PREVIEW_SIZES.map((size) => ({
      size,
      url: renderPreviewCanvas(size).toDataURL('image/png')
    }))
    error.value = ''
  } catch (e) {
    error.value = '渲染失败：' + (e && e.message ? e.message : e)
  }
}

function isValidHex(v) {
  return /^#[0-9a-fA-F]{6}$/.test((v || '').trim())
}

let timer = null
function scheduleRender() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    // 校验颜色输入，避免 color picker 因非法值报错
    if (!isValidHex(bgColor.value)) bgColor.value = '#111111'
    if (!isValidHex(fgColor.value)) fgColor.value = '#9dff6b'
    renderAll()
  }, 120)
}

watch(
  [content, bgColor, fgColor, transparent, fontFamily, fontWeight, shape, radiusRatio, padding, fontScale],
  scheduleRender
)

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadPng(size) {
  try {
    const canvas = renderPreviewCanvas(size)
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `favicon-${size}x${size}.png`)
      success.value = `已下载 ${size}×${size} PNG`
      error.value = ''
    }, 'image/png')
  } catch (e) {
    error.value = '导出 PNG 失败：' + (e && e.message ? e.message : e)
  }
}

function canvasToArrayBuffer(size) {
  return new Promise((resolve, reject) => {
    const canvas = renderPreviewCanvas(size)
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('canvas 导出失败'))
      resolve(await blob.arrayBuffer())
    }, 'image/png')
  })
}

async function downloadIco() {
  const text = (content.value || '').trim()
  if (!text && transparent.value) {
    error.value = '图标内容为空，请填写文字 / Emoji'
    success.value = ''
    return
  }
  try {
    const pngs = []
    for (const s of ICO_SIZES) {
      pngs.push(await canvasToArrayBuffer(s))
    }

    const header = new ArrayBuffer(6 + 16 * pngs.length)
    const dv = new DataView(header)
    dv.setUint16(0, 0, true) // reserved
    dv.setUint16(2, 1, true) // type = icon
    dv.setUint16(4, pngs.length, true)

    let offset = 6 + 16 * pngs.length
    const parts = [header]
    pngs.forEach((buf, i) => {
      const s = ICO_SIZES[i]
      const e = 6 + i * 16
      dv.setUint8(e, s >= 256 ? 0 : s) // width
      dv.setUint8(e + 1, s >= 256 ? 0 : s) // height
      dv.setUint8(e + 2, 0) // color count
      dv.setUint8(e + 3, 0) // reserved
      dv.setUint16(e + 4, 1, true) // color planes
      dv.setUint16(e + 6, 32, true) // bits per pixel
      dv.setUint32(e + 8, buf.byteLength, true) // size of image data
      dv.setUint32(e + 12, offset, true) // offset
      offset += buf.byteLength
      parts.push(buf)
    })

    const blob = new Blob(parts, { type: 'image/x-icon' })
    downloadBlob(blob, 'favicon.ico')
    success.value = '已下载 favicon.ico（16 / 32 / 48 多尺寸）'
    error.value = ''
  } catch (e) {
    error.value = '导出 ICO 失败：' + (e && e.message ? e.message : e)
  }
}

onMounted(renderAll)
</script>

<style scoped>
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.color-input {
  width: 44px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  border-radius: 0;
}

.color-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-input::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

.hex-input {
  flex: 1;
  min-width: 90px;
}

.transparent-toggle {
  white-space: nowrap;
}

select.code-input-sm {
  cursor: pointer;
}

/* 标签预览 */
.tab-mock {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  border-bottom: 1px solid var(--line);
  padding: 6px 6px 0;
  background: var(--panel);
}

.tab-mock-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-bottom: none;
  font-size: 12px;
  color: var(--muted);
  max-width: 160px;
}

.tab-mock-item.active {
  color: var(--text);
  border-top: 2px solid var(--green);
}

.tab-favicon {
  display: block;
  flex-shrink: 0;
}

.tab-mock-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 尺寸网格 */
.size-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.size-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.size-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  overflow: hidden;
}

.size-canvas img {
  image-rendering: auto;
  max-width: 72px;
  max-height: 72px;
}

.size-canvas.checker {
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
}

.size-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.size-dl {
  padding: 3px 10px;
  font-size: 11px;
  min-height: 0;
}

@media (max-width: 640px) {
  .size-grid {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  }
  .size-canvas {
    width: 60px;
    height: 60px;
  }
  .size-canvas img {
    max-width: 60px;
    max-height: 60px;
  }
}
</style>
