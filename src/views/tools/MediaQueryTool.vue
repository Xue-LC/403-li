<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📱 CSS 媒体查询生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：条件控制面板 -->
          <div class="tool-col">
            <label class="tool-label">预设断点（点击应用）：</label>
            <div class="preset-grid">
              <button
                v-for="p in presets"
                :key="p.label"
                class="preset-btn"
                @click="applyPreset(p)"
              >{{ p.label }}</button>
            </div>

            <label class="tool-label">查询条件（{{ conds.length }}）：</label>
            <div class="cond-list">
              <div v-for="(c, i) in conds" :key="i" class="cond-item">
                <select v-model="c.type" class="cond-select">
                  <option value="width">宽度 width</option>
                  <option value="height">高度 height</option>
                  <option value="orientation">方向 orientation</option>
                  <option value="prefers-color-scheme">色彩偏好 prefers-color-scheme</option>
                </select>
                <template v-if="c.type === 'width' || c.type === 'height'">
                  <select v-model="c.op" class="cond-select cond-op">
                    <option value="min">min</option>
                    <option value="max">max</option>
                  </select>
                  <input
                    v-model="c.value"
                    type="number"
                    min="1"
                    max="10000"
                    class="cond-input"
                    placeholder="768"
                  />
                  <span class="cond-unit">px</span>
                </template>
                <select v-else-if="c.type === 'orientation'" v-model="c.value" class="cond-select cond-op">
                  <option value="landscape">横屏</option>
                  <option value="portrait">竖屏</option>
                </select>
                <select v-else v-model="c.value" class="cond-select cond-op">
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
                <button class="cond-remove" title="删除条件" @click="removeCond(i)">✕</button>
              </div>
            </div>
            <button class="tool-button" @click="addCond">+ 添加条件</button>

            <label class="tool-label">预览宽度：{{ previewWidth }}px</label>
            <input
              type="range"
              v-model.number="previewWidth"
              min="320"
              max="1920"
              step="1"
              class="range-input"
            />
            <div class="width-quick">
              <button
                v-for="w in quickWidths"
                :key="w"
                class="width-btn"
                :class="{ active: previewWidth === w }"
                @click="previewWidth = w"
              >{{ w }}</button>
            </div>
          </div>

          <!-- 右栏：实时预览 + CSS 代码 -->
          <div class="tool-col">
            <label class="tool-label">
              实时预览：
              <button class="copy-btn" title="复制预览 HTML" :disabled="!previewDoc" @click="copyPreview">📋</button>
            </label>
            <div class="preview-frame">
              <iframe
                :srcdoc="previewDoc"
                :style="{ width: previewWidth + 'px' }"
                class="preview-iframe"
                title="媒体查询实时预览"
              ></iframe>
            </div>
            <div class="preview-hint">🖱️ 拖动上方滑块改变视口宽度，实时查看匹配效果</div>

            <label class="tool-label">
              CSS 代码：
              <button class="copy-btn" title="复制 CSS" :disabled="!generatedCSS" @click="copyCSS">📋</button>
            </label>
            <textarea
              :value="generatedCSS"
              readonly
              rows="8"
              class="code-input output"
              placeholder="配置查询条件后自动生成 CSS..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!generatedCSS" @click="copyCSS">📋 复制 CSS</button>
          <button class="tool-button" :disabled="!conds.length" @click="copyConds">📋 复制条件</button>
          <button class="tool-button danger" @click="reset">🗑️ 清空</button>
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

const conds = ref([
  { type: 'width', op: 'max', value: '767' }
])
const previewWidth = ref(768)
const error = ref('')
const success = ref('')
let successTimer = null

const presets = [
  { label: '📱 手机', conds: [{ type: 'width', op: 'max', value: '767' }] },
  {
    label: '📱 平板',
    conds: [
      { type: 'width', op: 'min', value: '768' },
      { type: 'width', op: 'max', value: '1023' }
    ]
  },
  { label: '🖥️ 桌面', conds: [{ type: 'width', op: 'min', value: '1024' }] },
  { label: '🖥️ 大屏', conds: [{ type: 'width', op: 'min', value: '1280' }] }
]

const quickWidths = [375, 768, 1024, 1440]

function applyPreset(preset) {
  conds.value = preset.conds.map(c => ({ ...c }))
  error.value = ''
}

function addCond() {
  conds.value.push({ type: 'width', op: 'max', value: '768' })
}

function removeCond(index) {
  conds.value.splice(index, 1)
}

function reset() {
  conds.value = []
  previewWidth.value = 768
}

/** 校验条件，返回错误消息（空字符串表示通过） */
function validate() {
  if (!conds.value.length) return '请至少添加一个查询条件'
  for (let i = 0; i < conds.value.length; i++) {
    const c = conds.value[i]
    if (c.type === 'width' || c.type === 'height') {
      const v = String(c.value).trim()
      if (!v) return `第 ${i + 1} 个条件：${c.type} 的取值不能为空`
      if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 10000) {
        return `第 ${i + 1} 个条件：${c.type} 请输入 1-10000 之间的正整数（px）`
      }
    }
  }
  return ''
}

/** 组装媒体查询字符串，如 (min-width: 768px) and (max-width: 1023px) */
const mediaQueryText = computed(() => {
  const parts = []
  for (const c of conds.value) {
    if (c.type === 'width' || c.type === 'height') {
      const v = String(c.value).trim()
      if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 10000) continue
      parts.push(`(${c.op}-${c.type}: ${Number(v)}px)`)
    } else if (c.type === 'orientation') {
      parts.push(`(orientation: ${c.value})`)
    } else if (c.type === 'prefers-color-scheme') {
      parts.push(`(prefers-color-scheme: ${c.value})`)
    }
  }
  return parts.join(' and ')
})

/** 输出给用户的 CSS 代码 */
const generatedCSS = computed(() => {
  const mq = mediaQueryText.value
  if (!mq) return ''
  return `/* 403.li 媒体查询生成器 */\n@media ${mq} {\n  /* ✍️ 在此编写此断点下的样式 */\n  .selector {\n    /* 示例：padding: 8px; */\n  }\n}\n`
})

/** 预览 iframe 文档（隔离环境，颜色使用主题同款色值） */
const previewDoc = computed(() => {
  const mq = mediaQueryText.value
  const mqCss = mq
    ? `@media ${mq} {
  .demo-panel {
    border-color: #9dff6b;
    background: rgba(157,255,107,0.12);
    color: #9dff6b;
    box-shadow: 0 0 24px rgba(157,255,107,0.25);
  }
}`
    : ''
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: #0d1117;
  font-family: 'Maple Mono NF CN', 'Monaco', 'Consolas', monospace;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.meta { color: #8b949e; font-size: 12px; line-height: 1.6; }
.meta b { color: #9dff6b; font-weight: normal; }
.demo-panel {
  padding: 20px;
  border: 1px dashed rgba(157,255,107,0.35);
  background: rgba(157,255,107,0.04);
  color: #8b949e;
  font-size: 13px;
  line-height: 1.8;
  transition: all 0.3s;
}
${mqCss}
</style>
</head>
<body>
  <div class="meta">视口宽度：<b id="w">0</b>px<br>媒体查询：<b>${mq || '（未配置条件）'}</b></div>
  <div class="demo-panel">
    <div style="font-size: 15px; margin-bottom: 6px">🔲 演示元素 .demo-panel</div>
    <div id="st">检测中…</div>
  </div>
<script>
function upd() {
  document.getElementById('w').textContent = window.innerWidth;
  var st = document.getElementById('st');
  var matched = false;
  try { matched = window.matchMedia('${mq}').matches; } catch (e) {}
  st.textContent = matched ? '✅ 当前视口匹配该媒体查询' : '⬜ 当前视口不匹配';
}
window.addEventListener('resize', upd);
upd();
<\/script>
</body>
</html>`
})

watch(conds, () => {
  error.value = validate()
  success.value = ''
}, { deep: true })

error.value = validate()

function showSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 2500)
}

async function copyCSS() {
  if (!generatedCSS.value) return
  const ok = await copyText(generatedCSS.value)
  if (ok) showSuccess('CSS 代码已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

async function copyConds() {
  if (!conds.value.length) return
  const text = JSON.stringify(conds.value, null, 2)
  const ok = await copyText(text)
  if (ok) showSuccess('查询条件（JSON）已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

async function copyPreview() {
  const ok = await copyText(previewDoc.value)
  if (ok) showSuccess('预览 HTML 已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}
</script>

<style scoped>
/* 标签内复制按钮定位（.copy-btn 为全局绝对定位） */
.tool-label {
  position: relative;
  padding-right: 34px;
}

/* 预设断点按钮 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-btn {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 20px var(--green-glow);
}

/* 条件列表 */
.cond-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cond-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cond-select {
  flex: 1 1 130px;
  min-width: 130px;
  height: 36px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0 6px;
}

.cond-select:focus {
  outline: 0;
  border-color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.cond-op {
  flex: 0 0 74px;
  min-width: 74px;
}

.cond-input {
  flex: 0 0 84px;
  width: 84px;
  height: 36px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0 8px;
}

.cond-input:focus {
  outline: 0;
  border-color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.cond-unit {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}

.cond-remove {
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--red);
  font-family: var(--mono);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cond-remove:hover {
  border-color: var(--red);
  background: rgba(255,138,138,0.1);
}

/* 快捷宽度按钮 */
.width-quick {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.width-btn {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.width-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.width-btn.active {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

/* 预览区 */
.preview-frame {
  border: 1px solid var(--line);
  background: var(--panel-2);
  overflow-x: auto;
  min-height: 240px;
}

.preview-iframe {
  display: block;
  height: 240px;
  border: 0;
  max-width: none;
}

.preview-hint {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cond-item {
    gap: 6px;
  }

  .cond-select {
    flex: 1 1 100%;
  }

  .cond-op {
    flex: 1 1 70px;
    min-width: 70px;
  }

  .cond-input {
    flex: 1 1 80px;
  }

  .preview-iframe {
    height: 200px;
  }
}
</style>
