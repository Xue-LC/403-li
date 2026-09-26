<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 CSS Filter 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：滤镜控制 -->
          <div class="tool-col">
            <label class="tool-label">滤镜设置：</label>
            <div class="filter-controls">
              <!-- blur -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.blur.enabled" />
                  <span>模糊 blur</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.blur.value"
                  min="0"
                  max="20"
                  step="0.1"
                  class="range-input"
                  :disabled="!filters.blur.enabled"
                />
                <span class="filter-val">{{ filters.blur.value }}px</span>
              </div>

              <!-- brightness -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.brightness.enabled" />
                  <span>亮度 brightness</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.brightness.value"
                  min="0"
                  max="300"
                  step="1"
                  class="range-input"
                  :disabled="!filters.brightness.enabled"
                />
                <span class="filter-val">{{ filters.brightness.value }}%</span>
              </div>

              <!-- contrast -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.contrast.enabled" />
                  <span>对比度 contrast</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.contrast.value"
                  min="0"
                  max="300"
                  step="1"
                  class="range-input"
                  :disabled="!filters.contrast.enabled"
                />
                <span class="filter-val">{{ filters.contrast.value }}%</span>
              </div>

              <!-- saturate -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.saturate.enabled" />
                  <span>饱和度 saturate</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.saturate.value"
                  min="0"
                  max="300"
                  step="1"
                  class="range-input"
                  :disabled="!filters.saturate.enabled"
                />
                <span class="filter-val">{{ filters.saturate.value }}%</span>
              </div>

              <!-- grayscale -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.grayscale.enabled" />
                  <span>灰度 grayscale</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.grayscale.value"
                  min="0"
                  max="100"
                  step="1"
                  class="range-input"
                  :disabled="!filters.grayscale.enabled"
                />
                <span class="filter-val">{{ filters.grayscale.value }}%</span>
              </div>

              <!-- sepia -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.sepia.enabled" />
                  <span>复古 sepia</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.sepia.value"
                  min="0"
                  max="100"
                  step="1"
                  class="range-input"
                  :disabled="!filters.sepia.enabled"
                />
                <span class="filter-val">{{ filters.sepia.value }}%</span>
              </div>

              <!-- invert -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.invert.enabled" />
                  <span>反转 invert</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.invert.value"
                  min="0"
                  max="100"
                  step="1"
                  class="range-input"
                  :disabled="!filters.invert.enabled"
                />
                <span class="filter-val">{{ filters.invert.value }}%</span>
              </div>

              <!-- hue-rotate -->
              <div class="filter-row">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.hueRotate.enabled" />
                  <span>色相旋转 hue-rotate</span>
                </label>
                <input
                  type="range"
                  v-model.number="filters.hueRotate.value"
                  min="0"
                  max="360"
                  step="1"
                  class="range-input"
                  :disabled="!filters.hueRotate.enabled"
                />
                <span class="filter-val">{{ filters.hueRotate.value }}deg</span>
              </div>

              <!-- drop-shadow -->
              <div class="filter-row filter-row-multi">
                <label class="checkbox-label filter-check">
                  <input type="checkbox" v-model="filters.dropShadow.enabled" />
                  <span>投影 drop-shadow</span>
                </label>
                <div class="shadow-controls" v-if="filters.dropShadow.enabled">
                  <div class="shadow-field">
                    <span>X偏移</span>
                    <input
                      type="range"
                      v-model.number="filters.dropShadow.offsetX"
                      min="-20"
                      max="20"
                      step="1"
                      class="range-input"
                    />
                    <span class="filter-val">{{ filters.dropShadow.offsetX }}px</span>
                  </div>
                  <div class="shadow-field">
                    <span>Y偏移</span>
                    <input
                      type="range"
                      v-model.number="filters.dropShadow.offsetY"
                      min="-20"
                      max="20"
                      step="1"
                      class="range-input"
                    />
                    <span class="filter-val">{{ filters.dropShadow.offsetY }}px</span>
                  </div>
                  <div class="shadow-field">
                    <span>模糊半径</span>
                    <input
                      type="range"
                      v-model.number="filters.dropShadow.blur"
                      min="0"
                      max="30"
                      step="0.5"
                      class="range-input"
                    />
                    <span class="filter-val">{{ filters.dropShadow.blur }}px</span>
                  </div>
                  <div class="shadow-field">
                    <span>颜色</span>
                    <input
                      type="color"
                      v-model="filters.dropShadow.color"
                      class="stop-color-picker"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="button-group button-group-2" style="margin-top:12px">
              <button class="tool-button danger" @click="resetAll">🔄 重置</button>
              <button class="tool-button" @click="disableAll">🚫 全部关闭</button>
            </div>
          </div>

          <!-- 右栏：预览 + CSS -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-wrapper">
              <canvas
                ref="previewCanvas"
                :width="canvasSize"
                :height="canvasSize"
                :style="{ filter: filterCSS }"
                class="preview-canvas"
              ></canvas>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="4"
              placeholder="选择滤镜后将在此显示 CSS 代码..."
            ></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="randomFilter">🎲 随机</button>
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
import { ref, computed, onMounted, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// Canvas ref
const previewCanvas = ref(null)

// Canvas size
const canvasSize = ref(300)

// Filters state
const filters = ref({
  blur: { enabled: false, value: 0 },
  brightness: { enabled: false, value: 100 },
  contrast: { enabled: false, value: 100 },
  saturate: { enabled: false, value: 100 },
  grayscale: { enabled: false, value: 0 },
  sepia: { enabled: false, value: 0 },
  invert: { enabled: false, value: 0 },
  hueRotate: { enabled: false, value: 0 },
  dropShadow: {
    enabled: false,
    offsetX: 4,
    offsetY: 4,
    blur: 6,
    color: '#000000'
  }
})

// Messages
const copyMsg = ref('')
const error = ref('')

// Build filter CSS string
const filterCSS = computed(() => {
  const parts = []
  const f = filters.value

  if (f.blur.enabled && f.blur.value > 0) {
    parts.push(`blur(${f.blur.value}px)`)
  }
  if (f.brightness.enabled && f.brightness.value !== 100) {
    parts.push(`brightness(${f.brightness.value}%)`)
  }
  if (f.contrast.enabled && f.contrast.value !== 100) {
    parts.push(`contrast(${f.contrast.value}%)`)
  }
  if (f.saturate.enabled && f.saturate.value !== 100) {
    parts.push(`saturate(${f.saturate.value}%)`)
  }
  if (f.grayscale.enabled && f.grayscale.value > 0) {
    parts.push(`grayscale(${f.grayscale.value}%)`)
  }
  if (f.sepia.enabled && f.sepia.value > 0) {
    parts.push(`sepia(${f.sepia.value}%)`)
  }
  if (f.invert.enabled && f.invert.value > 0) {
    parts.push(`invert(${f.invert.value}%)`)
  }
  if (f.hueRotate.enabled && f.hueRotate.value !== 0) {
    parts.push(`hue-rotate(${f.hueRotate.value}deg)`)
  }
  if (f.dropShadow.enabled) {
    const ds = f.dropShadow
    parts.push(`drop-shadow(${ds.offsetX}px ${ds.offsetY}px ${ds.blur}px ${ds.color})`)
  }

  return parts.join(' ')
})

// Generated CSS
const generatedCSS = computed(() => {
  const css = filterCSS.value
  if (!css) return '/* 请启用至少一个滤镜 */'
  return `filter: ${css};`
})

// Draw test pattern on canvas
function drawTestPattern() {
  const canvas = previewCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  // Background gradient (colorful rainbow)
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#ff6b6b')
  gradient.addColorStop(0.2, '#ffd93d')
  gradient.addColorStop(0.4, '#6bcf7f')
  gradient.addColorStop(0.6, '#4ecdc4')
  gradient.addColorStop(0.8, '#6c5ce7')
  gradient.addColorStop(1, '#e056a0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Circles
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.arc(w * 0.2, h * 0.25, w * 0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.arc(w * 0.7, h * 0.6, w * 0.12, 0, Math.PI * 2)
  ctx.fill()

  // Rectangle
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(w * 0.25, h * 0.45, w * 0.5, h * 0.2)

  // Text
  ctx.font = `bold ${Math.round(w * 0.08)}px "MapleMono NF CN", monospace`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 4
  ctx.fillText('CSS Filter', w * 0.5, h * 0.5)
  ctx.shadowBlur = 0

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i <= w; i += w / 6) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, h)
    ctx.stroke()
  }
  for (let j = 0; j <= h; j += h / 6) {
    ctx.beginPath()
    ctx.moveTo(0, j)
    ctx.lineTo(w, j)
    ctx.stroke()
  }
}

// Reset all
function resetAll() {
  filters.value = {
    blur: { enabled: false, value: 0 },
    brightness: { enabled: false, value: 100 },
    contrast: { enabled: false, value: 100 },
    saturate: { enabled: false, value: 100 },
    grayscale: { enabled: false, value: 0 },
    sepia: { enabled: false, value: 0 },
    invert: { enabled: false, value: 0 },
    hueRotate: { enabled: false, value: 0 },
    dropShadow: {
      enabled: false,
      offsetX: 4,
      offsetY: 4,
      blur: 6,
      color: '#000000'
    }
  }
  copyMsg.value = ''
  error.value = ''
}

// Disable all
function disableAll() {
  for (const key of Object.keys(filters.value)) {
    if (typeof filters.value[key].enabled === 'boolean') {
      filters.value[key].enabled = false
    }
  }
}

// Random filter
function randomFilter() {
  const f = filters.value
  f.blur.enabled = Math.random() > 0.6
  f.blur.value = +(Math.random() * 5).toFixed(1)
  f.brightness.enabled = Math.random() > 0.5
  f.brightness.value = Math.round(50 + Math.random() * 150)
  f.contrast.enabled = Math.random() > 0.5
  f.contrast.value = Math.round(50 + Math.random() * 150)
  f.saturate.enabled = Math.random() > 0.4
  f.saturate.value = Math.round(Math.random() * 300)
  f.grayscale.enabled = Math.random() > 0.7
  f.grayscale.value = Math.round(Math.random() * 100)
  f.sepia.enabled = Math.random() > 0.7
  f.sepia.value = Math.round(Math.random() * 100)
  f.invert.enabled = Math.random() > 0.8
  f.invert.value = Math.round(Math.random() * 100)
  f.hueRotate.enabled = Math.random() > 0.6
  f.hueRotate.value = Math.round(Math.random() * 360)
  f.dropShadow.enabled = Math.random() > 0.5
  f.dropShadow.offsetX = Math.round((Math.random() - 0.5) * 20)
  f.dropShadow.offsetY = Math.round((Math.random() - 0.5) * 20)
  f.dropShadow.blur = +(Math.random() * 15).toFixed(1)
  f.dropShadow.color = randomHex()
  copyMsg.value = ''
}

function randomHex() {
  const h = Math.floor(Math.random() * 360)
  const s = 60 + Math.floor(Math.random() * 40)
  const l = 30 + Math.floor(Math.random() * 30)
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l / 100 - c / 2
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return '#' + [r, g, b].map(v =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0')
  ).join('')
}

// Copy CSS
async function copyCSS() {
  try {
    await copyText(generatedCSS.value)
    copyMsg.value = '✅ CSS 已复制到剪贴板'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  } catch {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 3000)
  }
}

onMounted(() => {
  drawTestPattern()
})

// Redraw canvas on resize
watch(canvasSize, () => {
  setTimeout(drawTestPattern, 50)
})
</script>

<style scoped>
.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 520px;
  overflow-y: auto;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 6px 10px;
}

.filter-row-multi {
  padding-bottom: 8px;
}

.filter-check {
  margin-bottom: 2px;
}

.filter-check span {
  color: var(--text);
  font-size: 13px;
  font-family: 'MapleMono NF CN', monospace;
}

.filter-val {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--green);
  text-align: right;
  min-width: 60px;
}

.shadow-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.shadow-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shadow-field > span:first-child {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  color: var(--muted);
  min-width: 52px;
}

.shadow-field .range-input {
  flex: 1;
}

.stop-color-picker {
  width: 28px;
  height: 24px;
  border: 1px solid var(--green);
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.stop-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.stop-color-picker::-webkit-color-swatch {
  border: none;
}

.preview-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--panel-2);
  border: 2px solid var(--green);
  padding: 8px;
  min-height: 320px;
  box-shadow: 0 0 15px var(--green-glow);
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  transition: filter 0.3s ease;
}

/* Filter scrollbar */
.filter-controls::-webkit-scrollbar {
  width: 6px;
}

.filter-controls::-webkit-scrollbar-track {
  background: var(--panel);
}

.filter-controls::-webkit-scrollbar-thumb {
  background: var(--green);
}

/* Mobile */
@media (max-width: 640px) {
  .filter-controls {
    max-height: none;
  }

  .preview-wrapper {
    min-height: 240px;
  }

  .preview-canvas {
    width: 100%;
  }

  .filter-val {
    font-size: 11px;
    min-width: 48px;
  }
}
</style>
