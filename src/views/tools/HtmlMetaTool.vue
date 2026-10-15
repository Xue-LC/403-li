<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🏷️ HTML Meta 标签生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：配置表单 -->
          <div class="tool-col">
            <label class="tool-label">SEO 基础信息：</label>
            <input
              v-model="seo.title"
              class="code-input-sm"
              placeholder="页面标题 (title)"
            />
            <p class="field-hint" :class="titleLevel">
              标题长度 {{ seo.title.length }} / 建议 ≤ 60 字符
            </p>

            <textarea
              v-model="seo.description"
              class="code-input"
              rows="3"
              placeholder="页面描述 (description)"
            ></textarea>
            <p class="field-hint" :class="descLevel">
              描述长度 {{ seo.description.length }} / 建议 ≤ 160 字符
            </p>

            <input
              v-model="seo.keywords"
              class="code-input-sm"
              placeholder="关键词 (keywords)，用英文逗号分隔"
            />
            <input
              v-model="seo.author"
              class="code-input-sm"
              placeholder="作者 (author)"
            />
            <input
              v-model="seo.canonical"
              class="code-input-sm"
              placeholder="规范链接 (canonical)，如 https://example.com/"
            />

            <label class="tool-label">爬虫规则 (robots)：</label>
            <select v-model="seo.robots" class="tool-select">
              <option v-for="r in robotsOptions" :key="r" :value="r">{{ r }}</option>
            </select>

            <label class="tool-label">Open Graph（社交分享）：</label>
            <select v-model="og.type" class="tool-select">
              <option v-for="t in ogTypes" :key="t" :value="t">{{ t }}</option>
            </select>
            <input v-model="og.title" class="code-input-sm" placeholder="og:title（留空则复用 title）" />
            <textarea
              v-model="og.description"
              class="code-input"
              rows="3"
              placeholder="og:description（留空则复用 description）"
            ></textarea>
            <input v-model="og.image" class="code-input-sm" placeholder="og:image 图片地址" />
            <input v-model="og.url" class="code-input-sm" placeholder="og:url 页面地址" />
            <input v-model="og.siteName" class="code-input-sm" placeholder="og:site_name 站点名称" />
            <input v-model="og.locale" class="code-input-sm" placeholder="og:locale，如 zh_CN" />

            <label class="tool-label">Twitter Card：</label>
            <select v-model="tw.card" class="tool-select">
              <option v-for="c in twCards" :key="c" :value="c">{{ c }}</option>
            </select>
            <input v-model="tw.site" class="code-input-sm" placeholder="twitter:site，如 @example" />
            <input v-model="tw.creator" class="code-input-sm" placeholder="twitter:creator，如 @author" />
            <input v-model="tw.image" class="code-input-sm" placeholder="twitter:image（留空则复用 og:image）" />
          </div>

          <!-- 右栏：预览 + 输出 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">搜索结果预览：</label>
            </div>
            <div class="serp-preview">
              <div class="serp-url">{{ displayUrl }}</div>
              <div class="serp-title">{{ seo.title || '页面标题将显示在这里' }}</div>
              <div class="serp-desc">
                {{ seo.description || '页面描述将显示在这里，用于向搜索引擎说明页面内容。' }}
              </div>
            </div>

            <label class="tool-label">社交卡片预览：</label>
            <div class="social-card">
              <div class="social-img">
                <img v-if="ogImage && !imgError" :src="ogImage" alt="preview" @error="imgError = true" />
                <span v-else class="social-img-ph">暂无预览图</span>
              </div>
              <div class="social-body">
                <div class="social-site">{{ og.siteName || hostName || 'example.com' }}</div>
                <div class="social-title">{{ ogTitle }}</div>
                <div class="social-desc">{{ ogDescription }}</div>
              </div>
            </div>

            <div class="label-row">
              <label class="tool-label">生成的 meta 代码：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制 meta 代码"
                :disabled="!metaCode"
                @click="copyCode"
              >📋</button>
            </div>
            <pre class="meta-code" :class="{ 'is-empty': !metaCode }">{{ metaCode || '填写左侧信息后，这里会实时生成 meta 标签代码…' }}</pre>
          </div>
        </div>

        <!-- ✅ 全宽区域：按钮与状态提示 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" :disabled="!metaCode" @click="copyCode">
            📋 复制完整代码
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
import { computed, reactive, ref, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const robotsOptions = [
  'index, follow',
  'index, nofollow',
  'noindex, follow',
  'noindex, nofollow',
  'noarchive',
  'nosnippet'
]

const ogTypes = ['website', 'article', 'product', 'profile', 'video.movie', 'music.song', 'book']
const twCards = ['summary', 'summary_large_image', 'app', 'player']

const seo = reactive({
  title: '',
  description: '',
  keywords: '',
  author: '',
  canonical: '',
  robots: 'index, follow'
})

const og = reactive({
  type: 'website',
  title: '',
  description: '',
  image: '',
  url: '',
  siteName: '',
  locale: ''
})

const tw = reactive({
  card: 'summary_large_image',
  site: '',
  creator: '',
  image: ''
})

const error = ref('')
const success = ref('')
const imgError = ref(false)

const ogTitle = computed(() => og.title.trim() || seo.title.trim())
const ogDescription = computed(() => og.description.trim() || seo.description.trim())
const ogImage = computed(() => og.image.trim() || tw.image.trim())

watch(ogImage, () => { imgError.value = false })

const titleLevel = computed(() => {
  const n = seo.title.length
  if (!n) return ''
  return n > 60 ? 'is-bad' : 'is-good'
})

const descLevel = computed(() => {
  const n = seo.description.length
  if (!n) return ''
  return n > 160 ? 'is-bad' : 'is-good'
})

const hostName = computed(() => {
  const raw = seo.canonical.trim() || og.url.trim()
  if (!raw) return ''
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})

const displayUrl = computed(() => {
  const base = hostName.value || 'example.com'
  return `https://${base}`
})

const esc = (s) => String(s).replace(/"/g, '&quot;').trim()

const metaCode = computed(() => {
  const lines = []

  lines.push('<meta charset="UTF-8">')
  lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')

  if (seo.title.trim()) lines.push(`<title>${esc(seo.title)}</title>`)
  if (seo.description.trim()) lines.push(`<meta name="description" content="${esc(seo.description)}">`)
  if (seo.keywords.trim()) lines.push(`<meta name="keywords" content="${esc(seo.keywords)}">`)
  if (seo.author.trim()) lines.push(`<meta name="author" content="${esc(seo.author)}">`)
  if (seo.robots.trim()) lines.push(`<meta name="robots" content="${esc(seo.robots)}">`)
  if (seo.canonical.trim()) lines.push(`<link rel="canonical" href="${esc(seo.canonical)}">`)

  // 只有填写了任意 OG/Twitter 字段才生成社交标签
  const hasSocial =
    ogTitle.value || ogDescription.value || og.image.trim() || og.url.trim() ||
    og.siteName.trim() || og.locale.trim() || tw.site.trim() || tw.creator.trim() || tw.image.trim()

  if (hasSocial) {
    lines.push('')
    lines.push('<!-- Open Graph -->')
    lines.push(`<meta property="og:type" content="${esc(og.type)}">`)
    if (ogTitle.value) lines.push(`<meta property="og:title" content="${esc(ogTitle.value)}">`)
    if (ogDescription.value) lines.push(`<meta property="og:description" content="${esc(ogDescription.value)}">`)
    if (og.url.trim()) lines.push(`<meta property="og:url" content="${esc(og.url)}">`)
    if (og.image.trim()) lines.push(`<meta property="og:image" content="${esc(og.image)}">`)
    if (og.siteName.trim()) lines.push(`<meta property="og:site_name" content="${esc(og.siteName)}">`)
    if (og.locale.trim()) lines.push(`<meta property="og:locale" content="${esc(og.locale)}">`)
  }

  const twImage = tw.image.trim() || og.image.trim()
  const hasTwitter = tw.site.trim() || tw.creator.trim() || twImage || ogTitle.value || ogDescription.value
  if (hasTwitter) {
    lines.push('')
    lines.push('<!-- Twitter Card -->')
    lines.push(`<meta name="twitter:card" content="${esc(tw.card)}">`)
    if (tw.site.trim()) lines.push(`<meta name="twitter:site" content="${esc(tw.site)}">`)
    if (tw.creator.trim()) lines.push(`<meta name="twitter:creator" content="${esc(tw.creator)}">`)
    if (ogTitle.value) lines.push(`<meta name="twitter:title" content="${esc(ogTitle.value)}">`)
    if (ogDescription.value) lines.push(`<meta name="twitter:description" content="${esc(ogDescription.value)}">`)
    if (twImage) lines.push(`<meta name="twitter:image" content="${esc(twImage)}">`)
  }

  return lines.join('\n')
})

async function copyCode() {
  error.value = ''
  success.value = ''
  if (!metaCode.value) {
    error.value = '请先填写页面标题等信息'
    return
  }
  if (await copyText(metaCode.value)) {
    success.value = '已复制 meta 代码到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
  }
}

function clear() {
  seo.title = ''
  seo.description = ''
  seo.keywords = ''
  seo.author = ''
  seo.canonical = ''
  seo.robots = 'index, follow'
  og.type = 'website'
  og.title = ''
  og.description = ''
  og.image = ''
  og.url = ''
  og.siteName = ''
  og.locale = ''
  tw.card = 'summary_large_image'
  tw.site = ''
  tw.creator = ''
  tw.image = ''
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

/* 标签内联复制按钮（覆盖全局绝对定位） */
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

.field-hint {
  margin: 4px 0 8px;
  font-size: 11px;
  font-family: var(--mono);
  color: var(--muted);
  line-height: 1.4;
}

.field-hint.is-good {
  color: var(--green);
}

.field-hint.is-bad {
  color: var(--red);
}

/* 搜索结果预览 */
.serp-preview {
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
}

.serp-url {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
  word-break: break-all;
}

.serp-title {
  font-size: 16px;
  color: var(--green);
  line-height: 1.35;
  margin-bottom: 4px;
  word-break: break-word;
}

.serp-desc {
  font-size: 13px;
  color: var(--text);
  opacity: 0.85;
  line-height: 1.5;
  word-break: break-word;
}

/* 社交卡片预览 */
.social-card {
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 0;
  overflow: hidden;
}

.social-img {
  width: 100%;
  aspect-ratio: 1.91 / 1;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.social-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.social-img-ph {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

.social-body {
  padding: 10px 12px;
}

.social-site {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 3px;
}

.social-title {
  font-size: 14px;
  color: var(--text);
  line-height: 1.35;
  margin-bottom: 3px;
  word-break: break-word;
}

.social-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 生成的 meta 代码 */
.meta-code {
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
  min-height: 180px;
  max-height: 420px;
  overflow: auto;
}

.meta-code.is-empty {
  border-color: var(--line);
  color: var(--muted);
  font-style: italic;
}

@media (max-width: 640px) {
  .serp-title {
    font-size: 15px;
  }
  .meta-code {
    font-size: 12px;
    max-height: 320px;
  }
}
</style>
