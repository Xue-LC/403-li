<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📱 PWA Manifest 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：配置表单 -->
          <div class="tool-col">
            <label class="tool-label">应用信息：</label>
            <input
              v-model="form.name"
              class="code-input-sm"
              placeholder="应用名称 name（必填）"
            />
            <input
              v-model="form.shortName"
              class="code-input-sm"
              placeholder="短名称 short_name（主屏图标下显示）"
            />
            <textarea
              v-model="form.description"
              class="code-input"
              rows="2"
              placeholder="应用描述 description"
            ></textarea>
            <input
              v-model="form.startUrl"
              class="code-input-sm"
              placeholder="启动地址 start_url，如 /"
            />
            <input
              v-model="form.scope"
              class="code-input-sm"
              placeholder="作用域 scope，如 /"
            />

            <label class="tool-label">显示模式与方向：</label>
            <select v-model="form.display" class="tool-select">
              <option v-for="d in displays" :key="d" :value="d">{{ d }}</option>
            </select>
            <select v-model="form.orientation" class="tool-select">
              <option v-for="o in orientations" :key="o" :value="o">{{ o }}</option>
            </select>

            <label class="tool-label">主题配色：</label>
            <div class="color-row">
              <input type="color" class="color-swatch" v-model="form.themeColor" />
              <input
                v-model="form.themeColor"
                class="code-input-sm"
                placeholder="主题色 theme_color，如 #0f172a"
              />
            </div>
            <div class="color-row">
              <input type="color" class="color-swatch" v-model="form.backgroundColor" />
              <input
                v-model="form.backgroundColor"
                class="code-input-sm"
                placeholder="背景色 background_color"
              />
            </div>

            <label class="tool-label">语言与分类：</label>
            <div class="inline-2">
              <input v-model="form.lang" class="code-input-sm" placeholder="lang，如 zh-CN" />
              <select v-model="form.dir" class="tool-select">
                <option value="ltr">ltr</option>
                <option value="rtl">rtl</option>
                <option value="auto">auto</option>
              </select>
            </div>
            <input
              v-model="form.categories"
              class="code-input-sm"
              placeholder="分类 categories，英文逗号分隔"
            />

            <div class="label-row">
              <label class="tool-label">图标 icons：</label>
              <button class="mini-btn" title="添加一个图标" @click="addIcon">＋ 添加</button>
            </div>
            <div class="icon-list">
              <div v-for="(ic, i) in icons" :key="i" class="icon-row">
                <input v-model="ic.src" class="code-input-sm" placeholder="src 图标路径" />
                <div class="icon-row-line">
                  <input v-model="ic.sizes" class="code-input-sm" placeholder="sizes 如 192x192" />
                  <input v-model="ic.type" class="code-input-sm" placeholder="type 如 image/png" />
                  <select v-model="ic.purpose" class="tool-select icon-purpose">
                    <option value="any">any</option>
                    <option value="maskable">maskable</option>
                    <option value="any maskable">any maskable</option>
                    <option value="monochrome">monochrome</option>
                  </select>
                  <button class="remove-btn" title="删除该图标" @click="removeIcon(i)">✕</button>
                </div>
              </div>
              <p v-if="!icons.length" class="empty-hint">暂无图标，点击「＋ 添加」录入 icons 条目。</p>
            </div>
          </div>

          <!-- 右栏：预览 + JSON 输出 -->
          <div class="tool-col">
            <label class="tool-label">安装预览：</label>
            <div class="phone">
              <div class="phone-bar" :style="{ background: safeColor(form.themeColor) }">
                <span class="phone-dot"></span>
                <span class="phone-dot"></span>
              </div>
              <div class="phone-body" :style="{ background: safeColor(form.backgroundColor) }">
                <div class="app-icon" :style="{ background: safeColor(form.themeColor) }">
                  {{ iconChar }}
                </div>
                <div class="app-name">{{ form.shortName || form.name || '应用名称' }}</div>
                <div class="app-desc">{{ form.description || '应用描述将显示在这里。' }}</div>
              </div>
            </div>

            <div class="label-row">
              <label class="tool-label">manifest.json 输出：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制 JSON"
                :disabled="!jsonText"
                @click="copyJson"
              >📋</button>
            </div>
            <pre class="manifest-json" :class="{ 'is-empty': !hasContent }">{{ outputText }}</pre>
          </div>
        </div>

        <!-- ✅ 全宽区域：按钮与状态提示 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!jsonText" @click="copyJson">
            📋 复制 JSON
          </button>
          <button class="tool-button" :disabled="!hasContent" @click="download">
            ⬇️ 下载 manifest.json
          </button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const displays = ['standalone', 'fullscreen', 'minimal-ui', 'browser']
const orientations = [
  'any',
  'natural',
  'portrait',
  'portrait-primary',
  'portrait-secondary',
  'landscape',
  'landscape-primary',
  'landscape-secondary'
]

const form = reactive({
  name: '',
  shortName: '',
  description: '',
  startUrl: '/',
  scope: '',
  display: 'standalone',
  orientation: 'any',
  themeColor: '#0f172a',
  backgroundColor: '#0f172a',
  lang: 'zh-CN',
  dir: 'ltr',
  categories: ''
})

const icons = ref([
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
])

const error = ref('')
const success = ref('')

const iconChar = computed(() => {
  const n = (form.name || form.shortName || 'A').trim()
  return n ? n[0].toUpperCase() : 'A'
})

function safeColor(v) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((v || '').trim()) ? v.trim() : 'var(--panel-2)'
}

const manifest = computed(() => {
  const m = {}
  if (form.name.trim()) m.name = form.name.trim()
  if (form.shortName.trim()) m.short_name = form.shortName.trim()
  if (form.description.trim()) m.description = form.description.trim()
  if (form.startUrl.trim()) m.start_url = form.startUrl.trim()
  if (form.scope.trim()) m.scope = form.scope.trim()
  m.display = form.display
  m.orientation = form.orientation
  if (form.themeColor.trim()) m.theme_color = form.themeColor.trim()
  if (form.backgroundColor.trim()) m.background_color = form.backgroundColor.trim()
  if (form.lang.trim()) m.lang = form.lang.trim()
  if (form.dir) m.dir = form.dir

  const cats = form.categories
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (cats.length) m.categories = cats

  const list = icons.value
    .map((i) => {
      const o = {}
      if (i.src.trim()) o.src = i.src.trim()
      if (i.sizes.trim()) o.sizes = i.sizes.trim()
      if (i.type.trim()) o.type = i.type.trim()
      if (i.purpose) o.purpose = i.purpose
      return o
    })
    .filter((o) => Object.keys(o).length)
  if (list.length) m.icons = list

  return m
})

const hasContent = computed(() => !!form.name.trim())
const jsonText = computed(() => (hasContent.value ? JSON.stringify(manifest.value, null, 2) : ''))

const outputText = computed(() =>
  hasContent.value
    ? jsonText.value
    : '填写应用名称后，这里会实时生成 manifest.json 内容…'
)

function addIcon() {
  icons.value.push({ src: '', sizes: '', type: 'image/png', purpose: 'any' })
}

function removeIcon(i) {
  icons.value.splice(i, 1)
}

async function copyJson() {
  error.value = ''
  success.value = ''
  if (!hasContent.value) {
    error.value = '请先填写应用名称 name'
    return
  }
  if (await copyText(jsonText.value)) {
    success.value = '已复制 manifest.json 内容到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
  }
}

function download() {
  error.value = ''
  success.value = ''
  if (!hasContent.value) {
    error.value = '请先填写应用名称 name'
    return
  }
  try {
    const blob = new Blob([jsonText.value], { type: 'application/manifest+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manifest.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    success.value = '已开始下载 manifest.json'
    setTimeout(() => { success.value = '' }, 2000)
  } catch {
    error.value = '下载失败，请改用复制后保存为 manifest.json'
  }
}

function clear() {
  form.name = ''
  form.shortName = ''
  form.description = ''
  form.startUrl = '/'
  form.scope = ''
  form.display = 'standalone'
  form.orientation = 'any'
  form.themeColor = '#0f172a'
  form.backgroundColor = '#0f172a'
  form.lang = 'zh-CN'
  form.dir = 'ltr'
  form.categories = ''
  icons.value = [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ]
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  border-radius: 0;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.tool-select:focus {
  border-color: var(--green);
}

.tool-select option {
  background: var(--panel-2);
  color: var(--text);
}

/* 颜色选择行 */
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 0;
  cursor: pointer;
}

.color-swatch::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-swatch::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-swatch::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

.inline-2 {
  display: flex;
  gap: 8px;
}

.inline-2 .code-input-sm {
  flex: 1 1 0;
  min-width: 0;
}

.inline-2 .tool-select {
  flex: 0 0 100px;
}

/* 图标列表 */
.mini-btn {
  padding: 4px 10px;
  background: var(--green-soft);
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--mono);
  font-size: 11px;
  border-radius: 0;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.mini-btn:hover {
  box-shadow: 0 0 8px var(--green-glow);
}

.icon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-row {
  padding: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-row-line {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-row-line .code-input-sm {
  flex: 1 1 0;
  min-width: 0;
}

.icon-purpose {
  flex: 0 0 120px;
}

.remove-btn {
  flex: 0 0 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--red);
  font-family: var(--mono);
  font-size: 13px;
  border-radius: 0;
  cursor: pointer;
  transition: border-color 0.2s;
}

.remove-btn:hover {
  border-color: var(--red);
}

.empty-hint {
  margin: 0;
  padding: 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  border: 1px dashed var(--line);
  border-radius: 0;
}

/* 安装预览 */
.phone {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 0;
  overflow: hidden;
}

.phone-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--line);
}

.phone-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 50%;
}

.phone-body {
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  min-height: 160px;
  justify-content: center;
}

.app-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.app-name {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text);
  word-break: break-word;
}

.app-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  word-break: break-word;
}

/* JSON 输出 */
.manifest-json {
  margin: 0;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 0;
  min-height: 200px;
  max-height: 440px;
  overflow: auto;
}

.manifest-json.is-empty {
  border-color: var(--line);
  color: var(--muted);
  font-style: italic;
}

@media (max-width: 640px) {
  .icon-purpose {
    flex: 0 0 96px;
  }
  .manifest-json {
    font-size: 12px;
    max-height: 320px;
  }
}
</style>
