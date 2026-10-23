<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🗄️ JSON 转 SQL 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入 / 输出双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入 JSON 数组：</label>
            <div class="copy-wrap">
              <textarea
                v-model="input"
                rows="16"
                class="code-input"
                spellcheck="false"
                placeholder='[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25}]'
              ></textarea>
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>
            <div v-if="parseError" class="input-error">⚠️ {{ parseError }}</div>
            <div v-else-if="shapeLine" class="shape-line">
              <span class="shape-badge">{{ shapeLine }}</span>
              <span v-if="sourceHint" class="shape-hint">{{ sourceHint }}</span>
            </div>

            <!-- 字段筛选 -->
            <div v-if="columns.length" class="field-panel">
              <div class="field-head">
                <span>字段筛选 {{ selectedCols.length }}/{{ columns.length }}</span>
                <div class="field-actions">
                  <button class="mini-btn" @click="selectAll">全选</button>
                  <button class="mini-btn" @click="selectNone">全不选</button>
                </div>
              </div>
              <div class="field-chips">
                <label
                  v-for="c in columns"
                  :key="c"
                  class="field-chip"
                  :class="{ off: isOff(c) }"
                >
                  <input type="checkbox" :checked="!isOff(c)" @change="toggleCol(c)" />
                  <span class="chip-mark">{{ isOff(c) ? '▢' : '▣' }}</span>
                  <span class="chip-name">{{ c }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">生成的 SQL：</label>
            <div class="copy-wrap">
              <textarea
                :value="output"
                rows="16"
                class="code-input output"
                spellcheck="false"
                readonly
                placeholder="INSERT 语句将显示在这里..."
              ></textarea>
              <button class="copy-btn" title="复制 SQL" :disabled="!output" @click="copyOutput">📋</button>
            </div>
            <div v-if="outputNotice" class="input-error">⚠️ {{ outputNotice }}</div>
            <div v-else-if="output" class="shape-line">
              <span class="shape-badge out">{{ outputStat }}</span>
            </div>
          </div>
        </div>

        <!-- 配置 -->
        <div class="opt-grid">
          <div class="opt-row">
            <span class="opt-label">表名</span>
            <input
              v-model="tableName"
              class="code-input-sm table-input"
              spellcheck="false"
              placeholder="my_table"
            />
          </div>

          <div class="opt-row">
            <span class="opt-label">方言</span>
            <div class="radio-group">
              <label v-for="(d, key) in dialects" :key="key" class="radio-label">
                <input v-model="dialect" type="radio" :value="key" />
                <span>{{ d.label }}</span>
              </label>
            </div>
          </div>

          <div class="opt-row">
            <span class="opt-label">语句</span>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="mode" type="radio" value="batch" />
                <span>批量合并</span>
              </label>
              <label class="radio-label">
                <input v-model="mode" type="radio" value="single" />
                <span>逐行单条</span>
              </label>
            </div>
          </div>

          <div class="opt-row opt-checks">
            <label class="checkbox-label">
              <input v-model="createTable" type="checkbox" />
              <span>含建表语句</span>
            </label>
            <label class="checkbox-label">
              <input v-model="flatten" type="checkbox" />
              <span>展开嵌套字段</span>
            </label>
            <label class="checkbox-label">
              <input v-model="quoteIdent" type="checkbox" />
              <span>引用标识符</span>
            </label>
          </div>
        </div>

        <!-- 操作 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!output" @click="copyOutput">📋 复制 SQL</button>
          <button class="tool-button" @click="loadSample">🧪 示例</button>
          <button class="tool-button" :disabled="!output" @click="download">⬇️ 下载 .sql</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="!input.trim()" class="empty-hint">
          粘贴 JSON 对象数组，自动按字段生成 INSERT INTO 语句，支持字段筛选与三种 SQL 方言
        </div>

        <!-- 统计 -->
        <div v-if="stats" class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">数据行</span>
            <span class="stat-value">{{ stats.rows }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">字段</span>
            <span class="stat-value">{{ stats.cols }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">语句数</span>
            <span class="stat-value green">{{ stats.statements }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">输出大小</span>
            <span class="stat-value">{{ stats.size }}</span>
          </div>
        </div>

        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

const SAMPLE = `[
  { "id": 1, "name": "Alice", "age": 30, "email": "alice@example.com", "active": true },
  { "id": 2, "name": "Bob", "age": 25, "email": null, "active": false },
  { "id": 3, "name": "Carol", "age": 28, "email": "carol@example.com", "active": true }
]`

const BATCH_SIZE = 200

const DIALECTS = {
  mysql: {
    label: 'MySQL',
    quote: s => '`' + String(s).replace(/`/g, '``') + '`',
    quoteIdent: s => '`' + String(s).replace(/`/g, '``') + '`',
    bool: b => (b ? '1' : '0'),
    str: s => {
      const esc = String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")
      return "'" + esc + "'"
    },
    types: { int: 'BIGINT', float: 'DOUBLE', bool: 'TINYINT(1)', varchar: 'VARCHAR({n})', text: 'TEXT', json: 'JSON' }
  },
  postgres: {
    label: 'PostgreSQL',
    quote: s => '"' + String(s).replace(/"/g, '""') + '"',
    quoteIdent: s => '"' + String(s).replace(/"/g, '""') + '"',
    bool: b => (b ? 'TRUE' : 'FALSE'),
    str: s => "'" + String(s).replace(/'/g, "''") + "'",
    types: { int: 'BIGINT', float: 'DOUBLE PRECISION', bool: 'BOOLEAN', varchar: 'VARCHAR({n})', text: 'TEXT', json: 'JSONB' }
  },
  sqlite: {
    label: 'SQLite',
    quote: s => '"' + String(s).replace(/"/g, '""') + '"',
    quoteIdent: s => '"' + String(s).replace(/"/g, '""') + '"',
    bool: b => (b ? '1' : '0'),
    str: s => "'" + String(s).replace(/'/g, "''") + "'",
    types: { int: 'INTEGER', float: 'REAL', bool: 'INTEGER', varchar: 'TEXT', text: 'TEXT', json: 'TEXT' }
  }
}

const input = ref(SAMPLE)
const tableName = ref('users')
const dialect = ref('mysql')
const mode = ref('batch')
const createTable = ref(true)
const flatten = ref(true)
const quoteIdent = ref(true)
const offCols = ref([])
const success = ref('')
let successTimer = null

const dialects = DIALECTS

/* ================= 工具函数 ================= */

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function friendlyParseError(e, text) {
  const m = /position (\d+)/.exec(e.message)
  if (m) {
    const pos = Number(m[1])
    const before = text.slice(0, pos)
    const line = before.split('\n').length
    const col = pos - before.lastIndexOf('\n')
    const msg = e.message
      .replace(/\s+in JSON at position \d+/, '')
      .replace(/\s*\(line \d+ column \d+\)\s*$/, '')
    return `第 ${line} 行 第 ${col} 列：${msg}`
  }
  return e.message
}

function flattenObject(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k
    if (isPlainObject(v) && Object.keys(v).length) flattenObject(v, key, out)
    else out[key] = v
  }
  return out
}

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 1800)
}

/* ================= 解析 ================= */

const parsed = computed(() => {
  const text = input.value
  if (!text.trim()) return { empty: true }
  let value
  try {
    value = JSON.parse(text)
  } catch (e) {
    return { error: friendlyParseError(e, text) }
  }

  if (Array.isArray(value)) {
    if (!value.length) return { error: '数组为空，没有可转换的数据' }
    if (!value.every(isPlainObject)) return { error: '数组元素需全部是对象，例如 [{"id":1}]' }
    return { rows: value, source: 'root' }
  }

  if (isPlainObject(value)) {
    const arrayKeys = Object.keys(value).filter(k => Array.isArray(value[k]))
    if (arrayKeys.length === 1 && value[arrayKeys[0]].every(isPlainObject)) {
      const arr = value[arrayKeys[0]]
      if (!arr.length) return { error: `字段 "${arrayKeys[0]}" 是空数组，没有可转换的数据` }
      return { rows: arr, source: arrayKeys[0] }
    }
    return { rows: [value], source: 'object' }
  }

  return { error: '请输入 JSON 数组（对象数组），或包含单个对象数组字段的 JSON 对象' }
})

const parseError = computed(() => parsed.value.error || '')
const sourceHint = computed(() => {
  if (parsed.value.source === 'root') return '根数组'
  if (parsed.value.source === 'object') return '单个对象 → 1 行'
  if (parsed.value.source) return `取自字段 "${parsed.value.source}"`
  return ''
})

const shapeLine = computed(() => {
  const p = parsed.value
  if (!p.rows) return ''
  return `${p.rows.length} 行 · ${columns.value.length} 字段`
})

/* ================= 行数据 / 字段 ================= */

const normRows = computed(() => {
  const p = parsed.value
  if (!p.rows) return null
  if (!flatten.value) return p.rows
  return p.rows.map(o => flattenObject(o, '', {}))
})

const columns = computed(() => {
  const rows = normRows.value
  if (!rows) return []
  const seen = new Set()
  const list = []
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k)
        list.push(k)
      }
    }
  }
  return list
})

const selectedCols = computed(() => columns.value.filter(c => !offCols.value.includes(c)))

watch(columns, cols => {
  offCols.value = offCols.value.filter(c => cols.includes(c))
})

function isOff(c) {
  return offCols.value.includes(c)
}

function toggleCol(c) {
  if (offCols.value.includes(c)) offCols.value = offCols.value.filter(x => x !== c)
  else offCols.value = [...offCols.value, c]
}

function selectAll() {
  offCols.value = []
}

function selectNone() {
  offCols.value = [...columns.value]
}

/* ================= 生成 SQL ================= */

const SIMPLE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/

function quoteName(name, d) {
  const raw = String(name).trim()
  if (!raw) return ''
  if (!quoteIdent.value) return raw
  return raw.split('.').map(part => d.quote(part)).join('.')
}

function ident(name, d) {
  const raw = String(name)
  if (!quoteIdent.value && SIMPLE_IDENT.test(raw)) return raw
  return d.quote(raw)
}

function literal(v, d) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'boolean') return d.bool(v)
  if (typeof v === 'string') return d.str(v)
  try {
    return d.str(JSON.stringify(v))
  } catch {
    return 'NULL'
  }
}

function columnValues(col) {
  return (normRows.value || []).map(r => (Object.prototype.hasOwnProperty.call(r, col) ? r[col] : null))
}

function sqlType(col, d) {
  const vals = columnValues(col).filter(v => v !== null && v !== undefined)
  if (!vals.length) return d.types.text
  if (vals.every(v => typeof v === 'boolean')) return d.types.bool
  if (vals.every(v => typeof v === 'number')) {
    return vals.every(v => Number.isInteger(v)) ? d.types.int : d.types.float
  }
  if (vals.every(v => typeof v === 'string')) {
    const max = Math.max(...vals.map(v => v.length))
    if (max <= 255) return d.types.varchar.replace('{n}', Math.max(16, Math.ceil(max * 1.5)))
    return d.types.text
  }
  return d.types.json
}

function isPrimaryKey(col) {
  if (col.toLowerCase() !== 'id') return false
  const vals = columnValues(col)
  if (!vals.length) return false
  if (!vals.every(v => typeof v === 'number' && Number.isInteger(v))) return false
  if (vals.some(v => v === null || v === undefined)) return false
  return new Set(vals).size === vals.length
}

const tableOk = computed(() => tableName.value.trim().length > 0)

function buildCreateTable(d, cols, tbl) {
  const lines = cols.map(col => {
    const parts = ['  ' + ident(col, d), sqlType(col, d)]
    if (columnValues(col).every(v => v !== null && v !== undefined)) parts.push('NOT NULL')
    if (isPrimaryKey(col)) parts.push('PRIMARY KEY')
    return parts.join(' ')
  })
  return `CREATE TABLE IF NOT EXISTS ${tbl} (\n${lines.join(',\n')}\n);`
}

const output = computed(() => {
  const rows = normRows.value
  const cols = selectedCols.value
  if (!rows || !rows.length || !cols.length || !tableOk.value) return ''
  const d = DIALECTS[dialect.value]
  const tbl = quoteName(tableName.value, d)
  const parts = []

  if (createTable.value) parts.push(buildCreateTable(d, cols, tbl))

  const colList = cols.map(c => ident(c, d)).join(', ')
  const head = `INSERT INTO ${tbl} (${colList}) VALUES`

  if (mode.value === 'batch') {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE)
      const tuples = chunk.map(r => '  (' + cols.map(c => literal(r[c], d)).join(', ') + ')')
      parts.push(`${head}\n${tuples.join(',\n')};`)
    }
  } else {
    for (const r of rows) {
      parts.push(`${head} (${cols.map(c => literal(r[c], d)).join(', ')});`)
    }
  }

  return parts.join('\n\n')
})

const outputNotice = computed(() => {
  if (parseError.value) return '请先修正 JSON 语法错误'
  if (!parsed.value.rows) return ''
  if (!tableOk.value) return '请填写表名'
  if (!columns.value.length) return '数据里没有可用的字段'
  if (!selectedCols.value.length) return '请至少选择一个字段'
  return ''
})

const outputStat = computed(() => {
  const n = parsed.value.rows ? parsed.value.rows.length : 0
  return `${n} 条记录 · ${DIALECTS[dialect.value].label}`
})

const stats = computed(() => {
  const text = output.value
  if (!text) return null
  const rows = parsed.value.rows.length
  const cols = selectedCols.value.length
  let statements = 0
  if (createTable.value) statements += 1
  statements += mode.value === 'batch' ? Math.ceil(rows / BATCH_SIZE) : rows
  const bytes = new Blob([text]).size
  return {
    rows,
    cols,
    statements,
    size: bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
  }
})

/* ================= 操作 ================= */

async function copyTextToClipboard(text, msg) {
  if (!text) return
  const ok = await copyText(text)
  flash(ok ? msg : '复制失败，请手动选择复制')
}

function copyInput() {
  copyTextToClipboard(input.value, '已复制输入 JSON')
}

function copyOutput() {
  copyTextToClipboard(output.value, '已复制 SQL')
}

function loadSample() {
  input.value = SAMPLE
  tableName.value = 'users'
  dialect.value = 'mysql'
  mode.value = 'batch'
  createTable.value = true
  flatten.value = true
  quoteIdent.value = true
  offCols.value = []
  success.value = ''
}

function clearAll() {
  input.value = ''
  offCols.value = []
  success.value = ''
}

function download() {
  if (!output.value) return
  try {
    const blob = new Blob([output.value + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (tableName.value.trim() || 'data').replace(/[^\w.-]/g, '_') + '.sql'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    flash('已下载 SQL 文件')
  } catch {
    flash('下载失败，请手动复制 SQL')
  }
}

onBeforeUnmount(() => {
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
.copy-wrap {
  position: relative;
}

.copy-wrap .code-input {
  padding-right: 44px;
}

.input-error {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--red);
  word-break: break-all;
}

.shape-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.shape-badge {
  border: 1px solid var(--green);
  background: var(--green-soft);
  color: var(--green);
  padding: 2px 8px;
}

.shape-badge.out {
  border-color: var(--line);
  background: var(--panel-2);
  color: var(--text);
}

.shape-hint {
  color: var(--muted);
}

/* 字段筛选 */
.field-panel {
  margin-top: 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-actions {
  display: flex;
  gap: 6px;
}

.mini-btn {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  padding: 2px 7px;
  cursor: pointer;
  border-radius: 0;
}

.mini-btn:hover {
  color: var(--green);
  border-color: var(--green);
}

.field-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
  max-height: 150px;
  overflow: auto;
}

.field-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
  border-radius: 0;
}

.field-chip:hover,
.field-chip:has(input:focus-visible) {
  border-color: var(--green);
}

.field-chip.off {
  color: var(--muted);
  border-style: dashed;
}

.field-chip input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.chip-mark {
  color: var(--green);
  font-size: 11px;
}

.field-chip.off .chip-mark {
  color: var(--muted);
}

.chip-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 配置 */
.opt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  margin-top: 1rem;
}

.opt-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.opt-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-width: 42px;
}

.table-input {
  flex: 1;
  min-width: 120px;
}

.opt-checks {
  grid-column: 1 / -1;
  gap: 18px;
}

/* 空提示 */
.empty-hint {
  margin-top: 1rem;
  padding: 14px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  text-align: center;
}

/* 统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 1rem;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 18px;
  color: var(--text);
}

.stat-value.green {
  color: var(--green);
}

@media (max-width: 900px) {
  .opt-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .field-chips {
    max-height: 190px;
  }

  .opt-checks {
    gap: 12px;
  }
}
</style>
