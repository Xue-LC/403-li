<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔠 字体预览器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入与控制面板 -->
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="text"
              rows="8"
              class="code-input text-input"
              placeholder="输入要预览的文本，支持多行..."
            ></textarea>

            <label class="tool-label">字号：{{ fontSize }}px</label>
            <input
              type="range"
              v-model.number="fontSize"
              min="12"
              max="72"
              step="1"
              class="range-input"
            />
            <div class="length-display"><span>{{ fontSize }}px</span></div>

            <label class="tool-label">行高：{{ lineHeight }}</label>
            <input
              type="range"
              v-model.number="lineHeight"
              min="1"
              max="2.5"
              step="0.1"
              class="range-input"
            />
            <div class="length-display"><span>{{ lineHeight }}</span></div>

            <label class="tool-label">字重：</label>
            <div class="weight-group">
              <button
                v-for="w in weights"
                :key="w"
                :class="['weight-btn', { active: fontWeight === w }]"
                @click="fontWeight = w"
              >
                {{ w }}
              </button>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="italic" />
                <span>斜体 Italic</span>
              </label>
            </div>

            <label class="tool-label">文字颜色：</label>
            <div class="config-row">
              <input
                type="color"
                class="color-input"
                v-model="color"
                title="选择颜色"
              />
              <input
                class="code-input-sm color-hex"
                v-model="colorHex"
                @change="applyHexColor"
                placeholder="#RRGGBB"
              />
            </div>

            <label class="tool-label">对比字体（多选）：</label>
            <div class="font-list">
              <label
                v-for="f in fonts"
                :key="f.id"
                class="checkbox-label"
              >
                <input type="checkbox" :value="f.id" v-model="selected" />
                <span class="font-name" :style="{ fontFamily: f.family }">{{ f.name }}</span>
              </label>
            </div>

            <label class="tool-label">自定义字体：</label>
            <input
              class="code-input-sm"
              v-model="customFamily"
              placeholder="如 'PingFang SC', 'Noto Serif SC', serif"
            />
          </div>

          <!-- 右栏：预览区 -->
          <div class="tool-col">
            <label class="tool-label">字体对比预览：</label>
            <div v-if="!previewFonts.length" class="empty-hint">
              勾选左侧字体开始对比预览
            </div>
            <div
              v-for="f in previewFonts"
              :key="f.id"
              class="preview-block"
            >
              <div class="section-header">
                <span class="section-title">▸ {{ f.name }}</span>
                <button
                  class="copy-btn-inline"
                  @click="copyFontCss(f)"
                  title="复制该字体的 CSS 样式"
                >
                  📋 复制 CSS
                </button>
              </div>
              <div class="font-preview" :style="previewStyle(f)">
                {{ text || placeholderText }}
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyInput" :disabled="!text.trim()">
            📋 复制输入
          </button>
          <button class="tool-button" @click="copyAllCss" :disabled="!previewFonts.length">
            📋 复制全部 CSS
          </button>
          <button class="tool-button danger" @click="reset">↺ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const DEFAULT_TEXT = 'Design 设计与代码\nThe quick brown fox jumps over the lazy dog 0123456789\n敏捷的棕色狐狸跳过懒狗 · 字体预览测试'

const text = ref(DEFAULT_TEXT)
const fontSize = ref(24)
const lineHeight = ref(1.6)
const fontWeight = ref(400)
const italic = ref(false)
const color = ref('#c9d1d9')
const colorHex = ref('#c9d1d9')
const customFamily = ref('')
const error = ref('')
const success = ref('')

const weights = [400, 500, 600, 700, 800]

const fonts = [
  { id: 'maple',   name: 'Maple Mono NF CN', family: "'Maple Mono NF CN', 'Monaco', 'Consolas', monospace" },
  { id: 'mono',    name: '系统等宽',          family: "'Consolas', 'Courier New', 'Menlo', monospace" },
  { id: 'sans',    name: '无衬线体',          family: "'Inter', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', system-ui, sans-serif" },
  { id: 'serif',   name: '衬线体',            family: "'Georgia', 'Times New Roman', 'Songti SC', 'SimSun', serif" },
  { id: 'heiti',   name: '黑体',              family: "'SimHei', 'Heiti SC', 'Noto Sans SC', sans-serif" },
  { id: 'kaiti',   name: '楷体',              family: "'KaiTi', 'Kaiti SC', 'STKaiti', serif" },
  { id: 'youyuan', name: '幼圆',              family: "'YouYuan', 'Yuanti SC', sans-serif" },
  { id: 'cursive', name: '手写体',            family: "'Comic Sans MS', 'Segoe Script', 'Brush Script MT', cursive" },
  { id: 'arial',   name: 'Arial',             family: "'Arial', 'Helvetica', sans-serif" },
  { id: 'times',   name: 'Times New Roman',   family: "'Times New Roman', Times, serif" },
  { id: 'courier', name: 'Courier New',       family: "'Courier New', Courier, monospace" },
  { id: 'impact',  name: 'Impact',            family: "'Impact', 'Arial Black', sans-serif" }
]

const selected = ref(['maple', 'sans', 'serif', 'kaiti'])

const placeholderText = '（暂无输入，输入文本后在此预览）'

watch(color, v => {
  colorHex.value = v
})

const previewFonts = computed(() => {
  const list = fonts.filter(f => selected.value.includes(f.id))
  const cf = customFamily.value.trim()
  if (cf) {
    list.push({ id: 'custom', name: '自定义字体', family: cf, custom: true })
  }
  return list
})

function previewStyle(font) {
  return {
    fontFamily: font.family,
    fontSize: fontSize.value + 'px',
    lineHeight: lineHeight.value,
    fontWeight: String(fontWeight.value),
    fontStyle: italic.value ? 'italic' : 'normal',
    color: color.value
  }
}

function fontCss(font) {
  return `/* ${font.name} */\nfont-family: ${font.family};\nfont-size: ${fontSize.value}px;\nline-height: ${lineHeight.value};\nfont-weight: ${fontWeight.value};\nfont-style: ${italic.value ? 'italic' : 'normal'};\ncolor: ${color.value};`
}

function applyHexColor() {
  const v = colorHex.value.trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
    color.value = v
    error.value = ''
  } else {
    error.value = '颜色格式无效，请使用 #RGB 或 #RRGGBB'
  }
}

async function copyInput() {
  if (await copyText(text.value)) {
    flash('输入文本已复制到剪贴板')
  } else {
    flash('复制失败，请手动复制', true)
  }
}

async function copyFontCss(font) {
  if (await copyText(fontCss(font))) {
    flash(`「${font.name}」的 CSS 已复制`)
  } else {
    flash('复制失败，请手动复制', true)
  }
}

async function copyAllCss() {
  const css = previewFonts.value.map(f => fontCss(f)).join('\n\n')
  if (await copyText(css)) {
    flash('全部字体 CSS 已复制到剪贴板')
  } else {
    flash('复制失败，请手动复制', true)
  }
}

let timer = null
function flash(msg, isError = false) {
  if (isError) {
    error.value = msg
    success.value = ''
  } else {
    success.value = msg
    error.value = ''
  }
  clearTimeout(timer)
  timer = setTimeout(() => {
    error.value = ''
    success.value = ''
  }, 2000)
}

function reset() {
  text.value = DEFAULT_TEXT
  fontSize.value = 24
  lineHeight.value = 1.6
  fontWeight.value = 400
  italic.value = false
  color.value = '#c9d1d9'
  colorHex.value = '#c9d1d9'
  customFamily.value = ''
  selected.value = ['maple', 'sans', 'serif', 'kaiti']
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 输入文本域比默认输出框略矮 */
.code-input.text-input {
  min-height: 120px;
  height: auto;
}

/* 滑块数值显示 */
.length-display {
  text-align: right;
  margin-top: -6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
}

/* 字重按钮组 */
.weight-group {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.weight-btn {
  padding: 6px 0;
  font-family: var(--mono);
  font-size: 13px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.weight-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.weight-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

/* 颜色选择器（直角化） */
.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.color-input {
  width: 48px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  flex-shrink: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 3px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-input::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

.color-hex {
  flex: 1;
  min-width: 120px;
}

/* 字体多选列表 */
.font-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-bottom: 4px;
}

.font-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 预览区 */
.empty-hint {
  border: 1px dashed var(--line);
  padding: 24px 12px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  font-family: var(--mono);
}

.preview-block {
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.preview-block + .preview-block {
  margin-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}

.section-title {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn-inline {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.font-preview {
  padding: 14px;
  min-height: 56px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .weight-group {
    grid-template-columns: repeat(3, 1fr);
  }

  .font-list {
    grid-template-columns: 1fr;
  }

  .font-preview {
    padding: 12px;
  }
}
</style>
