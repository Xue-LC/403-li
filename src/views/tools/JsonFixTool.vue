<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔧 JSON 修复器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">损坏的 JSON：</label>
            <textarea
              v-model="input"
              placeholder="粘贴有格式错误的 JSON（尾逗号、单引号、注释、未加引号的键名）..."
              rows="12"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              修复结果：
              <button
                class="copy-btn-inline"
                @click="copyOutput"
                :disabled="!output"
                title="复制修复结果"
              >📋</button>
            </label>
            <textarea
              v-model="output"
              readonly
              rows="12"
              class="code-input output"
              placeholder="修复后的 JSON 将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="fix">
            🔧 修复
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output">
            📋 复制结果
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="changes.length > 0 && output" class="fix-summary">
          <div class="fix-summary-header">
            <span>📝 修复详情（共 {{ changes.length }} 处）</span>
          </div>
          <ul class="fix-list">
            <li v-for="(change, i) in changes" :key="i" class="fix-item">
              <span class="fix-type">{{ change.type }}</span>
              <span class="fix-desc">{{ change.desc }}</span>
            </li>
          </ul>
        </div>

        <div v-if="error" class="status-error">
          ❌ {{ error }}
        </div>

        <div v-if="success" class="status-success">
          ✅ 修复成功 — JSON 格式正确！
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const success = ref(false)
const changes = ref([])

function removeLineComments(text) {
  // State machine: track if we're inside a string
  const lines = text.split('\n')
  return lines.map(line => {
    let result = ''
    let inString = false
    let stringChar = ''
    let escaped = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (escaped) {
        result += ch
        escaped = false
        continue
      }
      if (ch === '\\' && inString) {
        result += ch
        escaped = true
        continue
      }
      if ((ch === '"' || ch === "'") && !inString) {
        inString = true
        stringChar = ch
        result += ch
        continue
      }
      if (ch === stringChar && inString) {
        inString = false
        stringChar = ''
        result += ch
        continue
      }
      if (!inString && ch === '/' && line[i + 1] === '/') {
        break // rest of line is a comment
      }
      result += ch
    }
    return result
  }).join('\n')
}

function removeBlockComments(text) {
  let result = ''
  let inString = false
  let stringChar = ''
  let escaped = false
  let inBlockComment = false
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (inBlockComment) {
      if (ch === '*' && text[i + 1] === '/') {
        inBlockComment = false
        i += 2
        continue
      }
      i++
      continue
    }
    if (escaped) {
      result += ch
      escaped = false
      i++
      continue
    }
    if (ch === '\\' && inString) {
      result += ch
      escaped = true
      i++
      continue
    }
    if ((ch === '"' || ch === "'") && !inString) {
      inString = true
      stringChar = ch
      result += ch
      i++
      continue
    }
    if (ch === stringChar && inString) {
      inString = false
      stringChar = ''
      result += ch
      i++
      continue
    }
    if (!inString && ch === '/' && text[i + 1] === '*') {
      inBlockComment = true
      i += 2
      continue
    }
    result += ch
    i++
  }
  return result
}

function fixUnquotedKeys(text) {
  // Match object keys that are not quoted
  // Pattern: after { or , followed by optional whitespace, then an unquoted identifier, then : 
  let fixed = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3')
  return fixed
}

function fixSingleQuotes(text) {
  let result = ''
  let inDoubleString = false
  let inSingleString = false
  let escaped = false
  let singleStrStart = -1
  let i = 0
  
  while (i < text.length) {
    const ch = text[i]
    
    if (escaped) {
      result += ch
      escaped = false
      i++
      continue
    }
    
    if (ch === '\\' && (inDoubleString || inSingleString)) {
      result += ch
      escaped = true
      i++
      continue
    }
    
    if (ch === '"' && !inSingleString) {
      inDoubleString = !inDoubleString
      result += ch
      i++
      continue
    }
    
    if (ch === "'" && !inDoubleString) {
      inSingleString = !inSingleString
      result += '"' // replace with double quote
      i++
      continue
    }
    
    result += ch
    i++
  }
  
  return result
}

function removeTrailingCommas(text) {
  // Remove commas before } or ] (with optional whitespace between)
  return text.replace(/,(\s*[}\]])/g, '$1')
}

function fix() {
  error.value = ''
  success.value = false
  changes.value = []
  output.value = ''

  if (!input.value.trim()) {
    error.value = '请粘贴需要修复的 JSON 文本'
    return
  }

  try {
    let text = input.value
    let changeList = []

    // Step 1: Remove BOM
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1)
      changeList.push({ type: 'BOM', desc: '移除开头 BOM 字符（\\uFEFF）' })
    }

    // Step 2: Remove comments
    const afterLineComments = removeLineComments(text)
    if (afterLineComments !== text) {
      changeList.push({ type: '注释', desc: '移除单行注释（// ...）' })
      text = afterLineComments
    }

    const afterBlockComments = removeBlockComments(text)
    if (afterBlockComments !== text) {
      changeList.push({ type: '注释', desc: '移除块注释（/* ... */）' })
      text = afterBlockComments
    }

    // Step 3: Fix unquoted keys
    const afterFixKeys = fixUnquotedKeys(text)
    if (afterFixKeys !== text) {
      changeList.push({ type: '键名', desc: '为未加引号的键名添加双引号' })
      text = afterFixKeys
    }

    // Step 4: Fix single quotes
    const afterFixQuotes = fixSingleQuotes(text)
    if (afterFixQuotes !== text) {
      changeList.push({ type: '引号', desc: '将单引号替换为双引号' })
      text = afterFixQuotes
    }

    // Step 5: Remove trailing commas
    const afterFixCommas = removeTrailingCommas(text)
    if (afterFixCommas !== text) {
      changeList.push({ type: '逗号', desc: '移除尾随逗号（, 在 } 或 ] 之前）' })
      text = afterFixCommas
    }

    // Validate the fixed JSON
    try {
      const parsed = JSON.parse(text)
      output.value = JSON.stringify(parsed, null, 2)
      changes.value = changeList

      if (changeList.length === 0) {
        success.value = true
        setTimeout(() => { success.value = false }, 3000)
      } else {
        success.value = true
        setTimeout(() => { success.value = false }, 3000)
      }
    } catch (parseErr) {
      // If parsing fails, still show the attempted fix but note it's incomplete
      output.value = text
      changeList.push({ type: '警告', desc: 'JSON 仍有语法错误，无法完全修复：' + parseErr.message })
      changes.value = changeList
      error.value = '修复后 JSON 仍有语法错误，请手动检查。已显示部分修复结果。'
    }
  } catch (e) {
    error.value = '修复过程出错：' + e.message
    output.value = ''
    changes.value = []
  }
}

async function copyOutput() {
  if (output.value) {
    const ok = await copyText(output.value)
    if (ok) {
      success.value = true
      setTimeout(() => { success.value = false }, 2000)
    }
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = false
  changes.value = []
}
</script>

<style scoped>
.fix-summary {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.fix-summary-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  text-transform: uppercase;
}

.fix-list {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
}

.fix-item {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--line);
}

.fix-item:last-child {
  border-bottom: none;
}

.fix-type {
  color: var(--green);
  flex-shrink: 0;
  min-width: 40px;
  text-transform: uppercase;
  font-size: 12px;
}

.fix-desc {
  color: var(--muted);
}

.copy-btn-inline {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: all 0.2s;
  vertical-align: middle;
}

.copy-btn-inline:hover:not(:disabled) {
  color: var(--green);
  transform: scale(1.1);
}

.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
