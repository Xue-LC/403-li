<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔄 CSV ↔ JSON 转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入：</label>
            <textarea
              v-model="input"
              :placeholder="inputPlaceholder"
              rows="12"
              class="code-input"
              @input="onInputChange"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              v-model="output"
              readonly
              rows="12"
              class="code-input output"
              placeholder="转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 转换方向 -->
        <div class="radio-group" style="margin-bottom: 12px;">
          <label class="radio-label">
            <input type="radio" v-model="direction" value="csv-to-json" />
            <span>CSV → JSON</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="direction" value="json-to-csv" />
            <span>JSON → CSV</span>
          </label>
        </div>

        <!-- CSV 选项 -->
        <div v-if="direction === 'csv-to-json'" class="options-group" style="margin-bottom: 12px;">
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.firstRowHeader" checked />
            <span>首行作为表头</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.trimValues" checked />
            <span>去除首尾空格</span>
          </label>
        </div>

        <!-- 分隔符 -->
        <div class="radio-group" style="margin-bottom: 12px;">
          <span style="font-family: 'MapleMono NF CN', monospace; font-size: 12px; color: var(--muted); margin-right: 8px;">分隔符：</span>
          <label class="radio-label">
            <input type="radio" v-model="opts.delimiter" value="," />
            <span>, 逗号</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="opts.delimiter" value="\t" />
            <span>↹ 制表符</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="opts.delimiter" value=";" />
            <span>; 分号</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="opts.delimiter" value="|" />
            <span>| 竖线</span>
          </label>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="convert" :disabled="!input.trim()">
            🔄 转换
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制输出
          </button>
          <button class="tool-button danger" @click="clear">
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
import { ref, computed, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const direction = ref('csv-to-json')
const error = ref('')
const success = ref('')

const opts = reactive({
  delimiter: ',',
  firstRowHeader: true,
  trimValues: true
})

const inputPlaceholder = computed(() => {
  if (direction.value === 'csv-to-json') {
    return '粘贴 CSV 内容…\n\n示例：\nname,age,city\n张三,28,北京\n李四,35,上海'
  }
  return '粘贴 JSON 内容…\n\n示例：\n[\n  {"name": "张三", "age": 28, "city": "北京"},\n  {"name": "李四", "age": 35, "city": "上海"}\n]'
})

// 自动检测输入格式
function onInputChange() {
  const trimmed = input.value.trim()
  if (!trimmed) return

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    direction.value = 'json-to-csv'
  } else {
    direction.value = 'csv-to-json'
  }
}

// 解析 CSV 行（支持引号转义）
function parseCSVLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(opts.trimValues ? current.trim() : current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(opts.trimValues ? current.trim() : current)
  return result
}

// 推断值的类型
function inferType(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  if (val === 'null' || val === '') return null
  if (/^-?\d+$/.test(val)) return Number(val)
  if (/^-?\d+\.\d+$/.test(val)) return Number(val)
  return val
}

// CSV → JSON
function csvToJson(text) {
  const delimiter = opts.delimiter === '\\t' ? '\t' : opts.delimiter
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('CSV 内容为空')
  }

  if (opts.firstRowHeader) {
    const headers = parseCSVLine(lines[0], delimiter)
    const dataRows = lines.slice(1)

    if (dataRows.length === 0) {
      throw new Error('CSV 只有表头，没有数据行')
    }

    return dataRows.map(row => {
      const values = parseCSVLine(row, delimiter)
      const obj = {}
      headers.forEach((header, idx) => {
        const val = values[idx] !== undefined ? values[idx] : ''
        obj[header] = inferType(val)
      })
      return obj
    })
  } else {
    return lines.map(row => {
      const values = parseCSVLine(row, delimiter)
      return values.map(v => inferType(v))
    })
  }
}

// JSON → CSV
function jsonToCsv(text) {
  const data = JSON.parse(text)

  if (!Array.isArray(data)) {
    throw new Error('JSON 必须是数组格式（[...]）')
  }

  if (data.length === 0) {
    throw new Error('JSON 数组为空')
  }

  const delimiter = opts.delimiter === '\\t' ? '\t' : opts.delimiter

  // 判断是否为对象数组
  const firstItem = data[0]
  if (typeof firstItem === 'object' && firstItem !== null) {
    // 对象数组：提取所有键作为表头
    const headers = Object.keys(firstItem)
    const escapeCsv = (val) => {
      const str = val === null || val === undefined ? '' : String(val)
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const headerRow = headers.join(delimiter)
    const dataRows = data.map(item =>
      headers.map(h => escapeCsv(item[h])).join(delimiter)
    )
    return [headerRow, ...dataRows].join('\n')
  } else {
    // 简单数组
    const escapeCsv = (val) => {
      const str = val === null || val === undefined ? '' : String(val)
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }
    return data.map(item => escapeCsv(item)).join('\n')
  }
}

function convert() {
  error.value = ''
  success.value = ''

  if (!input.value.trim()) {
    error.value = '请输入内容'
    return
  }

  try {
    if (direction.value === 'csv-to-json') {
      const result = csvToJson(input.value)
      output.value = JSON.stringify(result, null, 2)
      success.value = `CSV 转 JSON 成功，共 ${result.length} 条记录`
    } else {
      const result = jsonToCsv(input.value)
      output.value = result
      const lines = result.split('\n').length
      success.value = `JSON 转 CSV 成功，共 ${lines} 行`
    }
  } catch (e) {
    error.value = e.message || '转换失败，请检查输入格式'
    output.value = ''
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 组件特有样式补充 */
</style>
