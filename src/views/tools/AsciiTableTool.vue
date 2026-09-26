<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📐 ASCII 表格生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- ===== 左栏：输入 + 选项 ===== -->
          <div class="tool-col">
            <label class="tool-label">输入数据（CSV / TSV / 自定义分隔符）：</label>
            <div class="input-with-copy">
              <textarea
                v-model="input"
                class="code-input"
                rows="10"
                spellcheck="false"
                placeholder="粘贴 CSV/TSV 数据，例如：&#10;name,age,city&#10;Alice,30,Beijing&#10;Bob,25,Shanghai"
              ></textarea>
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>

            <div class="config-section">
              <div class="config-row">
                <span class="config-label">分隔符</span>
                <select class="tool-select" v-model="delimiter">
                  <option value="auto">自动识别</option>
                  <option value=",">逗号 ,</option>
                  <option value="&#9;">制表符 Tab</option>
                  <option value=";">分号 ;</option>
                  <option value="|">竖线 |</option>
                  <option value=" ">空格</option>
                  <option value="custom">自定义…</option>
                </select>
              </div>
              <div class="config-row" v-if="delimiter === 'custom'">
                <span class="config-label">自定义字符</span>
                <input
                  class="code-input-sm custom-delim"
                  v-model="customDelimiter"
                  maxlength="4"
                  placeholder="例如 : 或 # 或 @"
                />
              </div>
              <div class="config-row">
                <span class="config-label">边框样式</span>
                <select class="tool-select" v-model="border">
                  <option value="ascii">ASCII  +---+</option>
                  <option value="unicode">Unicode  ┌─┐</option>
                  <option value="rounded">圆角  ╭─╮</option>
                  <option value="double">双线  ╔═╗</option>
                  <option value="markdown">Markdown  |---|</option>
                  <option value="none">无边框</option>
                </select>
              </div>
              <div class="config-row">
                <span class="config-label">内边距</span>
                <select class="tool-select" v-model.number="padding">
                  <option :value="1">1 空格（紧凑）</option>
                  <option :value="2">2 空格（标准）</option>
                  <option :value="3">3 空格（宽松）</option>
                </select>
              </div>
            </div>

            <label class="tool-label">对齐方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="align" value="left" />
                <span>左对齐</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="align" value="center" />
                <span>居中</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="align" value="right" />
                <span>右对齐</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="align" value="auto" />
                <span>智能（数字右对齐）</span>
              </label>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="firstRowHeader" />
                <span>首行作为表头（加粗分隔线）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="upperHeader" />
                <span>表头转大写（纯文本高亮）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="dropEmptyCol" />
                <span>丢弃全空列</span>
              </label>
            </div>
          </div>

          <!-- ===== 右栏：输出 ===== -->
          <div class="tool-col">
            <label class="tool-label">输出表格（纯文本）：</label>
            <div class="output-toolbar">
              <span class="output-meta">
                {{ stats.rows }} 行 × {{ stats.cols }} 列 · {{ stats.chars }} 字符 · 最大列宽 {{ stats.width }}
              </span>
              <button class="copy-btn-inline" title="复制表格" @click="copyOutput">📋</button>
            </div>
            <div class="table-output-wrapper">
              <pre v-if="output" class="table-output">{{ output }}</pre>
              <div v-else class="table-output-empty">生成结果将显示在这里…</div>
            </div>
          </div>
        </div>

        <!-- ✅ 全宽区域：按钮 + 状态提示 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="copyOutput">📋 复制表格</button>
          <button class="tool-button" @click="downloadTxt">💾 下载 TXT</button>
          <button class="tool-button" @click="loadSample">🧪 载入示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ---------- 状态 ---------- */
const SAMPLE = `name,age,city,score
Alice,30,Beijing,92.5
Bob,25,Shanghai,78
Charlie,41,Shenzhen,88.5
Diana,35,Hangzhou,95`

const input = ref(SAMPLE)
const delimiter = ref('auto')
const customDelimiter = ref(':')
const border = ref('ascii')
const padding = ref(2)
const align = ref('left')
const firstRowHeader = ref(true)
const upperHeader = ref(false)
const dropEmptyCol = ref(true)

const copied = ref(false)

const MAX_ROWS = 500
const MAX_COLS = 60

/* ---------- 分隔符 ---------- */
const activeDelimiter = computed(() => {
  if (delimiter.value === 'custom') {
    return customDelimiter.value && customDelimiter.value.length ? customDelimiter.value : ','
  }
  if (delimiter.value === 'auto') return detectDelimiter(input.value)
  return delimiter.value
})

function detectDelimiter(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '').slice(0, 20)
  if (!lines.length) return ','
  const candidates = [',', '\t', ';', '|']
  let best = ','
  let bestScore = -1
  for (const d of candidates) {
    const counts = lines.map(l => l.split(d).length)
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    if (max <= 1) continue
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const score = (min > 1 ? 1000 : 0) - (max - min) * 10 + avg
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

/* ---------- 解析（支持引号包裹与内嵌换行，RFC4180 风格） ---------- */
function parseDelimited(text, delim) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const dLen = delim.length

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    if (ch === '"' && field.trim() === '') {
      inQuotes = true
      field = ''
      i++
      continue
    }
    if (text.startsWith(delim, i)) {
      row.push(field)
      field = ''
      i += dLen
      continue
    }
    if (ch === '\r') {
      i++
      continue
    }
    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }
  row.push(field)
  rows.push(row)

  // 去掉文末空行
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].trim() === '') {
    rows.pop()
  }
  return rows
}

/* ---------- 显示宽度（CJK / Emoji 算 2 列） ---------- */
function isWide(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  )
}

function displayWidth(str) {
  let w = 0
  for (const ch of str) {
    const cp = ch.codePointAt(0)
    if (cp === 0x200b || cp === 0xfeff || cp === 0x200e || cp === 0x200f) continue
    if (cp >= 0x0300 && cp <= 0x036f) continue
    w += isWide(cp) ? 2 : 1
  }
  return w
}

/* ---------- 边框字符集 ---------- */
const BOX = {
  ascii: { top: ['+', '-', '+'], mid: ['+', '=', '+'], bot: ['+', '-', '+'], v: '|' },
  unicode: { top: ['┌', '─', '┐'], mid: ['├', '─', '┤'], bot: ['└', '─', '┘'], v: '│' },
  rounded: { top: ['╭', '─', '╮'], mid: ['├', '─', '┤'], bot: ['╰', '─', '╯'], v: '│' },
  double: { top: ['╔', '═', '╗'], mid: ['╠', '═', '╣'], bot: ['╚', '═', '╝'], v: '║' }
}

/* ---------- 单元格填充 ---------- */
function padCell(text, width, mode) {
  const diff = Math.max(0, width - displayWidth(text))
  if (mode === 'right') return ' '.repeat(diff) + text
  if (mode === 'center') {
    const left = Math.floor(diff / 2)
    return ' '.repeat(left) + text + ' '.repeat(diff - left)
  }
  return text + ' '.repeat(diff)
}

/* ---------- 生成表格 ---------- */
const parsed = computed(() => {
  const text = input.value
  if (!text.trim()) return { rows: [], cols: 0, error: '' }
  const rows = parseDelimited(text, activeDelimiter.value)
  if (!rows.length) return { rows: [], cols: 0, error: '' }
  if (rows.length > MAX_ROWS) return { rows: [], cols: 0, error: `数据过大：共 ${rows.length} 行，最多支持 ${MAX_ROWS} 行，请分批处理` }

  let cols = Math.max(...rows.map(r => r.length))
  if (cols > MAX_COLS) return { rows: [], cols: 0, error: `列数过多：${cols} 列，最多支持 ${MAX_COLS} 列` }

  // 多列数据中丢弃孤立的空行（粘贴时常见的空行噪声）
  const src = cols > 1 ? rows.filter(r => !(r.length === 1 && r[0].trim() === '')) : rows
  if (!src.length) return { rows: [], cols: 0, error: '' }

  // 规整：去噪、补列、去掉内嵌换行
  let norm = src.map(r =>
    r.map(c => String(c).replace(/[\r\n]+/g, '␤').trim())
  )
  norm = norm.map(r => {
    const copy = [...r]
    while (copy.length < cols) copy.push('')
    return copy
  })

  // 丢弃全空列（从尾部开始）
  if (dropEmptyCol.value) {
    while (cols > 1) {
      const empty = norm.every(r => r[cols - 1].trim() === '')
      if (!empty) break
      cols--
      norm = norm.map(r => r.slice(0, cols))
    }
  }

  return { rows: norm, cols, error: '' }
})

const output = computed(() => {
  const { rows, cols, error: parseError } = parsed.value
  if (parseError) return ''
  if (!rows.length || cols === 0) return ''

  const pad = padding.value
  const hasHeader = firstRowHeader.value && rows.length > 1

  // 表头转大写
  let body = rows.map(r => [...r])
  if (hasHeader && upperHeader.value) {
    body[0] = body[0].map(c => c.toUpperCase())
  }

  const header = hasHeader ? body[0] : null
  const dataRows = hasHeader ? body.slice(1) : body

  // 列宽
  const widths = []
  for (let i = 0; i < cols; i++) {
    let w = 1
    for (const r of body) w = Math.max(w, displayWidth(r[i] || ''))
    widths.push(w)
  }

  // 逐列对齐模式（智能模式：整列都是数字则右对齐）
  const modes = []
  for (let i = 0; i < cols; i++) {
    if (align.value !== 'auto') {
      modes.push(align.value)
      continue
    }
    const values = dataRows.map(r => (r[i] || '').trim()).filter(v => v !== '')
    const numeric = values.length > 0 && values.every(v => /^-?\d+(\.\d+)?%?$/.test(v))
    modes.push(numeric ? 'right' : 'left')
  }

  const lines = []

  // 分隔线：left + 每列格线 + (mid) + right
  const sep = (left, mid, right, ch) =>
    left + widths.map(w => ch.repeat(w + pad * 2)).join(mid) + right

  // 数据行：单元格左右各留 pad 个空格
  const renderCells = (cells, v) =>
    cells
      .map((c, i) => ' '.repeat(pad) + padCell(c ?? '', widths[i], modes[i]) + ' '.repeat(pad))
      .join(v)

  if (border.value === 'markdown') {
    const allRows = header ? [header, ...dataRows] : dataRows
    if (!allRows.length) return ''
    const mdRow = (cells) => '|' + cells.map((c, i) => ' ' + padCell(c ?? '', widths[i], modes[i]) + ' ').join('|') + '|'
    const mdSep =
      '|' +
      widths
        .map((w, i) => {
          const dashes = '-'.repeat(Math.max(3, w))
          if (modes[i] === 'center') return ':' + dashes + ':'
          if (modes[i] === 'right') return dashes + ':'
          return ':' + dashes
        })
        .join('|') +
      '|'
    lines.push(mdRow(allRows[0]))
    lines.push(mdSep)
    for (let i = 1; i < allRows.length; i++) lines.push(mdRow(allRows[i]))
    return lines.join('\n')
  }

  if (border.value === 'none') {
    if (header) lines.push(renderCells(header, ' ').trimEnd())
    for (const r of dataRows) lines.push(renderCells(r, ' ').trimEnd())
    return lines.join('\n')
  }

  const g = BOX[border.value]
  lines.push(sep(g.top[0], crossOf('top'), g.top[2], g.top[1]))
  if (header) {
    lines.push(g.v + renderCells(header, g.v) + g.v)
    lines.push(sep(g.mid[0], crossOf('mid'), g.mid[2], g.mid[1]))
  }
  for (const r of dataRows) lines.push(g.v + renderCells(r, g.v) + g.v)
  lines.push(sep(g.bot[0], crossOf('bot'), g.bot[2], g.bot[1]))

  return lines.join('\n')
})

function crossOf(which) {
  const map = {
    ascii: { top: '+', mid: '+', bot: '+' },
    unicode: { top: '┬', mid: '┼', bot: '┴' },
    rounded: { top: '┬', mid: '┼', bot: '┴' },
    double: { top: '╦', mid: '╬', bot: '╩' }
  }
  const key = border.value in map ? border.value : 'ascii'
  return map[key][which]
}

/* ---------- 统计 ---------- */
const stats = computed(() => {
  const { rows, cols } = parsed.value
  const text = output.value
  return {
    rows: rows.length,
    cols,
    chars: text.length,
    width: text ? Math.max(...text.split('\n').map(l => displayWidth(l))) : 0
  }
})

const errMsg = ref('')
const error = computed(() => parsed.value.error || errMsg.value)
const success = computed(() => (typeof copied.value === 'string' ? copied.value : ''))

/* ---------- 操作 ---------- */
async function copyInput() {
  if (!input.value) {
    flash('输入内容为空，无可复制内容', true)
    return
  }
  await doCopy(input.value, '输入内容已复制到剪贴板')
}

async function copyOutput() {
  if (!output.value) {
    flash('表格为空，请先输入数据', true)
    return
  }
  await doCopy(output.value, '表格已复制到剪贴板')
}

async function doCopy(text, okMsg) {
  const ok = await copyText(text)
  if (ok) flash(okMsg)
  else flash('复制失败，请手动复制', true)
}

function flash(msg, isErr = false) {
  if (isErr) errMsg.value = msg
  else copied.value = msg
  setTimeout(() => {
    errMsg.value = ''
    copied.value = false
  }, 2000)
}

function downloadTxt() {
  if (!output.value) return
  const blob = new Blob(['\ufeff' + output.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'table.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  flash('TXT 文件已下载')
}

function loadSample() {
  input.value = SAMPLE
  delimiter.value = 'auto'
  border.value = 'ascii'
  padding.value = 2
  align.value = 'left'
  firstRowHeader.value = true
  flash('示例数据已载入')
}

function clearAll() {
  input.value = ''
  copied.value = false
}
</script>

<style scoped>
/* 使用 .input-with-copy 包裹多行输入框 */
.input-with-copy {
  align-items: stretch;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 640px) {
  .options-group {
    gap: 8px;
  }
}

.config-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  min-width: 72px;
  flex-shrink: 0;
}

.tool-select {
  flex: 1;
  min-width: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  height: 36px;
  padding: 0 8px;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: 0;
}

.tool-select:focus {
  outline: 0;
  border-color: var(--green);
  box-shadow: 0 0 20px var(--green-glow);
}

.custom-delim {
  flex: 1;
  padding: 0 12px;
}

/* 输出区工具条 */
.output-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 6px 40px 6px 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  min-height: 34px;
}

.copy-btn-inline {
  position: absolute;
  top: 4px;
  right: 6px;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 15px;
  padding: 2px 4px;
  border-radius: 0;
}

.copy-btn-inline:hover {
  transform: scale(1.15);
}

.output-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格输出区 */
.table-output-wrapper {
  flex: 1;
  border: 1px solid var(--line-strong);
  background: var(--green-soft);
  overflow: auto;
  max-height: 62vh;
  min-height: 200px;
}

.table-output {
  margin: 0;
  padding: 12px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--green);
  white-space: pre;
  tab-size: 4;
}

.table-output-empty {
  padding: 16px 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
}

@media (min-width: 900px) {
  .table-output-wrapper {
    max-height: none;
  }
}

@media (max-width: 640px) {
  .config-label {
    min-width: 64px;
    font-size: 11px;
  }
  .table-output {
    font-size: 12px;
    padding: 10px;
  }
}
</style>
