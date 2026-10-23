<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔢 JSON 数组计数器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入 / 报告双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入 JSON 数组：</label>
            <div class="copy-wrap">
              <textarea
                v-model="input"
                rows="16"
                class="code-input"
                spellcheck="false"
                placeholder='[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]'
              ></textarea>
              <button class="copy-btn" title="复制输入" @click="copyInput">📋</button>
            </div>
            <div v-if="parseError" class="input-error">⚠️ {{ parseError }}</div>
            <div v-else-if="stats" class="shape-line">
              <span class="shape-badge">{{ stats.isArray ? '数组' : '单值' }} · {{ stats.total }} 个元素</span>
              <span class="shape-arrow">{{ stats.fields.length }} 个字段 · 深度 {{ stats.depth }}</span>
            </div>
            <div v-if="stats && !stats.isArray" class="shape-line faint">
              输入不是数组，已按单个值统计
            </div>
            <div v-else-if="!stats && !parseError && !input.trim()" class="shape-line faint">等待输入…</div>
          </div>

          <div class="tool-col">
            <label class="tool-label">统计报告：</label>
            <div class="copy-wrap">
              <textarea
                :value="report"
                rows="16"
                class="code-input output"
                spellcheck="false"
                readonly
                placeholder="统计报告将显示在这里..."
              ></textarea>
              <button class="copy-btn" title="复制报告" :disabled="!report" @click="copyReport">📋</button>
            </div>
            <div v-if="stats && stats.total === 0" class="shape-line faint">空数组：没有元素可统计</div>
          </div>
        </div>

        <!-- 选项 -->
        <div class="opt-row">
          <label class="checkbox-label">
            <input v-model="flatten" type="checkbox" />
            <span>展开嵌套对象</span>
          </label>
          <div class="delim-box">
            <span class="delim-label">路径分隔符</span>
            <input v-model="delimiter" class="code-input-sm delim-input" maxlength="3" :disabled="!flatten" />
          </div>
          <div class="radio-group sort-group">
            <label class="radio-label">
              <input v-model="sortMode" type="radio" value="count" />
              <span>按出现次数</span>
            </label>
            <label class="radio-label">
              <input v-model="sortMode" type="radio" value="name" />
              <span>按字段名</span>
            </label>
          </div>
        </div>

        <!-- 操作 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!report" @click="copyReport">📋 复制报告</button>
          <button class="tool-button" @click="loadSample">🧪 示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <div v-if="!input.trim()" class="empty-hint">
          粘贴一个 JSON 数组（对象数组最佳），自动统计元素数量、字段出现次数与覆盖率、值类型分布和嵌套深度
        </div>

        <!-- 概览统计 -->
        <div v-if="stats" class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">元素总数</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">对象元素</span>
            <span class="stat-value">{{ stats.objects }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">其他元素</span>
            <span class="stat-value">{{ stats.others }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">字段数量</span>
            <span class="stat-value green">{{ stats.fields.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最大深度</span>
            <span class="stat-value">{{ stats.depth }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">数据大小</span>
            <span class="stat-value">{{ stats.sizeText }}</span>
          </div>
        </div>

        <!-- 类型分布 -->
        <div v-if="stats && stats.total" class="panel-block">
          <div class="panel-head">
            <span>▼ 元素类型分布</span>
            <span>{{ stats.total }} 个元素</span>
          </div>
          <div class="type-list">
            <div v-for="t in stats.types" :key="t.key" class="type-row">
              <span class="type-name">{{ t.label }}</span>
              <div class="type-track">
                <div class="type-fill" :style="{ width: Math.max(t.pct, 1.5) + '%' }"></div>
              </div>
              <span class="type-count">{{ t.count }}</span>
              <span class="type-pct">{{ t.pct.toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <!-- 字段分布 -->
        <div v-if="stats" class="panel-block">
          <div class="panel-head">
            <span>▼ 字段分布</span>
            <span>{{ stats.fields.length }} 个字段{{ stats.others ? ' · 已忽略 ' + stats.others + ' 个非对象元素' : '' }}</span>
          </div>
          <div v-if="!stats.fields.length" class="panel-empty">
            数组中没有对象元素，无法统计字段分布
          </div>
          <div v-else class="table-scroll">
            <table class="field-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th class="num">出现</th>
                  <th class="num">覆盖率</th>
                  <th class="num">唯一值</th>
                  <th class="num">空值</th>
                  <th>类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in stats.fields" :key="f.path">
                  <td class="field-name">{{ f.path }}</td>
                  <td class="num">{{ f.count }}</td>
                  <td class="num" :class="{ full: f.coverage === 100 }">{{ f.coverage.toFixed(1) }}%</td>
                  <td class="num">{{ f.uniqueText }}</td>
                  <td class="num" :class="{ muted: f.empty > 0 }">{{ f.empty }}</td>
                  <td class="type-cell">{{ f.typesText }}</td>
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

const SAMPLE = `[
  { "id": 1, "name": "Alice", "age": 30, "active": true, "tags": ["admin", "dev"], "profile": { "city": "Beijing", "score": 88.5 } },
  { "id": 2, "name": "Bob", "age": 25, "active": false, "tags": ["user"], "profile": { "city": "Shanghai", "score": 76 } },
  { "id": 3, "name": "Carol", "age": null, "active": true, "tags": [], "profile": { "city": "Shenzhen" } },
  { "id": 4, "name": "Dave", "age": 41, "active": true }
]`

const TYPE_ORDER = ['object', 'array', 'string', 'number', 'boolean', 'null', 'undefined']
const TYPE_LABEL = {
  object: '对象 object',
  array: '数组 array',
  string: '字符串 string',
  number: '数字 number',
  boolean: '布尔 boolean',
  null: '空值 null',
  undefined: '未定义'
}
const TYPE_SHORT = {
  object: 'object',
  array: 'array',
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  null: 'null',
  undefined: 'undefined'
}

const input = ref(SAMPLE)
const flatten = ref(true)
const delimiter = ref('.')
const sortMode = ref('count')
const success = ref('')
let successTimer = null

/* ================= 基础工具 ================= */

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function isEmptyValue(v) {
  return v === null || v === undefined || v === ''
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function calcDepth(v) {
  if (v === null || typeof v !== 'object') return 0
  const children = Array.isArray(v) ? v : Object.values(v)
  if (!children.length) return 1
  let max = 0
  for (const c of children) {
    const d = calcDepth(c)
    if (d > max) max = d
  }
  return max + 1
}

/* 显示宽度：中日韩字符按 2 列计算，保证等宽报告对齐 */
function dispWidth(s) {
  let n = 0
  for (const ch of String(s)) n += ch.codePointAt(0) > 0xff ? 2 : 1
  return n
}

function padEndW(s, len) {
  const diff = len - dispWidth(s)
  return diff > 0 ? String(s) + ' '.repeat(diff) : String(s)
}

function padStartW(s, len) {
  const diff = len - dispWidth(s)
  return diff > 0 ? ' '.repeat(diff) + String(s) : String(s)
}

function valueKey(v) {
  const t = typeOf(v)
  if (t === 'object' || t === 'array') {
    try {
      return t + ':' + JSON.stringify(v).slice(0, 200)
    } catch {
      return null
    }
  }
  return t + ':' + String(v)
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

const parseError = computed(() => parsedState.value.error || '')

/* ================= 统计 ================= */

function collectFields(obj, prefix, delim, out) {
  for (const k of Object.keys(obj)) {
    const path = prefix ? prefix + delim + k : k
    const v = obj[k]
    if (flatten.value && isPlainObject(v) && Object.keys(v).length) {
      collectFields(v, path, delim, out)
    } else {
      out.set(path, v)
    }
  }
  return out
}

function buildFields(objects, total) {
  const map = new Map()
  const delim = delimiter.value || '.'

  for (const obj of objects) {
    const entries = new Map()
    if (flatten.value) collectFields(obj, '', delim, entries)
    else for (const k of Object.keys(obj)) entries.set(k, obj[k])

    for (const [path, val] of entries) {
      let rec = map.get(path)
      if (!rec) {
        rec = { path, count: 0, empty: 0, unique: new Set(), capped: false, types: new Map() }
        map.set(path, rec)
      }
      rec.count++
      const t = typeOf(val)
      rec.types.set(t, (rec.types.get(t) || 0) + 1)
      if (isEmptyValue(val)) rec.empty++

      if (!rec.capped) {
        const key = valueKey(val)
        if (key !== null) {
          rec.unique.add(key)
          if (rec.unique.size > 2000) {
            rec.capped = true
            rec.unique.clear()
          }
        }
      }
    }
  }

  const list = []
  for (const rec of map.values()) {
    const typeList = [...rec.types.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    list.push({
      path: rec.path,
      count: rec.count,
      empty: rec.empty,
      coverage: total ? (rec.count / total) * 100 : 0,
      uniqueText: rec.capped ? '2000+' : String(rec.unique.size),
      typesText: typeList.map(([t, c]) => `${TYPE_SHORT[t] || t}×${c}`).join(', ')
    })
  }

  if (sortMode.value === 'name') {
    list.sort((a, b) => a.path.localeCompare(b.path, 'zh-Hans-CN'))
  } else {
    list.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path, 'zh-Hans-CN'))
  }
  return list
}

const stats = computed(() => {
  const st = parsedState.value
  if (st.empty || st.error) return null

  const isArray = Array.isArray(st.value)
  const items = isArray ? st.value : [st.value]
  const total = items.length

  const typeCounts = new Map()
  for (const v of items) {
    const t = typeOf(v)
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1)
  }
  const types = TYPE_ORDER
    .filter(t => typeCounts.has(t))
    .map(t => ({
      key: t,
      label: TYPE_LABEL[t] || t,
      count: typeCounts.get(t),
      pct: total ? (typeCounts.get(t) / total) * 100 : 0
    }))

  const objects = items.filter(isPlainObject)
  const fields = buildFields(objects, total)

  const bytes = new Blob([input.value]).size

  return {
    isArray,
    total,
    objects: objects.length,
    others: total - objects.length,
    fields,
    types,
    depth: calcDepth(st.value),
    bytes,
    sizeText: formatSize(bytes)
  }
})

/* ================= 文本报告 ================= */

const report = computed(() => {
  const s = stats.value
  if (!s) return ''

  const lines = []
  lines.push('JSON 数组统计报告')
  lines.push('='.repeat(48))
  lines.push('')

  lines.push('【概览】')
  const overview = [
    ['元素总数', s.total],
    ['对象元素', s.objects],
    ['其他元素', s.others],
    ['字段数量', s.fields.length],
    ['最大深度', s.depth],
    ['数据大小', s.sizeText]
  ]
  for (const [k, v] of overview) {
    lines.push('  ' + padEndW(k, 12) + ' : ' + v)
  }
  if (!s.isArray) {
    lines.push('')
    lines.push('  注意：输入不是数组，已按单个值统计')
  }
  if (s.others > 0) {
    lines.push('')
    lines.push(`  注意：${s.others} 个元素不是对象，未参与字段统计`)
  }
  lines.push('')

  lines.push('【元素类型分布】')
  if (!s.total) {
    lines.push('  （无元素）')
  } else {
    for (const t of s.types) {
      const bar = '█'.repeat(Math.max(1, Math.round((t.pct / 100) * 12)))
      lines.push(
        '  ' + padEndW(t.label, 16) + padStartW(t.count, 5) + '  ' +
        padStartW(t.pct.toFixed(1) + '%', 6) + '  ' + bar
      )
    }
  }
  lines.push('')

  lines.push('【字段分布】' + (sortMode.value === 'name' ? '按字段名排序' : '按出现次数排序'))
  if (!s.fields.length) {
    lines.push('  （数组中没有对象元素）')
  } else {
    const MAX = 200
    const shown = s.fields.slice(0, MAX)
    let nameW = 6
    for (const f of shown) {
      const w = Math.min(30, dispWidth(f.path))
      if (w > nameW) nameW = w
    }
    lines.push(
      '  ' + padEndW('字段', nameW) + '  ' + padStartW('出现', 6) + '  ' +
      padStartW('覆盖率', 8) + '  ' + padStartW('唯一值', 7) + '  ' +
      padStartW('空值', 5) + '  类型'
    )
    lines.push('  ' + '-'.repeat(nameW + 40))
    for (const f of shown) {
      const name = dispWidth(f.path) > 30 ? f.path.slice(0, 28) + '…' : f.path
      lines.push(
        '  ' + padEndW(name, nameW) + '  ' + padStartW(f.count, 6) + '  ' +
        padStartW(f.coverage.toFixed(1) + '%', 8) + '  ' +
        padStartW(f.uniqueText, 7) + '  ' + padStartW(f.empty, 5) + '  ' +
        f.typesText
      )
    }
    if (s.fields.length > MAX) {
      lines.push(`  … 还有 ${s.fields.length - MAX} 个字段未显示`)
    }
  }

  return lines.join('\n')
})

/* ================= 操作 ================= */

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 1800)
}

async function copyTextToClipboard(text, msg) {
  if (!text) return
  const ok = await copyText(text)
  flash(ok ? msg : '复制失败，请手动选择复制')
}

function copyInput() {
  copyTextToClipboard(input.value, '已复制输入 JSON')
}

function copyReport() {
  copyTextToClipboard(report.value, '已复制统计报告')
}

function loadSample() {
  input.value = SAMPLE
  flatten.value = true
  delimiter.value = '.'
  sortMode.value = 'count'
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

.shape-line.faint {
  color: var(--muted);
  opacity: 0.6;
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

.sort-group {
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

/* 概览统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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

/* 通用面板 */
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

.panel-empty {
  padding: 18px 12px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

/* 类型分布 */
.type-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-row {
  display: grid;
  grid-template-columns: 130px 1fr 56px 60px;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
}

.type-name {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-track {
  height: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  overflow: hidden;
}

.type-fill {
  height: 100%;
  background: var(--green);
}

.type-count {
  text-align: right;
  color: var(--text);
}

.type-pct {
  text-align: right;
  color: var(--green);
}

/* 字段表格 */
.table-scroll {
  max-height: 420px;
  overflow: auto;
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
}

.field-table th,
.field-table td {
  border-bottom: 1px solid var(--line);
  padding: 6px 10px;
  text-align: left;
  color: var(--text);
  white-space: nowrap;
}

.field-table th {
  position: sticky;
  top: 0;
  background: var(--panel);
  color: var(--green);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  z-index: 1;
}

.field-table .num {
  text-align: right;
  color: var(--muted);
}

.field-table td.num.full {
  color: var(--green);
}

.field-table td.num.muted {
  color: var(--red);
}

.field-table .field-name {
  color: var(--text);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-table .type-cell {
  color: var(--muted);
}

.field-table tbody tr:hover td {
  background: var(--green-soft);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .type-row {
    grid-template-columns: 96px 1fr 48px 56px;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .sort-group {
    margin-left: 0;
  }

  .panel-head {
    font-size: 11px;
  }

  .type-row {
    grid-template-columns: 84px 1fr 40px 52px;
    font-size: 11px;
  }

  .field-table {
    font-size: 11px;
  }

  .field-table th,
  .field-table td {
    padding: 5px 7px;
  }
}
</style>
