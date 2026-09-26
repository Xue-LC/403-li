<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📋 文本去重排序</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入文本（每行一条）：</label>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              placeholder="粘贴文本，每行一条记录..."
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">处理结果：</label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="点击「执行处理」查看结果..."
            ></textarea>
          </div>
        </div>

        <!-- 选项区 -->
        <div class="options-row">
          <div class="option-group">
            <label class="tool-label">去重方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="dedupMode" value="none" />
                <span>不去重</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="dedupMode" value="first" />
                <span>保留首次</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="dedupMode" value="last" />
                <span>保留末次</span>
              </label>
            </div>
          </div>

          <div class="option-group">
            <label class="tool-label">排序方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="none" />
                <span>保持原序</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="asc" />
                <span>升序 A→Z</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="desc" />
                <span>降序 Z→A</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="random" />
                <span>随机打乱</span>
              </label>
            </div>
          </div>

          <div class="option-group option-checks">
            <label class="checkbox-label">
              <input type="checkbox" v-model="removeEmpty" />
              <span>去除空行</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="trimLines" />
              <span>去除首尾空白</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="caseSensitive" />
              <span>区分大小写去重</span>
            </label>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="process" :disabled="!input.trim()">
            ⚡ 执行处理
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制结果
          </button>
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">
            📋 复制输入
          </button>
        </div>

        <div class="button-group">
          <button class="tool-button danger full-width" @click="clear">🗑️ 清空</button>
        </div>

        <!-- 统计信息 -->
        <div v-if="stats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">原始行数</span>
              <span class="stat-value">{{ stats.originalLines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">有效行数</span>
              <span class="stat-value">{{ stats.validLines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">不重复行</span>
              <span class="stat-value">{{ stats.uniqueCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">去重移除</span>
              <span class="stat-value">{{ stats.duplicatesRemoved }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">空行移除</span>
              <span class="stat-value">{{ stats.emptyRemoved }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">结果行数</span>
              <span class="stat-value">{{ stats.resultLines }}</span>
            </div>
          </div>

          <!-- 重复项统计 -->
          <div v-if="stats.duplicateItems.length > 0" class="dup-section">
            <div class="section-header">
              <span class="section-title">📊 重复项统计（出现 ≥ 2 次）</span>
            </div>
            <div class="dup-list">
              <div v-for="(item, idx) in stats.duplicateItems" :key="idx" class="dup-item">
                <span class="dup-text">{{ item.text || '(空行)' }}</span>
                <span class="dup-count">{{ item.count }} 次</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const dedupMode = ref('first')
const sortMode = ref('none')
const removeEmpty = ref(true)
const trimLines = ref(true)
const caseSensitive = ref(true)
const error = ref('')
const success = ref(false)
const stats = ref(null)

const output = computed(() => {
  if (!input.value.trim()) {
    stats.value = null
    return ''
  }

  const rawLines = input.value.split('\n')
  const originalLines = rawLines.length

  // Step 1: trim if needed
  let lines = trimLines.value ? rawLines.map(l => l.trim()) : [...rawLines]

  // Step 2: count & remove empty lines
  let emptyRemoved = 0
  if (removeEmpty.value) {
    const before = lines.length
    lines = lines.filter(l => l !== '')
    emptyRemoved = before - lines.length
  }

  const validLines = lines.length

  // Step 3: dedup
  let duplicatesRemoved = 0
  const seen = new Map()
  const dupCounts = new Map()

  if (dedupMode.value !== 'none') {
    // Compute duplicate counts for stats
    for (const line of lines) {
      const key = caseSensitive.value ? line : line.toLowerCase()
      dupCounts.set(key, (dupCounts.get(key) || 0) + 1)
    }

    const seenSet = new Set()
    const dedupedLines = []

    if (dedupMode.value === 'first') {
      for (const line of lines) {
        const key = caseSensitive.value ? line : line.toLowerCase()
        if (!seenSet.has(key)) {
          seenSet.add(key)
          dedupedLines.push(line)
        }
      }
    } else if (dedupMode.value === 'last') {
      // Reverse to keep last occurrence
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]
        const key = caseSensitive.value ? line : line.toLowerCase()
        if (!seenSet.has(key)) {
          seenSet.add(key)
          dedupedLines.unshift(line)
        }
      }
    }

    duplicatesRemoved = lines.length - dedupedLines.length
    lines = dedupedLines
  } else {
    // Still compute dup counts for stats even when not deduping
    for (const line of lines) {
      const key = caseSensitive.value ? line : line.toLowerCase()
      dupCounts.set(key, (dupCounts.get(key) || 0) + 1)
    }
  }

  const uniqueCount = lines.length

  // Step 4: sort
  if (sortMode.value === 'asc') {
    lines.sort((a, b) => {
      if (caseSensitive.value) return a.localeCompare(b)
      return a.toLowerCase().localeCompare(b.toLowerCase())
    })
  } else if (sortMode.value === 'desc') {
    lines.sort((a, b) => {
      if (caseSensitive.value) return b.localeCompare(a)
      return b.toLowerCase().localeCompare(a.toLowerCase())
    })
  } else if (sortMode.value === 'random') {
    // Fisher-Yates shuffle
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[lines[i], lines[j]] = [lines[j], lines[i]]
    }
  }

  const resultLines = lines.length

  // Build stats
  const duplicateItems = []
  for (const [key, count] of dupCounts) {
    if (count >= 2) {
      // Find the original text for the key
      const displayText = caseSensitive.value ? key : input.value.split('\n').find(l => {
        const t = trimLines.value ? l.trim() : l
        return (caseSensitive.value ? t : t.toLowerCase()) === key
      }) || key
      duplicateItems.push({ text: displayText, count })
    }
  }
  duplicateItems.sort((a, b) => b.count - a.count)
  // Limit to top 20
  const topDups = duplicateItems.slice(0, 20)

  stats.value = {
    originalLines,
    validLines,
    uniqueCount,
    duplicatesRemoved,
    emptyRemoved,
    resultLines,
    duplicateItems: topDups
  }

  return lines.join('\n')
})

function process() {
  // Processing is reactive via computed, just trigger a "done" state
  if (!input.value.trim()) {
    error.value = '请输入文本内容'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (output.value) {
    success.value = '处理完成'
    setTimeout(() => { success.value = false }, 2000)
  }
}

async function copyOutput() {
  if (await copyText(output.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyInput() {
  if (await copyText(input.value)) {
    success.value = '输入已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  dedupMode.value = 'first'
  sortMode.value = 'none'
  removeEmpty.value = true
  trimLines.value = true
  caseSensitive.value = true
  stats.value = null
  error.value = ''
  success.value = false
}
</script>

<style scoped>
.options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 14px 0 8px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-group > .tool-label {
  margin-bottom: 2px;
}

.option-checks {
  flex-direction: column;
  gap: 8px;
}

.option-checks .checkbox-label {
  margin: 0;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.dup-section {
  margin-top: 14px;
}

.dup-list {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--panel);
  margin-top: 8px;
}

.dup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  font-size: 13px;
  border-bottom: 1px solid var(--line);
}

.dup-item:last-child {
  border-bottom: none;
}

.dup-text {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75%;
  font-family: inherit;
}

.dup-count {
  color: var(--green);
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  margin-left: 8px;
}

@media (max-width: 640px) {
  .options-row {
    flex-direction: column;
    gap: 12px;
  }

  .radio-group {
    gap: 4px 10px;
  }

  .dup-text {
    max-width: 60%;
    font-size: 12px;
  }
}
</style>
