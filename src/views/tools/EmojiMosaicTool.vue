<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 Emoji 马赛克生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：图片来源 & 参数配置 -->
          <div class="tool-col">
            <label class="tool-label">图片来源：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">🖼️</span>
                <span class="upload-text">点击或拖拽上传图片</span>
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / SVG / BMP</span>
              </div>
            </div>

            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="urlInput"
                placeholder="或粘贴图片 URL，回车加载..."
                @keyup.enter="loadFromUrl"
              />
              <button class="copy-btn" @click="loadFromUrl" title="加载 URL">⏎</button>
            </div>

            <div class="button-row">
              <button class="tool-button primary" @click="loadFromUrl" :disabled="!urlInput.trim()">
                加载 URL
              </button>
              <button class="tool-button" @click="loadDemo" :disabled="busy">
                🌄 示例图片
              </button>
            </div>

            <div v-if="imgSrc" class="preview-section">
              <label class="tool-label">原图预览：</label>
              <div class="canvas-wrapper">
                <img :src="imgSrc" alt="原图预览" class="preview-image" />
              </div>
            </div>

            <label class="tool-label">网格密度：{{ grid }} 格</label>
            <input
              type="range"
              v-model.number="grid"
              min="8"
              max="96"
              step="1"
              class="range-input"
            />
            <div class="length-display"><span>{{ grid }}</span></div>

            <label class="tool-label">单元格大小：{{ cellSize }}px</label>
            <input
              type="range"
              v-model.number="cellSize"
              min="8"
              max="32"
              step="1"
              class="range-input"
            />
            <div class="length-display"><span>{{ cellSize }}</span></div>

            <label class="tool-label">Emoji 集合：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="s in emojiSets" :key="s.key">
                <input type="radio" v-model="emojiSetKey" :value="s.key" />
                <span>{{ s.label }}</span>
              </label>
            </div>

            <div v-if="emojiSetKey === 'custom'" class="custom-emoji-box">
              <label class="tool-label">自定义 Emoji（空格或逗号分隔）：</label>
              <textarea
                class="code-input"
                v-model="customEmoji"
                rows="2"
                placeholder="😀 😂 🚀 🌟 ..."
              ></textarea>
            </div>

            <div v-else class="emoji-preview">
              <span v-for="(e, i) in currentList()" :key="i" class="emoji-chip">{{ e }}</span>
            </div>

            <label class="tool-label">背景：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="dark" />
                <span>深色</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="light" />
                <span>浅色</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="transparent" />
                <span>透明</span>
              </label>
            </div>
          </div>

          <!-- 右栏：马赛克预览 & 文本输出 -->
          <div class="tool-col">
            <label class="tool-label">马赛克预览：</label>
            <div class="canvas-wrapper mosaic-wrapper">
              <canvas ref="mosaicCanvas" class="mosaic-canvas"></canvas>
              <div v-if="!hasImage" class="canvas-placeholder">
                <span class="placeholder-icon">🖼️</span>
                <span>上传图片或点击「示例图片」开始生成</span>
              </div>
            </div>

            <div v-if="info" class="image-info">
              <span class="info-item">📐 {{ info.cols }} × {{ info.rows }}</span>
              <span class="info-item">🧩 {{ info.cells }} 格</span>
              <span class="info-item">⏱️ {{ info.time }}ms</span>
              <span class="info-item">😀 {{ info.emojiCount }} 个 Emoji</span>
            </div>

            <label class="tool-label">Emoji 文本输出：</label>
            <div class="input-with-copy">
              <textarea
                class="code-input output"
                :value="emojiText"
                readonly
                rows="8"
                placeholder="生成后 Emoji 字符将显示在这里，可直接复制..."
              ></textarea>
              <button class="copy-btn" @click="copyText" title="复制 Emoji 文本">📋</button>
            </div>
            <div class="text-length" v-if="emojiText">
              <span class="info-item">📏 {{ emojiText.length }} 字符 / {{ emojiText.split('\n').length }} 行</span>
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="renderMosaic" :disabled="busy || !hasImage">
            ⚡ 生成马赛克
          </button>
          <button class="tool-button" @click="copyText" :disabled="!emojiText">
            📋 复制 Emoji 文本
          </button>
          <button class="tool-button" @click="downloadPng" :disabled="!hasImage">
            💾 下载 PNG
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copied" class="status-success">✅ 已复制到剪贴板</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

// ============ 状态 ============
const img = ref(null)          // HTMLImageElement
const imgSrc = ref('')         // 原图 dataURL/URL（用于预览）
const urlInput = ref('')
const dragOver = ref(false)
const grid = ref(48)           // 长边网格格数
const cellSize = ref(16)       // 单元格像素
const emojiSetKey = ref('faces')
const customEmoji = ref('😀 😂 😍 🥳 😎 🤔 🚀 ⭐')
const bgMode = ref('dark')     // dark | light | transparent
const mosaicCanvas = ref(null)
const emojiText = ref('')
const error = ref('')
const copied = ref(false)
const busy = ref(false)
const info = ref(null)
const hasImage = ref(false)

const fileInput = ref(null)

// ============ Emoji 集合 ============
const emojiSets = [
  { key: 'faces', label: '表情', emoji: ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '🥳', '😱', '🤯', '😴', '😋'] },
  { key: 'animals', label: '动物', emoji: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄'] },
  { key: 'food', label: '食物', emoji: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑', '🥕', '🌽', '🍕', '🍔', '🍟', '🌭', '🍦', '🍩', '🍪', '🧁'] },
  { key: 'shapes', label: '色块', emoji: ['⬛', '⬜', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'] },
  { key: 'nature', label: '自然', emoji: ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '☀️', '⛅', '🌧️', '❄️', '🌈', '⭐', '🌙', '🔥'] },
  { key: 'custom', label: '自定义', emoji: [] },
]

function currentList() {
  if (emojiSetKey.value === 'custom') {
    return customEmoji.value
      .split(/[\s,，]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }
  const set = emojiSets.find(s => s.key === emojiSetKey.value)
  return set ? set.emoji : []
}

// ============ 图片加载 ============
function handleFile(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function processFile(file) {
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件（PNG / JPEG / WebP / GIF / SVG / BMP）'
    return
  }
  const reader = new FileReader()
  reader.onload = ev => {
    loadImageFromSrc(ev.target.result)
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

function loadFromUrl() {
  const url = urlInput.value.trim()
  if (!url) return
  loadImageFromSrc(url, true)
}

function loadImageFromSrc(src, isRemote = false) {
  const image = new Image()
  if (isRemote) image.crossOrigin = 'anonymous'
  image.onload = () => {
    img.value = image
    imgSrc.value = src
    hasImage.value = true
    error.value = ''
    renderMosaic()
  }
  image.onerror = () => {
    error.value = '图片加载失败，请检查 URL 是否正确，或改用本地上传'
  }
  image.src = src
}

// 程序化生成示例图片（渐变 + 几何图形，纯 Canvas）
function loadDemo() {
  const c = document.createElement('canvas')
  c.width = 480
  c.height = 320
  const ctx = c.getContext('2d')
  // 天空渐变
  const sky = ctx.createLinearGradient(0, 0, 0, 320)
  sky.addColorStop(0, '#ff9a56')
  sky.addColorStop(0.45, '#ffd479')
  sky.addColorStop(0.46, '#ffb26b')
  sky.addColorStop(1, '#ff8a5c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 480, 320)
  // 太阳
  ctx.fillStyle = '#fff6d5'
  ctx.beginPath()
  ctx.arc(400, 70, 46, 0, Math.PI * 2)
  ctx.fill()
  // 山
  ctx.fillStyle = '#8fbc8f'
  ctx.beginPath()
  ctx.moveTo(0, 320)
  ctx.lineTo(130, 160)
  ctx.lineTo(260, 320)
  ctx.fill()
  ctx.fillStyle = '#6a9e6a'
  ctx.beginPath()
  ctx.moveTo(160, 320)
  ctx.lineTo(330, 120)
  ctx.lineTo(480, 320)
  ctx.fill()
  // 树
  ctx.fillStyle = '#5c8a5c'
  ctx.fillRect(60, 230, 18, 40)
  ctx.beginPath()
  ctx.moveTo(38, 240)
  ctx.lineTo(69, 180)
  ctx.lineTo(100, 240)
  ctx.fill()
  // 湖面
  const lake = ctx.createLinearGradient(0, 240, 0, 320)
  lake.addColorStop(0, '#7ec8e3')
  lake.addColorStop(1, '#4a90d9')
  ctx.fillStyle = lake
  ctx.fillRect(180, 240, 300, 80)
  // 小船
  ctx.fillStyle = '#d9534f'
  ctx.beginPath()
  ctx.moveTo(260, 285)
  ctx.lineTo(320, 285)
  ctx.lineTo(300, 300)
  ctx.lineTo(280, 300)
  ctx.fill()
  loadImageFromSrc(c.toDataURL('image/png'))
}

// ============ Emoji 调色板 ============
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif'
const paletteCache = new Map()

// 计算每个 emoji 的平均颜色（渲染到离屏 canvas 后读取像素）
function computePalette(list) {
  const key = list.join('|')
  if (paletteCache.has(key)) return paletteCache.get(key)
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = `${Math.floor(size * 0.8)}px ${EMOJI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const palette = []
  for (const ch of list) {
    ctx.clearRect(0, 0, size, size)
    ctx.fillText(ch, size / 2, size / 2)
    let data
    try {
      data = ctx.getImageData(0, 0, size, size).data
    } catch (e) {
      // 画布被污染（CORS），无法读取像素
      continue
    }
    let r = 0, g = 0, b = 0, n = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        n++
      }
    }
    if (n > 0) {
      palette.push({ ch, r: r / n, g: g / n, b: b / n })
    }
  }
  paletteCache.set(key, palette)
  return palette
}

// ============ 渲染马赛克 ============
let renderTimer = null
function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    if (hasImage.value) renderMosaic()
  }, 200)
}

async function renderMosaic() {
  if (!img.value || busy.value) return
  const list = currentList()
  if (list.length < 2) {
    error.value = 'Emoji 集合至少需要 2 个字符'
    return
  }
  busy.value = true
  error.value = ''
  copied.value = false
  const t0 = performance.now()

  try {
    const source = img.value
    const ratio = source.width / source.height
    let cols, rows
    if (ratio >= 1) {
      cols = grid.value
      rows = Math.max(1, Math.round(grid.value / ratio))
    } else {
      rows = grid.value
      cols = Math.max(1, Math.round(grid.value * ratio))
    }

    // 1. 缩小原图并读取像素
    const srcCanvas = document.createElement('canvas')
    srcCanvas.width = cols
    srcCanvas.height = rows
    const srcCtx = srcCanvas.getContext('2d')
    srcCtx.drawImage(source, 0, 0, cols, rows)
    let pixelData
    try {
      pixelData = srcCtx.getImageData(0, 0, cols, rows).data
    } catch (e) {
      throw new Error('图片无法读取（跨域 CORS 限制），请下载图片后使用本地上传')
    }

    // 2. 计算 emoji 调色板
    const palette = computePalette(list)
    if (palette.length < 2) {
      throw new Error('当前 Emoji 集合无法渲染，请换一组试试')
    }

    // 3. 逐格匹配最近颜色
    const gridMap = []
    for (let y = 0; y < rows; y++) {
      const row = []
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const pr = pixelData[i]
        const pg = pixelData[i + 1]
        const pb = pixelData[i + 2]
        let best = palette[0]
        let bestDist = Infinity
        for (const p of palette) {
          const dr = pr - p.r
          const dg = pg - p.g
          const db = pb - p.b
          const d = dr * dr + dg * dg + db * db
          if (d < bestDist) {
            bestDist = d
            best = p
          }
        }
        row.push(best.ch)
      }
      gridMap.push(row)
    }

    // 4. 绘制马赛克画布
    const canvas = mosaicCanvas.value
    const cw = cols * cellSize.value
    const ch = rows * cellSize.value
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (bgMode.value === 'dark') {
      ctx.fillStyle = '#0a0f0a'
      ctx.fillRect(0, 0, cw, ch)
    } else if (bgMode.value === 'light') {
      ctx.fillStyle = '#f5f5f0'
      ctx.fillRect(0, 0, cw, ch)
    }
    ctx.font = `${Math.floor(cellSize.value * 0.95)}px ${EMOJI_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillText(gridMap[y][x], x * cellSize.value + cellSize.value / 2, y * cellSize.value + cellSize.value / 2)
      }
    }

    // 5. 生成文本输出
    emojiText.value = gridMap.map(r => r.join('')).join('\n')

    const t1 = performance.now()
    info.value = {
      cols,
      rows,
      cells: cols * rows,
      time: Math.round(t1 - t0),
      emojiCount: palette.length,
    }
  } catch (e) {
    error.value = e.message || '生成失败，请重试'
  } finally {
    busy.value = false
  }
}

// ============ 复制 / 下载 / 清空 ============
async function copyText() {
  if (!emojiText.value) return
  try {
    await navigator.clipboard.writeText(emojiText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // 降级方案
    const ta = document.createElement('textarea')
    ta.value = emojiText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    } catch (e2) {
      error.value = '复制失败，请手动选择文本复制'
    }
    document.body.removeChild(ta)
  }
}

function downloadPng() {
  const canvas = mosaicCanvas.value
  if (!canvas || !canvas.width) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `emoji-mosaic-${canvas.width}x${canvas.height}.png`
  a.click()
}

function clearAll() {
  img.value = null
  imgSrc.value = ''
  hasImage.value = false
  emojiText.value = ''
  info.value = null
  error.value = ''
  copied.value = false
  urlInput.value = ''
  const canvas = mosaicCanvas.value
  if (canvas) {
    canvas.width = 0
    canvas.height = 0
  }
}

// ============ 监听 & 生命周期 ============
watch([grid, cellSize, emojiSetKey, customEmoji, bgMode], scheduleRender)

onMounted(() => {
  loadDemo()
})

onBeforeUnmount(() => {
  clearTimeout(renderTimer)
})
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.75rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--panel-2);
}

.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2.2rem;
}

.upload-text {
  color: var(--text);
  font-size: 14px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
}

.button-row {
  display: flex;
  gap: 10px;
}

.preview-section {
  margin-top: 14px;
}

.canvas-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 220px;
  display: block;
  margin: 0 auto;
}

.mosaic-wrapper {
  position: relative;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.mosaic-canvas {
  max-width: 100%;
  height: auto;
  display: block;
}

.canvas-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-family: var(--mono);
  padding: 2rem 1rem;
}

.placeholder-icon {
  font-size: 2rem;
}

.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.info-item {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
}

.length-display {
  text-align: right;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  margin-top: -4px;
}

.emoji-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  margin-bottom: 4px;
}

.emoji-chip {
  font-size: 18px;
  line-height: 1;
}

.custom-emoji-box {
  margin-bottom: 4px;
}

.custom-emoji-box .code-input {
  min-height: 60px;
}

.text-length {
  margin-top: 8px;
}

.text-length .info-item {
  display: inline-block;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1.4rem 1rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .button-row {
    flex-direction: column;
  }

  .emoji-chip {
    font-size: 16px;
  }
}
</style>
