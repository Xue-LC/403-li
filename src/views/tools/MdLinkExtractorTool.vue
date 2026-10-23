<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔗 Markdown 链接提取器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入 / 输出双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入 Markdown：</label>
            <div class="copy-wrap">
              <textarea
                v-model="input"
                rows="14"
                class="code-input"
                spellcheck="false"
                placeholder="粘贴包含链接的 Markdown 文本…&#10;&#10;[示例](https://403.li)&#10;![图片](https://403.li/logo.png)"
              ></textarea>
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>
            <div class="meta-line">
              <span>{{ input.length }} 字符 · {{ lineCount }} 行</span>
              <span v-if="parse.links.length" class="meta-green">识别 {{ parse.total }} 个链接</span>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">提取结果（{{ formatLabel }}）：</label>
            <div class="copy-wrap">
              <textarea
                :value="exportText"
                rows="14"
                class="code-input output"
                spellcheck="false"
                readonly
                placeholder="提取的链接将显示在这里..."
              ></textarea>
              <button class="copy-btn" title="复制结果" :disabled="!exportText" @click="copyOutput">📋</button>
            </div>
            <div class="meta-line">
              <span>{{ filtered.length }} 条{{ keyword ? '（已筛选）' : '' }} · {{ parse.unique }} 个唯一 URL</span>
            </div>
          </div>
        </div>

        <!-- 识别选项 -->
        <div class="opt-row">
          <label class="checkbox-label">
            <input v-model="opts.image" type="checkbox" />
            <span>图片 ![]()</span>
          </label>
          <label class="checkbox-label">
            <input v-model="opts.ref" type="checkbox" />
            <span>引用式 [][]</span>
          </label>
          <label class="checkbox-label">
            <input v-model="opts.auto" type="checkbox" />
            <span>自动链接 &lt;&gt;</span>
          </label>
          <label class="checkbox-label">
            <input v-model="opts.bare" type="checkbox" />
            <span>裸链接</span>
          </label>
          <label class="checkbox-label">
            <input v-model="opts.html" type="checkbox" />
            <span>HTML &lt;a&gt;</span>
          </label>
          <label class="checkbox-label">
            <input v-model="dedupe" type="checkbox" />
            <span>按 URL 去重</span>
          </label>
        </div>

        <!-- 输出格式 / 排序 -->
        <div class="opt-row opt-row-split">
          <div class="radio-group">
            <label v-for="f in FORMATS" :key="f.key" class="radio-label">
              <input v-model="format" type="radio" :value="f.key" />
              <span>{{ f.label }}</span>
            </label>
          </div>
          <div class="radio-group sort-group">
            <label class="radio-label">
              <input v-model="sortMode" type="radio" value="order" />
              <span>出现顺序</span>
            </label>
            <label class="radio-label">
              <input v-model="sortMode" type="radio" value="alpha" />
              <span>字母顺序</span>
            </label>
          </div>
        </div>

        <!-- 操作 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!exportText" @click="copyOutput">📋 复制全部</button>
          <button class="tool-button" @click="loadSample">🧪 示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="success" class="status-success">✅ {{ success }}</div>
        <div v-if="tooLong" class="status-error">
          ❌ 文本过长（{{ input.length }} 字符），请控制在 {{ MAX_LEN.toLocaleString() }} 字符以内
        </div>
        <div v-else-if="input.trim() && !parse.links.length" class="status-error">
          ⚠️ 未检测到链接：请确认格式是否正确，或勾选上方的「裸链接 / 自动链接」等选项
        </div>

        <!-- 空输入提示 -->
        <div v-if="!input.trim()" class="empty-hint">
          粘贴 Markdown 文本，自动提取所有链接文本与 URL —— 支持内联链接、图片、引用式链接、自动链接、裸链接和 HTML 锚点
        </div>

        <!-- 结构化结果表格 -->
        <div v-if="parse.links.length" class="panel-block">
          <div class="panel-head">
            <span>▼ 链接列表（{{ filtered.length }} / {{ parse.links.length }}）</span>
            <span>{{ parse.unique }} 个唯一 URL</span>
          </div>

          <div class="filter-row">
            <input
              v-model="keyword"
              class="code-input-sm filter-input"
              type="search"
              spellcheck="false"
              placeholder="搜索链接文本或 URL…"
            />
            <button v-if="keyword" class="filter-clear" @click="keyword = ''">✕ 清除</button>
          </div>

          <div class="table-scroll">
            <table class="link-table">
              <thead>
                <tr>
                  <th class="col-idx">#</th>
                  <th class="col-type">类型</th>
                  <th>链接文本</th>
                  <th>URL</th>
                  <th class="col-line num">行</th>
                  <th class="col-act">复制</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(l, i) in filtered" :key="l.index + ':' + l.url">
                  <td class="col-idx">{{ i + 1 }}</td>
                  <td class="col-type">
                    <span class="type-tag" :class="'t-' + l.type">{{ l.typeLabel }}</span>
                  </td>
                  <td class="cell-text" :title="l.text || l.title">
                    <span v-if="l.text">{{ l.text }}</span>
                    <span v-else class="faint">（无文本）</span>
                  </td>
                  <td class="cell-url" :title="l.url">
                    <a
                      v-if="isSafeUrl(l.url)"
                      :href="l.url"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >{{ l.url }}</a>
                    <span v-else class="faint">{{ l.url }}</span>
                  </td>
                  <td class="col-line num">{{ l.line }}</td>
                  <td class="col-act">
                    <button class="row-copy" title="复制此 URL" @click="copyOne(l)">📋</button>
                  </td>
                </tr>
                <tr v-if="!filtered.length">
                  <td colspan="6" class="no-match">没有匹配「{{ keyword }}」的链接</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

const MAX_LEN = 200000

const SAMPLE = `# 示例文档

常用工具站：[403.li 在线工具箱](https://403.li "终端风格工具站")，文档参考 [MDN](https://developer.mozilla.org/zh-CN/docs/Web)。

图片写法：![站点图标](https://403.li/favicon.png "Logo")

引用式链接：[Vue 3][vue] 与 [Vite][] 都是前端常用工具。

自动链接：<https://www.rfc-editor.org/rfc/rfc3986>

文中直接出现的裸链接：访问 https://example.com/docs?page=2#install 查看安装说明。

HTML 写法：<a href="https://github.com/">GitHub 主页</a>

[vue]: https://vuejs.org/ "Vue.js 官方文档"
[vite]: https://vitejs.dev/
`

const FORMATS = [
  { key: 'url', label: 'URL 列表' },
  { key: 'md', label: 'Markdown 列表' },
  { key: 'json', label: 'JSON 数组' },
  { key: 'csv', label: 'CSV 表格' }
]

const TYPE_LABEL = {
  link: '链接',
  image: '图片',
  ref: '引用',
  auto: '自动',
  bare: '裸链',
  html: 'HTML'
}

const input = ref('')
const format = ref('url')
const keyword = ref('')
const dedupe = ref(true)
const sortMode = ref('order')
const success = ref('')
const opts = ref({ image: true, ref: true, auto: true, bare: true, html: true })
let successTimer = null

/* ================= 文本工具 ================= */

function buildLineStarts(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function lineAt(starts, index) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= index) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

function unescapeMd(s) {
  return String(s).replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1')
}

function stripAngle(s) {
  const t = String(s).trim()
  if (t.startsWith('<') && t.endsWith('>')) return t.slice(1, -1)
  return t
}

function cleanText(s) {
  return decodeEntities(
    String(s)
      .replace(/\s+/g, ' ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .trim()
  )
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/** URL 统一处理：去尖括号 → 反转义 Markdown → 解码 HTML 实体 */
function normalizeUrl(s) {
  return decodeEntities(unescapeMd(stripAngle(s)))
}

function normLabel(s) {
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase()
}

function countChar(s, ch) {
  let n = 0
  for (const c of s) if (c === ch) n++
  return n
}

function trimBare(url) {
  let s = url
  for (let guard = 0; guard < 8 && s.length; guard++) {
    const last = s[s.length - 1]
    if ('.,;:!?、。，；：！？'.includes(last)) {
      s = s.slice(0, -1)
      continue
    }
    if (last === ')' && countChar(s, '(') < countChar(s, ')')) {
      s = s.slice(0, -1)
      continue
    }
    if (last === ']' && countChar(s, '[') < countChar(s, ']')) {
      s = s.slice(0, -1)
      continue
    }
    if (last === '}') {
      s = s.slice(0, -1)
      continue
    }
    break
  }
  return s
}

/* ================= 解析 ================= */

function markRange(consumed, start, end) {
  for (let i = start; i < end && i < consumed.length; i++) consumed[i] = 1
}

function overlaps(consumed, start, end) {
  for (let i = start; i < end && i < consumed.length; i++) {
    if (consumed[i]) return true
  }
  return false
}

function parseLinks(text, cfg) {
  const out = []
  const consumed = new Uint8Array(text.length)
  const starts = buildLineStarts(text)
  const refs = new Map()

  const add = (item) => {
    out.push({
      text: item.text,
      url: item.url,
      title: item.title || '',
      type: item.type,
      typeLabel: TYPE_LABEL[item.type] || item.type,
      line: lineAt(starts, item.index),
      index: item.index
    })
  }

  /* 1. 引用式定义行（本身不算链接，但要防止其 URL 被当成裸链接） */
  const DEF_RE = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?[ \t]*$/gm
  let m
  while ((m = DEF_RE.exec(text)) !== null) {
    const label = normLabel(m[1])
    if (!refs.has(label)) {
      refs.set(label, { url: normalizeUrl(m[2]), title: m[3] || m[4] || m[5] || '' })
    }
    markRange(consumed, m.index, m.index + m[0].length)
  }

  /* 2. 内联链接与图片：![alt](url "title") / [text](url 'title') */
  const INLINE_RE = /(!?)\[([^\]]*)\]\(\s*(<[^<>\n]*>|[^\s()]*(?:\([^()]*\)[^\s()]*)*)(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^()]*)\)))?\s*\)/g
  while ((m = INLINE_RE.exec(text)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (overlaps(consumed, start, end)) continue
    markRange(consumed, start, end)

    const isImage = m[1] === '!'
    if (isImage && !cfg.image) continue
    const url = normalizeUrl(m[3])
    if (!url) continue
    add({
      text: cleanText(m[2]),
      url,
      title: m[4] || m[5] || m[6] || '',
      type: isImage ? 'image' : 'link',
      index: start
    })
  }

  /* 3. 引用式链接：[text][ref] 与折叠式 [text][] */
  const REF_RE = /\[([^\]]+)\]\[([^\]]*)\]/g
  while ((m = REF_RE.exec(text)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (overlaps(consumed, start, end)) continue
    const label = normLabel(m[2] || m[1])
    const def = refs.get(label)
    if (!def) continue
    markRange(consumed, start, end)
    if (!cfg.ref) continue
    add({
      text: cleanText(m[1]),
      url: def.url,
      title: def.title,
      type: 'ref',
      index: start
    })
  }

  /* 4. HTML 锚点 */
  if (cfg.html) {
    const A_RE = /<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi
    while ((m = A_RE.exec(text)) !== null) {
      const start = m.index
      const end = start + m[0].length
      if (overlaps(consumed, start, end)) continue
      markRange(consumed, start, end)
      const url = normalizeUrl(m[1] || m[2] || m[3] || '')
      if (!url) continue
      add({
        text: decodeEntities(m[4].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(),
        url,
        title: '',
        type: 'html',
        index: start
      })
    }
  }

  /* 5. 自动链接：<https://...> */
  const AUTO_RE = /<((?:https?|ftp|mailto):[^<>\s]+)>/gi
  while ((m = AUTO_RE.exec(text)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (overlaps(consumed, start, end)) continue
    markRange(consumed, start, end)
    if (!cfg.auto) continue
    add({ text: '', url: decodeEntities(m[1]), title: '', type: 'auto', index: start })
  }

  /* 6. 裸链接 */
  if (cfg.bare) {
    const BARE_RE = /(?:(?:https?|ftp):\/\/|mailto:)[^\s<>"'`\[\]{}|\\^]+/gi
    while ((m = BARE_RE.exec(text)) !== null) {
      const start = m.index
      if (overlaps(consumed, start, start + m[0].length)) continue
      const url = trimBare(m[0])
      if (!url) continue
      markRange(consumed, start, start + m[0].length)
      add({ text: '', url, title: '', type: 'bare', index: start })
    }
  }

  return out
}

/* ================= 状态 ================= */

const tooLong = computed(() => input.value.length > MAX_LEN)

const parse = computed(() => {
  const text = input.value
  if (!text.trim() || tooLong.value) return { links: [], total: 0, unique: 0 }

  const all = parseLinks(text, opts.value)
  const unique = new Set(all.map(l => l.url)).size

  let list = all
  if (dedupe.value) {
    const seen = new Set()
    list = []
    for (const l of all) {
      if (seen.has(l.url)) continue
      seen.add(l.url)
      list.push(l)
    }
  }

  if (sortMode.value === 'alpha') {
    list = [...list].sort((a, b) => a.url.localeCompare(b.url, 'en'))
  } else {
    list = [...list].sort((a, b) => a.index - b.index)
  }

  return { links: list, total: all.length, unique }
})

const lineCount = computed(() => (input.value ? input.value.split('\n').length : 0))

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return parse.value.links
  return parse.value.links.filter(l =>
    l.text.toLowerCase().includes(kw) ||
    l.url.toLowerCase().includes(kw) ||
    l.typeLabel.toLowerCase().includes(kw)
  )
})

const formatLabel = computed(() => (FORMATS.find(f => f.key === format.value) || FORMATS[0]).label)

/* ================= 导出 ================= */

function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

const exportText = computed(() => {
  const list = filtered.value
  if (!list.length) return ''

  if (format.value === 'url') {
    return list.map(l => l.url).join('\n')
  }

  if (format.value === 'md') {
    return list
      .map(l => `- ${l.type === 'image' ? '!' : ''}[${l.text || l.url}](${l.url})`)
      .join('\n')
  }

  if (format.value === 'json') {
    return JSON.stringify(
      list.map(l => ({ text: l.text, url: l.url, type: l.type, title: l.title || undefined, line: l.line })),
      null,
      2
    )
  }

  const rows = [['text', 'url', 'type', 'line']]
  for (const l of list) rows.push([l.text, l.url, l.type, l.line])
  return rows.map(r => r.map(csvCell).join(',')).join('\n')
})

/* ================= 操作 ================= */

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 1800)
}

async function doCopy(text, msg) {
  if (!text) return
  const ok = await copyText(text)
  flash(ok ? msg : '复制失败，请手动选择复制')
}

function copyInput() {
  doCopy(input.value, '已复制输入文本')
}

function copyOutput() {
  doCopy(exportText.value, `已复制 ${filtered.value.length} 条链接（${formatLabel.value}）`)
}

function copyOne(l) {
  doCopy(l.url, '已复制：' + (l.url.length > 48 ? l.url.slice(0, 48) + '…' : l.url))
}

function isSafeUrl(url) {
  return /^(https?:\/\/|ftp:\/\/|mailto:|\/|\.\/|\.\.\/|#)/i.test(String(url))
}

function loadSample() {
  input.value = SAMPLE
  keyword.value = ''
  success.value = ''
}

function clearAll() {
  input.value = ''
  keyword.value = ''
  success.value = ''
}

onBeforeUnmount(() => {
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
/* 输入框复制按钮 */
.copy-wrap {
  position: relative;
}

.copy-wrap .code-input {
  padding-right: 44px;
}

.copy-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.meta-green {
  color: var(--green);
}

/* 选项行 */
.opt-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.opt-row-split {
  margin-top: 0.75rem;
}

.sort-group {
  margin-left: auto;
}

/* 空输入提示 */
.empty-hint {
  margin-top: 1rem;
  padding: 16px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

/* 结果面板 */
.panel-block {
  border: 1px solid var(--line);
  background: var(--panel-2);
  margin-top: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}

.filter-input {
  flex: 1;
  padding-right: 12px;
  height: 38px;
  line-height: 38px;
}

.filter-clear {
  flex-shrink: 0;
  height: 38px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.filter-clear:hover {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
}

/* 表格 */
.table-scroll {
  max-height: 460px;
  overflow: auto;
}

.link-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
}

.link-table th,
.link-table td {
  border-bottom: 1px solid var(--line);
  padding: 7px 10px;
  text-align: left;
  color: var(--text);
  vertical-align: middle;
}

.link-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--panel);
  color: var(--green);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.link-table tbody tr:hover td {
  background: var(--green-soft);
}

.col-idx {
  width: 44px;
  color: var(--muted);
}

.col-type {
  width: 64px;
}

.col-line {
  width: 48px;
  text-align: right;
  color: var(--muted);
}

.col-act {
  width: 56px;
  text-align: center;
}

.link-table .num {
  text-align: right;
}

.cell-text {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-url {
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-url a {
  color: var(--green);
  text-decoration: none;
  border-bottom: 1px dotted var(--line-strong);
}

.cell-url a:hover {
  color: var(--text);
  border-bottom-color: var(--green);
}

.faint {
  color: var(--muted);
  opacity: 0.7;
}

.type-tag {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid var(--line-strong);
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  white-space: nowrap;
}

.type-tag.t-link {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
}

.type-tag.t-image {
  color: var(--green);
  border-color: var(--line-strong);
  background: transparent;
}

.type-tag.t-ref {
  color: var(--muted);
  border-style: dashed;
}

.type-tag.t-auto {
  color: var(--text);
  border-color: var(--line-strong);
}

.type-tag.t-bare {
  color: var(--muted);
  border-style: dotted;
}

.type-tag.t-html {
  color: var(--text);
  border-color: var(--line);
}

.row-copy {
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--green);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  transition: all 0.2s;
  border-radius: 0;
}

.row-copy:hover {
  background: var(--green-soft);
  border-color: var(--green);
}

.no-match {
  padding: 20px 12px !important;
  text-align: center !important;
  color: var(--muted);
}

/* 响应式 */
@media (max-width: 900px) {
  .cell-url {
    max-width: 260px;
  }
}

@media (max-width: 640px) {
  .opt-row {
    gap: 10px 14px;
  }

  .sort-group {
    margin-left: 0;
  }

  .panel-head {
    font-size: 11px;
  }

  .link-table {
    font-size: 11px;
  }

  .link-table th,
  .link-table td {
    padding: 6px 7px;
  }

  .col-line {
    display: none;
  }

  .cell-text {
    max-width: 110px;
  }

  .cell-url {
    max-width: 150px;
  }

  .filter-row {
    padding: 8px 10px;
  }
}
</style>
