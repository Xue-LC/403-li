<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📏 单位换算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区 -->
          <div class="tool-col">
            <label class="tool-label">类别：</label>
            <select class="unit-select" v-model="category" @change="onCategoryChange">
              <option v-for="cat in categoryList" :key="cat.key" :value="cat.key">
                {{ cat.icon }} {{ cat.label }}
              </option>
            </select>

            <label class="tool-label" style="margin-top: 16px;">输入数值：</label>
            <div class="input-row">
              <input
                class="code-input-sm"
                v-model="inputValue"
                @input="onInput"
                placeholder="输入数值，如 100"
                type="text"
              />
              <select class="unit-select" v-model="inputUnit" @change="onInput">
                <option v-for="u in currentUnits" :key="u.key" :value="u.key">
                  {{ u.label }}
                </option>
              </select>
              <button class="copy-btn" @click="copyInput" title="复制输入">📋</button>
            </div>

            <div v-if="isTemperature" class="info-note">
              💡 温度单位含偏移量，换算公式：°F = °C × 9/5 + 32，K = °C + 273.15
            </div>
            <div v-if="isData" class="info-note">
              💡 KB/MB/GB 为十进制（1000 进制），KiB/MiB/GiB 为二进制（1024 进制）
            </div>

            <div class="info-note hint-note">
              ⇄ 点击右侧结果的「设为输入」按钮，可将该单位作为新的输入值反向计算
            </div>
          </div>

          <!-- 右侧：换算结果 -->
          <div class="tool-col">
            <label class="tool-label">换算结果：</label>
            <div class="result-list">
              <div
                class="result-item"
                v-for="item in results"
                :key="item.key"
                :class="{ 'result-active': item.key === inputUnit }"
              >
                <span class="result-label">{{ item.label }}</span>
                <span class="result-value">{{ item.value || '—' }}</span>
                <button
                  class="swap-btn"
                  @click="swapInput(item.key)"
                  :title="'以 ' + item.label + ' 作为输入'"
                  :disabled="item.key === inputUnit || !item.value"
                >⇄</button>
                <button
                  class="copy-btn-inline"
                  @click="copyField(item.value)"
                  :title="'复制 ' + item.label"
                  :disabled="!item.value"
                >📋</button>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="copyAll">📋 复制全部结果</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
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

// 单位定义：factor 为线性换算因子（toBase 相乘 / fromBase 相除），
// 非线性单位（温度）用 toBase/fromBase 函数。
const CATEGORIES = {
  length: {
    label: '长度',
    icon: '📏',
    units: {
      mm: { label: 'mm 毫米', factor: 0.001 },
      cm: { label: 'cm 厘米', factor: 0.01 },
      m: { label: 'm 米', factor: 1 },
      km: { label: 'km 千米', factor: 1000 },
      in: { label: 'in 英寸', factor: 0.0254 },
      ft: { label: 'ft 英尺', factor: 0.3048 },
      yd: { label: 'yd 码', factor: 0.9144 },
      mi: { label: 'mi 英里', factor: 1609.344 },
      nmi: { label: 'nmi 海里', factor: 1852 },
      li: { label: '里', factor: 500 }
    }
  },
  weight: {
    label: '重量',
    icon: '⚖️',
    units: {
      mg: { label: 'mg 毫克', factor: 1e-6 },
      g: { label: 'g 克', factor: 0.001 },
      kg: { label: 'kg 千克', factor: 1 },
      t: { label: 't 吨', factor: 1000 },
      oz: { label: 'oz 盎司', factor: 0.028349523125 },
      lb: { label: 'lb 磅', factor: 0.45359237 },
      jin: { label: '斤', factor: 0.5 },
      liang: { label: '两', factor: 0.05 }
    }
  },
  temperature: {
    label: '温度',
    icon: '🌡️',
    units: {
      c: { label: '°C 摄氏度', toBase: v => v + 273.15, fromBase: v => v - 273.15 },
      f: { label: '°F 华氏度', toBase: v => (v + 459.67) * 5 / 9, fromBase: v => v * 9 / 5 - 459.67 },
      k: { label: 'K 开尔文', toBase: v => v, fromBase: v => v }
    }
  },
  area: {
    label: '面积',
    icon: '📐',
    units: {
      mm2: { label: 'mm²', factor: 1e-6 },
      cm2: { label: 'cm²', factor: 1e-4 },
      m2: { label: 'm²', factor: 1 },
      ha: { label: 'ha 公顷', factor: 10000 },
      km2: { label: 'km²', factor: 1e6 },
      in2: { label: 'in²', factor: 0.00064516 },
      ft2: { label: 'ft²', factor: 0.09290304 },
      yd2: { label: 'yd²', factor: 0.83612736 },
      acre: { label: 'acre 英亩', factor: 4046.8564224 },
      mu: { label: '亩', factor: 666.6666667 }
    }
  },
  volume: {
    label: '体积',
    icon: '🧪',
    units: {
      ml: { label: 'ml 毫升', factor: 0.001 },
      l: { label: 'L 升', factor: 1 },
      m3: { label: 'm³ 立方米', factor: 1000 },
      in3: { label: 'in³', factor: 0.016387064 },
      ft3: { label: 'ft³', factor: 28.316846592 },
      gal: { label: 'gal(US) 美加仑', factor: 3.785411784 },
      ukgal: { label: 'gal(UK) 英加仑', factor: 4.54609 },
      qt: { label: 'qt 夸脱', factor: 0.946352946 },
      pt: { label: 'pt 品脱', factor: 0.473176473 },
      floz: { label: 'fl oz 液量盎司', factor: 0.0295735295625 }
    }
  },
  time: {
    label: '时间',
    icon: '⏱️',
    units: {
      ms: { label: 'ms 毫秒', factor: 0.001 },
      s: { label: 's 秒', factor: 1 },
      min: { label: 'min 分钟', factor: 60 },
      h: { label: 'h 小时', factor: 3600 },
      d: { label: 'd 天', factor: 86400 },
      week: { label: '周', factor: 604800 },
      month: { label: '月（30天）', factor: 2592000 },
      year: { label: '年（365天）', factor: 31536000 }
    }
  },
  speed: {
    label: '速度',
    icon: '🚀',
    units: {
      ms: { label: 'm/s', factor: 1 },
      kmh: { label: 'km/h', factor: 1 / 3.6 },
      mph: { label: 'mph 英里/时', factor: 0.44704 },
      knot: { label: 'knot 节', factor: 0.5144444444444445 },
      fts: { label: 'ft/s', factor: 0.3048 },
      mach: { label: '马赫（近似）', factor: 340.29 }
    }
  },
  data: {
    label: '数据大小',
    icon: '💾',
    units: {
      b: { label: 'B 字节', factor: 1 },
      kb: { label: 'KB（十进制）', factor: 1e3 },
      mb: { label: 'MB（十进制）', factor: 1e6 },
      gb: { label: 'GB（十进制）', factor: 1e9 },
      tb: { label: 'TB（十进制）', factor: 1e12 },
      kib: { label: 'KiB（二进制）', factor: 1024 },
      mib: { label: 'MiB（二进制）', factor: 1024 ** 2 },
      gib: { label: 'GiB（二进制）', factor: 1024 ** 3 },
      tib: { label: 'TiB（二进制）', factor: 1024 ** 4 }
    }
  },
  angle: {
    label: '角度',
    icon: '📐',
    units: {
      deg: { label: '° 度', factor: 1 },
      rad: { label: 'rad 弧度', factor: 180 / Math.PI },
      grad: { label: 'grad 百分度', factor: 0.9 },
      arcmin: { label: "′ 角分", factor: 1 / 60 },
      arcsec: { label: "″ 角秒", factor: 1 / 3600 }
    }
  }
}

const categoryList = Object.entries(CATEGORIES).map(([key, cat]) => ({
  key,
  label: cat.label,
  icon: cat.icon
}))

const category = ref('length')
const inputValue = ref('1')
const inputUnit = ref('m')
const error = ref('')
const success = ref('')

const currentUnits = computed(() =>
  Object.entries(CATEGORIES[category.value].units).map(([key, u]) => ({ key, label: u.label }))
)

const isTemperature = computed(() => category.value === 'temperature')
const isData = computed(() => category.value === 'data')

const results = computed(() => {
  const cat = CATEGORIES[category.value]
  const raw = inputValue.value.trim()
  const list = []
  for (const [key, u] of Object.entries(cat.units)) {
    list.push({ key, label: u.label, value: '' })
  }
  if (!raw) return list

  const num = parseFloat(raw)
  if (isNaN(num) || !isFinite(num)) return list

  const from = cat.units[inputUnit.value]
  if (!from) return list

  // 统一换算到基准单位
  const base = typeof from.toBase === 'function' ? from.toBase(num) : num * from.factor
  if (!isFinite(base)) return list

  for (const item of list) {
    const u = cat.units[item.key]
    const v = typeof u.fromBase === 'function' ? u.fromBase(base) : base / u.factor
    item.value = formatNumber(v)
  }
  return list
})

function formatNumber(num) {
  if (num === 0) return '0'
  if (!isFinite(num)) return '—'
  // 极大或极小数用科学计数法
  if (Math.abs(num) >= 1e15 || (Math.abs(num) > 0 && Math.abs(num) < 1e-12)) {
    return num.toExponential(6)
  }
  // 温度类保留较多小数位，其余 6 位有效数字
  const str = num.toPrecision(8).replace(/\.?0+$/, '')
  return str
}

function onInput() {
  error.value = ''
  success.value = ''
  const raw = inputValue.value.trim()
  if (!raw) return
  const num = parseFloat(raw)
  if (isNaN(num) || !isFinite(num)) {
    error.value = `无效的数值：「${raw}」，请输入有效的数字`
  }
}

function onCategoryChange() {
  // 切类别时重置单位为该类别第一个单位，保留输入数值
  const firstKey = Object.keys(CATEGORIES[category.value].units)[0]
  inputUnit.value = firstKey
  error.value = ''
  success.value = ''
}

function swapInput(unitKey) {
  const item = results.value.find(r => r.key === unitKey)
  if (!item || !item.value) return
  inputValue.value = item.value
  inputUnit.value = unitKey
  error.value = ''
  success.value = ''
}

async function copyInput() {
  const raw = inputValue.value.trim()
  const u = CATEGORIES[category.value].units[inputUnit.value]
  if (!raw) {
    showError('没有内容可复制')
    return
  }
  const text = `${raw} ${u.label}`
  if (await copyText(text)) {
    showSuccess('已复制输入到剪贴板')
  } else {
    showError('复制失败，请手动复制')
  }
}

async function copyField(text) {
  if (!text || !text.trim()) {
    showError('没有内容可复制')
    return
  }
  if (await copyText(text)) {
    showSuccess('已复制到剪贴板')
  } else {
    showError('复制失败，请手动复制')
  }
}

async function copyAll() {
  const lines = []
  lines.push(`[${CATEGORIES[category.value].icon} ${CATEGORIES[category.value].label} 换算]`)
  for (const r of results.value) {
    if (r.value) lines.push(`${r.label}: ${r.value}`)
  }
  if (lines.length <= 1) {
    showError('没有内容可复制')
    return
  }
  if (await copyText(lines.join('\n'))) {
    showSuccess('已复制全部结果到剪贴板')
  } else {
    showError('复制失败，请手动复制')
  }
}

function clearAll() {
  inputValue.value = ''
  inputUnit.value = Object.keys(CATEGORIES[category.value].units)[0]
  error.value = ''
  success.value = ''
}

function showSuccess(msg) {
  success.value = msg
  setTimeout(() => { success.value = '' }, 2000)
}

function showError(msg) {
  error.value = msg
  setTimeout(() => { error.value = '' }, 2000)
}
</script>

<style scoped>
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row .code-input-sm {
  flex: 1;
  min-width: 0;
}

.input-row .copy-btn {
  position: static;
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.input-row .copy-btn:hover {
  color: var(--green);
}

.unit-select {
  width: 100%;
  height: 40px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 14px;
  padding: 0 8px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%239dff6b'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.input-row .unit-select {
  width: 150px;
  flex-shrink: 0;
}

.unit-select:focus {
  outline: none;
  border-color: var(--green);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 14px;
}

.result-active {
  border-color: var(--green);
  background: var(--green-soft);
}

.result-label {
  color: var(--green);
  min-width: 90px;
  flex-shrink: 0;
  font-weight: 600;
}

.result-value {
  color: var(--text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.copy-btn-inline,
.swap-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.copy-btn-inline:hover:not(:disabled),
.swap-btn:hover:not(:disabled) {
  color: var(--green);
}

.copy-btn-inline:disabled,
.swap-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.info-note {
  margin-top: 10px;
  padding: 8px 10px;
  background: var(--green-soft);
  border: 1px solid var(--green);
  color: var(--text);
  font-size: 12px;
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  border-radius: 0;
}

.hint-note {
  background: var(--panel-2);
  border-color: var(--line);
  color: var(--muted);
}

@media (max-width: 640px) {
  .input-row .unit-select {
    width: 110px;
    font-size: 12px;
  }
  .unit-select {
    font-size: 12px;
  }
  .result-label {
    min-width: 72px;
    font-size: 12px;
  }
}
</style>
