<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔀 文本差异对比器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入双栏：原文 / 新文 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">原文：</label>
            <div class="copy-wrap">
              <textarea
                v-model="oldText"
                rows="10"
                class="code-input"
                spellcheck="false"
                placeholder="粘贴原始文本..."
              ></textarea>
              <button class="copy-btn" title="复制原文" @click="copyOld">📋</button>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">新文：</label>
            <div class="copy-wrap">
              <textarea
                v-model="newText"
                rows="10"
                class="code-input"
                spellcheck="false"
                placeholder="粘贴修改后的文本..."
              ></textarea>
              <button class="copy-btn" title="复制新文" @click="copyNew">📋</button>
            </div>
          </div>
        </div>

        <!-- 视图与选项（双栏外） -->
        <div class="options-row">
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="view" value="side" />
              <span>📑 并排视图</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="view" value="inline" />
              <span>📄 内联视图</span>
            </label>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="ignoreWhitespace" />
              <span>忽略空白</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="ignoreCase" />
              <span>忽略大小写</span>
            </label>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button" @click="swap">🔄 交换</button>
          <button class="tool-button primary" :disabled="!hasDiff" @click="copyDiff">📋 复制差异</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 空输入提示 -->
        <div v-if="!hasInput" class="diff-hint">
          请在左右两栏输入文本（支持多行），输入后自动逐行对比差异
        </div>

        <!-- 完全一致 -->
        <div v-if="hasInput && identical" class="status-success">
          ✅ 两段文本完全一致（{{ stats.unchanged }} 行无变化）
        </div>

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
        <div v-if="hasDiff" class="diff-output">
          <div class="diff-head">
            <span>{{ view === 'side' ? '▼ 并排视图' : '▼ 内联视图' }}</span>
            <span class="diff-legend">+ 新增 / - 删除 / ~ 修改</span>
          </div>

          <!-- 并排视图 -->
          <div v-if="view === 'side'" class="side-table">
            <div
              v-for="(row, i) in sideRows"
              :key="i"
              class="sd-row"
              :class="'k-' + row.kind"
            >
              <span class="sd-no old">{{ row.leftNo || '' }}</span>
              <span class="sd-cell old" :title="row.left">{{ row.left ?? '' }}</span>
              <span class="sd-no new">{{ row.rightNo || '' }}</span>
              <span class="sd-cell new" :title="row.right">{{ row.right ?? '' }}</span>
            </div>
          </div>

          <!-- 内联视图 -->
          <div v-else class="inline-body">
            <div
              v-for="(row, i) in inlineRows"
              :key="i"
              class="il-line"
              :class="'k-' + row.type"
            >
              <span class="il-marker">{{ row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' ' }}</span>
              <span class="il-content">{{ row.line }}</span>
            </div>
          </div>

          <button class="copy-btn diff-copy" title="复制差异" @click="copyDiff">📋</button>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { diffArrays } from 'diff'
import { copyText } from '../../utils/clipboard'

const oldText = ref('')
const newText = ref('')
const view = ref('side')
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)
const error = ref('')
const success = ref('')

/* ================= 文本切分 ================= */

function splitLines(text) {
  if (!text) return []
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

/* ================= Diff 计算 ================= */

/** 自定义比较器：忽略空白 / 忽略大小写 */
function comparator(a, b) {
  let x = a
  let y = b
  if (ignoreWhitespace.value) {
    x = x.replace(/\s+/g, ' ').trim()
    y = y.replace(/\s+/g, ' ').trim()
  }
  if (ignoreCase.value) {
    x = x.toLowerCase()
    y = y.toLowerCase()
  }
  return x === y
}

/** 展开为行级事件序列 */
const events = computed(() => {
  const parts = diffArrays(
    splitLines(oldText.value),
    splitLines(newText.value),
    { comparator }
  )
  const list = []
  for (const part of parts) {
    const type = part.added ? 'add' : part.removed ? 'del' : 'eq'
    for (const line of part.value) list.push({ type, line })
  }
  return list
})

/** 并排视图行：del/add 相邻块配对为修改行 */
const sideRows = computed(() => {
  const list = events.value
  const rows = []
  let i = 0
  const n = list.length
  while (i < n) {
    const e = list[i]
    if (e.type === 'eq') {
      rows.push({ kind: 'eq', left: e.line, right: e.line })
      i++
    } else if (e.type === 'del') {
      const dels = []
      while (i < n && list[i].type === 'del') { dels.push(list[i].line); i++ }
      const adds = []
      while (i < n && list[i].type === 'add') { adds.push(list[i].line); i++ }
      const m = Math.max(dels.length, adds.length)
      for (let k = 0; k < m; k++) {
        const hasD = k < dels.length
        const hasA = k < adds.length
        const kind = hasD && hasA ? 'mod' : hasD ? 'del' : 'add'
        rows.push({ kind, left: hasD ? dels[k] : null, right: hasA ? adds[k] : null })
      }
    } else {
      rows.push({ kind: 'add', left: null, right: e.line })
      i++
    }
  }
  // 左右行号
  let ln = 0
  let rn = 0
  for (const r of rows) {
    if (r.left !== null) r.leftNo = ++ln
    if (r.right !== null) r.rightNo = ++rn
  }
  return rows
})

/** 内联视图行 */
const inlineRows = computed(() => events.value)

/* ================= 统计 ================= */

const stats = computed(() => {
  if (!hasInput.value) return null
  const rows = sideRows.value
  let added = 0
  let removed = 0
  let modified = 0
  let unchanged = 0
  for (const r of rows) {
    if (r.kind === 'eq') unchanged++
    else if (r.kind === 'mod') modified++
    else if (r.kind === 'add') added++
    else removed++
  }
  return { added, removed, modified, unchanged }
})

/* ================= 状态 ================= */

const hasInput = computed(() => oldText.value.trim() !== '' || newText.value.trim() !== '')
const hasDiff = computed(() => events.value.length > 0)
const identical = computed(() =>
  hasInput.value && stats.value &&
  stats.value.added === 0 && stats.value.removed === 0 && stats.value.modified === 0
)

/* ================= 复制 / 操作 ================= */

const diffText = computed(() =>
  events.value.map(e => (e.type === 'add' ? '+' : e.type === 'del' ? '-' : ' ') + ' ' + e.line).join('\n')
)

function flash(type, msg) {
  if (type === 'success') {
    success.value = msg
    setTimeout(() => { if (success.value === msg) success.value = '' }, 2000)
  } else {
    error.value = msg
    setTimeout(() => { if (error.value === msg) error.value = '' }, 2000)
  }
}

async function copyOld() {
  if (!oldText.value) return flash('error', '原文为空，无可复制内容')
  if (await copyText(oldText.value)) flash('success', '原文已复制到剪贴板')
  else flash('error', '复制失败，请手动复制')
}

async function copyNew() {
  if (!newText.value) return flash('error', '新文为空，无可复制内容')
  if (await copyText(newText.value)) flash('success', '新文已复制到剪贴板')
  else flash('error', '复制失败，请手动复制')
}

async function copyDiff() {
  if (!diffText.value) return flash('error', '暂无可复制的差异')
  if (await copyText(diffText.value)) flash('success', '差异已复制到剪贴板')
  else flash('error', '复制失败，请手动复制')
}

function swap() {
  const t = oldText.value
  oldText.value = newText.value
  newText.value = t
}

function clear() {
  oldText.value = ''
  newText.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 输入框复制按钮锚点（.copy-btn 全局为绝对定位） */
.copy-wrap {
  position: relative;
}

/* 视图与选项行 */
.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 1rem;
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

/* 差异输出容器 */
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

.diff-legend {
  color: var(--muted);
  text-transform: none;
}

.diff-copy {
  top: 44px;
}

/* ===== 并排视图 ===== */
.side-table {
  max-height: 460px;
  overflow: auto;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
}

.sd-row {
  display: grid;
  grid-template-columns: 42px 1fr 42px 1fr;
}

.sd-row:hover {
  background: var(--panel);
}

.sd-no {
  padding: 1px 6px;
  text-align: right;
  color: var(--muted);
  user-select: none;
  border-right: 1px solid var(--line);
  background: var(--panel);
  white-space: nowrap;
  overflow: hidden;
}

.sd-no.old { border-left: 2px solid transparent; }
.sd-no.new { border-left: 1px solid var(--line); }

.sd-cell {
  padding: 1px 10px;
  white-space: pre-wrap;
  word-break: break-all;
  border-left: 2px solid transparent;
}

/* 未变化行 */
.sd-row.k-eq .sd-cell {
  color: var(--text-dim);
}

/* 删除：仅左侧 */
.sd-row.k-del .sd-cell.old,
.sd-row.k-del .sd-no.old {
  color: var(--red);
  border-left-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
}

/* 新增：仅右侧 */
.sd-row.k-add .sd-cell.new,
.sd-row.k-add .sd-no.new {
  color: var(--green);
  border-left-color: var(--green);
  background: var(--green-soft);
}

/* 修改：左旧右新成对 */
.sd-row.k-mod .sd-cell.old,
.sd-row.k-mod .sd-no.old {
  color: var(--red);
  border-left-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
}

.sd-row.k-mod .sd-cell.new,
.sd-row.k-mod .sd-no.new {
  color: var(--green);
  border-left-color: var(--green);
  background: var(--green-soft);
}

/* ===== 内联视图 ===== */
.inline-body {
  max-height: 460px;
  overflow: auto;
  padding: 6px 0;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.75;
}

.il-line {
  display: flex;
  align-items: baseline;
  padding: 1px 12px;
  border-left: 2px solid transparent;
  white-space: pre-wrap;
  word-break: break-all;
}

.il-line:hover {
  background: var(--panel);
}

.il-marker {
  flex: 0 0 22px;
  text-align: center;
  font-weight: 700;
  user-select: none;
}

.il-line.k-eq {
  color: var(--text-dim);
}

.il-line.k-del {
  color: var(--red);
  border-left-color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
}

.il-line.k-add {
  color: var(--green);
  border-left-color: var(--green);
  background: var(--green-soft);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .sd-row {
    grid-template-columns: 30px 1fr 30px 1fr;
  }

  .sd-cell {
    padding: 1px 6px;
  }

  .sd-no {
    padding: 1px 3px;
  }

  .inline-body,
  .side-table {
    max-height: 360px;
    font-size: 12px;
  }
}
</style>
