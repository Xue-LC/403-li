<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌐 CIDR 子网计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区 -->
          <div class="tool-col">
            <label class="tool-label">CIDR 表示法：</label>
            <input
              class="code-input-sm"
              v-model="cidrInput"
              @input="onInput"
              placeholder="例如: 192.168.1.0/24"
            />
            <div class="quick-presets">
              <span class="preset-label">快速填入：</span>
              <div class="preset-buttons">
                <button
                  v-for="p in presets"
                  :key="p.label"
                  class="preset-btn"
                  @click="selectPreset(p.cidr)"
                >{{ p.label }}</button>
              </div>
            </div>
            <div class="cidr-examples">
              <span class="preset-label">CIDR 格式说明：</span>
              <p class="muted-text">
                格式为 <code>IP地址/前缀长度</code>，前缀长度 0-32。<br />
                例如 <code>10.0.0.0/8</code>、<code>192.168.1.0/24</code>、<code>172.16.0.0/12</code>
              </p>
            </div>
          </div>

          <!-- 右侧：结果区 -->
          <div class="tool-col">
            <label class="tool-label">
              计算结果：
              <button
                v-if="result"
                class="copy-btn-inline"
                @click="copyResult"
                title="复制全部结果"
              >📋 复制</button>
            </label>
            <div v-if="result" class="result-grid">
              <div class="result-item">
                <span class="result-label">子网掩码</span>
                <span class="result-value">{{ result.mask }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">网络地址</span>
                <span class="result-value">{{ result.network }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">广播地址</span>
                <span class="result-value">{{ result.broadcast }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">首个可用 IP</span>
                <span class="result-value">{{ result.firstHost }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">末尾可用 IP</span>
                <span class="result-value">{{ result.lastHost }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">IP 范围</span>
                <span class="result-value mono-sm">{{ result.range }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">可用主机数</span>
                <span class="result-value">{{ result.usableHosts }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">总主机数</span>
                <span class="result-value">{{ result.totalHosts }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">通配符掩码</span>
                <span class="result-value">{{ result.wildcard }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">二进制掩码</span>
                <span class="result-value mono-sm">{{ result.binaryMask }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">IP 类型</span>
                <span class="result-value">{{ result.ipType }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">地址类别</span>
                <span class="result-value">{{ result.ipClass }}</span>
              </div>
            </div>
            <div v-else class="result-placeholder">
              <span>输入 CIDR 地址后自动计算</span>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="onInput" :disabled="!cidrInput.trim()">
            🔍 计算
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const cidrInput = ref('')
const result = ref(null)
const error = ref('')
const success = ref('')

const presets = [
  { label: '家庭网络 /24', cidr: '192.168.1.0/24' },
  { label: '大内网 /16', cidr: '10.0.0.0/16' },
  { label: 'A类私有 /8', cidr: '10.0.0.0/8' },
  { label: 'B类私有 /12', cidr: '172.16.0.0/12' },
  { label: 'C类私有 /24', cidr: '192.168.0.0/24' },
  { label: '环回地址 /8', cidr: '127.0.0.0/8' },
  { label: '链路本地 /16', cidr: '169.254.0.0/16' },
  { label: '点对点 /30', cidr: '10.0.0.0/30' },
  { label: '点对点 /31', cidr: '10.0.0.0/31' },
  { label: '单主机 /32', cidr: '8.8.8.8/32' },
]

/**
 * Convert an IPv4 string to a 32-bit unsigned integer.
 */
function ipToInt(ip) {
  const octets = ip.split('.')
  if (octets.length !== 4) return null
  const nums = []
  for (const o of octets) {
    const n = parseInt(o, 10)
    if (isNaN(n) || n < 0 || n > 255) return null
    nums.push(n)
  }
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0
}

/**
 * Convert a 32-bit unsigned integer to an IPv4 string.
 */
function intToIp(intVal) {
  return [
    (intVal >>> 24) & 0xff,
    (intVal >>> 16) & 0xff,
    (intVal >>> 8) & 0xff,
    intVal & 0xff,
  ].join('.')
}

/**
 * Get the subnet mask as a 32-bit integer from prefix length.
 */
function prefixToMask(prefix) {
  if (prefix === 0) return 0
  return (~0 << (32 - prefix)) >>> 0
}

/**
 * Format a number with commas.
 */
function fmtNum(n) {
  return n.toLocaleString('en-US')
}

/**
 * Determine IP type (public/private/loopback/link-local).
 */
function getIpType(ipInt) {
  const first = (ipInt >>> 24) & 0xff
  const second = (ipInt >>> 16) & 0xff

  if (first === 127) return '环回地址 (Loopback)'
  if (first === 169 && second === 254) return '链路本地 (Link-Local)'
  if (first === 10) return '私有地址 (A类)'
  if (first === 172 && second >= 16 && second <= 31) return '私有地址 (B类)'
  if (first === 192 && second === 168) return '私有地址 (C类)'
  if (first >= 224 && first <= 239) return '组播地址 (D类)'
  if (first >= 240) return '保留地址 (E类)'
  if (first === 0) return '零网络 (保留)'
  if (first === 255 && ((ipInt >>> 24) & 0xff) === 255) {
    const b3 = (ipInt >>> 16) & 0xff
    const b2 = (ipInt >>> 8) & 0xff
    const b1 = ipInt & 0xff
    if (b3 === 255 && b2 === 255 && b1 === 255) return '受限广播'
  }
  return '公网地址'
}

/**
 * Determine IP class.
 */
function getIpClass(ipInt) {
  const first = (ipInt >>> 24) & 0xff
  if (first < 128) return 'A 类'
  if (first < 192) return 'B 类'
  if (first < 224) return 'C 类'
  if (first < 240) return 'D 类（组播）'
  return 'E 类（保留）'
}

/**
 * Format mask as binary dotted notation.
 */
function maskToBinary(prefix) {
  const maskInt = prefixToMask(prefix)
  const octets = [
    (maskInt >>> 24) & 0xff,
    (maskInt >>> 16) & 0xff,
    (maskInt >>> 8) & 0xff,
    maskInt & 0xff,
  ]
  return octets.map(o => o.toString(2).padStart(8, '0')).join('.')
}

function parseCidr(input) {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split('/')
  if (parts.length !== 2) return null

  const ip = parts[0].trim()
  const prefixStr = parts[1].trim()

  const ipInt = ipToInt(ip)
  if (ipInt === null) return null

  const prefix = parseInt(prefixStr, 10)
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null

  return { ipInt, prefix }
}

function calculate(parsed) {
  const { ipInt, prefix } = parsed
  const maskInt = prefixToMask(prefix)
  const wildcardInt = (~maskInt) >>> 0

  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0

  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix)
  let usableHosts
  let firstHostInt
  let lastHostInt

  if (prefix === 32) {
    usableHosts = 1
    firstHostInt = networkInt
    lastHostInt = networkInt
  } else if (prefix === 31) {
    usableHosts = 2
    firstHostInt = networkInt
    lastHostInt = broadcastInt
  } else {
    usableHosts = totalHosts - 2
    firstHostInt = (networkInt + 1) >>> 0
    lastHostInt = (broadcastInt - 1) >>> 0
  }

  return {
    mask: intToIp(maskInt),
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    range: intToIp(firstHostInt) + ' – ' + intToIp(lastHostInt),
    usableHosts: fmtNum(usableHosts),
    totalHosts: fmtNum(totalHosts),
    wildcard: intToIp(wildcardInt),
    binaryMask: maskToBinary(prefix),
    ipType: getIpType(networkInt),
    ipClass: getIpClass(networkInt),
    prefix,
  }
}

function onInput() {
  error.value = ''
  success.value = ''

  if (!cidrInput.value.trim()) {
    result.value = null
    return
  }

  const parsed = parseCidr(cidrInput.value)
  if (!parsed) {
    error.value = '无效的 CIDR 格式，请使用「IP地址/前缀长度」格式，例如 192.168.1.0/24'
    result.value = null
    return
  }

  try {
    result.value = calculate(parsed)
  } catch (e) {
    error.value = '计算出错：' + e.message
    result.value = null
  }
}

function selectPreset(cidr) {
  cidrInput.value = cidr
  error.value = ''
  success.value = ''
  const parsed = parseCidr(cidr)
  if (parsed) {
    result.value = calculate(parsed)
  }
}

async function copyResult() {
  if (!result.value) return
  const r = result.value
  const text = [
    `CIDR: ${cidrInput.value.trim()}`,
    `子网掩码: ${r.mask}`,
    `网络地址: ${r.network}`,
    `广播地址: ${r.broadcast}`,
    `首个可用IP: ${r.firstHost}`,
    `末尾可用IP: ${r.lastHost}`,
    `IP范围: ${r.range}`,
    `可用主机数: ${r.usableHosts}`,
    `总主机数: ${r.totalHosts}`,
    `通配符掩码: ${r.wildcard}`,
    `二进制掩码: ${r.binaryMask}`,
    `IP类型: ${r.ipType}`,
    `地址类别: ${r.ipClass}`,
  ].join('\n')

  if (await copyText(text)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clearAll() {
  cidrInput.value = ''
  result.value = null
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.quick-presets {
  margin-top: 16px;
}

.preset-label {
  display: block;
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  padding: 4px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  border-radius: 0;
  transition: background 0.15s, border-color 0.15s;
}

.preset-btn:hover {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.cidr-examples {
  margin-top: 16px;
}

.muted-text {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
  margin: 6px 0 0 0;
}

.muted-text code {
  font-family: 'MapleMono NF CN', monospace;
  background: var(--panel);
  padding: 1px 5px;
  border: 1px solid var(--line);
  color: var(--green);
}

.copy-btn-inline {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  padding: 2px 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  border-radius: 0;
  margin-left: 8px;
  transition: background 0.15s, border-color 0.15s;
}

.copy-btn-inline:hover {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--panel);
}

.result-label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.result-value {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  color: var(--green);
  text-align: right;
  word-break: break-all;
}

.result-value.mono-sm {
  font-size: 10px;
  line-height: 1.4;
}

.result-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  border: 1px dashed var(--line);
}

@media (max-width: 640px) {
  .preset-buttons {
    gap: 4px;
  }

  .preset-btn {
    font-size: 10px;
    padding: 3px 8px;
  }

  .result-value {
    font-size: 12px;
  }

  .result-value.mono-sm {
    font-size: 9px;
  }

  .result-item {
    padding: 6px 10px;
  }
}
</style>
