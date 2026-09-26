<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📊 JSON 表格查看器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入 JSON 数组：</label>
            <textarea
              v-model="input"
              placeholder='粘贴 JSON 数组…&#10;&#10;示例：&#10;[&#10;  {"name": "张三", "age": 28, "city": "北京"},&#10;  {"name": "李四", "age": 35, "city": "上海"},&#10;  {"name": "王五", "age": 22, "city": "广州"}&#10;]'
              rows="12"
              class="code-input"
              @input="onInput"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">表格预览：</label>

            <!-- 表格区域 -->
            <div v-if="tableData.length > 0" class="table-container">
              <!-- 工具栏 -->
              <div class="table-toolbar">
                <input
                  v-model="searchQuery"
                  class="table-search"
                  placeholder="🔍 搜索表格..."
                  @input="applyFilter"
                />
                <span class="table-info">{{ filteredData.length }} / {{ tableData.length }} 行</span>
                <button class="tool-button" @click="exportCSV" :disabled="tableData.length === 0" style="padding: 4px 12px; font-size: 12px;">
                  📥 CSV
                </button>
              </div>

              <!-- 表格 -->
              <div class="table-scroll">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th v-for="col in columns" :key="col" @click="toggleSort(col)" class="sortable-th">
                        <span class="th-content">
                          {{ col }}
                          <span class="sort-icon">{{ getSortIcon(col) }}</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIdx) in filteredData" :key="rowIdx">
                      <td v-for="col in columns" :key="col">{{ formatCell(row[col]) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="table-empty">
              <span>粘贴 JSON 数组后自动展示表格</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="parseJSON" :disabled="!input.trim()">
            📊 查看表格
          </button>
          <button class="tool-button" @click="copyAsJSON" :disabled="!outputJSON">
            📋 复制 JSON
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">
          ❌ 错误：{{ error }}
        </div>
        <div v-if="success" class="status-success">
          ✅ {{ success }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const tableData = ref([])
const columns = ref([])
const searchQuery = ref('')
const sortKey = ref('')
const sortDir = ref('asc')
const error = ref('')
const success = ref('')

// 将原始数据复制一份用于筛选和排序
const rawData = ref([])

const filteredData = computed(() => {
  let data = [...rawData.value]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    data = data.filter(row =>
      columns.value.some(col => {
        const val = row[col]
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      })
    )
  }

  // 排序
  if (sortKey.value) {
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1
    data.sort((a, b) => {
      const va = a[key]
      const vb = b[key]

      // null/undefined 排到最后
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1

      // 数值比较
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir
      }
      // 字符串比较
      return String(va).localeCompare(String(vb), 'zh-CN') * dir
    })
  }

  return data
})

const outputJSON = computed(() => {
  if (tableData.value.length === 0) return ''
  return JSON.stringify(tableData.value, null, 2)
})

function onInput() {
  // 自动尝试解析
  const trimmed = input.value.trim()
  if (!trimmed) {
    resetTable()
    return
  }

  // 如果看起来像 JSON 数组，自动解析
  if (trimmed.startsWith('[')) {
    doParse()
  }
}

function parseJSON() {
  error.value = ''
  success.value = ''
  doParse()
}

function doParse() {
  const trimmed = input.value.trim()
  if (!trimmed) {
    resetTable()
    return
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (!Array.isArray(parsed)) {
      error.value = 'JSON 必须是数组格式（以 [ 开头，以 ] 结尾）'
      resetTable()
      return
    }

    if (parsed.length === 0) {
      error.value = 'JSON 数组为空'
      resetTable()
      return
    }

    // 检查是否全部为对象
    const firstItem = parsed[0]
    if (firstItem === null || typeof firstItem !== 'object' || Array.isArray(firstItem)) {
      error.value = 'JSON 数组必须包含对象元素（如 {"key": "value"}）'
      resetTable()
      return
    }

    // 提取所有列名（合并所有对象的键）
    const allKeys = new Set()
    parsed.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => allKeys.add(k))
      }
    })

    tableData.value = parsed
    columns.value = Array.from(allKeys)
    rawData.value = [...parsed]
    searchQuery.value = ''
    sortKey.value = ''
    sortDir.value = 'asc'
    error.value = ''
    success.value = `成功解析，共 ${parsed.length} 条记录，${columns.value.length} 列`
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = `JSON 解析失败：${e.message}`
    resetTable()
  }
}

function resetTable() {
  tableData.value = []
  columns.value = []
  rawData.value = []
  searchQuery.value = ''
  sortKey.value = ''
  sortDir.value = 'asc'
}

function applyFilter() {
  sortKey.value = ''
  sortDir.value = 'asc'
}

function toggleSort(col) {
  if (sortKey.value === col) {
    // 已按此列排序，切换方向
    if (sortDir.value === 'asc') {
      sortDir.value = 'desc'
    } else {
      sortKey.value = ''
      sortDir.value = 'asc'
    }
  } else {
    sortKey.value = col
    sortDir.value = 'asc'
  }
}

function getSortIcon(col) {
  if (sortKey.value !== col) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function formatCell(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function exportCSV() {
  if (tableData.value.length === 0) return

  const dataToExport = searchQuery.value.trim() ? filteredData.value : tableData.value
  const cols = columns.value

  // 构建 CSV 内容
  const escapeCsv = (val) => {
    const str = val === null || val === undefined ? '' : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const headerRow = cols.map(c => escapeCsv(c)).join(',')
  const dataRows = dataToExport.map(row =>
    cols.map(c => escapeCsv(formatCell(row[c]))).join(',')
  )
  const csv = [headerRow, ...dataRows].join('\n')

  // 下载文件
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'export.csv'
  link.click()
  URL.revokeObjectURL(url)

  success.value = `已导出 ${dataToExport.length} 行数据`
  setTimeout(() => { success.value = '' }, 2000)
}

async function copyAsJSON() {
  if (!outputJSON.value) return
  if (await copyText(outputJSON.value)) {
    success.value = 'JSON 已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

function clearAll() {
  input.value = ''
  resetTable()
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 表格容器 */
.table-container {
  background: var(--card);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 工具栏 */
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  flex-shrink: 0;
}

.table-search {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  border-radius: 0;
}

.table-search:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 1px var(--green-glow);
}

.table-info {
  color: var(--muted);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  white-space: nowrap;
}

/* 表格滚动 */
.table-scroll {
  overflow: auto;
  flex: 1;
}

/* 数据表格 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--text);
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
}

.data-table th {
  background: var(--panel-2);
  color: var(--green);
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid var(--line);
  white-space: nowrap;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.data-table th:hover {
  background: var(--green-soft);
}

.data-table th:not(:last-child) {
  border-right: 1px solid var(--line);
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 10px;
  opacity: 0.6;
}

.data-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table td:not(:last-child) {
  border-right: 1px solid var(--line);
}

.data-table tbody tr {
  transition: background 0.1s;
}

.data-table tbody tr:hover {
  background: var(--panel);
}

.data-table tbody tr:nth-child(even) {
  background: var(--card);
}

.data-table tbody tr:nth-child(even):hover {
  background: var(--panel);
}

/* 空状态 */
.table-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  min-height: 200px;
}

/* 响应式：表格在小屏幕上缩小字号 */
@media (max-width: 640px) {
  .data-table {
    font-size: 10px;
  }

  .data-table th,
  .data-table td {
    padding: 4px 6px;
  }

  .table-toolbar {
    flex-wrap: wrap;
  }

  .table-search {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
