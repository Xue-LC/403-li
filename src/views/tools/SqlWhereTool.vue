<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧩 SQL WHERE 条件构造器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 全局选项条 -->
        <div class="opt-bar">
          <label class="opt-item">
            <span class="opt-label">方言</span>
            <select class="tool-select" v-model="options.dialect">
              <option value="none">通用（需引用时用 " 双引号"）</option>
              <option value="mysql">MySQL `反引号`</option>
              <option value="postgres">PostgreSQL "双引号"</option>
              <option value="sqlserver">SQL Server [方括号]</option>
            </select>
          </label>
          <label class="opt-item">
            <span class="opt-label">关键字</span>
            <select class="tool-select" v-model="options.keywordCase">
              <option value="upper">大写 UPPER</option>
              <option value="lower">小写 lower</option>
            </select>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.forceQuote" />
            <span>强制引用标识符</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.multiline" />
            <span>多行缩进</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.fullStatement" />
            <span>生成完整语句</span>
          </label>
        </div>

        <div class="tool-two-col">
          <!-- 左栏：条件构造 -->
          <div class="tool-col">
            <div class="col-head">
              <label class="tool-label">条件列表：</label>
              <button class="copy-btn-inline" @click="copyConditions" title="复制条件 JSON" :disabled="!rows.length">📋</button>
            </div>

            <div class="cond-list">
              <div v-for="(row, i) in rows" :key="row.id" class="cond-row">
                <div class="cond-head">
                  <select v-if="i > 0" class="tool-select logic" v-model="row.logic">
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                  <span v-else class="where-badge">WHERE</span>

                  <span class="paren-box">
                    <select class="tool-select paren" v-model.number="row.openParen" title="前置左括号数量">
                      <option :value="0">(0</option>
                      <option :value="1">((</option>
                      <option :value="2">(((</option>
                    </select>
                    <select class="tool-select paren" v-model.number="row.closeParen" title="后置右括号数量">
                      <option :value="0">)0</option>
                      <option :value="1">))</option>
                      <option :value="2">)))</option>
                    </select>
                  </span>

                  <span class="cond-actions">
                    <button class="row-btn" @click="moveRow(i, -1)" :disabled="i === 0" title="上移">↑</button>
                    <button class="row-btn" @click="moveRow(i, 1)" :disabled="i === rows.length - 1" title="下移">↓</button>
                    <button class="row-btn danger" @click="removeRow(i)" title="删除">✕</button>
                  </span>
                </div>

                <div class="cond-body">
                  <input
                    class="code-input-sm field"
                    v-model="row.field"
                    placeholder="字段名，如 users.age 或 a.b"
                    @input="clearStatus"
                  />
                  <select class="tool-select op" v-model="row.operator">
                    <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>

                  <template v-if="arityOf(row) === 1">
                    <input class="code-input-sm val" v-model="row.value" placeholder="值" @input="clearStatus" />
                  </template>
                  <template v-else-if="arityOf(row) === 'list'">
                    <input class="code-input-sm val" v-model="row.value" placeholder="值1, 值2, 值3" @input="clearStatus" />
                  </template>
                  <template v-else-if="arityOf(row) === 2">
                    <input class="code-input-sm val-sm" v-model="row.value" placeholder="下限" @input="clearStatus" />
                    <span class="and-mark">AND</span>
                    <input class="code-input-sm val-sm" v-model="row.value2" placeholder="上限" @input="clearStatus" />
                  </template>
                  <span v-else class="no-value">— 无需值 —</span>

                  <select v-if="arityOf(row) !== 0" class="tool-select vtype" v-model="row.valueType" title="值类型">
                    <option value="auto">自动</option>
                    <option value="string">字符串</option>
                    <option value="number">数字</option>
                    <option value="raw">原始表达式</option>
                  </select>
                </div>
              </div>

              <div v-if="!rows.length" class="empty-hint">暂无条件，点击下方「添加条件」开始构造。</div>
            </div>
          </div>

          <!-- 右栏：SQL 输出 -->
          <div class="tool-col">
            <label class="tool-label">生成的 SQL：</label>

            <div v-if="options.fullStatement" class="stmt-fields">
              <input class="code-input-sm" v-model="options.select" placeholder="SELECT 字段（默认 *）" />
              <input class="code-input-sm" v-model="options.from" placeholder="FROM 表名" />
              <input class="code-input-sm" v-model="options.orderBy" placeholder="ORDER BY（可空）" />
              <input class="code-input-sm limit-in" v-model="options.limit" placeholder="LIMIT（可空，数字）" />
            </div>

            <div class="output-wrap">
              <textarea
                :value="output"
                readonly
                rows="14"
                class="code-input output"
                placeholder="SQL 将实时显示在这里..."
              ></textarea>
              <button class="copy-btn" @click="copySql" :disabled="!output.trim()" title="复制 SQL">📋</button>
            </div>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="addRow">➕ 添加条件</button>
          <button class="tool-button" @click="loadPreset" :disabled="!presets.length">🎲 示例</button>
          <button class="tool-button" @click="copySql" :disabled="!output.trim()">📋 复制 SQL</button>
          <button class="tool-button danger" @click="clearAll" :disabled="!rows.length">🗑️ 清空</button>
        </div>

        <div v-if="errors.length" class="status-error">
          ❌ {{ errors[0] }}
          <span v-if="errors.length > 1">（共 {{ errors.length }} 个问题）</span>
        </div>
        <div v-if="warnings.length" class="status-warn">⚠️ {{ warnings.join('；') }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <div class="tip-note">
          提示：值类型「自动」会识别数字、true/false、NULL，其余按字符串加引号；「原始表达式」会原样输出（如 NOW()、其他字段名）。
          IN / NOT IN 用英文逗号分隔多个值，BETWEEN 需填下限和上限。
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const OPERATORS = [
  { value: '=', label: '= 等于', arity: 1 },
  { value: '!=', label: '!= 不等于', arity: 1 },
  { value: '<>', label: '<> 不等于', arity: 1 },
  { value: '>', label: '> 大于', arity: 1 },
  { value: '>=', label: '>= 大于等于', arity: 1 },
  { value: '<', label: '< 小于', arity: 1 },
  { value: '<=', label: '<= 小于等于', arity: 1 },
  { value: 'LIKE', label: 'LIKE 模糊匹配', arity: 1 },
  { value: 'NOT LIKE', label: 'NOT LIKE 不匹配', arity: 1 },
  { value: 'ILIKE', label: 'ILIKE 忽略大小写', arity: 1 },
  { value: 'REGEXP', label: 'REGEXP 正则', arity: 1 },
  { value: 'IN', label: 'IN 在集合内', arity: 'list' },
  { value: 'NOT IN', label: 'NOT IN 不在集合内', arity: 'list' },
  { value: 'BETWEEN', label: 'BETWEEN 区间', arity: 2 },
  { value: 'NOT BETWEEN', label: 'NOT BETWEEN 区间外', arity: 2 },
  { value: 'IS NULL', label: 'IS NULL 为空', arity: 0 },
  { value: 'IS NOT NULL', label: 'IS NOT NULL 非空', arity: 0 },
  { value: 'IS TRUE', label: 'IS TRUE', arity: 0 },
  { value: 'IS FALSE', label: 'IS FALSE', arity: 0 }
]

const presets = [
  [
    { field: 'user_id', operator: '=', value: 'other_table.user_id', valueType: 'raw' },
    { field: 'age', operator: '>=', value: '18' },
    { field: 'status', operator: 'IN', value: 'active, pending' },
    { field: 'deleted_at', operator: 'IS NULL' }
  ],
  [
    { field: 'amount', operator: 'BETWEEN', value: '100', value2: '500' },
    { field: 'note', operator: 'LIKE', value: '%退款%', logic: 'OR' }
  ],
  [
    { field: 'role', operator: '=', value: 'admin', openParen: 1 },
    { field: 'vip', operator: '=', value: 'true', logic: 'OR' },
    { field: 'created_at', operator: 'NOT BETWEEN', value: '2024-01-01', value2: '2024-12-31', closeParen: 1 }
  ]
]

let seq = 0
function newRow(init = {}) {
  return {
    id: ++seq,
    logic: 'AND',
    field: '',
    operator: '=',
    value: '',
    value2: '',
    valueType: 'auto',
    openParen: 0,
    closeParen: 0,
    ...init
  }
}

const rows = ref([
  newRow({ field: 'status', operator: '=', value: 'active' }),
  newRow({ field: 'age', operator: '>=', value: '18', logic: 'AND' })
])

const options = reactive({
  dialect: 'none',
  keywordCase: 'upper',
  forceQuote: false,
  multiline: true,
  fullStatement: false,
  select: '*',
  from: 'users',
  orderBy: 'created_at DESC',
  limit: '100'
})

const success = ref('')

// ── 工具函数 ──────────────────────────────────────────────────────

const RESERVED = new Set([
  'SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'BY', 'TABLE', 'USER', 'INDEX',
  'KEY', 'VALUE', 'VALUES', 'SET', 'JOIN', 'ON', 'AND', 'OR', 'NOT', 'NULL',
  'DEFAULT', 'PRIMARY', 'FOREIGN', 'REFERENCES', 'LIKE', 'IN', 'IS', 'AS',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DESC', 'ASC', 'LIMIT', 'OFFSET',
  'UNION', 'ALL', 'DISTINCT', 'CHECK', 'DATE', 'TIME', 'TIMESTAMP', 'LEFT',
  'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL', 'INSERT', 'UPDATE', 'DELETE'
])

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_$]*$/
const NUMBER_RE = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/

function kw(word) {
  return options.keywordCase === 'lower' ? word.toLowerCase() : word.toUpperCase()
}

function wrapIdent(part) {
  if (options.dialect === 'mysql') return '`' + part.replace(/`/g, '``') + '`'
  if (options.dialect === 'postgres') return '"' + part.replace(/"/g, '""') + '"'
  if (options.dialect === 'sqlserver') return '[' + part.replace(/]/g, ']]') + ']'
  // 通用方言：按 SQL 标准使用双引号
  return '"' + part.replace(/"/g, '""') + '"'
}

function quoteIdent(raw) {
  const name = String(raw || '').trim()
  if (!name) return ''
  return name
    .split('.')
    .map(part => {
      const p = part.trim()
      if (!p) return ''
      if (p === '*') return '*'
      const simple = IDENT_RE.test(p)
      if (simple && !options.forceQuote && !RESERVED.has(p.toUpperCase())) return p
      return wrapIdent(p)
    })
    .filter(Boolean)
    .join('.')
}

function quoteString(value) {
  return "'" + String(value).replace(/'/g, "''") + "'"
}

function splitList(str) {
  const out = []
  let cur = ''
  let quote = null
  for (const ch of String(str)) {
    if (quote) {
      if (ch === quote) quote = null
      cur += ch
    } else if (ch === "'" || ch === '"') {
      quote = ch
      cur += ch
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(s => s.trim()).filter(Boolean)
}

function stripQuotes(item) {
  const s = String(item).trim()
  if (s.length >= 2 && ((s[0] === "'" && s.endsWith("'")) || (s[0] === '"' && s.endsWith('"')))) {
    const inner = s.slice(1, -1)
    return { text: s[0] === "'" ? inner.replace(/''/g, "'") : inner.replace(/""/g, '"'), forced: true }
  }
  return { text: s, forced: false }
}

function formatValue(row, raw, forcedString = false) {
  const v = String(raw ?? '').trim()
  if (v === '') return { sql: 'NULL', empty: true }
  if (forcedString || row.valueType === 'string') return { sql: quoteString(v) }
  if (row.valueType === 'raw') return { sql: v }
  if (row.valueType === 'number') {
    if (!NUMBER_RE.test(v)) return { sql: v, error: `「${v}」不是合法数字` }
    return { sql: v }
  }
  // auto
  if (NUMBER_RE.test(v)) return { sql: v }
  if (/^(true|false)$/i.test(v)) return { sql: kw(v) }
  if (/^null$/i.test(v)) return { sql: 'NULL' }
  return { sql: quoteString(v) }
}

function arityOf(row) {
  const op = OPERATORS.find(o => o.value === row.operator)
  return op ? op.arity : 1
}

// ── 构造逻辑 ──────────────────────────────────────────────────────

function renderRow(row, lineNo, errs) {
  const field = quoteIdent(row.field)
  if (!field) return ''
  const arity = arityOf(row)
  const operator = kw(row.operator)

  if (arity === 0) return `${field} ${operator}`

  if (arity === 'list') {
    const items = splitList(row.value)
    if (!items.length) {
      errs.push(`第 ${lineNo} 行：${row.operator} 至少需要一个值`)
      return ''
    }
    const vals = items.map(it => {
      const { text, forced } = stripQuotes(it)
      const res = formatValue(row, text, forced)
      if (res.error) errs.push(`第 ${lineNo} 行：${res.error}`)
      if (res.empty && row.valueType !== 'raw') errs.push(`第 ${lineNo} 行：${row.operator} 的值不能为空`)
      return res.sql
    })
    return `${field} ${operator} (${vals.join(', ')})`
  }

  if (arity === 2) {
    const a = formatValue(row, row.value)
    const b = formatValue(row, row.value2)
    if (a.empty || b.empty) {
      errs.push(`第 ${lineNo} 行：BETWEEN 需要同时填写下限和上限`)
      return ''
    }
    if (a.error) errs.push(`第 ${lineNo} 行：下限 ${a.error}`)
    if (b.error) errs.push(`第 ${lineNo} 行：上限 ${b.error}`)
    return `${field} ${operator} ${a.sql} AND ${b.sql}`
  }

  const v = formatValue(row, row.value)
  if (v.empty) {
    errs.push(`第 ${lineNo} 行：${row.operator} 的值不能为空（可用「原始表达式」填 NULL）`)
    return ''
  }
  if (v.error) errs.push(`第 ${lineNo} 行：${v.error}`)
  return `${field} ${operator} ${v.sql}`
}

const built = computed(() => {
  const errs = []
  const warns = []
  const segments = []
  let openTotal = 0
  let closeTotal = 0

  rows.value.forEach((row, i) => {
    const filled = row.field.trim() || row.value.trim() || row.value2.trim()
    if (!filled) return
    if (!row.field.trim()) {
      errs.push(`第 ${i + 1} 行：请填写字段名`)
      return
    }
    const body = renderRow(row, i + 1, errs)
    openTotal += row.openParen
    closeTotal += row.closeParen
    if (!body) return
    const seg = '('.repeat(row.openParen) + body + ')'.repeat(row.closeParen)
    segments.push({ logic: row.logic, seg })
  })

  if (openTotal !== closeTotal) {
    warns.push(`括号数量不匹配（左括号 ${openTotal} 个，右括号 ${closeTotal} 个）`)
  }
  if (closeTotal > openTotal && segments.length) {
    warns.push('建议先加左括号，再在对应条件上补右括号')
  }

  if (!segments.length) return { where: '', errs, warns }

  const indent = options.multiline ? '  ' : ' '
  const joiner = options.multiline ? '\n' + indent : ' '
  const body = segments
    .map((s, idx) => (idx === 0 ? s.seg : `${kw(s.logic)} ${s.seg}`))
    .join(joiner)

  return {
    where: `${kw('WHERE')}${options.multiline ? '\n' + indent : ' '}${body}`,
    errs,
    warns
  }
})

const output = computed(() => {
  const { where } = built.value
  if (!where) return ''
  if (!options.fullStatement) return where + ';'

  const lines = []
  lines.push(`${kw('SELECT')} ${options.select.trim() || '*'}`)
  if (options.from.trim()) lines.push(`${kw('FROM')} ${options.from.trim()}`)
  lines.push(where)
  if (options.orderBy.trim()) lines.push(`${kw('ORDER BY')} ${options.orderBy.trim()}`)
  const lim = options.limit.trim()
  if (lim) lines.push(`${kw('LIMIT')} ${NUMBER_RE.test(lim) ? lim : lim}`)
  return lines.join('\n') + ';'
})

const errors = computed(() => built.value.errs)
const warnings = computed(() => built.value.warns)

// ── 行操作 ────────────────────────────────────────────────────────

function addRow() {
  const last = rows.value[rows.value.length - 1]
  rows.value.push(newRow({ logic: last && last.logic === 'OR' ? 'OR' : 'AND' }))
  clearStatus()
}

function removeRow(i) {
  rows.value.splice(i, 1)
  clearStatus()
}

function moveRow(i, delta) {
  const j = i + delta
  if (j < 0 || j >= rows.value.length) return
  const list = rows.value
  ;[list[i], list[j]] = [list[j], list[i]]
  clearStatus()
}

function loadPreset() {
  const preset = presets[Math.floor(Math.random() * presets.length)]
  rows.value = preset.map(p => newRow(p))
  success.value = '已载入示例条件'
  setTimeout(() => (success.value = ''), 1500)
}

function clearAll() {
  rows.value = [newRow()]
  options.select = '*'
  options.from = 'users'
  options.orderBy = ''
  options.limit = ''
  success.value = ''
}

function clearStatus() {
  success.value = ''
}

// ── 复制 ──────────────────────────────────────────────────────────

async function copySql() {
  if (!output.value.trim()) return
  const ok = await copyText(output.value)
  success.value = ok ? 'SQL 已复制到剪贴板' : '复制失败，请手动选择文本'
  setTimeout(() => (success.value = ''), 1500)
}

async function copyConditions() {
  const payload = rows.value.map(r => ({
    logic: r.logic,
    field: r.field,
    operator: r.operator,
    value: r.value,
    ...(arityOf(r) === 2 ? { value2: r.value2 } : {}),
    valueType: r.valueType,
    ...(r.openParen ? { openParen: r.openParen } : {}),
    ...(r.closeParen ? { closeParen: r.closeParen } : {})
  }))
  const ok = await copyText(JSON.stringify(payload, null, 2))
  success.value = ok ? '条件 JSON 已复制到剪贴板' : '复制失败，请手动选择文本'
  setTimeout(() => (success.value = ''), 1500)
}
</script>

<style scoped>
/* 全局选项条 */
.opt-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 10px 12px;
  margin-bottom: 14px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.opt-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opt-label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green);
}

/* 通用下拉框：直角、主题色 */
.tool-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.tool-select:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 1px var(--green-glow);
}

.col-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
}

.col-head .tool-label {
  margin-bottom: 0;
  margin-top: 0;
}

.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 0;
  color: var(--green);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--mono);
  padding: 3px 8px;
  transition: all 0.2s;
}

.copy-btn-inline:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.copy-btn-inline:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 条件列表 */
.cond-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.cond-row {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
}

.cond-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.where-badge {
  padding: 3px 8px;
  border: 1px solid var(--green);
  background: var(--green-soft);
  color: var(--green);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.tool-select.logic {
  width: 70px;
  color: var(--green);
}

.paren-box {
  display: flex;
  gap: 4px;
}

.tool-select.paren {
  width: 48px;
  text-align: center;
  color: var(--muted);
}

.cond-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.row-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--panel);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}

.row-btn:hover:not(:disabled) {
  border-color: var(--green);
  color: var(--green);
}

.row-btn.danger:hover:not(:disabled) {
  border-color: var(--red);
  color: var(--red);
}

.row-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cond-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.code-input-sm.field {
  flex: 1 1 140px;
  min-width: 120px;
}

.tool-select.op {
  flex: 0 0 auto;
  min-width: 132px;
}

.code-input-sm.val {
  flex: 2 1 160px;
  min-width: 120px;
}

.code-input-sm.val-sm {
  flex: 1 1 90px;
  min-width: 80px;
}

.and-mark {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.tool-select.vtype {
  flex: 0 0 auto;
  min-width: 84px;
}

.no-value {
  flex: 1 1 auto;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.empty-hint {
  padding: 18px 12px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  text-align: center;
}

/* 右栏 */
.stmt-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 8px 0;
}

.stmt-fields .limit-in {
  grid-column: span 2;
}

.output-wrap {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 260px;
}

.output-wrap .code-input {
  width: 100%;
}

.output-wrap .copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}

/* 状态与提示 */
.status-warn {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--amber);
  background: rgba(255, 216, 102, 0.08);
  color: var(--amber);
  font-family: var(--mono);
  font-size: 13px;
}

.tip-note {
  margin-top: 14px;
  padding: 10px 12px;
  border-left: 2px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .stmt-fields {
    grid-template-columns: 1fr;
  }

  .stmt-fields .limit-in {
    grid-column: span 1;
  }

  .tool-select.op {
    min-width: 100%;
  }

  .output-wrap {
    min-height: 200px;
  }
}
</style>
