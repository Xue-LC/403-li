<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎯 CSS 选择器测试器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 双栏：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <label class="tool-label">HTML 片段：</label>
            <div class="ta-wrap">
              <textarea
                v-model="html"
                class="code-input"
                rows="10"
                spellcheck="false"
                placeholder="粘贴或输入 HTML 片段…&#10;&#10;<div class=&quot;card&quot;>&#10;  <h2 class=&quot;title&quot;>标题</h2>&#10;  <p class=&quot;text&quot;>段落文字</p>&#10;</div>"
              ></textarea>
              <button class="copy-btn" title="复制 HTML" @click="copy(html, '已复制 HTML')">📋</button>
            </div>

            <label class="tool-label">CSS 选择器：</label>
            <div class="input-with-copy">
              <input
                v-model="selector"
                type="text"
                class="code-input-sm"
                spellcheck="false"
                placeholder="如 .card > p, #list li:nth-child(2)"
                @keyup.enter="applyHighlight"
              />
              <button class="copy-btn" title="复制选择器" @click="copy(selector, '已复制选择器')">📋</button>
            </div>

            <div class="sel-chips">
              <span class="chips-label">示例：</span>
              <button
                v-for="ex in examples"
                :key="ex"
                class="chip-btn"
                @click="selector = ex"
              >{{ ex }}</button>
            </div>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="preview-shell">
              <iframe
                ref="iframeRef"
                class="preview-frame"
                :srcdoc="srcdoc"
                sandbox="allow-same-origin"
                title="CSS 选择器预览"
                @load="applyHighlight"
              ></iframe>
            </div>

            <label class="tool-label">
              匹配结果：
              <button
                class="copy-btn inline-copy"
                title="复制报告"
                @click="copyReport"
                :disabled="!matches.length"
              >📋</button>
            </label>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">匹配数量</span>
                <span class="stat-value">{{ matches.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">唯一标签</span>
                <span class="stat-value">{{ uniqueTags }}</span>
              </div>
            </div>
            <div class="match-list">
              <div v-for="m in matches" :key="m.index" class="match-item">
                <span class="match-index">{{ m.index }}</span>
                <div class="match-body">
                  <code class="match-tag">{{ m.signature }}</code>
                  <span v-if="m.path" class="match-path">{{ m.path }}</span>
                  <span v-if="m.text" class="match-text">{{ m.text }}</span>
                </div>
              </div>
              <div v-if="!matches.length" class="match-empty">
                {{ selector.trim() ? '没有元素匹配该选择器' : '输入选择器后显示匹配元素' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮（双栏外，全宽） -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" :disabled="!html.trim()" @click="applyHighlight">🔍 高亮匹配</button>
          <button class="tool-button" @click="loadSample">📄 载入示例</button>
        </div>
        <div class="button-group button-group-2">
          <button class="tool-button" :disabled="!matches.length" @click="copyReport">📋 复制报告</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-else-if="status" class="status-success">✅ {{ status }}</div>

        <details class="help-box">
          <summary>📖 支持的常见选择器（点击试用）</summary>
          <div class="help-grid">
            <button
              v-for="h in cheats"
              :key="h.sel"
              class="help-item"
              @click="selector = h.sel"
            >
              <code>{{ h.sel }}</code>
              <span>{{ h.desc }}</span>
            </button>
          </div>
        </details>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { copyText } from '../../utils/clipboard'

const SAMPLE_HTML = `<div class="card">
  <h2 class="card-title">卡片标题</h2>
  <p class="card-text">第一段正文内容</p>
  <p class="card-text">第二段正文内容</p>
  <ul id="list">
    <li>列表项 A</li>
    <li class="active">列表项 B</li>
    <li>列表项 C</li>
  </ul>
  <a href="https://403.li" class="link">链接</a>
  <button class="btn primary" disabled>提交</button>
</div>`

const html = ref(SAMPLE_HTML)
const selector = ref('.card-text')
const srcdoc = ref('')
const matches = ref([])
const error = ref('')
const status = ref('')
const iframeRef = ref(null)

const examples = ['.card-text', '#list > li', 'ul li:first-child', '.btn', 'a[href^="https"]']

const cheats = [
  { sel: 'div', desc: '标签选择器' },
  { sel: '.class', desc: '类选择器' },
  { sel: '#id', desc: 'ID 选择器' },
  { sel: 'a[href]', desc: '属性选择器' },
  { sel: 'ul > li', desc: '直接子元素' },
  { sel: 'h2 + p', desc: '相邻兄弟元素' },
  { sel: 'li:nth-child(2)', desc: '第 N 个子元素' },
  { sel: ':not(.active)', desc: '排除匹配' }
]

const uniqueTags = computed(() => new Set(matches.value.map(m => m.tag)).size)

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

// 移除脚本与内联事件，预览更安全
function sanitize(fragment) {
  return (fragment || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function buildDoc(fragment) {
  const accent = cssVar('--green', '#9dff6b')
  const accentSoft = 'rgba(157,255,107,0.18)'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:12px;background:transparent;color:#cdd6cd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.55;}
.__sel_hit{outline:2px solid ${accent} !important;outline-offset:1px;background:${accentSoft} !important;}
</style></head><body>${sanitize(fragment)}</body></html>`
}

function signatureOf(el) {
  const cls = Array.from(el.classList).filter(c => c !== '__sel_hit')
  return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls.length ? '.' + cls.join('.') : '')
}

function buildPath(el) {
  const parts = []
  let node = el
  while (node && node.nodeType === 1 && !['body', 'html'].includes(node.tagName.toLowerCase())) {
    let p = node.tagName.toLowerCase()
    if (node.id) { parts.unshift(p + '#' + node.id); break }
    const cls = Array.from(node.classList).filter(c => c !== '__sel_hit')
    if (cls.length) p += '.' + cls.join('.')
    const parent = node.parentElement
    if (parent) {
      const sib = Array.from(parent.children).filter(c => c.tagName === node.tagName)
      if (sib.length > 1) p += `:nth-of-type(${sib.indexOf(node) + 1})`
    }
    parts.unshift(p)
    node = node.parentElement
  }
  return parts.join(' > ')
}

function applyHighlight() {
  const doc = iframeRef.value && iframeRef.value.contentDocument
  matches.value = []
  error.value = ''
  status.value = ''
  if (!doc) return
  doc.querySelectorAll('.__sel_hit').forEach(el => el.classList.remove('__sel_hit'))
  const sel = selector.value.trim()
  if (!sel) {
    if (html.value.trim()) status.value = '请输入 CSS 选择器'
    return
  }
  let nodes
  try {
    nodes = doc.querySelectorAll(sel)
  } catch (e) {
    error.value = '选择器语法错误：' + (e && e.message ? e.message : '无法解析')
    return
  }
  const list = []
  nodes.forEach((el, i) => {
    el.classList.add('__sel_hit')
    list.push({
      index: i + 1,
      tag: el.tagName.toLowerCase(),
      signature: signatureOf(el),
      path: buildPath(el),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    })
  })
  matches.value = list
  status.value = `匹配到 ${list.length} 个元素`
}

let htmlTimer = null
let selTimer = null
function scheduleRender() {
  clearTimeout(htmlTimer)
  htmlTimer = setTimeout(() => { srcdoc.value = buildDoc(html.value) }, 250)
}
function scheduleHighlight() {
  clearTimeout(selTimer)
  selTimer = setTimeout(applyHighlight, 120)
}

watch(html, scheduleRender)
watch(selector, scheduleHighlight)

function loadSample() {
  html.value = SAMPLE_HTML
  selector.value = '.card-text'
  scheduleRender()
}

function clear() {
  html.value = ''
  selector.value = ''
  matches.value = []
  error.value = ''
  status.value = ''
  srcdoc.value = buildDoc('')
}

async function copy(text, msg) {
  if (!text) return
  const ok = await copyText(text)
  if (ok) { status.value = msg; error.value = '' }
  else { error.value = '复制失败，请手动选择复制' }
}

function copyReport() {
  if (!matches.value.length) return
  const lines = matches.value.map(m =>
    `${m.index}. <${m.tag}>` +
    (m.path ? '\n   path: ' + m.path : '') +
    (m.text ? '\n   text: ' + m.text : '')
  )
  copy(lines.join('\n\n'), `已复制 ${matches.value.length} 条匹配结果`)
}

onMounted(() => {
  srcdoc.value = buildDoc(html.value)
})
</script>

<style scoped>
.ta-wrap {
  position: relative;
}
.ta-wrap .copy-btn {
  top: 8px;
  right: 8px;
}

.sel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
}
.chips-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}
.chip-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}
.chip-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.preview-shell {
  border: 1px solid var(--line);
  background: var(--panel-2);
  display: flex;
  min-height: 260px;
}
.preview-frame {
  width: 100%;
  min-height: 260px;
  border: 0;
  background: var(--panel-2);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}
.stat-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}
.stat-value {
  color: var(--green);
  font-family: var(--mono);
  font-size: 16px;
  font-weight: bold;
}

.match-list {
  border: 1px solid var(--line);
  background: var(--panel-2);
  max-height: 220px;
  overflow: auto;
}
.match-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
}
.match-item:last-child {
  border-bottom: 0;
}
.match-index {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  min-width: 20px;
  text-align: right;
}
.match-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.match-tag {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 13px;
  word-break: break-all;
}
.match-path {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  word-break: break-all;
}
.match-text {
  color: var(--text-muted);
  font-size: 12px;
  word-break: break-all;
}
.match-empty {
  padding: 14px 10px;
  color: var(--dim);
  font-family: var(--mono);
  font-size: 12px;
  text-align: center;
}

.inline-copy {
  position: static;
  display: inline;
  margin-left: 8px;
  font-size: 14px;
}

.help-box {
  margin-top: 14px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}
.help-box summary {
  cursor: pointer;
  color: var(--green);
}
.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.help-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}
.help-item:hover {
  border-color: var(--green);
  background: var(--green-soft);
}
.help-item code {
  color: var(--green);
  font-size: 12px;
}
.help-item span {
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 640px) {
  .preview-frame,
  .preview-shell {
    min-height: 200px;
  }
}
</style>
