<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔬 Hexdump 查看器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：数据源 + 显示选项 -->
          <div class="tool-col">
            <label class="tool-label">数据来源：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="sourceMode" value="text" />
                <span>粘贴文本</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sourceMode" value="hex" />
                <span>Hex 字符串</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sourceMode" value="file" />
                <span>上传文件</span>
              </label>
            </div>

            <template v-if="sourceMode !== 'file'">
              <div class="label-row">
                <label class="tool-label">输入：</label>
                <button
                  class="copy-btn"
                  title="复制输入"
                  @click="copySourceInput"
                >📋</button>
              </div>
              <textarea
                v-if="sourceMode === 'text'"
                v-model="textInput"
                class="code-input"
                rows="9"
                spellcheck="false"
                placeholder="输入任意文本（按 UTF-8 编码查看其字节）…&#10;例如：Hello 403.li!&#10;中文、Emoji 等也会显示对应多字节序列"
              ></textarea>
              <textarea
                v-else
                v-model="hexInput"
                class="code-input"
                rows="9"
                spellcheck="false"
                placeholder="输入十六进制字节串，如：&#10;48656c6c6f2c20466f726d6174696f6e21&#10;支持空格 / 换行分隔，自动忽略空白字符"
              ></textarea>
            </template>

            <template v-else>
              <label class="tool-label">上传文件：</label>
              <div
                class="upload-area"
                :class="{ dragover: dragOver }"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="handleDrop"
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  style="display: none"
                  @change="handleFileChange"
                />
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽文件到此处</span>
                <span class="upload-hint">任意二进制 / 文本文件 · 最大 2MB · FileReader 本地解析</span>
              </div>
              <div v-if="fileName" class="hd-file">
                <span>📄 {{ fileName }}</span>
                <span class="hd-muted">（{{ fmtSize(fileSize) }}）</span>
                <button class="hd-rm" title="移除文件" @click="removeFile">✕ 移除</button>
              </div>
            </template>

            <div v-if="sourceMode !== 'file'" class="hd-sample-row">
              <button class="tool-button" @click="loadSample">🧪 载入示例</button>
              <span class="hd-muted">示例：中英文 + 控制字符混合字节</span>
            </div>

            <div class="config-section hd-opts">
              <div class="config-row">
                <span class="cfg-label">每行字节数：</span>
                <label class="radio-label">
                  <input type="radio" v-model="bytesPerRow" :value="8" />
                  <span>8</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="bytesPerRow" :value="16" />
                  <span>16</span>
                </label>
              </div>
              <div class="config-row">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="uppercase" />
                  <span>十六进制大写 (A-F)</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="showAscii" checked />
                  <span>显示 ASCII 栏</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 右栏：Hexdump 输出 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">Hexdump 输出：</label>
              <button
                class="copy-btn"
                title="复制 Hexdump 文本"
                @click="copyDump"
                :disabled="!bytes.length"
              >📋</button>
            </div>

            <div class="config-section hd-tools">
              <div class="config-row">
                <span class="cfg-label">跳转偏移</span>
                <input
                  v-model="jumpInput"
                  class="code-input-sm sm-off"
                  placeholder="如 0x1A4 或 420"
                  spellcheck="false"
                  @keyup.enter="goJump"
                />
                <button class="tool-button" @click="goJump">⤵ 定位</button>
                <span class="hd-muted">支持十进制或 0x 十六进制</span>
              </div>
              <div class="config-row hd-search-row">
                <span class="cfg-label">搜索字节</span>
                <label class="radio-label">
                  <input type="radio" v-model="searchMode" value="hex" />
                  <span>Hex</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="searchMode" value="text" />
                  <span>文本</span>
                </label>
                <input
                  v-model="searchInput"
                  class="code-input-sm sm-search"
                  :placeholder="searchMode === 'hex' ? '如 48656c 或 48 65 6c' : '如 Hello'"
                  spellcheck="false"
                  @keyup.enter="runSearch"
                />
                <button class="tool-button" @click="runSearch">🔍 搜索</button>
                <button
                  class="tool-button"
                  title="上一处匹配"
                  :disabled="!matchTotal"
                  @click="navMatch(-1)"
                >◀</button>
                <button
                  class="tool-button"
                  title="下一处匹配"
                  :disabled="!matchTotal"
                  @click="navMatch(1)"
                >▶</button>
              </div>
              <div v-if="searched" class="hd-hit-line">
                <span v-if="matchTotal" class="hd-hit-ok">
                  ✔ 命中 {{ matchIdx + 1 }} / {{ matchTotal }} 处
                  <template v-if="truncated">（过多，仅显示前 {{ MAX_MATCHES }} 处）</template>
                </span>
                <span v-else class="hd-hit-none">✖ 未找到匹配的字节序列</span>
                <button class="hd-rm" @click="clearSearch">✕ 清除搜索</button>
              </div>
            </div>

            <div ref="hdViewEl" class="hd-view"></div>

            <div v-if="totalChunks && visibleChunks < totalChunks" class="hd-more">
              <span class="hd-muted">
                已显示 {{ Math.min(visibleChunks * CHUNK_ROWS, totalRows) }} / {{ totalRows }} 行
              </span>
              <button class="tool-button" @click="loadMore">⬇ 加载更多行</button>
            </div>
          </div>
        </div>

        <div v-if="metaText" class="hd-meta">{{ metaText }}</div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="copyDump" :disabled="!bytes.length">
            📋 复制 Hexdump
          </button>
          <button class="tool-button" @click="copyHex" :disabled="!bytes.length">
            📋 复制纯 Hex
          </button>
          <button class="tool-button" @click="exportTxt" :disabled="!bytes.length">
            ⬇ 导出 .txt
          </button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="successMsg" class="status-success">✅ {{ successMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { copyText } from '../../utils/clipboard'

const MAX_BYTES = 2 * 1024 * 1024 // 输入数据上限
const CHUNK_ROWS = 400 // 每批渲染的行数
const MAX_MATCHES = 5000 // 搜索匹配数量上限
const MAX_COPY_LEN = 5000000 // 复制文本长度上限（超过建议导出）
const GROUP = 8 // 每组的字节数（视觉分组）
const HEX_LO = '0123456789abcdef'
const HEX_UP = '0123456789ABCDEF'

const SAMPLE_TEXT =
  'Hello 403.li! Hexdump 演示\n' +
  '纯前端 · FileReader + TypedArray 解析字节\n' +
  '\x00\x01\x02\x1b[32m 控制字符与转义区 \x1b[0m \x7f\x80\xff\n' +
  '🚀 中文 UTF-8 编码：每个汉字占 3 字节 · 2026'

// ---------- 输入状态 ----------
const sourceMode = ref('text') // text | hex | file
const textInput = ref('')
const hexInput = ref('')
const fileBytes = ref(null)
const fileName = ref('')
const fileSize = ref(0)

// ---------- 显示选项 ----------
const bytesPerRow = ref(16)
const uppercase = ref(false)
const showAscii = ref(true)

// ---------- 输出状态 ----------
const bytes = ref(new Uint8Array(0))
const error = ref('')
const successMsg = ref('')

// ---------- 跳转 / 搜索 ----------
const jumpInput = ref('')
const searchInput = ref('')
const searchMode = ref('hex')
const matchesOffsets = ref([])
const matchIdx = ref(-1)
const searched = ref(false)
const truncated = ref(false)
let patLen = 0

// ---------- 分块渲染 ----------
const hdViewEl = ref(null)
const visibleChunks = ref(0)
const totalChunks = ref(0)
const dragOver = ref(false)
let curEl = null
let parseTimer = null
let msgTimer = null

const totalRows = computed(() =>
  bytes.value.length ? Math.ceil(bytes.value.length / bytesPerRow.value) : 0
)

const matchTotal = computed(() => matchesOffsets.value.length)

const metaText = computed(() => {
  if (!bytes.value.length) return ''
  const parts = []
  if (sourceMode.value === 'file' && fileName.value) {
    parts.push('📄 ' + fileName.value + '（' + fmtSize(fileSize.value) + '）')
  }
  parts.push('共 ' + bytes.value.length.toLocaleString() + ' 字节')
  parts.push(totalRows.value.toLocaleString() + ' 行')
  parts.push('每行 ' + bytesPerRow.value + ' 字节')
  return parts.join(' · ')
})

// ---------- 工具函数 ----------
function fmtSize(n) {
  if (n < 1024) return n + ' B'
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1048576).toFixed(2) + ' MB'
}

function hexChars() {
  return uppercase.value ? HEX_UP : HEX_LO
}

function escHtml(ch) {
  return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch
}

function hexPad8(num, table) {
  let s = ''
  for (let i = 7; i >= 0; i--) s += table[(num >> (i * 4)) & 15]
  return s
}

function flashError(msg) {
  clearTimeout(msgTimer)
  error.value = msg
  successMsg.value = ''
  msgTimer = setTimeout(() => { error.value = '' }, 4000)
}

function flashSuccess(msg) {
  clearTimeout(msgTimer)
  successMsg.value = msg
  error.value = ''
  msgTimer = setTimeout(() => { successMsg.value = '' }, 2200)
}

// ---------- 数据解析 ----------
function parseSource() {
  error.value = ''
  let arr = null
  if (sourceMode.value === 'text') {
    const raw = textInput.value
    if (raw.length > MAX_BYTES) {
      error.value = '输入文本过大（超过 2MB），建议使用「上传文件」或分段查看'
    } else {
      arr = new TextEncoder().encode(raw)
    }
  } else if (sourceMode.value === 'hex') {
    const raw = hexInput.value.replace(/\s+/g, '')
    if (!raw) {
      arr = new Uint8Array(0)
    } else if (!/^[0-9a-fA-F]+$/.test(raw)) {
      error.value = 'Hex 字符串包含非法字符（仅允许 0-9 / A-F），且不含 0x 前缀'
    } else if (raw.length % 2 !== 0) {
      error.value = 'Hex 字符串长度必须为偶数（每两个字符表示一个字节）'
    } else if (raw.length / 2 > MAX_BYTES) {
      error.value = 'Hex 数据过大（超过 2MB），请分段查看'
    } else {
      arr = new Uint8Array(raw.length / 2)
      for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(raw.substr(i * 2, 2), 16)
      }
    }
  } else {
    arr = fileBytes.value
  }
  bytes.value = arr || new Uint8Array(0)
  resetSearch()
  renderAll()
}

function scheduleParse(delay) {
  clearTimeout(parseTimer)
  parseTimer = setTimeout(parseSource, delay == null ? 120 : delay)
}

// 数据变化时清空搜索状态（显示选项变化不清空）
function resetSearch() {
  matchesOffsets.value = []
  matchIdx.value = -1
  searched.value = false
  truncated.value = false
  patLen = 0
}

// ---------- 分块渲染 ----------
function renderAll() {
  const box = hdViewEl.value
  if (!box) return
  curEl = null
  box.innerHTML = ''
  if (!bytes.value.length) {
    visibleChunks.value = 0
    totalChunks.value = 0
    box.innerHTML =
      '<div class="hd-empty">⬡ 暂无数据 — 在左侧粘贴文本 / Hex 或上传文件后，' +
      '这里将显示 xxd 风格的 Hex + ASCII 双栏视图</div>'
    return
  }
  totalChunks.value = Math.ceil(totalRows.value / CHUNK_ROWS)
  visibleChunks.value = 1
  appendChunk(0)
}

function appendChunk(chunkIdx) {
  const box = hdViewEl.value
  if (!box) return
  const startRow = chunkIdx * CHUNK_ROWS
  const endRow = Math.min(startRow + CHUNK_ROWS, totalRows.value)
  let html = ''
  for (let r = startRow; r < endRow; r++) html += buildLineHtml(r)
  box.insertAdjacentHTML('beforeend', html)
}

function loadMore() {
  const target = Math.min(visibleChunks.value + 2, totalChunks.value)
  while (visibleChunks.value < target) {
    appendChunk(visibleChunks.value)
    visibleChunks.value++
  }
}

async function revealRow(rowIdx, doScroll) {
  const box = hdViewEl.value
  if (!box || rowIdx < 0 || rowIdx >= totalRows.value) return
  // 逐块加载直到目标行所在的块出现（大文件远跳转时让出主线程）
  while (
    visibleChunks.value < totalChunks.value &&
    rowIdx >= visibleChunks.value * CHUNK_ROWS
  ) {
    appendChunk(visibleChunks.value)
    visibleChunks.value++
    if (visibleChunks.value % 40 === 0) await new Promise(r => setTimeout(r, 0))
  }
  await nextTick()
  const el = box.querySelector('[data-r="' + rowIdx + '"]')
  if (!el) return
  if (curEl) curEl.classList.remove('hd-cur')
  el.classList.add('hd-cur')
  curEl = el
  if (doScroll) {
    box.scrollTop = Math.max(0, el.offsetTop - Math.floor(box.clientHeight / 2))
  }
}

// ---------- 单行构建 ----------
function rangesForRow(start, end) {
  const arr = matchesOffsets.value
  const out = []
  let lo = 0
  let hi = arr.length - 1
  let k = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < start) lo = mid + 1
    else hi = mid - 1
  }
  k = lo
  while (k < arr.length) {
    const m = arr[k]
    if (m >= end) break
    out.push([Math.max(m, start) - start, Math.min(m + patLen, end) - start])
    k++
  }
  return out
}

function buildLineHtml(ri) {
  const bpr = bytesPerRow.value
  const start = ri * bpr
  const end = Math.min(start + bpr, bytes.value.length)
  const table = hexChars()
  const off = hexPad8(start, table)
  const hit = []
  if (matchesOffsets.value.length) {
    const ranges = rangesForRow(start, end)
    for (let k = 0; k < ranges.length; k++) {
      for (let j = ranges[k][0]; j < ranges[k][1]; j++) hit[j] = true
    }
  }
  let groups = []
  let g = []
  let plainLen = 0
  let ascii = ''
  for (let a = start; a < end; a++) {
    const b = bytes.value[a]
    const j = a - start
    const hh = table[b >> 4] + table[b & 15]
    g.push(hit[j] ? '<span class="hd-hit">' + hh + '</span>' : hh)
    plainLen += 2
    if (g.length === GROUP) {
      groups.push(g.join(' '))
      plainLen += GROUP - 1
      g = []
    }
    const ch = b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
    ascii += hit[j] ? '<span class="hd-hit">' + escHtml(ch) + '</span>' : escHtml(ch)
  }
  if (g.length) {
    groups.push(g.join(' '))
    plainLen += g.length - 1
  }
  const maxLen = bpr === 16 ? 48 : 23
  const pad = Math.max(0, maxLen - plainLen - 2 * (groups.length - 1))
  let content = off + ': ' + groups.join('  ') + ' '.repeat(pad)
  if (showAscii.value) content += '  ' + ascii
  return '<div class="hd-line" data-r="' + ri + '">' + content + '</div>'
}

function buildLinePlain(ri) {
  const bpr = bytesPerRow.value
  const start = ri * bpr
  const end = Math.min(start + bpr, bytes.value.length)
  const table = hexChars()
  const off = hexPad8(start, table)
  const tokens = []
  let ascii = ''
  for (let a = start; a < end; a++) {
    const b = bytes.value[a]
    tokens.push(table[b >> 4] + table[b & 15])
    ascii += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
  }
  const groups = []
  for (let i = 0; i < tokens.length; i += GROUP) {
    groups.push(tokens.slice(i, i + GROUP).join(' '))
  }
  const hexStr = groups.join('  ')
  const maxLen = bpr === 16 ? 48 : 23
  const pad = Math.max(0, maxLen - hexStr.length)
  let line = off + ': ' + hexStr + ' '.repeat(pad)
  if (showAscii.value) line += '  ' + ascii
  return line
}

function dumpPlainText() {
  const lines = []
  for (let r = 0; r < totalRows.value; r++) lines.push(buildLinePlain(r))
  return lines.join('\n')
}

function hexOnlyText() {
  const table = hexChars()
  const out = []
  let line = ''
  for (let i = 0; i < bytes.value.length; i++) {
    const b = bytes.value[i]
    line += table[b >> 4] + table[b & 15]
    if (line.length >= 64) {
      out.push(line)
      line = ''
    }
  }
  if (line) out.push(line)
  return out.join('\n')
}

// ---------- 搜索 ----------
function parseSearchPattern() {
  const s = searchInput.value.trim()
  if (!s) {
    flashError('请输入要搜索的字节序列')
    return null
  }
  let pat = null
  if (searchMode.value === 'hex') {
    const raw = s.replace(/\s+/g, '')
    if (!/^[0-9a-fA-F]+$/.test(raw)) {
      flashError('搜索的 Hex 含非法字符（仅允许 0-9 / A-F）')
      return null
    }
    if (raw.length % 2 !== 0) {
      flashError('搜索的 Hex 长度必须为偶数（如 48656c）')
      return null
    }
    pat = new Uint8Array(raw.length / 2)
    for (let i = 0; i < pat.length; i++) pat[i] = parseInt(raw.substr(i * 2, 2), 16)
  } else {
    pat = new TextEncoder().encode(s)
  }
  return pat
}

function runSearch() {
  if (!bytes.value.length) {
    flashError('请先在左侧输入内容或上传文件')
    return
  }
  const pat = parseSearchPattern()
  if (!pat) return
  const data = bytes.value
  const out = []
  let i = 0
  patLen = pat.length
  const first = pat[0]
  while (i <= data.length - patLen && out.length < MAX_MATCHES) {
    const idx = data.indexOf(first, i)
    if (idx === -1 || idx > data.length - patLen) break
    let ok = true
    for (let k = 1; k < patLen; k++) {
      if (data[idx + k] !== pat[k]) { ok = false; break }
    }
    if (ok) out.push(idx)
    i = idx + 1
  }
  matchesOffsets.value = out
  truncated.value = out.length === MAX_MATCHES && data.length - i > 0
  searched.value = true
  renderAll() // 重新渲染以应用高亮
  if (out.length) {
    matchIdx.value = 0
    revealRow(Math.floor(out[0] / bytesPerRow.value), true)
  } else {
    matchIdx.value = -1
  }
}

function navMatch(dir) {
  const n = matchesOffsets.value.length
  if (!n) return
  matchIdx.value = (matchIdx.value + dir + n) % n
  revealRow(Math.floor(matchesOffsets.value[matchIdx.value] / bytesPerRow.value), true)
}

function clearSearch() {
  matchesOffsets.value = []
  matchIdx.value = -1
  searched.value = false
  truncated.value = false
  patLen = 0
  searchInput.value = ''
  if (curEl) {
    curEl.classList.remove('hd-cur')
    curEl = null
  }
  renderAll()
}

// ---------- 偏移跳转 ----------
function goJump() {
  if (!bytes.value.length) {
    flashError('请先在左侧输入内容或上传文件')
    return
  }
  const s = jumpInput.value.trim()
  if (!s) {
    flashError('请输入要跳转的偏移量')
    return
  }
  let off = -1
  if (/^0x[0-9a-fA-F]+$/.test(s)) off = parseInt(s, 16)
  else if (/^\d+$/.test(s)) off = parseInt(s, 10)
  else {
    flashError('偏移格式不正确：请使用十进制（如 420）或以 0x 开头的十六进制（如 0x1A4）')
    return
  }
  if (off < 0 || off >= bytes.value.length) {
    flashError('偏移超出范围（0 ~ 0x' + (bytes.value.length - 1).toString(16) + '）')
    return
  }
  const table = hexChars()
  revealRow(Math.floor(off / bytesPerRow.value), true)
  flashSuccess('已定位到偏移 0x' + hexPad8(off, table))
}

// ---------- 复制 / 导出 ----------
async function copyDump() {
  if (!bytes.value.length) return
  const text = dumpPlainText()
  if (text.length > MAX_COPY_LEN) {
    flashError('Hexdump 文本过长，剪贴板可能失败，建议使用「导出 .txt」')
    return
  }
  const ok = await copyText(text)
  if (ok) flashSuccess('Hexdump 文本已复制（' + totalRows.value.toLocaleString() + ' 行）')
  else flashError('复制失败，请手动选择复制')
}

async function copyHex() {
  if (!bytes.value.length) return
  const text = hexOnlyText()
  if (text.length > MAX_COPY_LEN) {
    flashError('Hex 数据过长，剪贴板可能失败，建议使用「导出 .txt」')
    return
  }
  const ok = await copyText(text)
  if (ok) flashSuccess('纯 Hex 数据已复制（' + bytes.value.length.toLocaleString() + ' 字节）')
  else flashError('复制失败，请手动选择复制')
}

async function copySourceInput() {
  const text = sourceMode.value === 'text' ? textInput.value : hexInput.value
  if (!text) {
    flashError('输入内容为空，没有可复制的内容')
    return
  }
  const ok = await copyText(text)
  if (ok) flashSuccess('输入内容已复制')
  else flashError('复制失败，请手动选择复制')
}

function exportTxt() {
  if (!bytes.value.length) return
  const text = dumpPlainText()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  a.href = url
  a.download = 'hexdump-' + ts + '.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  flashSuccess('已导出 hexdump-' + ts + '.txt（' + fmtSize(text.length) + '）')
}

// ---------- 文件上传 ----------
function readFile(file) {
  if (!file) return
  if (file.size > MAX_BYTES) {
    flashError('文件过大（' + fmtSize(file.size) + '），仅支持 ≤ 2MB 的文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    fileBytes.value = new Uint8Array(reader.result)
    fileName.value = file.name
    fileSize.value = file.size
  }
  reader.onerror = () => flashError('文件读取失败，请重试')
  reader.readAsArrayBuffer(file)
}

function handleFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (file) readFile(file)
  e.target.value = '' // 允许重复选择同一文件
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) readFile(file)
}

function removeFile() {
  fileBytes.value = null
  fileName.value = ''
  fileSize.value = 0
}

// ---------- 示例 / 清空 ----------
function loadSample() {
  sourceMode.value = 'text'
  textInput.value = SAMPLE_TEXT
  error.value = ''
}

function clearAll() {
  sourceMode.value = 'text'
  textInput.value = ''
  hexInput.value = ''
  fileBytes.value = null
  fileName.value = ''
  fileSize.value = 0
  jumpInput.value = ''
  bytesPerRow.value = 16
  uppercase.value = false
  showAscii.value = true
  resetSearch()
  searchInput.value = ''
  clearTimeout(msgTimer)
  error.value = ''
  successMsg.value = ''
  scheduleParse(0)
}

// ---------- 监听 ----------
// 数据 / 来源变化：重新解析
watch([textInput, hexInput, fileBytes, sourceMode], () => scheduleParse(), {
  immediate: true
})

// 显示选项变化：仅重新渲染
watch([bytesPerRow, uppercase, showAscii], () => {
  clearTimeout(parseTimer)
  renderAll()
})

onMounted(() => {
  renderAll()
})
</script>

<style scoped>
/* === 标签行 + 复制按钮 === */
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-row .tool-label {
  margin-top: 0;
  margin-bottom: 0;
}

.label-row .copy-btn {
  position: static;
  flex-shrink: 0;
}

.label-row .copy-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* === 上传区域 === */
.upload-area {
  border: 2px dashed var(--line);
  background: var(--panel-2);
  padding: 1.75rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover,
.upload-area.dragover {
  border-color: var(--green);
  background: var(--green-soft);
}

.upload-icon {
  display: block;
  font-size: 26px;
}

.upload-text {
  display: block;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
}

.upload-hint {
  display: block;
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* === 文件信息 / 示例行 === */
.hd-file {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
}

.hd-sample-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hd-sample-row .tool-button {
  padding: 6px 12px;
  font-size: 13px;
}

.hd-muted {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.hd-rm {
  background: none;
  border: none;
  padding: 2px 6px;
  color: var(--red);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
}

.hd-rm:hover {
  text-decoration: underline;
}

/* === 配置 / 工具栏 === */
.hd-opts,
.hd-tools {
  margin-bottom: 0;
}

.hd-opts {
  margin-top: 4px;
}

.config-row {
  row-gap: 8px;
}

.cfg-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  white-space: nowrap;
}

.sm-off {
  width: 150px;
  flex: 0 0 auto;
}

.sm-search {
  flex: 1;
  min-width: 130px;
}

.hd-search-row {
  margin-bottom: 0;
}

.hd-hit-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
}

.hd-hit-ok {
  color: var(--green);
}

.hd-hit-none {
  color: var(--red);
}

/* === Hexdump 视图 === */
.hd-view {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  overflow: auto;
  max-height: 480px;
  min-height: 140px;
  padding: 10px 12px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  user-select: text;
}

.hd-view :deep(.hd-empty) {
  padding: 40px 12px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

.hd-view :deep(.hd-line) {
  white-space: pre;
  color: var(--text);
}

.hd-view :deep(.hd-line:hover) {
  background: rgba(255, 255, 255, 0.03);
}

.hd-view :deep(.hd-off) {
  color: var(--muted);
}

.hd-view :deep(.hd-hit) {
  background: var(--green);
  color: var(--bg);
}

.hd-view :deep(.hd-cur) {
  background: var(--green-soft);
  box-shadow: inset 2px 0 0 var(--green);
}

/* === 加载更多 / 元信息 === */
.hd-more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.hd-more .tool-button {
  padding: 6px 12px;
  font-size: 13px;
}

.hd-meta {
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  word-break: break-all;
}

/* === 移动端适配 === */
@media (max-width: 640px) {
  .hd-view {
    max-height: 340px;
    font-size: 11px;
  }

  .hd-search-row {
    align-items: stretch;
  }

  .sm-off {
    width: 100%;
  }

  .sm-search {
    min-width: 0;
    width: 100%;
  }

  .hd-search-row .tool-button {
    padding: 6px 8px;
    font-size: 12px;
  }

  .hd-meta {
    font-size: 11px;
  }
}

@media (max-width: 375px) {
  .hd-more {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
