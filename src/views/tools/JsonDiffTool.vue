<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔀 JSON 对比器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">原 JSON：</label>
            <div class="copy-wrap">
              <textarea
                v-model="oldText"
                rows="12"
                class="code-input"
                spellcheck="false"
                placeholder='{"name": "Alice", "age": 30}'
              ></textarea>
              <button class="copy-btn" title="复制原 JSON" @click="copyInput('old')">📋</button>
            </div>
            <div v-if="oldError" class="input-error">⚠️ {{ oldError }}</div>
          </div>
          <div class="tool-col">
            <label class="tool-label">新 JSON：</label>
            <div class="copy-wrap">
              <textarea
                v-model="newText"
                rows="12"
                class="code-input"
                spellcheck="false"
                placeholder='{"name": "Alice", "age": 31}'
              ></textarea>
              <button class="copy-btn" title="复制新 JSON" @click="copyInput('new')">📋</button>
            </div>
            <div v-if="newError" class="input-error">⚠️ {{ newError }}</div>
          </div>
        </div>

        <!-- 视图切换 -->
        <div class="view-row">
          <label class="tool-label view-label">视图：</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="view" value="tree" />
              <span>🌲 树形视图</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="view" value="flat" />
              <span>📋 平铺视图</span>
            </label>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button" @click="swap">🔄 交换</button>
          <button class="tool-button primary" :disabled="!diffText" @click="copyDiff">📋 复制差异</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <!-- 空输入提示 -->
        <div v-if="!diff && !oldError && !newError" class="diff-hint">
          请在两栏输入合法的 JSON（支持对象 / 数组 / 嵌套结构），输入合法后自动对比差异
        </div>

        <!-- 完全一致提示 -->
        <div v-if="identical" class="status-success">✅ 两个 JSON 完全一致（{{ stats.unchanged }} 处无变化）</div>

        <!-- 统计 -->
        <div v-if="stats" class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">新增</span>
            <span class="stat-value add">+{{ stats.added }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">删除</span>
            <span class="stat-value del">-{{ stats.removed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">修改</span>
            <span class="stat-value mod">~{{ stats.modified }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">无变化</span>
            <span class="stat-value">{{ stats.unchanged }}</span>
          </div>
        </div>

        <!-- 差异结果 -->
        <div v-if="diff && !identical" class="diff-output">
          <div class="diff-head">
            <span>▼ 对比结果（{{ view === 'tree' ? '树形视图' : '平铺视图' }}）</span>
            <span>+ 新增 / - 删除 / ~ 修改</span>
          </div>
          <div class="diff-body">
            <!-- 树形视图 -->
            <template v-if="view === 'tree'">
              <div
                v-for="(row, i) in treeRows"
                :key="i"
                class="d-row"
                :class="'s-' + row.status"
                :style="{ '--indent': row.depth }"
              >
                <span class="d-marker">{{ marker(row.status) }}</span>
                <span v-if="row.depth > 0" class="d-key">{{ row.key }}{{ row.key.startsWith('[') ? '' : ':' }}</span>
                <template v-if="row.status === 'modified' && isLeaf(row)">
                  <span class="v-old">{{ fmtVal(row.oldVal, 60) }}</span>
                  <span class="v-arrow">→</span>
                  <span class="v-new">{{ fmtVal(row.newVal, 60) }}</span>
                </template>
                <template v-else>
                  <span>{{ rowDisplay(row) }}</span>
                </template>
                <span v-if="changedUnder(row) > 0" class="d-count">({{ changedUnder(row) }} 处变化)</span>
              </div>
            </template>
            <!-- 平铺视图 -->
            <template v-else>
              <div
                v-for="(row, i) in flatRows"
                :key="i"
                class="d-row flat"
                :class="'s-' + row.status"
              >
                <span class="d-marker">{{ marker(row.status) }}</span>
                <span class="d-path">{{ row.path || '$' }}</span>
                <span class="d-eq">=</span>
                <template v-if="row.status === 'modified' && isLeaf(row)">
                  <span class="v-old">{{ fmtVal(row.oldVal, 80) }}</span>
                  <span class="v-arrow">→</span>
                  <span class="v-new">{{ fmtVal(row.newVal, 80) }}</span>
                </template>
                <template v-else>
                  <span>{{ flatDisplay(row) }}</span>
                </template>
              </div>
            </template>
          </div>
          <button class="copy-btn" title="复制差异" @click="copyDiff">📋</button>
        </div>

        <!-- 操作反馈 -->
        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const oldText = ref('{\n  "name": "Alice",\n  "age": 30,\n  "city": "Beijing",\n  "hobbies": ["read", "code", "music"]\n}')
const newText = ref('{\n  "name": "Alice",\n  "age": 31,\n  "email": "alice@example.com",\n  "hobbies": ["read", "game", "music", "travel"]\n}')
const view = ref('tree')
const success = ref('')
const error = ref('')

/* ================= 解析与错误提示 ================= */

function friendlyParseError(e, text) {
  const m = /position (\d+)/.exec(e.message)
  if (m) {
    const pos = Number(m[1])
    const before = text.slice(0, pos)
    const line = before.split('\n').length
    const col = pos - before.lastIndexOf('\n')
    const msg = e.message.replace(/\s+in JSON at position \d+/, '')
    return `第 ${line} 行 第 ${col} 列：${msg}`
  }
  return e.message
}

function parseError(text) {
  if (!text.trim()) return ''
  try {
    JSON.parse(text)
    return ''
  } catch (e) {
    return friendlyParseError(e, text)
  }
}

const oldError = computed(() => parseError(oldText.value))
const newError = computed(() => parseError(newText.value))

/* ================= 结构差异算法 ================= */

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function makeNode({ status, oldVal, newVal, children = [], key = '', path }) {
  return { status, oldVal, newVal, children, key, path }
}

function isLeaf(node) {
  return !node.children || node.children.length === 0
}

/**
 * 递归构建差异节点
 * force: null（正常对比）| 'added'（整块新增）| 'removed'（整块删除）
 */
function buildNode(oldVal, newVal, path, force = null) {
  const ot = typeOf(oldVal)
  const nt = typeOf(newVal)

  if (force === 'added') {
    const node = makeNode({ status: 'added', oldVal: undefined, newVal, path })
    if (nt === 'object' || nt === 'array') node.children = buildChildren(undefined, newVal, path, 'added')
    return node
  }
  if (force === 'removed') {
    const node = makeNode({ status: 'removed', oldVal, newVal: undefined, path })
    if (ot === 'object' || ot === 'array') node.children = buildChildren(oldVal, undefined, path, 'removed')
    return node
  }
  // 类型不同 → 修改
  if (ot !== nt) return makeNode({ status: 'modified', oldVal, newVal, path })
  // 容器 → 递归子节点
  if (ot === 'object' || ot === 'array') {
    const children = buildChildren(oldVal, newVal, path, null)
    const hasChange = children.some(c => c.status !== 'unchanged')
    return makeNode({ status: hasChange ? 'modified' : 'unchanged', oldVal, newVal, children, path })
  }
  // 原始值
  const same = Object.is(oldVal, newVal)
  return makeNode({ status: same ? 'unchanged' : 'modified', oldVal, newVal, path })
}

function buildChildren(oldVal, newVal, path, force) {
  const isArr = Array.isArray(oldVal) || Array.isArray(newVal)
  const children = []

  if (isArr) {
    const o = Array.isArray(oldVal) ? oldVal : []
    const n = Array.isArray(newVal) ? newVal : []
    const maxLen = Math.max(o.length, n.length)
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`
      let child
      if (force === 'added') child = buildNode(undefined, n[i], childPath, 'added')
      else if (force === 'removed') child = buildNode(o[i], undefined, childPath, 'removed')
      else if (i >= o.length) child = buildNode(undefined, n[i], childPath, 'added')
      else if (i >= n.length) child = buildNode(o[i], undefined, childPath, 'removed')
      else child = buildNode(o[i], n[i], childPath, null)
      child.key = `[${i}]`
      children.push(child)
    }
    return children
  }

  const o = oldVal && typeof oldVal === 'object' ? oldVal : {}
  const n = newVal && typeof newVal === 'object' ? newVal : {}
  const keys = new Set([...Object.keys(o), ...Object.keys(n)])
  for (const k of keys) {
    const childPath = k === '' ? `${path || '$'}['']` : (path ? `${path}.${k}` : k)
    let child
    if (force === 'added') child = buildNode(undefined, n[k], childPath, 'added')
    else if (force === 'removed') child = buildNode(o[k], undefined, childPath, 'removed')
    else if (!(k in o)) child = buildNode(undefined, n[k], childPath, 'added')
    else if (!(k in n)) child = buildNode(o[k], undefined, childPath, 'removed')
    else child = buildNode(o[k], n[k], childPath, null)
    child.key = k
    children.push(child)
  }
  return children
}

const diff = computed(() => {
  if (oldError.value || newError.value) return null
  if (!oldText.value.trim() || !newText.value.trim()) return null
  let oldVal, newVal
  try {
    oldVal = JSON.parse(oldText.value)
    newVal = JSON.parse(newText.value)
  } catch {
    return null
  }
  return buildNode(oldVal, newVal, '')
})

/* ================= 统计 ================= */

const stats = computed(() => {
  if (!diff.value) return null
  const counts = { added: 0, removed: 0, modified: 0, unchanged: 0 }
  ;(function walk(node) {
    if (isLeaf(node)) {
      counts[node.status]++
    } else if (node.children) {
      node.children.forEach(walk)
    }
  })(diff.value)
  return counts
})

const identical = computed(() =>
  !!diff.value && stats.value && stats.value.added === 0 && stats.value.removed === 0 && stats.value.modified === 0
)

/* ================= 树形视图 ================= */

const treeRows = computed(() => {
  if (!diff.value) return []
  const rows = []
  ;(function walk(node, depth) {
    rows.push({ ...node, depth })
    if (node.children) node.children.forEach(c => walk(c, depth + 1))
  })(diff.value, 0)
  return rows
})

/* ================= 平铺视图（仅变化叶子 / 整块增删的容器） ================= */

const flatRows = computed(() => {
  if (!diff.value) return []
  const rows = []
  ;(function walk(node) {
    if (node.status === 'added' || node.status === 'removed') {
      rows.push(node)
      return
    }
    if (node.status === 'modified' && isLeaf(node)) {
      rows.push(node)
      return
    }
    if (node.children) node.children.forEach(walk)
  })(diff.value)
  return rows
})

/* ================= 展示辅助 ================= */

function marker(status) {
  return { added: '+', removed: '-', modified: '~', unchanged: ' ' }[status] || ' '
}

/** 格式化值（字符串加引号、长值截断） */
function fmtVal(v, max = 60) {
  if (v === undefined) return ''
  if (v === null) return 'null'
  const t = typeof v
  if (t === 'string') {
    const s = v.length > max ? v.slice(0, max) + '…' : v
    return JSON.stringify(s)
  }
  if (t === 'object') {
    const s = JSON.stringify(v)
    return s.length > max ? s.slice(0, max) + '…' : s
  }
  return String(v)
}

/** 树形行：容器显示 {…} / […] */
function rowDisplay(row) {
  if (!isLeaf(row)) {
    return Array.isArray(row.newVal ?? row.oldVal) ? '[…]' : '{…}'
  }
  const v = row.status === 'removed' ? row.oldVal : row.newVal
  return fmtVal(v, 60)
}

/** 平铺行：整块增删的容器显示紧凑 JSON */
function flatDisplay(row) {
  const v = row.status === 'removed' ? row.oldVal : row.newVal
  return fmtVal(v, 80)
}

/** 子树中变化叶子数量 */
function changedUnder(node) {
  let n = 0
  ;(function walk(x) {
    if (isLeaf(x) && x.status !== 'unchanged') n++
    if (x.children) x.children.forEach(walk)
  })(node)
  return n
}

/* ================= 复制 / 操作 ================= */

const diffText = computed(() => {
  if (!diff.value) return ''
  return flatRows.value
    .map(row => {
      const p = row.path || '$'
      if (row.status === 'added') return `+ ${p} = ${fmtVal(row.newVal, 10000)}`
      if (row.status === 'removed') return `- ${p} = ${fmtVal(row.oldVal, 10000)}`
      return `~ ${p}: ${fmtVal(row.oldVal, 10000)} → ${fmtVal(row.newVal, 10000)}`
    })
    .join('\n')
})

function flash(type, msg) {
  if (type === 'success') {
    success.value = msg
    setTimeout(() => { if (success.value === msg) success.value = '' }, 2000)
  } else {
    error.value = msg
    setTimeout(() => { if (error.value === msg) error.value = '' }, 2000)
  }
}

async function copyInput(side) {
  const text = side === 'old' ? oldText.value : newText.value
  if (!text.trim()) {
    flash('error', '输入为空，无可复制内容')
    return
  }
  if (await copyText(text)) {
    flash('success', side === 'old' ? '原 JSON 已复制到剪贴板' : '新 JSON 已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

async function copyDiff() {
  if (!diffText.value) {
    flash('error', '暂无可复制的差异')
    return
  }
  if (await copyText(diffText.value)) {
    flash('success', '差异已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

function swap() {
  const t = oldText.value
  oldText.value = newText.value
  newText.value = t
}

function clear() {
  oldText.value = ''
  newText.value = ''
  success.value = ''
  error.value = ''
}
</script>

<style scoped>
/* 输入框复制按钮定位（.copy-btn 全局为绝对定位，需相对定位容器锚定） */
.copy-wrap {
  position: relative;
}

.input-error {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--red);
  word-break: break-all;
}

/* 视图切换行 */
.view-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.view-row .tool-label {
  margin: 0;
}

/* 空输入提示 */
.diff-hint {
  margin-top: 1rem;
  padding: 14px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  text-align: center;
}

/* 统计网格 */
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

.stat-value.add { color: var(--green); }
.stat-value.del { color: var(--red); }
.stat-value.mod { color: var(--amber); }

/* 差异输出 */
.diff-output {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  margin-top: 12px;
}

.diff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 46px 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.diff-body {
  max-height: 440px;
  overflow: auto;
  padding: 6px 0;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.75;
}

/* 差异行 */
.d-row {
  padding: 1px 12px;
  padding-left: calc(var(--indent, 0) * 20px + 12px);
  border-left: 2px solid transparent;
  white-space: pre-wrap;
  word-break: break-all;
}

.d-row.flat {
  padding-left: 12px;
}

.d-row:hover {
  background: var(--panel);
}

.s-added {
  color: var(--green);
  border-left-color: var(--green);
}

.s-removed {
  color: var(--red);
  border-left-color: var(--red);
}

.s-modified {
  border-left-color: var(--amber);
}

.s-unchanged {
  color: var(--muted);
}

.d-marker {
  display: inline-block;
  width: 20px;
  text-align: center;
  font-weight: 700;
  user-select: none;
  margin-right: 4px;
}

.d-key,
.d-path {
  font-weight: 600;
}

.d-eq {
  color: var(--muted);
  margin: 0 4px;
}

.d-count {
  color: var(--muted);
  font-size: 12px;
  margin-left: 6px;
}

.v-old {
  color: var(--red);
  text-decoration: line-through;
}

.v-new {
  color: var(--green);
}

.v-arrow {
  color: var(--muted);
  margin: 0 4px;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .diff-body {
    max-height: 360px;
    font-size: 12px;
  }

  .d-row {
    padding-left: calc(var(--indent, 0) * 14px + 10px);
  }

  .diff-head {
    font-size: 11px;
  }
}
</style>
