<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 Chmod 转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <label class="tool-label">八进制：</label>
            <input
              class="code-input-sm"
              v-model="octal"
              @input="onOctalChange"
              placeholder="例如 755 或 4755"
            />

            <label class="tool-label">符号：</label>
            <input
              class="code-input-sm"
              v-model="symbolic"
              @input="onSymbolicChange"
              placeholder="例如 rwxr-xr-x"
            />

            <!-- 权限勾选网格 -->
            <label class="tool-label">权限勾选：</label>
            <div class="perm-grid">
              <div class="perm-hdr">
                <span class="perm-lbl"></span>
                <span class="perm-hdr-item">读</span>
                <span class="perm-hdr-item">写</span>
                <span class="perm-hdr-item">执行</span>
              </div>
              <div class="perm-row">
                <span class="perm-lbl">属主</span>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.owner.read" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.owner.write" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.owner.execute" @change="onPermsChange" /></label>
              </div>
              <div class="perm-row">
                <span class="perm-lbl">属组</span>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.group.read" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.group.write" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.group.execute" @change="onPermsChange" /></label>
              </div>
              <div class="perm-row">
                <span class="perm-lbl">其他</span>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.other.read" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.other.write" @change="onPermsChange" /></label>
                <label class="checkbox-label perm-cb"><input type="checkbox" v-model="perms.other.execute" @change="onPermsChange" /></label>
              </div>
            </div>

            <!-- 特殊权限位 -->
            <label class="tool-label">特殊权限：</label>
            <div class="special-bits">
              <label class="checkbox-label">
                <input type="checkbox" v-model="perms.special.suid" @change="onPermsChange" />
                <span>SUID (4---)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="perms.special.sgid" @change="onPermsChange" />
                <span>SGID (2---)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="perms.special.sticky" @change="onPermsChange" />
                <span>Sticky (1---)</span>
              </label>
            </div>

            <!-- 递归选项 -->
            <label class="checkbox-label" style="margin-top: 8px">
              <input type="checkbox" v-model="recursive" />
              <span>递归 (-R)</span>
            </label>
          </div>

          <!-- 右栏：结果 -->
          <div class="tool-col">
            <label class="tool-label">结果：</label>
            <div class="result-display">
              <span class="result-text">{{ resultText }}</span>
              <button class="copy-btn" @click="copyResult" title="复制">📋</button>
            </div>

            <div v-if="octal || symbolic" class="perm-summary">
              <div class="summary-row">
                <span class="summary-key">八进制：</span>
                <code class="summary-val">{{ displayOctal }}</code>
                <button class="copy-btn-inline" @click="copyOctal" title="复制八进制">📋</button>
              </div>
              <div class="summary-row">
                <span class="summary-key">符号：</span>
                <code class="summary-val">{{ displaySymbolic }}</code>
                <button class="copy-btn-inline" @click="copySymbolic" title="复制符号">📋</button>
              </div>
              <div class="summary-row">
                <span class="summary-key">命令：</span>
                <code class="summary-val">{{ chmodCmd }}</code>
                <button class="copy-btn-inline" @click="copyCmd" title="复制命令">📋</button>
              </div>
            </div>

            <div v-if="!octal && !symbolic" class="perm-placeholder">
              输入八进制或符号权限，或勾选权限位查看结果
            </div>
          </div>
        </div>

        <!-- 状态提示 -->
        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// ── 状态 ──
const octal = ref('755')
const symbolic = ref('')
const perms = ref({
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
  special: { suid: false, sgid: false, sticky: false }
})
const recursive = ref(false)
const error = ref('')
const success = ref('')

// 防重入标志
let isUpdating = false

// ── 计算属性 ──
const displayOctal = computed(() => {
  if (!octal.value) return '—'
  return octal.value
})

const displaySymbolic = computed(() => {
  if (!symbolic.value) return '—'
  return symbolic.value
})

const resultText = computed(() => {
  if (!octal.value && !symbolic.value) return '等待输入...'
  const o = octal.value || buildOctal()
  const s = symbolic.value || buildSymbolic()
  return `${o}  ⟷  ${s}`
})

const chmodCmd = computed(() => {
  if (!octal.value && !symbolic.value) return 'chmod <权限> <文件>'
  const o = octal.value || buildOctal()
  const r = recursive.value ? '-R ' : ''
  return `chmod ${r}${o} <文件>`
})

// ── 核心转换：权限对象 → 八进制 ──
function buildOctal() {
  const p = perms.value
  let special = 0
  if (p.special.suid) special += 4
  if (p.special.sgid) special += 2
  if (p.special.sticky) special += 1

  const owner = (p.owner.read ? 4 : 0) + (p.owner.write ? 2 : 0) + (p.owner.execute ? 1 : 0)
  const group = (p.group.read ? 4 : 0) + (p.group.write ? 2 : 0) + (p.group.execute ? 1 : 0)
  const other = (p.other.read ? 4 : 0) + (p.other.write ? 2 : 0) + (p.other.execute ? 1 : 0)

  if (special > 0) {
    return `${special}${owner}${group}${other}`
  }
  return `${owner}${group}${other}`
}

// ── 核心转换：权限对象 → 符号 ──
function buildSymbolic() {
  const p = perms.value
  const parts = []

  // 属主
  let owner = ''
  owner += p.owner.read ? 'r' : '-'
  owner += p.owner.write ? 'w' : '-'
  if (p.special.suid) {
    owner += p.owner.execute ? 's' : 'S'
  } else {
    owner += p.owner.execute ? 'x' : '-'
  }
  parts.push(owner)

  // 属组
  let group = ''
  group += p.group.read ? 'r' : '-'
  group += p.group.write ? 'w' : '-'
  if (p.special.sgid) {
    group += p.group.execute ? 's' : 'S'
  } else {
    group += p.group.execute ? 'x' : '-'
  }
  parts.push(group)

  // 其他
  let other = ''
  other += p.other.read ? 'r' : '-'
  other += p.other.write ? 'w' : '-'
  if (p.special.sticky) {
    other += p.other.execute ? 't' : 'T'
  } else {
    other += p.other.execute ? 'x' : '-'
  }
  parts.push(other)

  return parts.join('')
}

// ── 解析八进制 → 权限对象 ──
function parseOctal(val) {
  const trimmed = val.trim()
  if (!trimmed) return null

  // 验证：只允许 0-7
  if (!/^[0-7]{3,4}$/.test(trimmed)) return null

  const digits = trimmed.split('').map(Number)
  let special = { suid: false, sgid: false, sticky: false }
  let ownerDigit, groupDigit, otherDigit

  if (digits.length === 4) {
    special.suid = !!(digits[0] & 4)
    special.sgid = !!(digits[0] & 2)
    special.sticky = !!(digits[0] & 1)
    ownerDigit = digits[1]
    groupDigit = digits[2]
    otherDigit = digits[3]
  } else {
    ownerDigit = digits[0]
    groupDigit = digits[1]
    otherDigit = digits[2]
  }

  return {
    owner: {
      read: !!(ownerDigit & 4),
      write: !!(ownerDigit & 2),
      execute: !!(ownerDigit & 1)
    },
    group: {
      read: !!(groupDigit & 4),
      write: !!(groupDigit & 2),
      execute: !!(groupDigit & 1)
    },
    other: {
      read: !!(otherDigit & 4),
      write: !!(otherDigit & 2),
      execute: !!(otherDigit & 1)
    },
    special
  }
}

// ── 解析符号 → 权限对象 ──
function parseSymbolic(val) {
  const trimmed = val.trim()
  if (!trimmed) return null

  // 必须是 9 字符
  if (trimmed.length !== 9) return null

  const chars = trimmed.split('')
  const parts = [
    chars.slice(0, 3),
    chars.slice(3, 6),
    chars.slice(6, 9)
  ]

  const special = { suid: false, sgid: false, sticky: false }

  function parseTriplet(triplet, idx) {
    const expect = (i, ch, alt) => {
      const c = triplet[i]
      if (c === ch) return true
      if (c === alt) {
        // 特殊位大写
        if (idx === 0) special.suid = true
        else if (idx === 1) special.sgid = true
        else special.sticky = true
        return false
      }
      return false
    }
    const expectSpecial = (i, chLower, chUpper) => {
      const c = triplet[i]
      if (c === chLower) return true
      if (c === chUpper) {
        if (idx === 0) special.suid = true
        else if (idx === 1) special.sgid = true
        else special.sticky = true
        return true
      }
      return false
    }

    const read = triplet[0] === 'r'
    const write = triplet[1] === 'w'

    let execute = false
    const xChar = triplet[2]
    if (xChar === 'x' || xChar === 'X') {
      execute = true
    } else if (xChar === 's' || xChar === 'S') {
      if (idx === 0) special.suid = true
      else if (idx === 1) special.sgid = true
      execute = (xChar === 's')
    } else if (xChar === 't' || xChar === 'T') {
      if (idx === 2) special.sticky = true
      execute = (xChar === 't')
    }

    // 验证每个字符合法
    const validChars = 'rwxstST-'
    for (const c of triplet) {
      if (!validChars.includes(c)) return null
    }

    return { read, write, execute }
  }

  const owner = parseTriplet(parts[0], 0)
  const group = parseTriplet(parts[1], 1)
  const other = parseTriplet(parts[2], 2)

  if (!owner || !group || !other) return null

  return { owner, group, other, special }
}

// ── 从权限对象更新输入框（静默） ──
function syncInputsFromPerms() {
  isUpdating = true
  octal.value = buildOctal()
  symbolic.value = buildSymbolic()
  error.value = ''
  isUpdating = false
}

// ── 事件处理 ──
function onOctalChange() {
  if (isUpdating) return
  const val = octal.value.trim()
  if (!val) {
    error.value = ''
    return
  }
  const parsed = parseOctal(val)
  if (!parsed) {
    error.value = '无效的八进制权限（请输入 3-4 位 0-7 数字，如 755 或 4755）'
    return
  }
  isUpdating = true
  perms.value = { ...parsed }
  octal.value = val // 保留用户输入格式
  symbolic.value = buildSymbolic()
  error.value = ''
  isUpdating = false
}

function onSymbolicChange() {
  if (isUpdating) return
  const val = symbolic.value.trim()
  if (!val) {
    error.value = ''
    return
  }
  const parsed = parseSymbolic(val)
  if (!parsed) {
    error.value = '无效的符号权限（请输入 9 位 rwx 格式，如 rwxr-xr-x）'
    return
  }
  isUpdating = true
  perms.value = { ...parsed }
  symbolic.value = val
  octal.value = buildOctal()
  error.value = ''
  isUpdating = false
}

function onPermsChange() {
  if (isUpdating) return
  isUpdating = true
  octal.value = buildOctal()
  symbolic.value = buildSymbolic()
  error.value = ''
  isUpdating = false
}

// ── 复制 ──
async function copyResult() {
  const text = resultText.value
  if (text === '等待输入...') return
  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

async function copyOctal() {
  if (!octal.value) return
  if (await copyText(octal.value)) {
    success.value = '已复制八进制'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

async function copySymbolic() {
  if (!symbolic.value) return
  if (await copyText(symbolic.value)) {
    success.value = '已复制符号'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

async function copyCmd() {
  if (await copyText(chmodCmd.value)) {
    success.value = '已复制命令'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

// ── 初始化 ──
syncInputsFromPerms()
</script>

<style scoped>
/* ── 权限网格 ── */
.perm-grid {
  border: 1px solid var(--line);
  background: var(--panel);
}

.perm-hdr {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 1fr;
  padding: 6px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-2);
}

.perm-hdr-item {
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.perm-row {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 1fr;
  padding: 4px 12px;
  border-bottom: 1px solid var(--line);
  align-items: center;
}

.perm-row:last-child {
  border-bottom: none;
}

.perm-lbl {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
}

.perm-cb {
  display: flex;
  justify-content: center;
  margin: 0;
}

.perm-cb span {
  display: none;
}

/* ── 特殊权限 ── */
.special-bits {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* ── 结果显示 ── */
.result-display {
  background: rgba(157,255,107,0.03);
  border: 1px solid rgba(157,255,107,0.2);
  padding: 16px;
  position: relative;
  font-family: var(--mono);
  font-size: 18px;
  color: var(--green);
  text-align: center;
  word-break: break-all;
}

.result-text {
  user-select: all;
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 14px;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
}

/* ── 权限摘要 ── */
.perm-summary {
  margin-top: 12px;
  border: 1px solid var(--line);
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 13px;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-key {
  color: var(--muted);
  min-width: 70px;
  text-transform: uppercase;
  font-size: 11px;
}

.summary-val {
  flex: 1;
  color: var(--green);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn-inline {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
}

/* ── 占位提示 ── */
.perm-placeholder {
  margin-top: 12px;
  padding: 20px;
  text-align: center;
  color: var(--dim);
  font-family: var(--mono);
  font-size: 13px;
  border: 1px dashed var(--line);
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .perm-grid {
    font-size: 12px;
  }
  .perm-hdr {
    grid-template-columns: 50px 1fr 1fr 1fr;
    padding: 4px 8px;
  }
  .perm-row {
    grid-template-columns: 50px 1fr 1fr 1fr;
    padding: 4px 8px;
  }
  .perm-lbl {
    font-size: 11px;
  }
  .result-display {
    font-size: 16px;
    padding: 12px;
  }
  .special-bits {
    flex-direction: column;
    gap: 4px;
  }
  .summary-row {
    flex-wrap: wrap;
  }
}
</style>
