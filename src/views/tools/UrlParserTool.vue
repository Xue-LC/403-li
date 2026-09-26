<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔗 URL 解析器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 模式切换 -->
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="mode" value="parse" />
            <span>🔍 解析 URL</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="mode" value="build" />
            <span>✏️ 构造 URL</span>
          </label>
        </div>

        <!-- ===== 解析模式 ===== -->
        <template v-if="mode === 'parse'">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入 URL：</label>
              <textarea
                v-model="parseInput"
                placeholder="https://example.com:8080/path/to/page?key=value&foo=bar#section"
                rows="6"
                class="code-input"
              ></textarea>
            </div>
            <div class="tool-col">
              <label class="tool-label">解析结果：</label>
              <div v-if="!parseResult && !parseError" class="url-placeholder">
                请输入 URL，点击「解析」查看各组成部分
              </div>
              <div v-else-if="parseError" class="url-placeholder url-error-placeholder">
                {{ parseError }}
              </div>
              <div v-else class="url-result">
                <!-- 基本组成部分 -->
                <div class="url-parts">
                  <div class="url-part-item">
                    <span class="url-part-label">协议</span>
                    <span class="url-part-value">{{ parseResult.protocol }}</span>
                    <button class="copy-btn-inline" @click="copyField(parseResult.protocol)" title="复制">📋</button>
                  </div>
                  <div class="url-part-item">
                    <span class="url-part-label">主机</span>
                    <span class="url-part-value">{{ parseResult.hostname }}</span>
                    <button class="copy-btn-inline" @click="copyField(parseResult.hostname)" title="复制">📋</button>
                  </div>
                  <div class="url-part-item">
                    <span class="url-part-label">端口</span>
                    <span class="url-part-value">{{ parseResult.port || '(默认)' }}</span>
                    <button v-if="parseResult.port" class="copy-btn-inline" @click="copyField(parseResult.port)" title="复制">📋</button>
                  </div>
                  <div class="url-part-item">
                    <span class="url-part-label">路径</span>
                    <span class="url-part-value">{{ parseResult.pathname }}</span>
                    <button class="copy-btn-inline" @click="copyField(parseResult.pathname)" title="复制">📋</button>
                  </div>
                  <div class="url-part-item">
                    <span class="url-part-label">片段</span>
                    <span class="url-part-value">{{ parseResult.hash || '(无)' }}</span>
                    <button v-if="parseResult.hash" class="copy-btn-inline" @click="copyField(parseResult.hash)" title="复制">📋</button>
                  </div>
                  <div class="url-part-item">
                    <span class="url-part-label">源</span>
                    <span class="url-part-value">{{ parseResult.origin }}</span>
                    <button class="copy-btn-inline" @click="copyField(parseResult.origin)" title="复制">📋</button>
                  </div>
                </div>

                <!-- 查询参数表格 -->
                <div v-if="parseResult.queryParams.length > 0" class="query-section">
                  <div class="section-header-mini">
                    <span>查询参数 ({{ parseResult.queryParams.length }})</span>
                    <button class="copy-btn-inline" @click="copyField(parseResult.search)" title="复制全部">📋</button>
                  </div>
                  <table class="query-table">
                    <thead>
                      <tr>
                        <th>参数名</th>
                        <th>值</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(param, idx) in parseResult.queryParams" :key="idx">
                        <td class="query-key">{{ param.key }}</td>
                        <td class="query-val">{{ param.value }}</td>
                        <td class="query-copy">
                          <button class="copy-btn-inline" @click="copyField(param.key + '=' + param.value)" title="复制">📋</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="query-section">
                  <div class="section-header-mini">查询参数 (0)</div>
                  <div class="query-empty">无查询参数</div>
                </div>
              </div>
            </div>
          </div>

          <div class="button-group button-group-3">
            <button class="tool-button primary" @click="doParse" :disabled="!parseInput.trim()">🔍 解析</button>
            <button class="tool-button" @click="copyFullUrl" :disabled="!parseResult">📋 复制完整 URL</button>
            <button class="tool-button danger" @click="clearParse">🗑️ 清空</button>
          </div>
        </template>

        <!-- ===== 构造模式 ===== -->
        <template v-else>
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">URL 组件：</label>
              <div class="build-fields">
                <div class="build-field">
                  <label class="tool-label">协议：</label>
                  <select v-model="build.protocol" class="code-input-sm">
                    <option value="https:">https://</option>
                    <option value="http:">http://</option>
                    <option value="ftp:">ftp://</option>
                    <option value="ws:">ws://</option>
                    <option value="wss:">wss://</option>
                  </select>
                </div>
                <div class="build-field">
                  <label class="tool-label">主机名：</label>
                  <input v-model="build.hostname" class="code-input-sm" placeholder="example.com" />
                </div>
                <div class="build-field">
                  <label class="tool-label">端口：</label>
                  <input v-model="build.port" class="code-input-sm" placeholder="443" type="number" />
                </div>
                <div class="build-field">
                  <label class="tool-label">路径：</label>
                  <input v-model="build.pathname" class="code-input-sm" placeholder="/path/to/page" />
                </div>
                <div class="build-field">
                  <label class="tool-label">片段：</label>
                  <input v-model="build.hash" class="code-input-sm" placeholder="section" />
                </div>
                <div class="build-field">
                  <label class="tool-label">查询参数：</label>
                  <div class="query-builder">
                    <div v-for="(param, idx) in build.queryParams" :key="idx" class="query-row">
                      <input v-model="param.key" class="query-input" placeholder="参数名" />
                      <span class="query-eq">=</span>
                      <input v-model="param.value" class="query-input" placeholder="参数值" />
                      <button class="query-remove" @click="removeQueryParam(idx)" title="移除">✕</button>
                    </div>
                    <button class="query-add-btn" @click="addQueryParam">+ 添加参数</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">构造结果：</label>
              <textarea
                :value="builtUrl"
                readonly
                rows="6"
                class="code-input output"
                placeholder="构造的 URL 将显示在这里..."
              ></textarea>
            </div>
          </div>

          <div class="button-group button-group-3">
            <button class="tool-button primary" @click="copyBuiltUrl" :disabled="!builtUrl">📋 复制</button>
            <button class="tool-button" @click="testBuiltUrl" :disabled="!builtUrl">🧪 测试解析</button>
            <button class="tool-button danger" @click="clearBuild">🗑️ 清空</button>
          </div>
        </template>

        <!-- 状态提示 -->
        <div v-if="copyMsg" class="status-success">✅ {{ copyMsg }}</div>
        <div v-if="parseError && mode === 'parse'" class="status-error">❌ {{ parseError }}</div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

// ── 模式 ──
const mode = ref('parse')

// ── 解析模式 ──
const parseInput = ref('')
const parseResult = ref(null)
const parseError = ref('')
const copyMsg = ref('')

function doParse() {
  parseError.value = ''
  parseResult.value = null

  const raw = parseInput.value.trim()
  if (!raw) {
    parseError.value = '请输入 URL'
    return
  }

  try {
    const url = new URL(raw)
    const queryParams = []
    url.searchParams.forEach((value, key) => {
      queryParams.push({ key, value })
    })

    parseResult.value = {
      href: url.href,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      queryParams
    }
  } catch (e) {
    parseError.value = '无效的 URL：' + e.message
  }
}

function clearParse() {
  parseInput.value = ''
  parseResult.value = null
  parseError.value = ''
  copyMsg.value = ''
}

async function copyField(text) {
  if (!text) return
  if (await copyText(text)) {
    copyMsg.value = '已复制！'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  }
}

async function copyFullUrl() {
  if (!parseResult.value) return
  if (await copyText(parseResult.value.href)) {
    copyMsg.value = '完整 URL 已复制！'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  }
}

// ── 构造模式 ──
const build = reactive({
  protocol: 'https:',
  hostname: '',
  port: '',
  pathname: '',
  hash: '',
  queryParams: [{ key: '', value: '' }]
})

const builtUrl = computed(() => {
  const b = build
  if (!b.hostname.trim()) return ''

  try {
    const base = b.protocol + '//' + b.hostname.trim()
    const portStr = b.port.trim() ? ':' + b.port.trim() : ''
    const pathStr = b.pathname.trim() || '/'
    // Ensure path starts with /
    const normalizedPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr
    const queryParts = b.queryParams
      .filter(p => p.key.trim())
      .map(p => encodeURIComponent(p.key.trim()) + '=' + encodeURIComponent(p.value))
    const queryStr = queryParts.length > 0 ? '?' + queryParts.join('&') : ''
    const hashStr = b.hash.trim() ? (b.hash.trim().startsWith('#') ? b.hash.trim() : '#' + b.hash.trim()) : ''

    return base + portStr + normalizedPath + queryStr + hashStr
  } catch {
    return ''
  }
})

function addQueryParam() {
  build.queryParams.push({ key: '', value: '' })
}

function removeQueryParam(idx) {
  if (build.queryParams.length > 1) {
    build.queryParams.splice(idx, 1)
  }
}

function clearBuild() {
  build.protocol = 'https:'
  build.hostname = ''
  build.port = ''
  build.pathname = ''
  build.hash = ''
  build.queryParams = [{ key: '', value: '' }]
  copyMsg.value = ''
}

async function copyBuiltUrl() {
  if (!builtUrl.value) return
  if (await copyText(builtUrl.value)) {
    copyMsg.value = 'URL 已复制！'
    setTimeout(() => { copyMsg.value = '' }, 2000)
  }
}

function testBuiltUrl() {
  if (!builtUrl.value) return
  mode.value = 'parse'
  parseInput.value = builtUrl.value
  doParse()
}

// ── 全局复制提示重置 ──
watch(mode, () => {
  copyMsg.value = ''
  parseError.value = ''
})
</script>

<style scoped>
/* === 占位提示 === */
.url-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 180px;
  height: 100%;
  padding: 20px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  background: var(--panel);
  border: 1px solid var(--line);
}

.url-error-placeholder {
  color: var(--red);
  border-color: var(--red);
}

/* === 解析结果 === */
.url-result {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.url-parts {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.url-part-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-bottom: none;
}

.url-part-item:last-child {
  border-bottom: 1px solid var(--line);
}

.url-part-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  min-width: 40px;
  flex-shrink: 0;
}

.url-part-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--accent);
  word-break: break-all;
  flex: 1;
}

/* === 行内复制按钮 === */
.copy-btn-inline {
  padding: 2px 6px;
  font-family: var(--mono);
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

/* === 查询参数区域 === */
.query-section {
  margin-top: 8px;
}

.section-header-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent);
  text-transform: uppercase;
}

.query-empty {
  padding: 12px;
  text-align: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-top: none;
}

/* === 查询参数表格 === */
.query-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
}

.query-table thead th {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 5px 8px;
  text-align: left;
  color: var(--muted);
  font-weight: normal;
  font-size: 11px;
  text-transform: uppercase;
}

.query-table tbody td {
  border: 1px solid var(--line);
  padding: 5px 8px;
  vertical-align: middle;
}

.query-table tbody tr {
  background: var(--panel);
}

.query-table tbody tr:hover {
  background: var(--panel-2);
}

.query-key {
  color: var(--accent);
  word-break: break-all;
  max-width: 120px;
}

.query-val {
  color: var(--text);
  word-break: break-all;
}

.query-copy {
  width: 36px;
  text-align: center;
}

/* === 构造模式字段 === */
.build-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.build-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.build-field > .tool-label {
  margin-top: 0;
}

/* === 查询参数构造器 === */
.query-builder {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.query-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.query-input {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  box-sizing: border-box;
}

.query-input:focus {
  outline: none;
  border-color: var(--accent);
}

.query-eq {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  flex-shrink: 0;
}

.query-remove {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.query-remove:hover {
  border-color: var(--red);
  background: rgba(255, 80, 80, 0.1);
}

.query-add-btn {
  padding: 5px 12px;
  background: transparent;
  border: 1px dashed var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.query-add-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

/* === 响应式 === */
@media (max-width: 640px) {
  .url-part-item {
    flex-wrap: wrap;
    gap: 4px;
    padding: 5px 8px;
  }
}
</style>
