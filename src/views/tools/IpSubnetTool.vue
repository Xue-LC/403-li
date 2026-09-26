<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌐 IP 子网计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 选项卡 -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >{{ tab.label }}</button>
        </div>

        <!-- Tab 1: 子网计算 -->
        <div v-if="activeTab === 'calc'" class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">CIDR 表示法：</label>
            <input
              class="code-input-sm"
              v-model="cidrInput"
              @input="onCalcInput"
              placeholder="例如: 192.168.1.0/24"
            />
            <div class="or-divider"><span>或者分别输入</span></div>
            <label class="tool-label">IP 地址：</label>
            <input
              class="code-input-sm"
              v-model="ipInput"
              @input="onCalcInput"
              placeholder="例如: 192.168.1.0"
            />
            <label class="tool-label">前缀长度：</label>
            <div class="prefix-row">
              <input
                class="code-input-sm prefix-input"
                v-model.number="prefixInput"
                @input="onCalcInput"
                type="number"
                min="0"
                max="32"
                placeholder="0-32"
              />
              <span class="prefix-slash">/{{ prefixInput || '--' }}</span>
            </div>
            <div class="quick-presets">
              <span class="preset-label">快速填入：</span>
              <div class="preset-buttons">
                <button
                  v-for="p in presets"
                  :key="p.label"
                  class="preset-btn"
                  @click="selectPreset(p)"
                >{{ p.label }}</button>
              </div>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              计算结果：
              <button
                v-if="calcResult"
                class="copy-btn-inline"
                @click="copyCalcResult"
                title="复制全部结果"
              >📋 复制</button>
            </label>
            <div v-if="calcResult" class="result-grid">
              <div class="result-item">
                <span class="result-label">子网掩码</span>
                <span class="result-value">{{ calcResult.mask }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">网络地址</span>
                <span class="result-value">{{ calcResult.network }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">广播地址</span>
                <span class="result-value">{{ calcResult.broadcast }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">首个可用 IP</span>
                <span class="result-value">{{ calcResult.firstHost }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">末尾可用 IP</span>
                <span class="result-value">{{ calcResult.lastHost }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">IP 范围</span>
                <span class="result-value mono-sm">{{ calcResult.range }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">可用主机数</span>
                <span class="result-value">{{ calcResult.usableHosts }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">总主机数</span>
                <span class="result-value">{{ calcResult.totalHosts }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">通配符掩码</span>
                <span class="result-value">{{ calcResult.wildcard }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">二进制掩码</span>
                <span class="result-value mono-sm">{{ calcResult.binaryMask }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">IP 类型</span>
                <span class="result-value">{{ calcResult.ipType }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">地址类别</span>
                <span class="result-value">{{ calcResult.ipClass }}</span>
              </div>
            </div>
            <div v-else class="result-placeholder">
              <span>{{ calcError || '输入 CIDR 地址后自动计算' }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: CIDR 拆分 -->
        <div v-if="activeTab === 'split'" class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">源网络 (CIDR)：</label>
            <input
              class="code-input-sm"
              v-model="splitNetwork"
              @input="onSplitInput"
              placeholder="例如: 10.0.0.0/8"
            />
            <label class="tool-label">目标前缀长度：</label>
            <div class="split-prefix-row">
              <input
                class="code-input-sm prefix-input"
                v-model.number="splitTargetPrefix"
                @input="onSplitInput"
                type="number"
                min="1"
                max="32"
                placeholder="例如: 16"
              />
              <span class="prefix-slash">/{{ splitTargetPrefix || '--' }}</span>
            </div>
            <div class="split-info" v-if="splitInfo">
              <div class="info-item">
                <span class="info-label">产生子网数：</span>
                <span class="info-value">{{ splitInfo.subnetCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">每个子网主机数：</span>
                <span class="info-value">{{ splitInfo.hostsPerSubnet }}</span>
              </div>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              拆分结果：
              <button
                v-if="splitResults.length > 0"
                class="copy-btn-inline"
                @click="copySplitResults"
                title="复制全部子网"
              >📋 复制</button>
            </label>
            <div v-if="splitResults.length > 0" class="split-table-wrap">
              <table class="split-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>网络地址</th>
                    <th>广播地址</th>
                    <th>IP 范围</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in splitResults" :key="i">
                    <td class="idx">{{ i + 1 }}</td>
                    <td>{{ s.network }}</td>
                    <td>{{ s.broadcast }}</td>
                    <td class="range-cell">{{ s.firstHost }} – {{ s.lastHost }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="result-placeholder">
              <span>{{ splitError || '输入源网络和目标前缀后自动拆分' }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 3: IP 归属判断 -->
        <div v-if="activeTab === 'lookup'" class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">待查询 IP：</label>
            <input
              class="code-input-sm"
              v-model="lookupIp"
              @input="onLookupInput"
              placeholder="例如: 192.168.1.100"
            />
            <label class="tool-label">网段列表（每行一个 CIDR）：</label>
            <textarea
              class="code-input"
              v-model="lookupSubnets"
              @input="onLookupInput"
              rows="8"
              placeholder="每行一个 CIDR，例如：
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
192.168.1.0/24"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">归属结果：</label>
            <div v-if="lookupResults.length > 0" class="lookup-result-list">
              <div
                v-for="(r, i) in lookupResults"
                :key="i"
                class="lookup-item"
                :class="{ match: r.matches, 'no-match': !r.matches }"
              >
                <span class="lookup-cidr">{{ r.cidr }}</span>
                <span class="lookup-status">
                  {{ r.matches ? '✅ 归属' : '❌ 不归属' }}
                </span>
                <span v-if="r.matches" class="lookup-detail">
                  范围：{{ r.firstHost }} – {{ r.lastHost }}
                </span>
              </div>
            </div>
            <div v-else class="result-placeholder">
              <span>{{ lookupError || '输入 IP 和网段列表后自动判断' }}</span>
            </div>
          </div>
        </div>

        <!-- 错误/成功提示 -->
        <div class="button-group button-group-2">
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
import { ref, reactive, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// ---- Tabs ----
const tabs = [
  { key: 'calc', label: '🔢 子网计算' },
  { key: 'split', label: '✂️ CIDR 拆分' },
  { key: 'lookup', label: '🔍 IP 归属判断' },
]
const activeTab = ref('calc')

function switchTab(key) {
  activeTab.value = key
  error.value = ''
  success.value = ''
}

// ---- IP 工具函数 ----
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

function intToIp(intVal) {
  return [
    (intVal >>> 24) & 0xff,
    (intVal >>> 16) & 0xff,
    (intVal >>> 8) & 0xff,
    intVal & 0xff,
  ].join('.')
}

function prefixToMask(prefix) {
  if (prefix === 0) return 0
  return (~0 << (32 - prefix)) >>> 0
}

function fmtNum(n) {
  return n.toLocaleString('en-US')
}

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
  if (first === 255 && second === 255) {
    const b2 = (ipInt >>> 8) & 0xff
    const b1 = ipInt & 0xff
    if (b2 === 255 && b1 === 255) return '受限广播'
  }
  return '公网地址'
}

function getIpClass(ipInt) {
  const first = (ipInt >>> 24) & 0xff
  if (first < 128) return 'A 类'
  if (first < 192) return 'B 类'
  if (first < 224) return 'C 类'
  if (first < 240) return 'D 类（组播）'
  return 'E 类（保留）'
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
  return { ipInt, prefix, ip }
}

function calculateSubnet(ipInt, prefix) {
  const maskInt = prefixToMask(prefix)
  const wildcardInt = (~maskInt) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0
  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix)

  let usableHosts, firstHostInt, lastHostInt
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
    networkInt,
    broadcastInt,
  }
}

// ---- 全局 error/success ----
const error = ref('')
const success = ref('')

function showSuccess(msg) {
  success.value = msg
  setTimeout(() => { success.value = '' }, 2000)
}

function showError(msg) {
  error.value = msg
  setTimeout(() => { error.value = '' }, 3000)
}

// ==================== Tab 1: 子网计算 ====================
const cidrInput = ref('')
const ipInput = ref('')
const prefixInput = ref(null)
const calcResult = ref(null)
const calcError = ref('')

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

function selectPreset(p) {
  cidrInput.value = p.cidr
  ipInput.value = ''
  prefixInput.value = null
  doCalc()
}

function onCalcInput() {
  calcError.value = ''
  // 优先使用 CIDR 输入
  if (cidrInput.value.trim()) {
    const parsed = parseCidr(cidrInput.value)
    if (parsed) {
      // 同步回填 IP 和前缀
      ipInput.value = parsed.ip
      prefixInput.value = parsed.prefix
    }
  }
  doCalc()
}

function doCalc() {
  calcError.value = ''
  calcResult.value = null

  // 优先 CIDR
  if (cidrInput.value.trim()) {
    const parsed = parseCidr(cidrInput.value)
    if (!parsed) {
      calcError.value = '无效的 CIDR 格式，请使用「IP地址/前缀长度」格式'
      return
    }
    calcResult.value = calculateSubnet(parsed.ipInt, parsed.prefix)
    return
  }

  // 分别输入模式
  if (!ipInput.value.trim()) return

  const ipInt = ipToInt(ipInput.value.trim())
  if (ipInt === null) {
    calcError.value = '无效的 IP 地址'
    return
  }

  const prefix = prefixInput.value
  if (prefix === null || prefix === '' || isNaN(prefix) || prefix < 0 || prefix > 32) {
    calcError.value = '请输入有效的前缀长度 (0-32)'
    return
  }

  calcResult.value = calculateSubnet(ipInt, prefix)
}

async function copyCalcResult() {
  if (!calcResult.value) return
  const r = calcResult.value
  const src = cidrInput.value.trim() || `${ipInput.value.trim()}/${prefixInput.value}`
  const text = [
    `CIDR: ${src}`,
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
    showSuccess('结果已复制到剪贴板')
  } else {
    showError('复制失败，请手动复制')
  }
}

// ==================== Tab 2: CIDR 拆分 ====================
const splitNetwork = ref('')
const splitTargetPrefix = ref(null)
const splitResults = ref([])
const splitInfo = ref(null)
const splitError = ref('')

function onSplitInput() {
  splitError.value = ''
  doSplit()
}

function doSplit() {
  splitError.value = ''
  splitResults.value = []
  splitInfo.value = null

  if (!splitNetwork.value.trim()) return

  const parsed = parseCidr(splitNetwork.value)
  if (!parsed) {
    splitError.value = '无效的源网络 CIDR 格式'
    return
  }

  const target = splitTargetPrefix.value
  if (target === null || target === '' || isNaN(target) || target < 1 || target > 32) {
    splitError.value = '请输入有效的目标前缀长度 (1-32)'
    return
  }

  if (target <= parsed.prefix) {
    splitError.value = `目标前缀长度 (/${target}) 必须大于源前缀长度 (/${parsed.prefix})`
    return
  }

  const subnetCount = Math.pow(2, target - parsed.prefix)
  // 限制展示数量，避免页面卡死
  const maxDisplay = 4096
  const displayCount = Math.min(subnetCount, maxDisplay)

  const step = Math.pow(2, 32 - target)
  const results = []
  let currentInt = parsed.ipInt

  for (let i = 0; i < displayCount; i++) {
    const sub = calculateSubnet(currentInt, target)
    results.push(sub)
    currentInt = (currentInt + step) >>> 0
  }

  splitResults.value = results
  splitInfo.value = {
    subnetCount: fmtNum(subnetCount),
    hostsPerSubnet: subnetCount > 0
      ? fmtNum(target === 32 ? 1 : Math.pow(2, 32 - target) - (target <= 30 ? 2 : 0))
      : '—',
  }

  if (subnetCount > maxDisplay) {
    splitError.value = `共 ${fmtNum(subnetCount)} 个子网，仅显示前 ${fmtNum(maxDisplay)} 个`
  }
}

async function copySplitResults() {
  if (splitResults.value.length === 0) return
  const lines = splitResults.value.map((s, i) =>
    `${i + 1}. ${s.network}/${s.prefix}  →  范围: ${s.firstHost} – ${s.lastHost}  (广播: ${s.broadcast})`
  )
  const text = [
    `源网络: ${splitNetwork.value.trim()}`,
    `目标前缀: /${splitTargetPrefix.value}`,
    `子网数: ${splitInfo.value.subnetCount}`,
    '',
    ...lines,
  ].join('\n')
  if (await copyText(text)) {
    showSuccess('拆分结果已复制到剪贴板')
  } else {
    showError('复制失败，请手动复制')
  }
}

// ==================== Tab 3: IP 归属判断 ====================
const lookupIp = ref('')
const lookupSubnets = ref('')
const lookupResults = ref([])
const lookupError = ref('')

function onLookupInput() {
  lookupError.value = ''
  doLookup()
}

function doLookup() {
  lookupError.value = ''
  lookupResults.value = []

  const ip = lookupIp.value.trim()
  if (!ip) return

  const ipInt = ipToInt(ip)
  if (ipInt === null) {
    lookupError.value = '无效的 IP 地址'
    return
  }

  const lines = lookupSubnets.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '')

  if (lines.length === 0) return

  const results = []
  for (const line of lines) {
    const parsed = parseCidr(line)
    if (!parsed) {
      results.push({ cidr: line, matches: false, error: '无效格式' })
      continue
    }
    const sub = calculateSubnet(parsed.ipInt, parsed.prefix)
    const matches = ipInt >= sub.networkInt && ipInt <= sub.broadcastInt
    results.push({
      cidr: line,
      matches,
      firstHost: sub.firstHost,
      lastHost: sub.lastHost,
      network: sub.network,
      broadcast: sub.broadcast,
    })
  }
  lookupResults.value = results
}

// ==================== 清空 ====================
function clearAll() {
  cidrInput.value = ''
  ipInput.value = ''
  prefixInput.value = null
  calcResult.value = null
  calcError.value = ''

  splitNetwork.value = ''
  splitTargetPrefix.value = null
  splitResults.value = []
  splitInfo.value = null
  splitError.value = ''

  lookupIp.value = ''
  lookupSubnets.value = ''
  lookupResults.value = []
  lookupError.value = ''

  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 选项卡 */
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.tab-btn {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  color: var(--green);
  border-bottom-color: var(--green);
}

/* 分隔线 */
.or-divider {
  display: flex;
  align-items: center;
  margin: 12px 0;
  gap: 10px;
}

.or-divider::before,
.or-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.or-divider span {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  white-space: nowrap;
}

/* 前缀行 */
.prefix-row,
.split-prefix-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefix-input {
  flex: 1;
}

.prefix-slash {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 14px;
  color: var(--green);
  min-width: 36px;
  text-align: right;
}

/* 快速预设 */
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

/* 复制按钮 */
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

/* 结果网格 */
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
  text-align: center;
  padding: 16px;
}

/* 拆分信息 */
.split-info {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--panel);
}

.info-label {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.info-value {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 14px;
  color: var(--green);
}

/* 拆分表格 */
.split-table-wrap {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--line);
}

.split-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
}

.split-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.split-table th {
  background: var(--panel-2);
  color: var(--muted);
  padding: 6px 8px;
  text-align: left;
  font-weight: normal;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--line);
}

.split-table td {
  padding: 5px 8px;
  color: var(--text);
  border-bottom: 1px solid var(--line);
}

.split-table tbody tr:hover {
  background: var(--green-soft);
}

.split-table .idx {
  color: var(--muted);
  text-align: center;
  width: 40px;
}

.split-table .range-cell {
  font-size: 10px;
  color: var(--green);
}

/* IP 归属结果 */
.lookup-result-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lookup-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
}

.lookup-item.match {
  border-color: var(--green);
  background: var(--green-soft);
}

.lookup-item.no-match {
  opacity: 0.5;
}

.lookup-cidr {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 12px;
  color: var(--text);
  flex-shrink: 0;
}

.lookup-status {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  flex-shrink: 0;
}

.lookup-detail {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 10px;
  color: var(--muted);
  width: 100%;
  margin-top: 2px;
}

/* 响应式 */
@media (max-width: 640px) {
  .tab-btn {
    font-size: 11px;
    padding: 6px 10px;
  }

  .split-table {
    font-size: 10px;
  }

  .split-table th,
  .split-table td {
    padding: 4px 5px;
  }

  .preset-buttons {
    gap: 4px;
  }

  .preset-btn {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
