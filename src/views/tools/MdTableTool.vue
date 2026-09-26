<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📊 Markdown 表格生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 粘贴解析区域 -->
        <div class="paste-area">
          <label class="tool-label">粘贴 Markdown 表格解析：</label>
          <div class="input-with-copy">
            <textarea
              v-model="pasteInput"
              class="code-input"
              rows="3"
              placeholder="粘贴 Markdown 表格源码，自动解析为可编辑表格..."
              @input="onPasteInput"
            ></textarea>
          </div>
        </div>

        <!-- 双栏：编辑器 + 预览 -->
        <div class="tool-two-col">
          <!-- 左侧：表格编辑器 -->
          <div class="tool-col">
            <label class="tool-label">表格编辑器：</label>
            <div class="table-editor-wrapper">
              <div class="table-controls">
                <div class="col-aligns">
                  <span class="align-label">列对齐：</span>
                  <select
                    v-for="(align, ci) in alignments"
                    :key="'align-' + ci"
                    :value="align"
                    @change="setAlignment(ci, ($event.target).value)"
                    class="align-select"
                    :title="'第' + (ci + 1) + '列对齐'"
                  >
                    <option value="left">⬅ 左</option>
                    <option value="center">⬌ 中</option>
                    <option value="right">➡ 右</option>
                  </select>
                </div>
              </div>

              <div class="table-grid-wrapper">
                <table class="edit-table" v-if="headers.length > 0 && rowCount > 0">
                  <thead>
                    <tr>
                      <th class="row-btn-col"></th>
                      <th v-for="(h, ci) in headers" :key="'h-' + ci" class="edit-th">
                        <div class="th-content">
                          <input
                            :value="h"
                            @input="updateHeader(ci, ($event.target).value)"
                            class="cell-input header-input"
                            :placeholder="'列 ' + (ci + 1)"
                          />
                          <button
                            class="col-del-btn"
                            @click="deleteColumn(ci)"
                            title="删除此列"
                            :disabled="headers.length <= 1"
                          >✕</button>
                        </div>
                      </th>
                      <th class="add-col-th">
                        <button class="add-col-btn" @click="addColumn" title="添加列">+</button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in cells" :key="'r-' + ri">
                      <td class="row-btn-col">
                        <div class="row-btns">
                          <button
                            class="row-move-btn"
                            @click="moveRow(ri, -1)"
                            :disabled="ri === 0"
                            title="上移"
                          >▲</button>
                          <button
                            class="row-move-btn"
                            @click="moveRow(ri, 1)"
                            :disabled="ri === rowCount - 1"
                            title="下移"
                          >▼</button>
                          <button
                            class="row-del-btn"
                            @click="deleteRow(ri)"
                            title="删除此行"
                            :disabled="rowCount <= 2"
                          >✕</button>
                        </div>
                      </td>
                      <td v-for="(cell, ci) in row" :key="'c-' + ri + '-' + ci" class="edit-td">
                        <input
                          :value="cell"
                          @input="updateCell(ri, ci, ($event.target).value)"
                          class="cell-input"
                          :placeholder="'单元格'"
                        />
                      </td>
                      <td class="add-col-td"></td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="empty-table-hint">
                  <p>点击下方按钮添加行列开始编辑</p>
                </div>
              </div>

              <div class="table-actions">
                <button class="row-add-btn" @click="addRow" title="添加行">＋ 添加行</button>
                <button class="row-add-btn" @click="addColumn" title="添加列">＋ 添加列</button>
              </div>
            </div>
          </div>

          <!-- 右侧：预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="section-header">
              <span class="section-title">▼ 渲染效果</span>
            </div>
            <div
              class="table-preview markdown-preview"
              v-html="previewHtml"
            ></div>

            <div class="section-header" style="margin-top: 12px;">
              <span class="section-title">▼ Markdown 源码</span>
              <button class="copy-btn-inline" @click="copyMarkdown" title="复制 Markdown">📋</button>
            </div>
            <pre class="code-output">{{ markdownSource || '(空表格)' }}</pre>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button" @click="copyMarkdown">📋 复制 Markdown</button>
          <button class="tool-button" @click="copyHtml">📋 复制 HTML</button>
          <button class="tool-button danger" @click="resetTable">🗑️ 重置表格</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyText } from '../../utils/clipboard'

// --- Reactive state ---
const headers = ref(['列 1', '列 2', '列 3'])
const alignments = ref(['left', 'left', 'left'])
const cells = ref([
  ['', ''],
  ['', ''],
  ['', '']
])
const rowCount = ref(3)

const pasteInput = ref('')
const error = ref('')
const success = ref(false)

// --- Computed: generate markdown ---
const markdownSource = computed(() => {
  if (headers.value.length === 0 || rowCount.value === 0) return ''
  const lines = []

  // Header row
  const headerLine = '| ' + headers.value.map(h => h || ' ').join(' | ') + ' |'
  lines.push(headerLine)

  // Separator row with alignment
  const sepLine = '| ' + alignments.value.map(a => {
    if (a === 'center') return ':---:'
    if (a === 'right') return '---:'
    return ':---'
  }).join(' | ') + ' |'
  lines.push(sepLine)

  // Data rows
  for (const row of cells.value) {
    const dataLine = '| ' + row.map(c => c || ' ').join(' | ') + ' |'
    lines.push(dataLine)
  }

  return lines.join('\n')
})

// --- Computed: render markdown to HTML ---
const renderedHtml = computed(() => {
  try {
    const md = markdownSource.value
    if (!md.trim()) return '<p class="preview-placeholder">表格预览将显示在这里...</p>'
    const html = marked.parse(md)
    return html
  } catch (e) {
    return '<p class="preview-error">渲染错误</p>'
  }
})

// 消毒后的预览 HTML（v-html 只用这个，复制导出保留原始 HTML）
const previewHtml = computed(() => DOMPurify.sanitize(renderedHtml.value))

// --- Watch for paste input ---
let pasteTimer = null
function onPasteInput() {
  clearTimeout(pasteTimer)
  pasteTimer = setTimeout(() => {
    parseMarkdownTable(pasteInput.value)
  }, 300)
}

// --- Parse markdown table ---
function parseMarkdownTable(text) {
  if (!text.trim()) return
  const lines = text.trim().split('\n').filter(l => l.trim())

  // Find lines that look like table rows (start and end with |)
  const tableLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'))

  if (tableLines.length < 2) return // Need at least header + separator

  // Parse header
  const headerCells = parseTableRow(tableLines[0])
  if (headerCells.length === 0) return

  // Parse separator for alignment
  const sepCells = parseTableRow(tableLines[1])
  const newAlignments = sepCells.map(cell => {
    const trimmed = cell.trim()
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
    if (trimmed.endsWith(':')) return 'right'
    return 'left'
  })

  // Ensure alignments array matches header length
  while (newAlignments.length < headerCells.length) {
    newAlignments.push('left')
  }

  // Parse data rows (skip header and separator)
  const dataRows = tableLines.slice(2).map(parseTableRow)

  // Apply parsed data
  headers.value = headerCells
  alignments.value = newAlignments.slice(0, headerCells.length)
  cells.value = dataRows.length > 0 ? dataRows : [new Array(headerCells.length).fill('')]
  rowCount.value = cells.value.length

  // Ensure all rows have correct column count
  normalizeCells()

  pasteInput.value = ''
  success.value = '表格已解析'
  setTimeout(() => { success.value = false }, 2000)
}

function parseTableRow(line) {
  const trimmed = line.trim()
  // Remove leading and trailing |
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map(c => c.trim())
}

// --- Normalize cells to match column count ---
function normalizeCells() {
  const colCount = headers.value.length
  cells.value = cells.value.map(row => {
    const newRow = [...row]
    while (newRow.length < colCount) newRow.push('')
    return newRow.slice(0, colCount)
  })
}

// --- Cell updates ---
function updateHeader(ci, value) {
  headers.value[ci] = value
}
function updateCell(ri, ci, value) {
  cells.value[ri][ci] = value
}
function setAlignment(ci, value) {
  alignments.value[ci] = value
}

// --- Row operations ---
function addRow() {
  const newRow = new Array(headers.value.length).fill('')
  cells.value.push(newRow)
  rowCount.value++
}

function deleteRow(ri) {
  if (rowCount.value <= 2) return
  cells.value.splice(ri, 1)
  rowCount.value--
}

function moveRow(ri, direction) {
  const newIndex = ri + direction
  if (newIndex < 0 || newIndex >= rowCount.value) return
  const temp = cells.value[ri]
  cells.value[ri] = cells.value[newIndex]
  cells.value[newIndex] = temp
}

// --- Column operations ---
function addColumn() {
  headers.value.push('列 ' + (headers.value.length + 1))
  alignments.value.push('left')
  for (const row of cells.value) {
    row.push('')
  }
}

function deleteColumn(ci) {
  if (headers.value.length <= 1) return
  headers.value.splice(ci, 1)
  alignments.value.splice(ci, 1)
  for (const row of cells.value) {
    row.splice(ci, 1)
  }
}

// --- Reset ---
function resetTable() {
  headers.value = ['列 1', '列 2', '列 3']
  alignments.value = ['left', 'left', 'left']
  cells.value = [['', ''], ['', ''], ['', '']]
  rowCount.value = 3
  pasteInput.value = ''
  error.value = ''
  success.value = false
}

// --- Copy ---
async function copyMarkdown() {
  if (await copyText(markdownSource.value)) {
    success.value = 'Markdown 已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyHtml() {
  try {
    const container = document.createElement('div')
    container.innerHTML = renderedHtml.value
    const html = container.innerHTML
    if (await copyText(html)) {
      success.value = 'HTML 已复制到剪贴板'
      setTimeout(() => { success.value = false }, 2000)
    } else {
      error.value = '复制失败，请手动复制'
      setTimeout(() => { error.value = '' }, 2000)
    }
  } catch (e) {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}
</script>

<style scoped>
/* --- Paste area --- */
.paste-area {
  margin-bottom: 16px;
}

.paste-area .code-input {
  height: auto;
  min-height: 60px;
}

/* --- Table editor --- */
.table-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.table-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.col-aligns {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.align-label {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--font-mono, monospace);
}

.align-select {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 0;
  cursor: pointer;
}

.align-select:focus {
  outline: none;
  border-color: var(--green);
}

/* --- Edit table grid --- */
.table-grid-wrapper {
  overflow-x: auto;
  flex: 1;
}

.edit-table {
  border-collapse: collapse;
  width: 100%;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
}

.edit-th {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 2px;
  min-width: 80px;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 2px;
}

.edit-td {
  border: 1px solid var(--line);
  padding: 1px;
}

.cell-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  padding: 4px 6px;
  box-sizing: border-box;
  outline: none;
  border-radius: 0;
}

.cell-input:focus {
  background: var(--panel);
  box-shadow: inset 0 0 0 1px var(--green);
}

.header-input {
  flex: 1;
  font-weight: bold;
  color: var(--green);
}

.row-btn-col {
  border: none;
  padding: 1px 2px;
  width: 48px;
  vertical-align: middle;
}

.row-btns {
  display: flex;
  gap: 1px;
  align-items: center;
}

.row-move-btn,
.row-del-btn,
.col-del-btn {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  font-size: 10px;
  padding: 1px 3px;
  border-radius: 0;
  line-height: 1;
}

.row-move-btn:hover:not(:disabled),
.row-del-btn:hover:not(:disabled),
.col-del-btn:hover:not(:disabled) {
  color: var(--green);
  border-color: var(--green);
}

.row-move-btn:disabled,
.row-del-btn:disabled,
.col-del-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.col-del-btn {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 4px;
}

.add-col-th {
  border: none;
  padding: 2px;
  width: 28px;
}

.add-col-btn {
  background: var(--panel);
  border: 1px dashed var(--line);
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}

.add-col-btn:hover {
  color: var(--green);
  border-color: var(--green);
}

.add-col-td {
  border: none;
  padding: 2px;
}

/* --- Table actions --- */
.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.row-add-btn {
  background: var(--panel);
  border: 1px dashed var(--line);
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 12px;
  font-family: var(--font-mono, monospace);
  border-radius: 0;
}

.row-add-btn:hover {
  color: var(--green);
  border-color: var(--green);
}

/* --- Empty state --- */
.empty-table-hint {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  border: 1px dashed var(--line);
}

/* --- Preview --- */
.table-preview {
  min-height: 60px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  overflow-x: auto;
}

.table-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
}

.table-preview :deep(th),
.table-preview :deep(td) {
  border: 1px solid var(--line);
  padding: 6px 10px;
  text-align: left;
}

.table-preview :deep(th) {
  background: var(--panel-2);
  color: var(--green);
  font-weight: bold;
}

.table-preview :deep(td) {
  color: var(--text);
}

.preview-placeholder {
  color: var(--muted);
  text-align: center;
  padding: 16px;
  margin: 0;
}

.preview-error {
  color: var(--red);
  text-align: center;
  padding: 16px;
  margin: 0;
}

.markdown-preview {
  color: var(--text);
  line-height: 1.6;
}

/* --- Responsive --- */
@media (max-width: 640px) {
  .edit-th {
    min-width: 60px;
  }

  .cell-input {
    font-size: 11px;
    padding: 3px 4px;
  }

  .row-btn-col {
    width: 40px;
  }
}
</style>
