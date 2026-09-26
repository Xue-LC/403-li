<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📊 词频分析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左侧：输入 + 参数 -->
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              class="code-input"
              rows="12"
              placeholder="粘贴要分析的文本内容...&#10;&#10;支持中英文混合文本自动分词"
            ></textarea>

            <label class="tool-label">语言模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="mode" value="auto" />
                <span>自动检测</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="en" />
                <span>英文模式</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="zh" />
                <span>中文模式</span>
              </label>
            </div>

            <label class="tool-label">显示 TOP：{{ topN }} 个高频词</label>
            <input type="range" v-model.number="topN" min="5" max="100" class="range-input" />
            <div class="length-display"><span>{{ topN }}</span></div>

            <label class="tool-label">最小词长：{{ minLen }}</label>
            <input type="range" v-model.number="minLen" min="1" max="10" class="range-input" />
            <div class="length-display"><span>{{ minLen }}</span></div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="ignoreCase" />
                <span>忽略大小写</span>
              </label>
            </div>
          </div>

          <!-- 右侧：结果 -->
          <div class="tool-col">
            <label class="tool-label">分析结果：</label>
            <div v-if="results.length > 0" class="output-block">
              <!-- 柱状图 -->
              <div class="chart-wrapper" ref="chartWrapper">
                <canvas ref="chartCanvas"></canvas>
              </div>

              <!-- 总览统计 -->
              <div class="summary-row">
                <span class="summary-item">总词数：<strong>{{ totalWords }}</strong></span>
                <span class="summary-item">不重复词：<strong>{{ results.length }}</strong></span>
              </div>

              <!-- 词频表格 -->
              <div class="freq-table-wrapper">
                <table class="freq-table">
                  <thead>
                    <tr>
                      <th class="col-rank">#</th>
                      <th class="col-word">词汇</th>
                      <th class="col-count">频次</th>
                      <th class="col-freq">占比</th>
                      <th class="col-bar">分布</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in displayResults" :key="i">
                      <td class="col-rank">{{ i + 1 }}</td>
                      <td class="col-word">{{ item.word }}</td>
                      <td class="col-count">{{ item.count }}</td>
                      <td class="col-freq">{{ (item.count / totalWords * 100).toFixed(1) }}%</td>
                      <td class="col-bar">
                        <div class="bar-inline" :style="{ width: barWidth(item) }"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="code-input output" style="display: flex; align-items: center; justify-content: center; color: var(--muted); min-height: 200px;">
              请粘贴文本并点击「分析」
            </div>
          </div>
        </div>

        <!-- 停用词 -->
        <div style="margin-top: 16px;">
          <label class="tool-label">停用词（每行一个，可选）：</label>
          <textarea
            v-model="stopWords"
            class="code-input"
            rows="3"
            placeholder="the&#10;a&#10;an&#10;is&#10;of&#10;and&#10;to&#10;in"
            style="min-height: 80px;"
          ></textarea>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="analyze" :disabled="!input.trim()">⚡ 分析</button>
          <button class="tool-button" @click="copyResults" :disabled="results.length === 0">📋 复制结果</button>
          <button class="tool-button" @click="exportCSV" :disabled="results.length === 0">📥 导出 CSV</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const mode = ref('auto')
const topN = ref(20)
const minLen = ref(1)
const ignoreCase = ref(true)
const stopWords = ref('')
const results = ref([])
const totalWords = ref(0)
const error = ref('')
const success = ref(false)

const chartCanvas = ref(null)
const chartWrapper = ref(null)

// 预置常用停用词
const builtinStopWords = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'about', 'up', 'down', 'it', 'its', 'he', 'she', 'they', 'them',
  'this', 'that', 'these', 'those', 'am', 'but', 'or', 'and', 'if',
  'because', 'while', 'although', 'though', 'unless', 'until'
])

const displayResults = computed(() => {
  return results.value.slice(0, topN.value)
})

function barWidth(item) {
  if (results.value.length === 0) return '0%'
  const max = results.value[0].count
  return (item.count / max * 100).toFixed(0) + '%'
}

// 检测文本是否为中文为主
function isChinese(text) {
  let chineseCount = 0
  let totalCount = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code > 127) totalCount++
    if ((code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0xF900 && code <= 0xFAFF)) {
      chineseCount++
    }
  }
  return totalCount > 0 && chineseCount / totalCount > 0.4
}

// 英文分词
function tokenizeEn(text) {
  const processed = ignoreCase.value ? text.toLowerCase() : text
  const tokens = processed.match(/\b\w+\b/g) || []
  return tokens.filter(t => t.length >= minLen.value)
}

// 中文分词（单字 + 尝试双字组合）
function tokenizeZh(text) {
  const cjkChars = []
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if ((code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0xF900 && code <= 0xFAFF)) {
      cjkChars.push(ch)
    }
  }

  const tokens = []
  // 单字
  for (const ch of cjkChars) {
    tokens.push(ch)
  }
  // 双字组合
  for (let i = 0; i < cjkChars.length - 1; i++) {
    tokens.push(cjkChars[i] + cjkChars[i + 1])
  }
  return tokens.filter(t => t.length >= minLen.value)
}

// 混合分词
function tokenizeMixed(text) {
  const tokens = []
  // 先提取英文单词
  const enTokens = tokenizeEn(text)
  tokens.push(...enTokens)
  // 再提取中文
  const zhTokens = tokenizeZh(text)
  tokens.push(...zhTokens)
  return tokens
}

function getStopWordsSet() {
  const custom = stopWords.value
    .split(/[\n,;，；]+/)
    .map(w => ignoreCase.value ? w.trim().toLowerCase() : w.trim())
    .filter(w => w.length > 0)
  const all = new Set()
  // 添加内置停用词
  if (ignoreCase.value) {
    for (const w of builtinStopWords) {
      all.add(w)
    }
  }
  // 添加自定义停用词
  for (const w of custom) {
    all.add(w)
  }
  return all
}

function analyze() {
  error.value = ''
  success.value = false

  const text = input.value.trim()
  if (!text) {
    error.value = '请输入要分析的文本'
    return
  }

  // 决定分词模式
  let actualMode = mode.value
  if (actualMode === 'auto') {
    actualMode = isChinese(text) ? 'zh' : 'en'
  }

  let tokens
  if (actualMode === 'zh') {
    tokens = tokenizeMixed(text)
  } else {
    tokens = tokenizeEn(text)
  }

  if (tokens.length === 0) {
    error.value = '未检测到有效词汇，请检查文本内容和最小词长设置'
    return
  }

  // 停用词过滤
  const stopSet = getStopWordsSet()
  const filtered = tokens.filter(t => !stopSet.has(t))

  if (filtered.length === 0) {
    error.value = '过滤后无有效词汇，请检查停用词和最小词长设置'
    return
  }

  // 统计词频
  const freq = new Map()
  for (const t of filtered) {
    freq.set(t, (freq.get(t) || 0) + 1)
  }

  // 排序
  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }))

  results.value = sorted
  totalWords.value = filtered.length

  // 延迟绘制图表（等待 DOM 更新）
  nextTick(() => {
    drawChart()
  })
}

function drawChart() {
  const canvas = chartCanvas.value
  const wrapper = chartWrapper.value
  if (!canvas || !wrapper) return

  const dpr = window.devicePixelRatio || 1
  const display = displayResults.value
  if (display.length === 0) return

  const width = wrapper.clientWidth
  const barHeight = 18
  const barGap = 4
  const rowHeight = barHeight + barGap
  const labelWidth = Math.min(120, width * 0.3)
  const paddingTop = 8
  const paddingBottom = 4
  const height = paddingTop + display.length * rowHeight + paddingBottom

  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  canvas.width = width * dpr
  canvas.height = height * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 清空
  ctx.clearRect(0, 0, width, height)

  const maxCount = display[0].count
  const barMaxWidth = width - labelWidth - 8

  // 颜色
  const barColors = [
    'rgba(157, 255, 107, 0.85)',
    'rgba(157, 255, 107, 0.7)',
    'rgba(157, 255, 107, 0.55)',
    'rgba(157, 255, 107, 0.4)',
    'rgba(157, 255, 107, 0.25)'
  ]

  display.forEach((item, i) => {
    const y = paddingTop + i * rowHeight
    const barW = Math.max((item.count / maxCount) * barMaxWidth, 2)
    const colorIdx = Math.min(Math.floor(i / 5), barColors.length - 1)

    // 标签
    ctx.fillStyle = 'var(--text)'
    // Use computed color from CSS custom properties
    const computedStyle = getComputedStyle(document.documentElement)
    ctx.fillStyle = computedStyle.getPropertyValue('--muted').trim() || '#888888'
    ctx.font = '11px "MapleMono NF CN", monospace'
    ctx.textAlign = 'right'
    const label = item.word.length > 10 ? item.word.slice(0, 9) + '…' : item.word
    ctx.fillText(label, labelWidth - 6, y + barHeight - 3)

    // 柱状条
    ctx.fillStyle = barColors[colorIdx]
    ctx.fillRect(labelWidth + 2, y + 1, barW, barHeight - 2)

    // 数量
    ctx.fillStyle = computedStyle.getPropertyValue('--text').trim() || '#e0e0e0'
    ctx.font = '10px "MapleMono NF CN", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(String(item.count), labelWidth + barW + 6, y + barHeight - 3)
  })
}

async function copyResults() {
  const text = displayResults.value
    .map((item, i) => `${i + 1}. ${item.word} - ${item.count}次 (${(item.count / totalWords.value * 100).toFixed(1)}%)`)
    .join('\n')
  const header = `词频分析结果（总词数: ${totalWords.value}，不重复词: ${results.value.length}）\n${'='.repeat(40)}\n`
  if (await copyText(header + text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function exportCSV() {
  let csv = '排名,词汇,频次,占比\n'
  displayResults.value.forEach((item, i) => {
    csv += `${i + 1},"${item.word}",${item.count},${(item.count / totalWords.value * 100).toFixed(1)}%\n`
  })

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `word-frequency-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  success.value = 'CSV 已导出'
  setTimeout(() => { success.value = false }, 2000)
}

function clearAll() {
  input.value = ''
  results.value = []
  totalWords.value = 0
  error.value = ''
  success.value = false
  stopWords.value = ''
  topN.value = 20
  minLen.value = 1
  ignoreCase.value = true
  mode.value = 'auto'
}

// 窗口大小变化时重绘图表
if (typeof window !== 'undefined') {
  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (results.value.length > 0) {
        drawChart()
      }
    }, 200)
  })
}
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  overflow-x: hidden;
}

.chart-wrapper canvas {
  display: block;
  width: 100%;
}

.summary-row {
  display: flex;
  gap: 24px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
}

.summary-item strong {
  color: var(--green);
  font-weight: normal;
}

.freq-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
}

.freq-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
}

.freq-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.freq-table th {
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  padding: 6px 8px;
  text-align: left;
  font-weight: normal;
  color: var(--muted);
  text-transform: uppercase;
  font-size: 11px;
  white-space: nowrap;
}

.freq-table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.freq-table tbody tr:hover {
  background: var(--green-soft);
}

.col-rank {
  width: 36px;
  text-align: right;
  color: var(--muted);
}

.col-word {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--green);
}

.col-count {
  width: 60px;
  text-align: right;
}

.col-freq {
  width: 60px;
  text-align: right;
  color: var(--muted);
}

.col-bar {
  width: 80px;
}

.bar-inline {
  height: 10px;
  background: var(--green);
  opacity: 0.6;
  min-width: 2px;
}

.output-block {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 8px;
  min-height: 200px;
}

.length-display {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.length-display span {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--green);
  border: 1px solid var(--line);
  padding: 2px 16px;
  background: var(--panel-2);
}

@media (max-width: 640px) {
  .freq-table {
    font-size: 11px;
  }

  .freq-table th,
  .freq-table td {
    padding: 4px 6px;
  }

  .col-word {
    max-width: 80px;
  }

  .col-bar {
    width: 50px;
  }

  .summary-row {
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .freq-table-wrapper {
    max-height: 350px;
  }
}
</style>
