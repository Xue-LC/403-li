<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ SVG 转 PNG</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 双栏：左输入 右输出 -->
        <div class="tool-two-col">
          <!-- 左栏：SVG 代码输入 -->
          <div class="tool-col">
            <label class="tool-label">SVG 代码：</label>
            <textarea
              v-model="svgInput"
              rows="12"
              class="code-input"
              placeholder="粘贴 SVG 代码，例如：&#10;<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;>&#10;  <circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; fill=&quot;#9dff6b&quot; />&#10;</svg>"
            ></textarea>

            <div v-if="svgInfo" class="svg-meta">
              📐 原始尺寸：{{ svgInfo.w }} × {{ svgInfo.h }} px
            </div>

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
                accept=".svg,image/svg+xml"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传 SVG 文件</span>
                <span class="upload-hint">支持 .svg 文件（&lt; 5MB）</span>
              </div>
            </div>

            <p class="tip">
              💡 提示：SVG 中若引用外部图片/字体，导出 PNG 可能受浏览器跨域安全限制而失败
            </p>
          </div>

          <!-- 右栏：PNG 输出 + SVG 预览 -->
          <div class="tool-col">
            <label class="tool-label">PNG 输出预览：</label>
            <div class="canvas-wrapper">
              <img
                v-if="outputSrc"
                :src="outputSrc"
                alt="PNG 输出"
                class="preview-image"
              />
              <div v-else class="placeholder-preview">
                <span>输入 SVG 后自动生成 PNG 预览</span>
              </div>
            </div>
            <div v-if="pngInfo" class="image-info">
              <span class="info-item">📐 {{ pngInfo.width }} × {{ pngInfo.height }} px</span>
              <span class="info-item">💾 {{ pngInfo.size }}</span>
              <span class="info-item">🎨 {{ bgLabel }}</span>
            </div>

            <label class="tool-label">SVG 预览：</label>
            <div class="canvas-wrapper">
              <img
                v-if="svgPreviewUri"
                :src="svgPreviewUri"
                alt="SVG 预览"
                class="preview-image"
                @error="svgPreviewBroken = true"
                @load="svgPreviewBroken = false"
              />
              <div v-if="!svgPreviewUri || svgPreviewBroken" class="placeholder-preview">
                <span>{{ svgPreviewUri ? 'SVG 预览加载失败' : '等待输入...' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 参数区（全宽） -->
        <label class="tool-label">导出参数：</label>
        <div class="param-grid">
          <div class="param-block">
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="sizeMode" value="scale" />
                <span>原始尺寸 × 缩放</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sizeMode" value="custom" />
                <span>自定义宽高</span>
              </label>
            </div>

            <template v-if="sizeMode === 'scale'">
              <label class="tool-label">缩放倍数：{{ scale }}x</label>
              <input
                type="range"
                v-model.number="scale"
                min="1"
                max="8"
                step="0.5"
                class="range-input"
              />
              <div class="range-tip">
                <span>1x</span>
                <span>8x</span>
              </div>
            </template>
            <template v-else>
              <div class="size-inputs">
                <input
                  class="code-input-sm"
                  v-model.number="customWidth"
                  type="number"
                  min="1"
                  max="8192"
                  placeholder="宽度 px"
                />
                <span class="size-x">×</span>
                <input
                  class="code-input-sm"
                  v-model.number="customHeight"
                  type="number"
                  min="1"
                  max="8192"
                  placeholder="高度 px"
                />
              </div>
            </template>
          </div>

          <div class="param-block">
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="transparent" />
                <span>透明背景</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="white" />
                <span>白色背景</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="bgMode" value="custom" />
                <span>自定义颜色</span>
              </label>
            </div>

            <div v-if="bgMode === 'custom'" class="bg-custom-row">
              <input type="color" v-model="bgColor" class="color-input" />
              <span class="bg-hex">{{ bgColor }}</span>
            </div>
          </div>
        </div>

        <!-- 按钮组（全宽） -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!pngBlob" @click="downloadPng">
            💾 下载 PNG
          </button>
          <button class="tool-button" :disabled="!pngBlob" @click="copyPng">
            📋 复制 PNG
          </button>
          <button class="tool-button" :disabled="!svgInput.trim()" @click="copySvg">
            📋 复制 SVG
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="warning" class="status-warning">⚠️ {{ warning }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="copied" class="status-success">✅ {{ copied }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

// 状态
const svgInput = ref('')
const dragOver = ref(false)
const fileInput = ref(null)
const svgPreviewBroken = ref(false)

// 导出参数
const sizeMode = ref('scale') // scale | custom
const scale = ref(2)
const customWidth = ref(800)
const customHeight = ref(600)
const bgMode = ref('transparent') // transparent | white | custom
const bgColor = ref('#000000')

// 结果
const outputSrc = ref('')
const pngBlob = ref(null)
const pngInfo = ref(null)
const svgInfo = ref(null)
const warning = ref('')
const error = ref('')
const copied = ref('')

// 渲染竞态控制 + 防抖
let renderSeq = 0
let renderTimer = null

const MAX_OUTPUT = 8192
const DEFAULT_W = 300
const DEFAULT_H = 150

// SVG 预览（原始尺寸，用于调试）
const svgPreviewUri = computed(() => {
  const svg = svgInput.value.trim()
  if (!svg) return ''
  try {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  } catch {
    return ''
  }
})

const bgLabel = computed(() => {
  if (bgMode.value === 'transparent') return '透明'
  if (bgMode.value === 'white') return '白色'
  return bgColor.value
})

// 文件大小格式化
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 解析 SVG，提取根元素与原始尺寸
function parseSvg(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('SVG 解析失败：XML 语法错误，请检查标签是否闭合')
  }
  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    throw new Error('内容不是有效的 SVG 文档（缺少 &lt;svg&gt; 根元素）')
  }

  let w = parseLen(root.getAttribute('width'))
  let h = parseLen(root.getAttribute('height'))
  let vb = null
  const vbAttr = root.getAttribute('viewBox') || root.getAttribute('viewbox')
  if (vbAttr) {
    const parts = vbAttr.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      vb = parts
      if (!w) w = parts[2]
      if (!h) h = parts[3]
    }
  }
  if (!w || w <= 0) w = DEFAULT_W
  if (!h || h <= 0) h = DEFAULT_H

  return { doc, root, w, h, vb }
}

function parseLen(v) {
  if (!v) return null
  const m = String(v).trim().match(/^([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('SVG 渲染失败，浏览器无法解析该图片'))
    img.src = src
  })
}

// 核心：SVG → Canvas → PNG
async function renderPng() {
  const seq = ++renderSeq
  const svg = svgInput.value.trim()

  if (!svg) {
    outputSrc.value = ''
    pngBlob.value = null
    pngInfo.value = null
    svgInfo.value = null
    warning.value = ''
    return
  }

  error.value = ''
  warning.value = ''

  // 1. 解析 SVG
  let parsed
  try {
    parsed = parseSvg(svg)
  } catch (e) {
    if (seq === renderSeq) {
      svgInfo.value = null
      outputSrc.value = ''
      pngBlob.value = null
      pngInfo.value = null
      error.value = e.message
    }
    return
  }

  // 2. 计算输出尺寸
  let outW, outH
  if (sizeMode.value === 'custom') {
    outW = Math.round(Number(customWidth.value) || 0)
    outH = Math.round(Number(customHeight.value) || 0)
  } else {
    outW = Math.round(parsed.w * scale.value)
    outH = Math.round(parsed.h * scale.value)
  }
  if (outW < 1 || outH < 1) {
    if (seq === renderSeq) {
      outputSrc.value = ''
      pngBlob.value = null
      pngInfo.value = null
      error.value = '请输入有效的宽度和高度（正整数）'
    }
    return
  }
  if (outW > MAX_OUTPUT || outH > MAX_OUTPUT) {
    if (seq === renderSeq) {
      outputSrc.value = ''
      pngBlob.value = null
      pngInfo.value = null
      error.value = `输出尺寸过大（${outW} × ${outH}），请控制在 ${MAX_OUTPUT}px 以内`
    }
    return
  }

  // 3. 检测外部资源引用（会导致 Canvas 被污染）
  const refs = [...parsed.doc.querySelectorAll('image,use,feImage')]
  const extRef = refs.find((el) => {
    const href = el.getAttribute('href') || el.getAttribute('xlink:href')
    return href && /^(https?:)?\/\//i.test(href)
  })
  if (extRef) {
    const href = extRef.getAttribute('href') || extRef.getAttribute('xlink:href')
    warning.value = `SVG 引用了外部资源（${href}），Canvas 可能被跨域策略污染导致导出失败`
  }

  // 4. 构造导出 SVG：补 xmlns / viewBox，设置输出宽高
  const root = parsed.root
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  if (!parsed.vb) {
    root.setAttribute('viewBox', `0 0 ${parsed.w} ${parsed.h}`)
  }
  root.setAttribute('width', String(outW))
  root.setAttribute('height', String(outH))
  const exportSvg = new XMLSerializer().serializeToString(parsed.doc)

  // 5. 加载并绘制到 Canvas
  const blob = new Blob([exportSvg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImage(url)
    if (seq !== renderSeq) return

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = '当前浏览器不支持 Canvas，无法转换'
      return
    }

    // 背景填充（非透明模式）
    if (bgMode.value !== 'transparent') {
      ctx.fillStyle = bgMode.value === 'white' ? '#ffffff' : bgColor.value
      ctx.fillRect(0, 0, outW, outH)
    }

    ctx.drawImage(img, 0, 0, outW, outH)

    svgInfo.value = { w: parsed.w, h: parsed.h }
    outputSrc.value = canvas.toDataURL('image/png')

    canvas.toBlob((b) => {
      if (seq !== renderSeq) return
      if (!b) {
        error.value = 'PNG 生成失败，请重试'
        return
      }
      pngBlob.value = b
      pngInfo.value = {
        width: outW,
        height: outH,
        size: formatSize(b.size),
      }
    }, 'image/png')
  } catch (e) {
    if (seq !== renderSeq) return
    outputSrc.value = ''
    pngBlob.value = null
    pngInfo.value = null
    error.value =
      e.name === 'SecurityError'
        ? '导出失败：SVG 引用了跨域外部资源，Canvas 已被浏览器污染'
        : e.message || 'SVG 渲染失败，请检查代码'
  } finally {
    URL.revokeObjectURL(url)
  }
}

// 文件处理
function handleFile(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function processFile(file) {
  error.value = ''
  copied.value = ''

  if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
    error.value = '请选择 SVG 文件'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'SVG 文件过大，请选择小于 5MB 的文件'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    svgInput.value = e.target.result
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsText(file)
}

// 下载 PNG
function downloadPng() {
  if (!pngBlob.value) return
  const url = URL.createObjectURL(pngBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = 'svg-to-png.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 复制 PNG：优先复制图片本身，失败则回退 Data URL
async function copyPng() {
  if (!pngBlob.value) return
  try {
    if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob.value }),
      ])
      copied.value = 'PNG 图片已复制到剪贴板'
      setTimeout(() => (copied.value = ''), 2000)
      return
    }
    throw new Error('no image clipboard support')
  } catch {
    const ok = await copyText(outputSrc.value)
    if (ok) {
      copied.value = '当前浏览器不支持复制图片，已复制 PNG Data URL'
    } else {
      error.value = '复制失败，请手动保存图片'
    }
    setTimeout(() => (copied.value = ''), 3000)
  }
}

// 复制 SVG 代码（输入区）
async function copySvg() {
  if (await copyText(svgInput.value)) {
    copied.value = 'SVG 代码已复制到剪贴板'
  } else {
    error.value = '复制失败，请手动复制'
  }
  setTimeout(() => (copied.value = ''), 2000)
}

// 清空
function clearAll() {
  svgInput.value = ''
  sizeMode.value = 'scale'
  scale.value = 2
  customWidth.value = 800
  customHeight.value = 600
  bgMode.value = 'transparent'
  bgColor.value = '#000000'
  outputSrc.value = ''
  pngBlob.value = null
  pngInfo.value = null
  svgInfo.value = null
  warning.value = ''
  error.value = ''
  copied.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// 实时渲染（防抖 250ms）
watch(
  [svgInput, sizeMode, scale, customWidth, customHeight, bgMode, bgColor],
  () => {
    clearTimeout(renderTimer)
    renderTimer = setTimeout(renderPng, 250)
  }
)

onBeforeUnmount(() => {
  clearTimeout(renderTimer)
})
</script>

<style scoped>
/* 上传区域 */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
  margin-top: 14px;
}

.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: rgba(157, 255, 107, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2rem;
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

/* SVG 原始尺寸提示 */
.svg-meta {
  margin-top: 8px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--green);
}

/* 使用提示 */
.tip {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

/* 预览 */
.canvas-wrapper {
  border: 1px solid var(--line);
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.preview-image {
  max-width: 100%;
  max-height: 260px;
  display: block;
  margin: 0 auto;
}

.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.15);
  width: 100%;
}

/* PNG 输出信息 */
.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 6px 0 14px;
}

.info-item {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
}

/* 导出参数 */
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.param-block {
  border: 1px solid var(--line);
  padding: 12px;
  background: var(--panel-2);
}

.param-block .radio-group {
  margin-bottom: 10px;
}

.range-tip {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-family: var(--mono);
  color: var(--muted);
  margin-top: 2px;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-inputs .code-input-sm {
  flex: 1;
  min-width: 0;
}

.size-x {
  color: var(--muted);
  font-family: var(--mono);
}

.bg-custom-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.color-input {
  width: 44px;
  height: 32px;
  padding: 2px;
  background: var(--panel);
  border: 1px solid var(--line);
  cursor: pointer;
}

.bg-hex {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
}

/* 警告提示（外部资源引用等非致命问题） */
.status-warning {
  margin-top: 10px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--yellow, #f0c040);
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
}

/* 响应式 */
@media (max-width: 640px) {
  .upload-area {
    padding: 1rem 0.5rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .preview-image {
    max-height: 200px;
  }

  .param-grid {
    grid-template-columns: 1fr;
  }
}
</style>
