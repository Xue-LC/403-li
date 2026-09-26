<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 占位图片生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：参数配置 -->
          <div class="tool-col">
            <label class="tool-label">宽度 (px)：</label>
            <input
              class="code-input-sm"
              type="number"
              v-model.number="width"
              min="1"
              max="4096"
              placeholder="例如：800"
            />

            <label class="tool-label">高度 (px)：</label>
            <input
              class="code-input-sm"
              type="number"
              v-model.number="height"
              min="1"
              max="4096"
              placeholder="例如：600"
            />

            <label class="tool-label">背景颜色：</label>
            <div class="color-row">
              <input
                type="color"
                v-model="bgColor"
                class="color-input-native"
              />
              <input
                class="code-input-sm color-hex-input"
                v-model="bgColor"
                placeholder="#cccccc"
              />
            </div>

            <label class="tool-label">文字颜色：</label>
            <div class="color-row">
              <input
                type="color"
                v-model="textColor"
                class="color-input-native"
              />
              <input
                class="code-input-sm color-hex-input"
                v-model="textColor"
                placeholder="#333333"
              />
            </div>

            <label class="tool-label">显示文字：</label>
            <input
              class="code-input-sm"
              v-model="displayText"
              placeholder="例如：800 × 600"
            />

            <label class="tool-label">字号 (px)：</label>
            <div class="font-size-row">
              <input
                type="range"
                v-model.number="fontSize"
                min="8"
                max="200"
                class="range-input"
              />
              <span class="font-size-value">{{ fontSize }}px</span>
            </div>
          </div>

          <!-- 右侧：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">预览：</label>
            <div class="canvas-wrapper">
              <canvas
                ref="canvasRef"
                :width="canvasWidth"
                :height="canvasHeight"
              ></canvas>
            </div>
            <div class="preview-info">
              <span>{{ canvasWidth }} × {{ canvasHeight }} px</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="drawCanvas">
            🔄 刷新预览
          </button>
          <button class="tool-button" @click="downloadPng">
            💾 下载 PNG
          </button>
          <button class="tool-button" @click="copyDataUrl">
            📋 复制 Data URL
          </button>
          <button class="tool-button danger" @click="resetDefaults">
            🗑️ 重置
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { copyText } from '../../utils/clipboard'

// 参数
const width = ref(800)
const height = ref(600)
const bgColor = ref('#cccccc')
const textColor = ref('#333333')
const displayText = ref('800 × 600')
const fontSize = ref(48)

// Canvas 引用
const canvasRef = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// 状态
const error = ref('')
const success = ref('')

/**
 * 绘制 Canvas 占位图
 */
function drawCanvas() {
  error.value = ''
  success.value = ''

  const w = Math.max(1, Math.min(4096, parseInt(width.value) || 800))
  const h = Math.max(1, Math.min(4096, parseInt(height.value) || 600))

  canvasWidth.value = w
  canvasHeight.value = h

  nextTick(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 背景
    ctx.fillStyle = bgColor.value || '#cccccc'
    ctx.fillRect(0, 0, w, h)

    // 文字
    const text = displayText.value || `${w} × ${h}`
    const fs = Math.max(8, Math.min(200, fontSize.value || 48))

    ctx.fillStyle = textColor.value || '#333333'
    ctx.font = `${fs}px "MapleMono NF CN", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 如果文字太长，尝试缩放字体以适配
    const maxTextWidth = w * 0.9
    let actualFontSize = fs
    ctx.font = `${actualFontSize}px "MapleMono NF CN", monospace`
    while (ctx.measureText(text).width > maxTextWidth && actualFontSize > 8) {
      actualFontSize--
      ctx.font = `${actualFontSize}px "MapleMono NF CN", monospace`
    }

    ctx.fillText(text, w / 2, h / 2)
  })
}

/**
 * 下载 PNG
 */
function downloadPng() {
  error.value = ''
  success.value = ''

  const canvas = canvasRef.value
  if (!canvas) {
    error.value = '请先生成预览图'
    return
  }

  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        error.value = '生成图片失败'
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `placeholder-${canvasWidth.value}x${canvasHeight.value}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      success.value = 'PNG 已下载'
    }, 'image/png')
  } catch (e) {
    error.value = '下载失败：' + e.message
  }
}

/**
 * 复制 Data URL
 */
async function copyDataUrl() {
  error.value = ''
  success.value = ''

  const canvas = canvasRef.value
  if (!canvas) {
    error.value = '请先生成预览图'
    return
  }

  try {
    const dataUrl = canvas.toDataURL('image/png')
    const ok = await copyText(dataUrl)
    if (ok) {
      success.value = 'Data URL 已复制到剪贴板'
    } else {
      error.value = '复制失败，请手动复制'
    }
  } catch (e) {
    error.value = '生成 Data URL 失败：' + e.message
  }
}

/**
 * 重置为默认值
 */
function resetDefaults() {
  error.value = ''
  success.value = ''
  width.value = 800
  height.value = 600
  bgColor.value = '#cccccc'
  textColor.value = '#333333'
  displayText.value = '800 × 600'
  fontSize.value = 48
}

// 监听参数变化自动重绘
watch([width, height, bgColor, textColor, displayText, fontSize], () => {
  drawCanvas()
})

onMounted(() => {
  drawCanvas()
})
</script>

<style scoped>
/* 颜色选择器行 */
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input-native {
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
  border-radius: 0;
}

.color-input-native::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input-native::-webkit-color-swatch {
  border: none;
}

.color-hex-input {
  flex: 1;
  min-width: 0;
}

/* 字号行 */
.font-size-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-input {
  flex: 1;
  accent-color: var(--green);
  height: 6px;
  cursor: pointer;
}

.font-size-value {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--green);
  min-width: 50px;
  text-align: right;
}

/* Canvas 预览 */
.canvas-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel-2);
  border: 1px solid var(--line);
  min-height: 200px;
  overflow: auto;
  padding: 12px;
}

.canvas-wrapper canvas {
  max-width: 100%;
  max-height: 400px;
  display: block;
  border: 1px solid var(--line);
}

.preview-info {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

/* 响应式 */
@media (max-width: 640px) {
  .canvas-wrapper {
    min-height: 180px;
  }

  .canvas-wrapper canvas {
    max-height: 280px;
  }

  .font-size-row {
    flex-wrap: wrap;
  }
}
</style>
