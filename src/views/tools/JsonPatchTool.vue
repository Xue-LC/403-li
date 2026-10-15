<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧩 JSON Patch 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 输入双栏 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">原 JSON：</label>
            <div class="copy-wrap">
              <textarea
                v-model="oldText"
                rows="12"
                class="code-input"
                spellcheck="false"
                placeholder='{"name": "Alice", "age": 30}'
              ></textarea>
              <button class="copy-btn" title="复制原 JSON" @click="copyInput('old')">📋</button>
            </div>
            <div v-if="oldError" class="input-error">⚠️ {{ oldError }}</div>
          </div>
          <div class="tool-col">
            <label class="tool-label">新 JSON：</label>
            <div class="copy-wrap">
              <textarea
                v-model="newText"
                rows="12"
                class="code-input"
                spellcheck="false"
                placeholder='{"name": "Alice", "age": 31}'
              ></textarea>
              <button class="copy-btn" title="复制新 JSON" @click="copyInput('new')">📋</button>
            </div>
            <div v-if="newError" class="input-error">⚠️ {{ newError }}</div>
          </div>
        </div>

        <!-- 数组比对模式 -->
        <div class="opt-row">
          <span class="tool-label opt-label">数组比对：</span>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="arrayMode" value="index" />
              <span>按索引</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="arrayMode" value="lcs" />
              <span>LCS 智能</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="arrayMode" value="whole" />
              <span>整体替换</span>
            </label>
          </div>
        </div>

        <!-- 选项 -->
        <div class="opt-row">
          <span class="tool-label opt-label">选项：</span>
          <div class="radio-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="optTest" />
              <span>replace 前插入 test 校验</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="optReverse" />
              <span>同时生成反向 patch</span>
            </label>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!patchJson" @click="copyPatch">📋 复制 Patch</button>
          <button class="tool-button" @click="swap">🔄 交换</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <!-- 空输入提示 -->
        <div v-if="!patchReady && !oldError && !newError" class="diff-hint">
          请在两栏分别输入合法的原 JSON 与新 JSON，将自动生成 RFC 6902 JSON Patch 操作序列
        </div>

        <!-- 统计 -->
        <div v-if="patchReady" class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">操作总数</span>
            <span class="stat-value">{{ ops.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">add</span>
            <span class="stat-value add">+{{ stats.add }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">remove</span>
            <span class="stat-value del">-{{ stats.remove }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">replace</span>
            <span class="stat-value mod">~{{ stats.replace }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">test</span>
            <span class="stat-value">{{ stats.test }}</span>
          </div>
        </div>

        <!-- Patch 输出 -->
        <div v-if="patchJson" class="out-block">
          <div class="out-head">
            <span>▼ JSON Patch（RFC 6902）</span>
            <span>{{ ops.length ? ops.length + ' 个操作' : '无变化' }}</span>
          </div>
          <pre class="out-body">{{ patchJson }}</pre>
          <button class="copy-btn" title="复制 Patch" @click="copyPatch">📋</button>
        </div>

        <!-- 反向 Patch 输出 -->
        <div v-if="optReverse && patchReady && reverseJson" class="out-block">
          <div class="out-head">
            <span>▲ 反向 Patch（新 → 原）</span>
            <span>{{ reverseOps.length }} 个操作</span>
          </div>
          <pre class="out-body">{{ reverseJson }}</pre>
          <button class="copy-btn" title="复制反向 Patch" @click="copyReverse">📋</button>
        </div>

        <!-- Dry-run 预览 -->
        <div v-if="patchJson" class="out-block">
          <div class="out-head">
            <span>▶ Dry-run：把 Patch 应用回原 JSON 的结果</span>
            <span>{{ dryOk ? '一致' : '不一致' }}</span>
          </div>
          <pre class="out-body">{{ dryRunJson }}</pre>
          <div class="dry-msg" :class="dryOk ? 'ok' : 'bad'">
            {{ dryOk ? '✅ Patch 应用成功，结果与新 JSON 完全一致' : '⚠️ Patch 应用结果与新 JSON 不一致：' + dryError }}
          </div>
        </div>

        <!-- 操作反馈 -->
        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ================= 状态 ================= */

const oldText = ref(
  '{\n  "name": "Alice",\n  "age": 30,\n  "city": "Beijing",\n  "hobbies": ["read", "code", "music"],\n  "active": true\n}'
)
const newText = ref(
  '{\n  "name": "Alice",\n  "age": 31,\n  "email": "alice@example.com",\n  "hobbies": ["read", "game", "music", "travel"],\n  "active": true\n}'
)
const arrayMode = ref('index') // index | lcs | whole
const optTest = ref(false)
const optReverse = ref(false)
const success = ref('')
const error = ref('')

/* ================= 解析与错误提示 ================= */

function friendlyParseError(e, text) {
  const m = /position (\d+)/.exec(e.message)
  if (m) {
    const pos = Number(m[1])
    const before = text.slice(0, pos)
    const line = before.split('\n').length
    const col = pos - before.lastIndexOf('\n')
    const msg = e.message.replace(/\s+in JSON at position \d+/, '')
    return `第 ${line} 行 第 ${col} 列：${msg}`
  }
  return e.message
}

function parseError(text) {
  if (!text.trim()) return ''
  try {
    JSON.parse(text)
    return ''
  } catch (e) {
    return friendlyParseError(e, text)
  }
}

const oldError = computed(() => parseError(oldText.value))
const newError = computed(() => parseError(newText.value))
const patchReady = computed(() => !oldError.value && !newError.value && !!oldText.value.trim() && !!newText.value.trim())

/* ================= JSON Pointer 工具 ================= */

function escSeg(seg) {
  return String(seg).replace(/~/g, '~0').replace(/\//g, '~1')
}

function joinPath(path, key) {
  return `${path}/${escSeg(key)}`
}

function parsePointer(pointer) {
  if (pointer === '') return []
  if (pointer[0] !== '/') throw new Error(`非法 JSON Pointer：${pointer}`)
  return pointer
    .slice(1)
    .split('/')
    .map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))
}

function clone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v))
}

/* ================= 类型 / 深度比较 ================= */

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true
  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) return false
  if (ta === 'array') {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  if (ta === 'object') {
    const ka = Object.keys(a)
    const kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    for (const k of ka) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false
      if (!deepEqual(a[k], b[k])) return false
    }
    return true
  }
  return false
}

/* ================= Patch 生成 ================= */

function emitReplace(ops, path, newVal, oldVal, opts) {
  if (opts.test) ops.push({ op: 'test', path, value: clone(oldVal) })
  ops.push({ op: 'replace', path, value: clone(newVal) })
}

function diffValue(oldVal, newVal, path, ops, opts) {
  if (deepEqual(oldVal, newVal)) return
  const ot = typeOf(oldVal)
  const nt = typeOf(newVal)

  // 类型不同 → 整体替换
  if (ot !== nt) {
    emitReplace(ops, path, newVal, oldVal, opts)
    return
  }

  if (ot === 'object') {
    // 先删除旧键（不在新对象里）
    for (const k of Object.keys(oldVal)) {
      if (!Object.prototype.hasOwnProperty.call(newVal, k)) {
        ops.push({ op: 'remove', path: joinPath(path, k) })
      }
    }
    // 再处理新键：新增 or 递归
    for (const k of Object.keys(newVal)) {
      if (!Object.prototype.hasOwnProperty.call(oldVal, k)) {
        ops.push({ op: 'add', path: joinPath(path, k), value: clone(newVal[k]) })
      } else {
        diffValue(oldVal[k], newVal[k], joinPath(path, k), ops, opts)
      }
    }
    return
  }

  if (ot === 'array') {
    diffArray(oldVal, newVal, path, ops, opts)
    return
  }

  // 原始值
  emitReplace(ops, path, newVal, oldVal, opts)
}

function diffArray(oldArr, newArr, path, ops, opts) {
  if (opts.arrayMode === 'whole') {
    emitReplace(ops, path, newArr, oldArr, opts)
    return
  }
  if (opts.arrayMode === 'lcs') {
    diffArrayLcs(oldArr, newArr, path, ops, opts)
    return
  }
  // 按索引
  const min = Math.min(oldArr.length, newArr.length)
  for (let i = 0; i < min; i++) {
    diffValue(oldArr[i], newArr[i], joinPath(path, i), ops, opts)
  }
  if (newArr.length > oldArr.length) {
    for (let i = oldArr.length; i < newArr.length; i++) {
      ops.push({ op: 'add', path: joinPath(path, i), value: clone(newArr[i]) })
    }
  } else if (oldArr.length > newArr.length) {
    for (let i = oldArr.length - 1; i >= newArr.length; i--) {
      ops.push({ op: 'remove', path: joinPath(path, i) })
    }
  }
}

/** 基于最长公共子序列的数组比对：识别插入 / 删除，减少 replace 噪声 */
function diffArrayLcs(oldArr, newArr, path, ops, opts) {
  const n = oldArr.length
  const m = newArr.length
  // dp[i][j] = old[i:] 与 new[j:] 的 LCS 长度
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = deepEqual(oldArr[i], newArr[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  // 正向回溯求出所有匹配的 (i, j) 对
  const matchedOld = new Set()
  const matchedNew = new Set()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (deepEqual(oldArr[i], newArr[j])) {
      matchedOld.add(i)
      matchedNew.add(j)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      j++
    }
  }

  // 先按原数组索引从大到小删除，再按目标索引从小到大插入
  const removes = []
  for (let k = 0; k < n; k++) {
    if (!matchedOld.has(k)) removes.push(k)
  }
  for (let k = removes.length - 1; k >= 0; k--) {
    ops.push({ op: 'remove', path: joinPath(path, removes[k]) })
  }
  for (let k = 0; k < m; k++) {
    if (!matchedNew.has(k)) {
      ops.push({ op: 'add', path: joinPath(path, k), value: clone(newArr[k]) })
    }
  }
}

function buildPatch(oldVal, newVal, opts) {
  const ops = []
  diffValue(oldVal, newVal, '', ops, opts)
  return ops
}

/* ================= 计算 Patch ================= */

function safeParse(text) {
  return JSON.parse(text)
}

const ops = computed(() => {
  if (!patchReady.value) return []
  try {
    const opts = { arrayMode: arrayMode.value, test: optTest.value }
    return buildPatch(safeParse(oldText.value), safeParse(newText.value), opts)
  } catch {
    return []
  }
})

const reverseOps = computed(() => {
  if (!patchReady.value) return []
  try {
    const opts = { arrayMode: arrayMode.value, test: optTest.value }
    return buildPatch(safeParse(newText.value), safeParse(oldText.value), opts)
  } catch {
    return []
  }
})

const patchJson = computed(() => {
  if (!patchReady.value) return ''
  return JSON.stringify(ops.value, null, 2)
})

const reverseJson = computed(() => {
  if (!patchReady.value) return ''
  return JSON.stringify(reverseOps.value, null, 2)
})

const stats = computed(() => {
  const s = { add: 0, remove: 0, replace: 0, test: 0, move: 0, copy: 0 }
  for (const op of ops.value) {
    if (s[op.op] !== undefined) s[op.op]++
  }
  return s
})

/* ================= Patch 应用（Dry-run） ================= */

function applyOp(doc, op) {
  const segs = parsePointer(op.path)
  if (segs.length === 0) {
    if (op.op === 'remove') return undefined
    if (op.op === 'add' || op.op === 'replace') return clone(op.value)
    if (op.op === 'test') {
      if (!deepEqual(doc, op.value)) throw new Error('test 校验失败（根节点）')
      return doc
    }
    return doc
  }
  let parent = doc
  for (let i = 0; i < segs.length - 1; i++) {
    parent = parent[segs[i]]
    if (parent === undefined || parent === null) {
      throw new Error(`路径不存在：${op.path}`)
    }
  }
  const key = segs[segs.length - 1]
  if (Array.isArray(parent)) {
    const idx = key === '-' ? parent.length : Number(key)
    if (op.op === 'add') {
      parent.splice(idx, 0, clone(op.value))
    } else if (op.op === 'remove') {
      parent.splice(idx, 1)
    } else if (op.op === 'replace') {
      parent[idx] = clone(op.value)
    } else if (op.op === 'test') {
      if (!deepEqual(parent[idx], op.value)) throw new Error(`test 校验失败：${op.path}`)
    }
  } else {
    if (op.op === 'add' || op.op === 'replace') {
      parent[key] = clone(op.value)
    } else if (op.op === 'remove') {
      delete parent[key]
    } else if (op.op === 'test') {
      if (!deepEqual(parent[key], op.value)) throw new Error(`test 校验失败：${op.path}`)
    }
  }
  return doc
}

const dryRun = computed(() => {
  if (!patchReady.value) return { ok: false, json: '', error: '' }
  try {
    let doc = clone(safeParse(oldText.value))
    for (const op of ops.value) doc = applyOp(doc, op)
    const target = safeParse(newText.value)
    const ok = deepEqual(doc, target)
    return { ok, json: JSON.stringify(doc, null, 2), error: ok ? '' : '应用结果与目标 JSON 不一致' }
  } catch (e) {
    return { ok: false, json: '', error: e.message }
  }
})

const dryOk = computed(() => dryRun.value.ok)
const dryError = computed(() => dryRun.value.error)
const dryRunJson = computed(() => dryRun.value.json)

/* ================= 操作 ================= */

function flash(type, msg) {
  if (type === 'success') {
    success.value = msg
    setTimeout(() => { if (success.value === msg) success.value = '' }, 2000)
  } else {
    error.value = msg
    setTimeout(() => { if (error.value === msg) error.value = '' }, 2000)
  }
}

async function copyInput(side) {
  const text = side === 'old' ? oldText.value : newText.value
  if (!text.trim()) {
    flash('error', '输入为空，无可复制内容')
    return
  }
  if (await copyText(text)) {
    flash('success', side === 'old' ? '原 JSON 已复制到剪贴板' : '新 JSON 已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

async function copyPatch() {
  if (!patchJson.value) {
    flash('error', '暂无可复制的 Patch')
    return
  }
  if (await copyText(patchJson.value)) {
    flash('success', 'JSON Patch 已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

async function copyReverse() {
  if (!reverseJson.value) {
    flash('error', '暂无可复制的反向 Patch')
    return
  }
  if (await copyText(reverseJson.value)) {
    flash('success', '反向 Patch 已复制到剪贴板')
  } else {
    flash('error', '复制失败，请手动复制')
  }
}

function swap() {
  const t = oldText.value
  oldText.value = newText.value
  newText.value = t
}

function clear() {
  oldText.value = ''
  newText.value = ''
  success.value = ''
  error.value = ''
}
</script>

<style scoped>
.copy-wrap {
  position: relative;
}

.input-error {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--red);
  word-break: break-all;
}

/* 选项行 */
.opt-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.opt-row .tool-label {
  margin: 0;
}

.opt-label {
  min-width: 72px;
}

/* 空输入提示 */
.diff-hint {
  margin-top: 1rem;
  padding: 14px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  text-align: center;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 1rem;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 18px;
  color: var(--text);
}

.stat-value.add { color: var(--green); }
.stat-value.del { color: var(--red); }
.stat-value.mod { color: var(--amber); }

/* 输出块 */
.out-block {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  margin-top: 12px;
}

.out-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 46px 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.out-body {
  margin: 0;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}

.dry-msg {
  padding: 8px 12px;
  border-top: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
  word-break: break-all;
}

.dry-msg.ok { color: var(--green); }
.dry-msg.bad { color: var(--red); }

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .out-head {
    font-size: 11px;
  }

  .out-body {
    max-height: 320px;
    font-size: 12px;
  }
}
</style>
