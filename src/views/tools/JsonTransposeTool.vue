<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔀 JSON 行列转置器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入 / 输出双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入 JSON：</label>
            <div class="copy-wrap">
              <textarea
                v-model="input"
                rows="14"
                class="code-input"
                spellcheck="false"
                placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
              ></textarea>
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>
            <div v-if="inputError" class="input-error">⚠️ {{ inputError }}</div>
            <div v-else-if="analysis" class="shape-line">
              <span class="shape-badge">{{ analysis.label }}</span>
              <span class="shape-arrow">{{ analysis.arrow }}</span>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">转置结果：</label>
            <div class="copy-wrap">
              <textarea
                :value="output"
                rows="14"
                class="code-input output"
                spellcheck="false"
                readonly
                placeholder="结果将显示在这里..."
              ></textarea>
              <button class="copy-btn" title="复制结果" :disabled="!output" @click="copyOutput">📋</button>
            </div>
            <div v-if="notice" class="input-error">⚠️ {{ notice }}</div>
            <div v-else-if="output" class="shape-line">
              <span class="shape-badge out">{{ outputShape }}</span>
              <span class="shape-arrow">{{ outputSize }}</span>
            </div>
          </div>
        </div>

        <!-- 选项 -->
        <div class="opt-row">
          <label class="checkbox-label">
            <input v-model="flatten" type="checkbox" />
            <span>展开嵌套字段</span>
          </label>
          <label class="checkbox-label">
            <input v-model="fillNull" type="checkbox" />
            <span>缺失值补 null</span>
          </label>
          <div class="delim-box">
            <span class="delim-label">路径分隔符</span>
            <input v-model="delimiter" class="code-input-sm delim-input" maxlength="3" />
          </div>
          <div class="radio-group indent-group">
            <label class="radio-label">
              <input v-model="indent" type="radio" :value="2" />
              <span>2 空格</span>
            </label>
            <label class="radio-label">
              <input v-model="indent" type="radio" :value="4" />
              <span>4 空格</span>
            </label>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!output" @click="copyOutput">📋 复制结果</button>
          <button class="tool-button" @click="loadSample">🧪 示例</button>
          <button class="tool-button" :disabled="!output" @click="swap">🔁 结果转输入</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <!-- 提示 -->
        <div v-if="!input.trim()" class="empty-hint">
          粘贴对象数组（行数据）或「字段 → 数组」字典（列数据），自动完成行转列 / 列转行
        </div>

        <!-- 统计 -->
        <div v-if="dims" class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">输入行</span>
            <span class="stat-value">{{ dims.inRows }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">输入列</span>
            <span class="stat-value">{{ dims.inCols }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">输出行</span>
            <span class="stat-value green">{{ dims.outRows }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">输出列</span>
            <span class="stat-value green">{{ dims.outCols }}</span>
          </div>
        </div>

        <!-- 表格预览 -->
        <div v-if="preview" class="out-block">
          <div class="out-head">
            <span>▼ 结果表格预览</span>
            <span>{{ preview.total }} 行{{ preview.truncated ? '（仅显示前 50 行）' : '' }}</span>
          </div>
          <div class="table-scroll">
            <table class="preview-table">
              <thead>
                <tr>
                  <th class="idx-col">#</th>
                  <th v-for="c in preview.columns" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in preview.rows" :key="ri">
                  <td class="idx-col">{{ ri + 1 }}</td>
                  <td
                    v-for="(cell, ci) in row"
                    :key="ci"
                    :class="{ 'cell-null': cell === null, 'cell-obj': isComplex(cell) }"
                  >{{ fmtCell(cell) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 操作反馈 -->
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

const SAMPLE = `[
  { "id": 1, "name": "Alice", "age": 30, "city": "Beijing", "tags": ["admin", "dev"] },
  { "id": 2, "name": "Bob", "age": 25, "city": "Shanghai", "tags": ["user"] },
  { "id": 3, "name": "Carol", "age": 28, "city": "Shenzhen", "tags": ["user", "ops"] }
]`

const input = ref(SAMPLE)
const flatten = ref(true)
const fillNull = ref(true)
const delimiter = ref('.')
const indent = ref(2)
const success = ref('')
let successTimer = null

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

function flattenObject(obj, prefix, delim, out) {
  const keys = Object.keys(obj)
  if (!keys.length && prefix) {
    out[prefix] = {}
    return out
  }
  for (const k of keys) {
    const path = prefix ? prefix + delim + k : k
    const v = obj[k]
    if (isPlainObject(v)) flattenObject(v, path, delim, out)
    else out[path] = v
  }
  return out
}

function unionKeys(rows) {
  const seen = new Set()
  const keys = []
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k)
        keys.push(k)
      }
    }
  }
  return keys
}

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 1800)
}

/* ================= 解析 ================= */

const parsedState = computed(() => {
  const text = input.value
  if (!text.trim()) return { empty: true }
  try {
    return { value: JSON.parse(text) }
  } catch (e) {
    return { error: friendlyParseError(e, text) }
  }
})

const inputError = computed(() => parsedState.value.error || '')

const analysis = computed(() => {
  const st = parsedState.value
  if (st.empty || st.error) return null
  const v = st.value

  if (Array.isArray(v)) {
    if (!v.length) return { kind: 'empty', label: '空数组', arrow: '' }
    if (v.every(item => Array.isArray(item))) {
      const cols = Math.max(...v.map(r => r.length))
      if (!cols) return { kind: 'empty', label: '空矩阵', arrow: '' }
      return { kind: 'matrix', label: '矩阵 · 二维数组', arrow: '行 → 列', inRows: v.length, inCols: cols }
    }
    if (v.every(item => isPlainObject(item))) {
      const cols = unionKeys(v).length
      if (!cols) return { kind: 'empty', label: '空对象数组', arrow: '' }
      return { kind: 'rows', label: '行数据 · 对象数组', arrow: '行 → 列', inRows: v.length, inCols: cols }
    }
    return { kind: 'unsupported', message: '数组元素需全部是同类型的对象或数组，暂不支持混合类型 / 原始值数组' }
  }

  if (isPlainObject(v)) {
    const entries = Object.entries(v)
    if (!entries.length) return { kind: 'empty', label: '空对象', arrow: '' }
    const delim = delimiter.value || '.'
    const colsEntries = flatten.value ? Object.entries(flattenObject(v, '', delim, {})) : entries
    if (colsEntries.length && colsEntries.every(([, x]) => Array.isArray(x))) {
      const rows = Math.max(...colsEntries.map(([, x]) => x.length))
      if (!rows) return { kind: 'empty', label: '空列数据', arrow: '' }
      return { kind: 'cols', label: '列数据 · 数组字典', arrow: '列 → 行', inRows: rows, inCols: colsEntries.length }
    }
    if (entries.every(([, x]) => isPlainObject(x))) {
      const cols = unionKeys(entries.map(([, x]) => x)).length + 1
      return { kind: 'objrows', label: '行数据 · 对象字典', arrow: '行 → 列', inRows: entries.length, inCols: cols }
    }
    return { kind: 'unsupported', message: '对象的值需全部为数组（列数据）或全部为对象（行数据），暂不支持混合类型' }
  }

  return { kind: 'unsupported', message: '请输入 JSON 对象数组或「字段 → 数组」对象' }
})

const notice = computed(() => {
  const a = analysis.value
  if (!a) return ''
  if (a.kind === 'unsupported') return a.message
  if (a.kind === 'empty') return '没有可转置的数据：' + a.label
  return ''
})

/* ================= 转置 ================= */

function missingValue() {
  return fillNull.value ? null : ''
}

const resultValue = computed(() => {
  const a = analysis.value
  if (!a || notice.value) return null
  const v = parsedState.value.value
  const delim = delimiter.value || '.'
  const miss = missingValue

  if (a.kind === 'matrix') {
    const cols = a.inCols
    const out = []
    for (let c = 0; c < cols; c++) {
      const row = []
      for (let r = 0; r < v.length; r++) {
        row.push(c < v[r].length && v[r][c] !== undefined ? v[r][c] : miss())
      }
      out.push(row)
    }
    return out
  }

  if (a.kind === 'rows') {
    const rows = v.map(o => (flatten.value ? flattenObject(o, '', delim, {}) : o))
    const keys = unionKeys(rows)
    const out = {}
    for (const k of keys) {
      out[k] = rows.map(r => (Object.prototype.hasOwnProperty.call(r, k) ? r[k] : miss()))
    }
    return out
  }

  if (a.kind === 'objrows') {
    let keyField = '_key'
    while (Object.prototype.hasOwnProperty.call(v, keyField)) keyField = '_' + keyField
    const rows = Object.entries(v).map(([k, o]) => {
      const flat = flatten.value ? flattenObject(o, '', delim, {}) : { ...o }
      return { [keyField]: k, ...flat }
    })
    const keys = unionKeys(rows)
    const out = {}
    for (const k of keys) {
      out[k] = rows.map(r => (Object.prototype.hasOwnProperty.call(r, k) ? r[k] : miss()))
    }
    return out
  }

  if (a.kind === 'cols') {
    const entries = Object.entries(v)
    const flatEntries = []
    for (const [k, arr] of entries) {
      if (flatten.value) {
        const flat = flattenObject({ [k]: arr }, '', delim, {})
        for (const [fk, fv] of Object.entries(flat)) flatEntries.push([fk, fv])
      } else {
        flatEntries.push([k, arr])
      }
    }
    const n = Math.max(...flatEntries.map(([, arr]) => (Array.isArray(arr) ? arr.length : 1)))
    const out = []
    for (let i = 0; i < n; i++) {
      const row = {}
      for (const [k, arr] of flatEntries) {
        if (Array.isArray(arr)) row[k] = i < arr.length ? arr[i] : miss()
        else row[k] = arr
      }
      out.push(row)
    }
    return out
  }

  return null
})

const output = computed(() => {
  if (resultValue.value === null) return ''
  return JSON.stringify(resultValue.value, null, indent.value)
})

const outputShape = computed(() => {
  const a = analysis.value
  if (!a) return ''
  if (a.kind === 'cols') return '行数据 · 对象数组'
  if (a.kind === 'matrix') return '矩阵 · 二维数组'
  return '列数据 · 数组字典'
})

const dims = computed(() => {
  const a = analysis.value
  const res = resultValue.value
  if (!a || !res) return null
  let outRows = 0
  let outCols = 0
  if (Array.isArray(res)) {
    outRows = res.length
    outCols = res.every(item => Array.isArray(item))
      ? Math.max(0, ...res.map(r => r.length))
      : unionKeys(res).length
  } else {
    outCols = Object.keys(res).length
    outRows = Math.max(0, ...Object.values(res).map(x => (Array.isArray(x) ? x.length : 1)))
  }
  return {
    inRows: a.inRows,
    inCols: a.inCols,
    outRows,
    outCols
  }
})

const outputSize = computed(() => (dims.value ? `${dims.value.outRows} 行 × ${dims.value.outCols} 列` : ''))

/* ================= 表格预览 ================= */

function isComplex(v) {
  return v !== null && typeof v === 'object'
}

function fmtCell(v) {
  if (v === null || v === undefined) return 'null'
  if (Array.isArray(v)) return JSON.stringify(v)
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const preview = computed(() => {
  const res = resultValue.value
  if (!res) return null
  let columns = []
  let rows = []

  if (Array.isArray(res)) {
    if (res.every(item => Array.isArray(item))) {
      const n = Math.max(0, ...res.map(r => r.length))
      columns = Array.from({ length: n }, (_, i) => '#' + (i + 1))
      rows = res.map(r => columns.map((_, i) => (i < r.length ? r[i] : null)))
    } else {
      columns = unionKeys(res)
      rows = res.map(o => columns.map(c => (Object.prototype.hasOwnProperty.call(o, c) ? o[c] : null)))
    }
  } else {
    columns = Object.keys(res)
    const n = Math.max(0, ...columns.map(c => (Array.isArray(res[c]) ? res[c].length : 1)))
    for (let i = 0; i < n; i++) {
      rows.push(columns.map(c => {
        const val = res[c]
        if (Array.isArray(val)) return i < val.length ? val[i] : null
        return val
      }))
    }
  }

  return {
    columns,
    rows: rows.slice(0, 50),
    total: rows.length,
    truncated: rows.length > 50
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
  copyTextToClipboard(output.value, '已复制转置结果')
}

function loadSample() {
  input.value = SAMPLE
  flatten.value = true
  fillNull.value = true
  delimiter.value = '.'
  success.value = ''
}

function swap() {
  if (!output.value) return
  input.value = output.value
  success.value = ''
}

function clearAll() {
  input.value = ''
  success.value = ''
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

.shape-arrow {
  color: var(--muted);
}

/* 选项行 */
.opt-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.delim-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delim-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.delim-input {
  width: 56px;
  text-align: center;
  padding: 0 6px;
}

.indent-group {
  margin-left: auto;
}

/* 空输入提示 */
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

/* 预览表格 */
.out-block {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  margin-top: 12px;
}

.out-head {
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

.table-scroll {
  max-height: 360px;
  overflow: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  border: 1px solid var(--line);
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
  color: var(--text);
}

.preview-table th {
  position: sticky;
  top: 0;
  background: var(--panel);
  color: var(--green);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  z-index: 1;
}

.preview-table tbody tr:hover td {
  background: var(--green-soft);
}

.preview-table .idx-col {
  width: 48px;
  text-align: right;
  color: var(--muted);
  background: var(--panel);
}

.preview-table .cell-null {
  color: var(--muted);
  font-style: italic;
}

.preview-table .cell-obj {
  color: var(--amber);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .indent-group {
    margin-left: 0;
  }

  .out-head {
    font-size: 11px;
  }

  .preview-table {
    font-size: 11px;
  }

  .preview-table th,
  .preview-table td {
    padding: 5px 7px;
  }
}
</style>
