<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎲 随机数生成</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：参数配置 -->
          <div class="tool-col">
            <label class="tool-label">数字类型：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="type" value="int" />
                <span>整数</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="type" value="float" />
                <span>浮点数</span>
              </label>
            </div>

            <div class="config-fields">
              <div class="config-field">
                <label class="tool-label">最小值</label>
                <input class="code-input-sm" v-model.number="minStr" type="number"
                  placeholder="如 1" />
              </div>
              <div class="config-field">
                <label class="tool-label">最大值</label>
                <input class="code-input-sm" v-model.number="maxStr" type="number"
                  placeholder="如 100" />
              </div>
            </div>

            <template v-if="type === 'float'">
              <label class="tool-label">小数位数：{{ decimals }} 位</label>
              <input type="range" v-model.number="decimals" min="0" max="10"
                class="range-input" />
              <div class="length-display"><span>{{ decimals }}</span></div>
            </template>

            <label class="tool-label">生成数量：{{ count }} 个</label>
            <input type="range" v-model.number="count" min="1" max="1000"
              class="range-input" />
            <div class="length-display"><span>{{ count }}</span></div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="unique" />
                <span>去重（不重复）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="secure" checked />
                <span>Web Crypto 安全随机</span>
              </label>
            </div>

            <label class="tool-label">排序方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="none" />
                <span>不排序</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="asc" />
                <span>升序</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="desc" />
                <span>降序</span>
              </label>
            </div>

            <button class="tool-button" @click="copyConfig">📋 复制参数</button>
          </div>

          <!-- 右栏：生成结果 -->
          <div class="tool-col">
            <label class="tool-label">生成结果：</label>
            <div class="input-with-copy">
              <textarea class="code-input output" :value="output" readonly rows="12"
                placeholder="点击「生成随机数」，结果将显示在这里..."></textarea>
              <button class="copy-btn" @click="copyOutput" title="复制结果">📋</button>
            </div>

            <div v-if="stats.count > 0" class="stats-section">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">数量</span>
                  <span class="stat-value">{{ stats.count }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总和</span>
                  <span class="stat-value">{{ stats.sum }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均值</span>
                  <span class="stat-value">{{ stats.avg }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最小值</span>
                  <span class="stat-value">{{ stats.min }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最大值</span>
                  <span class="stat-value">{{ stats.max }}</span>
                </div>
              </div>
            </div>
            <div v-else class="result-display" style="color: var(--muted);">
              生成后显示统计信息...
            </div>
          </div>
        </div>

        <!-- ✅ 操作按钮（双栏外面，自动全宽） -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="generate">🎲 生成随机数</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { copyText } from '../../utils/clipboard'
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'

const type = ref('int')
const minStr = ref(1)
const maxStr = ref(100)
const decimals = ref(2)
const count = ref(10)
const unique = ref(false)
const secure = ref(true)
const sortMode = ref('none')

const output = ref('')
const error = ref('')
const success = ref('')
const stats = ref({ count: 0, sum: 0, avg: 0, min: 0, max: 0 })

const sortLabels = { none: '不排序', asc: '升序', desc: '降序' }
const MAX_COUNT = 1000

/* 均匀随机整数 [min, max]，支持 Web Crypto */
function randInt(min, max) {
  const range = max - min + 1
  if (secure.value && window.crypto && crypto.getRandomValues && range <= 0x100000000) {
    // rejection sampling 消除模偏差
    const buf = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / range) * range
    let x
    do {
      crypto.getRandomValues(buf)
      x = buf[0]
    } while (x >= limit)
    return min + (x % range)
  }
  return Math.floor(Math.random() * range) + min
}

/* 均匀随机浮点数 [min, max)，按小数位四舍五入 */
function randFloat(min, max) {
  let r
  if (secure.value && window.crypto && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    r = buf[0] / 0x100000000
  } else {
    r = Math.random()
  }
  return Number((min + r * (max - min)).toFixed(decimals.value))
}

function generate() {
  error.value = ''
  success.value = ''

  if (minStr.value === '' || maxStr.value === '' ||
      !isFinite(Number(minStr.value)) || !isFinite(Number(maxStr.value))) {
    error.value = '请填写有效的最小值和最大值'
    return
  }
  const min = Number(minStr.value)
  const max = Number(maxStr.value)
  if (min > max) {
    error.value = '最小值不能大于最大值'
    return
  }
  const n = Math.max(1, Math.min(MAX_COUNT, Math.floor(count.value) || 1))

  const list = []
  const seen = new Set()
  let guard = 0
  const maxGuard = 200000

  if (type.value === 'int') {
    const available = max - min + 1
    if (unique.value && n > available) {
      error.value = `去重模式下数量（${n}）超出可用整数范围（${available} 个）`
      return
    }
    while (list.length < n && guard < maxGuard) {
      const v = randInt(min, max)
      if (!unique.value || !seen.has(v)) {
        seen.add(v)
        list.push(v)
      }
      guard++
    }
  } else {
    while (list.length < n && guard < maxGuard) {
      const v = randFloat(min, max)
      const key = v.toFixed(decimals.value)
      if (!unique.value || !seen.has(key)) {
        seen.add(key)
        list.push(v)
      }
      guard++
    }
  }

  if (list.length === 0) {
    error.value = '生成失败，请检查参数后重试'
    return
  }

  if (sortMode.value === 'asc') list.sort((a, b) => a - b)
  if (sortMode.value === 'desc') list.sort((a, b) => b - a)

  output.value = list.join('\n')

  const sum = list.reduce((a, b) => a + b, 0)
  const isInt = type.value === 'int'
  const fmt = isInt ? (v) => String(v) : (v) => Number(v).toFixed(decimals.value)
  stats.value = {
    count: list.length,
    sum: fmt(sum),
    avg: fmt(sum / list.length),
    min: fmt(Math.min(...list)),
    max: fmt(Math.max(...list))
  }

  success.value = `已生成 ${list.length} 个随机数`
  setTimeout(() => { success.value = '' }, 3000)
}

function clear() {
  output.value = ''
  stats.value = { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
  error.value = ''
  success.value = ''
}

async function copyOutput() {
  if (!output.value) {
    error.value = '没有可复制的内容，请先生成随机数'
    return
  }
  if (await copyText(output.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

async function copyConfig() {
  const cfg = [
    `类型: ${type.value === 'int' ? '整数' : '浮点数'}`,
    `范围: [${Number(minStr.value)}, ${Number(maxStr.value)}]`,
    `数量: ${count.value}`,
    `小数位: ${decimals.value}`,
    `去重: ${unique.value ? '是' : '否'}`,
    `排序: ${sortLabels[sortMode.value]}`,
    `安全随机: ${secure.value ? '是' : '否'}`
  ].join('\n')
  if (await copyText(cfg)) {
    success.value = '参数已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

onMounted(() => {
  const saved = loadToolPrefs('random-number')
  if (saved) {
    if (saved.type !== undefined) type.value = saved.type
    if (saved.minStr !== undefined) minStr.value = saved.minStr
    if (saved.maxStr !== undefined) maxStr.value = saved.maxStr
    if (saved.decimals !== undefined) decimals.value = saved.decimals
    if (saved.count !== undefined) count.value = saved.count
    if (saved.unique !== undefined) unique.value = saved.unique
    if (saved.secure !== undefined) secure.value = saved.secure
    if (saved.sortMode !== undefined) sortMode.value = saved.sortMode
  }
  generate()
})

watch(
  [type, minStr, maxStr, decimals, count, unique, secure, sortMode],
  () => {
    saveToolPrefs('random-number', {
      type: type.value,
      minStr: minStr.value,
      maxStr: maxStr.value,
      decimals: decimals.value,
      count: count.value,
      unique: unique.value,
      secure: secure.value,
      sortMode: sortMode.value
    })
  }
)
</script>

<style scoped>
/* === 组件特有样式 === */

/* 最小/最大值并排 */
.config-fields {
  display: flex;
  gap: 10px;
}

.config-fields .config-field {
  flex: 1;
  min-width: 0;
}

.config-field .tool-label {
  margin-top: 0;
}

/* 数量/小数位显示 */
.length-display {
  text-align: center;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  margin-top: -5px;
}

/* 选项组 */
.options-group {
  margin: 0.75rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 统计网格 */
.stats-section {
  margin-top: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 6px;
  text-align: center;
  min-width: 0;
}

.stat-label {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  display: block;
  font-family: var(--mono);
  font-size: 15px;
  color: var(--green);
  margin-top: 4px;
  word-break: break-all;
}

@media (max-width: 640px) {
  .config-fields {
    flex-direction: column;
    gap: 0;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
