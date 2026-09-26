<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📶 网络带宽换算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区 -->
          <div class="tool-col">
            <label class="tool-label">输入带宽：</label>
            <div class="input-row">
              <input
                class="code-input-sm"
                v-model="inputValue"
                @input="onInput"
                placeholder="输入数值，如 100"
                type="text"
              />
              <select class="unit-select" v-model="inputUnit" @change="onInput">
                <option value="bps">bps</option>
                <option value="Kbps">Kbps</option>
                <option value="Mbps">Mbps</option>
                <option value="Gbps">Gbps</option>
                <option value="Tbps">Tbps</option>
              </select>
            </div>

            <label class="tool-label" style="margin-top: 20px;">📥 估算下载时间：</label>
            <div class="input-row">
              <input
                class="code-input-sm"
                v-model="fileSize"
                @input="calcDownloadTime"
                placeholder="文件大小"
                type="text"
              />
              <select class="unit-select" v-model="fileSizeUnit" @change="calcDownloadTime">
                <option value="B">B</option>
                <option value="KB">KB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>

            <div v-if="downloadTime" class="result-display download-time">
              <span>⏱️ {{ downloadTime }}</span>
              <button class="copy-btn" @click="copyField(downloadTime)" title="复制">📋</button>
            </div>
          </div>

          <!-- 右侧：换算结果 -->
          <div class="tool-col">
            <label class="tool-label">换算结果：</label>
            <div class="result-list">
              <div class="result-item" v-for="item in results" :key="item.unit">
                <span class="result-label">{{ item.unit }}</span>
                <span class="result-value">{{ item.value }}</span>
                <button class="copy-btn-inline" @click="copyField(item.value)" title="复制">📋</button>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyAll">📋 复制全部结果</button>
          <button class="tool-button" @click="swapToBytes">🔄 比特↔字节</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

const inputValue = ref('')
const inputUnit = ref('Mbps')
const fileSize = ref('')
const fileSizeUnit = ref('MB')
const downloadTime = ref('')
const error = ref('')
const success = ref('')

const results = reactive([
  { unit: 'bps', value: '' },
  { unit: 'Kbps', value: '' },
  { unit: 'Mbps', value: '' },
  { unit: 'Gbps', value: '' },
  { unit: 'Tbps', value: '' },
  { unit: 'B/s', value: '' },
  { unit: 'KB/s', value: '' },
  { unit: 'MB/s', value: '' },
  { unit: 'GB/s', value: '' },
  { unit: 'TB/s', value: '' },
])

// Multipliers to bps
const bitsMultipliers = {
  bps: 1,
  Kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
  Tbps: 1_000_000_000_000,
}

// Multipliers to bytes
const bytesMultipliers = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
}

function formatNumber(num) {
  if (num >= 1e12 || (num > 0 && num < 1e-9)) {
    return num.toExponential(4)
  }
  // Show appropriate decimal places
  if (Number.isInteger(num)) return num.toString()
  if (num < 0.01) return num.toPrecision(4)
  return num.toFixed(num < 1 ? 6 : 2).replace(/\.?0+$/, '')
}

function onInput() {
  error.value = ''
  success.value = ''
  downloadTime.value = ''

  const raw = inputValue.value.trim()
  if (!raw) {
    results.forEach(r => r.value = '')
    return
  }

  const num = parseFloat(raw)
  if (isNaN(num) || num < 0) {
    error.value = `无效的数值：「${raw}」，请输入非负数字`
    results.forEach(r => r.value = '')
    return
  }

  // Convert to bps first
  const bps = num * bitsMultipliers[inputUnit.value]

  // Fill all bit-based units
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps']
  for (const unit of units) {
    const item = results.find(r => r.unit === unit)
    if (item) item.value = formatNumber(bps / bitsMultipliers[unit])
  }

  // Fill byte-based units (1 B/s = 8 bps)
  const byteUnits = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  const bytesPerSec = bps / 8
  const byteMultipliers = { 'B/s': 1, 'KB/s': 1_000, 'MB/s': 1_000_000, 'GB/s': 1_000_000_000, 'TB/s': 1_000_000_000_000 }
  for (const unit of byteUnits) {
    const item = results.find(r => r.unit === unit)
    if (item) item.value = formatNumber(bytesPerSec / byteMultipliers[unit])
  }

  // Recalculate download time if file size is set
  calcDownloadTime()
}

function calcDownloadTime() {
  downloadTime.value = ''
  const fs = fileSize.value.trim()
  if (!fs) return

  const raw = inputValue.value.trim()
  if (!raw) return

  const num = parseFloat(raw)
  if (isNaN(num) || num < 0) return

  const fileNum = parseFloat(fs)
  if (isNaN(fileNum) || fileNum < 0) return

  // File size in bits
  const fileBits = fileNum * bytesMultipliers[fileSizeUnit.value] * 8

  // Bandwidth in bps
  const bps = num * bitsMultipliers[inputUnit.value]

  if (bps === 0) {
    downloadTime.value = '带宽为 0，无法计算'
    return
  }

  const seconds = fileBits / bps

  if (seconds < 1) {
    downloadTime.value = `${(seconds * 1000).toFixed(0)} 毫秒`
  } else if (seconds < 60) {
    downloadTime.value = `${seconds.toFixed(1)} 秒`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    downloadTime.value = `${mins} 分 ${secs} 秒`
  } else if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    downloadTime.value = `${hrs} 小时 ${mins} 分`
  } else {
    const days = Math.floor(seconds / 86400)
    const hrs = Math.floor((seconds % 86400) / 3600)
    downloadTime.value = `${days} 天 ${hrs} 小时`
  }
}

function swapToBytes() {
  error.value = ''
  success.value = ''

  const raw = inputValue.value.trim()
  if (!raw) {
    error.value = '请先输入带宽值'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }

  // Toggle between bit-based and byte-based input interpretation
  // If currently using bit units, convert to equivalent byte value
  const num = parseFloat(raw)
  if (isNaN(num)) return

  const bps = num * bitsMultipliers[inputUnit.value]
  const bytesPerSec = bps / 8

  // Change to the closest byte unit
  const byteUnits = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  const byteMultipliers = { 'B/s': 1, 'KB/s': 1_000, 'MB/s': 1_000_000, 'GB/s': 1_000_000_000, 'TB/s': 1_000_000_000_000 }

  // Find best matching byte unit
  if (bytesPerSec >= 1e12) {
    inputValue.value = formatNumber(bytesPerSec / 1e12)
    inputUnit.value = 'Tbps'
  } else if (bytesPerSec >= 1e9) {
    inputValue.value = formatNumber(bytesPerSec / 1e9)
    inputUnit.value = 'Gbps'
  } else if (bytesPerSec >= 1e6) {
    inputValue.value = formatNumber(bytesPerSec / 1e6)
    inputUnit.value = 'Mbps'
  } else if (bytesPerSec >= 1e3) {
    inputValue.value = formatNumber(bytesPerSec / 1e3)
    inputUnit.value = 'Kbps'
  } else {
    inputValue.value = formatNumber(bytesPerSec)
    inputUnit.value = 'bps'
  }

  // Select the closest matching byte unit in the bit-input dropdown as well
  // Actually, let's keep it simple: just re-interpret value as byte equivalent in bits
  // The input stays in bit units. We just show an equivalent.
  // Revert: just show the byte equivalent by converting to bps and updating display

  // Actually, let me rethink. The swap button should toggle between "treat input as bits" and "treat input as bytes"
  // Simplest approach: convert the current bps value to its byte equivalent, update the input to show Mbps equivalent

  // Let me just toggle interpretation: if it's Mbps, convert to MB/s equivalent in Mbps
  // E.g., 100 Mbps → 12.5 MB/s, so show 12.5 in Mbps (meaning 12.5 * 8 = 100 Mbps)
  // But that's confusing. Let me just swap the input to show the byte/s value interpreted in bit units.
  // E.g. 100 Mbps input → swap shows 12.5 (as Mbps, equivalent to 12.5 MB/s)

  // Better: just toggle to show byte-equivalent speed in same bit units
  inputValue.value = formatNumber(bytesPerSec / bitsMultipliers[inputUnit.value])
  success.value = `已换算：${formatNumber(bytesPerSec / bitsMultipliers[inputUnit.value])} ${inputUnit.value} ≈ ${formatNumber(bytesPerSec / 1_000_000)} MB/s`
  setTimeout(() => { success.value = '' }, 3000)

  onInput()
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
  const lines = results.filter(r => r.value).map(r => `${r.unit}: ${r.value}`)
  if (lines.length === 0) {
    error.value = '没有内容可复制'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (downloadTime.value) {
    lines.push(`下载时间: ${downloadTime.value}`)
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
  inputUnit.value = 'Mbps'
  fileSize.value = ''
  fileSizeUnit.value = 'MB'
  downloadTime.value = ''
  error.value = ''
  success.value = ''
  results.forEach(r => r.value = '')
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

.result-label {
  color: var(--green);
  min-width: 48px;
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

.copy-btn-inline:hover {
  color: var(--green);
}

.download-time {
  margin-top: 8px;
}

@media (max-width: 640px) {
  .unit-select {
    width: 80px;
    font-size: 12px;
  }
}
</style>
