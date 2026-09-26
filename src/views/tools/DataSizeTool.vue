<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>💾 数据大小换算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区 -->
          <div class="tool-col">
            <label class="tool-label">输入数据大小：</label>
            <div class="input-row">
              <input
                class="code-input-sm"
                v-model="inputValue"
                @input="onInput"
                placeholder="输入数值，如 500"
                type="text"
              />
              <select class="unit-select" v-model="inputUnit" @change="onInput">
                <option value="B">B</option>
                <optgroup label="── 十进制 (SI) ──">
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                  <option value="TB">TB</option>
                  <option value="PB">PB</option>
                </optgroup>
                <optgroup label="── 二进制 (IEC) ──">
                  <option value="KiB">KiB</option>
                  <option value="MiB">MiB</option>
                  <option value="GiB">GiB</option>
                  <option value="TiB">TiB</option>
                  <option value="PiB">PiB</option>
                </optgroup>
              </select>
            </div>

            <label class="tool-label" style="margin-top: 20px;">📥 估算传输时间：</label>
            <div class="input-row">
              <input
                class="code-input-sm"
                v-model="bandwidthValue"
                @input="calcTransferTime"
                placeholder="带宽"
                type="text"
              />
              <select class="unit-select" v-model="bandwidthUnit" @change="calcTransferTime">
                <option value="Kbps">Kbps</option>
                <option value="Mbps">Mbps</option>
                <option value="Gbps">Gbps</option>
              </select>
            </div>

            <div v-if="transferTime" class="result-display transfer-time">
              <span>⏱️ {{ transferTime }}</span>
              <button class="copy-btn" @click="copyField(transferTime)" title="复制">📋</button>
            </div>

            <div v-if="infoText" class="info-note">{{ infoText }}</div>
          </div>

          <!-- 右侧：换算结果 -->
          <div class="tool-col">
            <label class="tool-label">换算结果：</label>

            <!-- 十进制 SI -->
            <div class="section-label">十进制 (SI) — 1000 进制</div>
            <div class="result-list">
              <div
                class="result-item"
                v-for="item in siResults"
                :key="item.unit"
                :class="{ 'result-active': item.unit === inputUnit }"
              >
                <span class="result-label">{{ item.unit }}</span>
                <span class="result-value">{{ item.value || '—' }}</span>
                <button
                  class="copy-btn-inline"
                  @click="copyField(item.value)"
                  :title="'复制 ' + item.unit"
                  :disabled="!item.value"
                >📋</button>
              </div>
            </div>

            <!-- 二进制 IEC -->
            <div class="section-label" style="margin-top: 12px;">二进制 (IEC) — 1024 进制</div>
            <div class="result-list">
              <div
                class="result-item"
                v-for="item in iecResults"
                :key="item.unit"
                :class="{ 'result-active': item.unit === inputUnit }"
              >
                <span class="result-label">{{ item.unit }}</span>
                <span class="result-value">{{ item.value || '—' }}</span>
                <button
                  class="copy-btn-inline"
                  @click="copyField(item.value)"
                  :title="'复制 ' + item.unit"
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
import { ref, reactive, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const inputValue = ref('')
const inputUnit = ref('MB')
const bandwidthValue = ref('')
const bandwidthUnit = ref('Mbps')
const transferTime = ref('')
const infoText = ref('')
const error = ref('')
const success = ref('')

// SI multipliers to bytes
const siMultipliers = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
  PB: 1_000_000_000_000_000,
}

// IEC multipliers to bytes (binary)
const iecMultipliers = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
}

// All unit multipliers (combined for parsing)
const allMultipliers = { ...siMultipliers, ...iecMultipliers }

// Bandwidth multipliers to bps (bits per second)
const bwMultipliers = {
  Kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
}

const siUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
const iecUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

const siResults = reactive(siUnits.map(u => ({ unit: u, value: '' })))
const iecResults = reactive(iecUnits.map(u => ({ unit: u, value: '' })))

function formatNumber(num) {
  if (num === 0) return '0'
  // For very large or very small numbers, use scientific notation
  if (num >= 1e15 || (num > 0 && num < 1e-12)) {
    return num.toExponential(6)
  }
  // For numbers with decimal parts
  if (!Number.isInteger(num)) {
    // Show up to 6 significant digits
    const str = num.toPrecision(6)
    // Remove trailing zeros after decimal
    return str.replace(/\.?0+$/, '')
  }
  return num.toString()
}

function onInput() {
  error.value = ''
  success.value = ''
  transferTime.value = ''
  infoText.value = ''

  const raw = inputValue.value.trim()
  if (!raw) {
    clearResults()
    return
  }

  const num = parseFloat(raw)
  if (isNaN(num) || num < 0) {
    error.value = `无效的数值：「${raw}」，请输入非负数字`
    clearResults()
    return
  }

  // Convert to bytes
  const multiplier = allMultipliers[inputUnit.value]
  if (!multiplier) {
    error.value = `未知单位：${inputUnit.value}`
    return
  }

  const bytes = num * multiplier

  // Fill SI results
  for (const item of siResults) {
    item.value = formatNumber(bytes / siMultipliers[item.unit])
  }

  // Fill IEC results
  for (const item of iecResults) {
    item.value = formatNumber(bytes / iecMultipliers[item.unit])
  }

  // Show info about the relationship
  if (inputUnit.value === 'KB') {
    infoText.value = `💡 1 KB = 1000 B，而 1 KiB = 1024 B。注意区分十进制和二进制单位。`
  } else if (inputUnit.value === 'KiB') {
    infoText.value = `💡 1 KiB = 1024 B，而 1 KB = 1000 B。注意区分二进制和十进制单位。`
  }

  // Recalculate transfer time
  calcTransferTime()
}

function calcTransferTime() {
  transferTime.value = ''
  const bwRaw = bandwidthValue.value.trim()
  if (!bwRaw) return

  const raw = inputValue.value.trim()
  if (!raw) return

  const num = parseFloat(raw)
  if (isNaN(num) || num < 0) return

  const bwNum = parseFloat(bwRaw)
  if (isNaN(bwNum) || bwNum <= 0) return

  // Data size in bits
  const multiplier = allMultipliers[inputUnit.value]
  if (!multiplier) return
  const totalBits = num * multiplier * 8

  // Bandwidth in bps
  const bps = bwNum * bwMultipliers[bandwidthUnit.value]
  if (bps <= 0) return

  const seconds = totalBits / bps

  if (seconds < 0.001) {
    transferTime.value = '< 1 毫秒'
  } else if (seconds < 1) {
    transferTime.value = `${(seconds * 1000).toFixed(0)} 毫秒`
  } else if (seconds < 60) {
    transferTime.value = `${seconds.toFixed(1)} 秒`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    transferTime.value = `${mins} 分 ${secs} 秒`
  } else if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    transferTime.value = `${hrs} 小时 ${mins} 分`
  } else {
    const days = Math.floor(seconds / 86400)
    const hrs = Math.floor((seconds % 86400) / 3600)
    transferTime.value = `${days} 天 ${hrs} 小时`
  }
}

function clearResults() {
  siResults.forEach(r => (r.value = ''))
  iecResults.forEach(r => (r.value = ''))
}

async function copyField(text) {
  if (!text || !text.trim()) {
    error.value = '没有内容可复制'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyAll() {
  const lines = []
  lines.push('[十进制 SI — 1000 进制]')
  for (const r of siResults) {
    if (r.value) lines.push(`${r.unit}: ${r.value}`)
  }
  lines.push('')
  lines.push('[二进制 IEC — 1024 进制]')
  for (const r of iecResults) {
    if (r.value) lines.push(`${r.unit}: ${r.value}`)
  }
  if (transferTime.value) {
    lines.push('')
    lines.push(`传输时间: ${transferTime.value}`)
  }

  if (lines.length <= 3) {
    error.value = '没有内容可复制'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (await copyText(lines.join('\n'))) {
    success.value = '已复制全部结果到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clearAll() {
  inputValue.value = ''
  inputUnit.value = 'MB'
  bandwidthValue.value = ''
  bandwidthUnit.value = 'Mbps'
  transferTime.value = ''
  infoText.value = ''
  error.value = ''
  success.value = ''
  clearResults()
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

.unit-select {
  width: 90px;
  flex-shrink: 0;
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

.unit-select:focus {
  outline: none;
  border-color: var(--green);
}

.section-label {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
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
  min-width: 40px;
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

.copy-btn-inline {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.copy-btn-inline:hover:not(:disabled) {
  color: var(--green);
}

.copy-btn-inline:disabled {
  opacity: 0.3;
  cursor: default;
}

.transfer-time {
  margin-top: 8px;
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

@media (max-width: 640px) {
  .unit-select {
    width: 80px;
    font-size: 12px;
  }
}
</style>
