<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌐 HTTP 状态码查询</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：搜索 + 列表 -->
          <div class="tool-col">
            <label class="tool-label">搜索：</label>
            <input
              class="code-input-sm"
              v-model="search"
              placeholder="输入状态码数字或关键词..."
            />

            <label class="tool-label">状态码列表：</label>
            <div class="status-list">
              <template v-for="category in filteredCategories" :key="category.range">
                <div class="category-header">{{ category.label }}</div>
                <div
                  v-for="code in category.codes"
                  :key="code.code"
                  class="status-item"
                  :class="{ active: selected && selected.code === code.code }"
                  @click="selectCode(code, category.label)"
                >
                  <span class="status-code-badge" :class="'badge-' + Math.floor(code.code / 100) + 'xx'">
                    {{ code.code }}
                  </span>
                  <span class="status-name">{{ code.name }}</span>
                </div>
              </template>
              <div v-if="filteredCategories.length === 0" class="status-empty">
                未找到匹配的状态码
              </div>
            </div>
          </div>

          <!-- 右侧：详情 -->
          <div class="tool-col">
            <label class="tool-label">详情：</label>
            <div v-if="selected" class="detail-card">
              <div class="detail-header">
                <span class="detail-code-badge" :class="'badge-' + Math.floor(selected.code / 100) + 'xx'">
                  {{ selected.code }}
                </span>
                <span class="detail-name">{{ selected.name }}</span>
              </div>
              <div class="detail-category">{{ selectedCategory }}</div>
              <div class="detail-desc">{{ selected.description }}</div>

              <div v-if="selected.note" class="detail-note">
                <strong>注意：</strong>{{ selected.note }}
              </div>

              <div class="detail-actions">
                <button class="tool-button" @click="copyDetail">📋 复制详情</button>
              </div>
            </div>
            <div v-else class="detail-empty">
              <div class="detail-empty-icon">👈</div>
              <div class="detail-empty-text">从左侧列表选择或搜索状态码</div>
            </div>
          </div>
        </div>

        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const search = ref('')
const selected = ref(null)
const selectedCategory = ref('')
const success = ref(false)

// 完整 HTTP 状态码数据
const statusData = [
  // 1xx - 信息性
  { code: 100, name: 'Continue', description: '客户端应继续其请求。服务器已收到请求头，客户端应发送请求体。', category: '1xx' },
  { code: 101, name: 'Switching Protocols', description: '服务器同意切换协议。客户端通过 Upgrade 请求头请求更改协议，服务器已同意。', category: '1xx' },
  { code: 102, name: 'Processing', description: '服务器已收到并正在处理请求，但无响应可用。用于 WebDAV。', category: '1xx', note: 'WebDAV 扩展（RFC 2518）' },
  { code: 103, name: 'Early Hints', description: '在最终 HTTP 消息之前返回一些响应头。用于预加载资源，优化页面加载速度。', category: '1xx', note: 'RFC 8297' },

  // 2xx - 成功
  { code: 200, name: 'OK', description: '请求成功。响应体包含请求的资源。GET、POST、PUT 等操作方法均可能返回此状态码。', category: '2xx' },
  { code: 201, name: 'Created', description: '请求成功并且创建了新资源。通常在 POST 或 PUT 请求后返回，Location 头包含新资源的 URL。', category: '2xx' },
  { code: 202, name: 'Accepted', description: '请求已被接受，但尚未处理完成。适用于异步操作，请求可能最终被处理或不被处理。', category: '2xx' },
  { code: 203, name: 'Non-Authoritative Information', description: '请求成功，但返回的元信息来自第三方缓存（非原始服务器），可能与原始服务器不同。', category: '2xx' },
  { code: 204, name: 'No Content', description: '请求成功，但响应体不包含任何内容。DELETE 操作常用此状态码，浏览器页面不会刷新。', category: '2xx' },
  { code: 205, name: 'Reset Content', description: '请求成功，客户端应重置（清空）文档视图。常用于表单提交后清除所有输入字段。', category: '2xx' },
  { code: 206, name: 'Partial Content', description: '部分内容。响应包含 Range 请求头指定的那部分数据。用于断点续传和分块下载。', category: '2xx' },
  { code: 207, name: 'Multi-Status', description: '多状态响应。响应体包含多个独立的操作结果。WebDAV 中使用。', category: '2xx', note: 'WebDAV 扩展（RFC 4918）' },
  { code: 208, name: 'Already Reported', description: 'DAV 绑定的成员已在响应前部分中列出，不再重复包含。', category: '2xx', note: 'WebDAV 扩展（RFC 5842）' },
  { code: 226, name: 'IM Used', description: '服务器已完成对资源的 GET 请求，响应是一个或多个实例操作结果的表示。', category: '2xx', note: 'RFC 3229（Delta encoding）' },

  // 3xx - 重定向
  { code: 300, name: 'Multiple Choices', description: '请求的资源有多个可能的响应。用户或客户端应选择一个。Location 头或响应体包含选择列表。', category: '3xx' },
  { code: 301, name: 'Moved Permanently', description: '资源已永久移动到新 URL。搜索引擎会将索引更改为新 URL，浏览器会缓存此重定向。', category: '3xx' },
  { code: 302, name: 'Found', description: '资源临时移动到新 URL。客户端应继续使用原始 URL 进行后续请求。搜索引擎不会更新索引。', category: '3xx' },
  { code: 303, name: 'See Other', description: '响应可在另一个 URL 找到，应使用 GET 方法获取。常用于 POST 后重定向到确认页面。', category: '3xx' },
  { code: 304, name: 'Not Modified', description: '资源未修改。客户端可以使用缓存的版本。响应不包含消息体，节省带宽。', category: '3xx' },
  { code: 305, name: 'Use Proxy', description: '请求的资源必须通过 Location 头中指定的代理访问。已废弃，存在安全风险。', category: '3xx', note: '已废弃（HTTP/1.1）' },
  { code: 306, name: '(Unused)', description: '此状态码在 HTTP/1.1 规范中保留但不再使用。之前曾用于 Switch Proxy。', category: '3xx', note: '不再使用' },
  { code: 307, name: 'Temporary Redirect', description: '资源临时移动到新 URL。与 302 类似，但要求客户端保持原始 HTTP 方法（POST 仍为 POST）。', category: '3xx' },
  { code: 308, name: 'Permanent Redirect', description: '资源永久移动到新 URL。与 301 类似，但要求客户端保持原始 HTTP 方法不变。', category: '3xx' },

  // 4xx - 客户端错误
  { code: 400, name: 'Bad Request', description: '服务器无法理解请求。常见原因：请求语法错误、请求参数不正确、请求体格式无效。', category: '4xx' },
  { code: 401, name: 'Unauthorized', description: '请求需要用户身份验证。客户端必须在请求中包含有效的认证凭据（如 Authorization 头）。', category: '4xx' },
  { code: 402, name: 'Payment Required', description: '需要付款。保留供将来使用，目前在实际开发中很少使用。', category: '4xx', note: '保留状态码' },
  { code: 403, name: 'Forbidden', description: '服务器理解请求但拒绝执行。用户已认证但没有访问权限。与 401 不同的是，重新认证不会解决问题。', category: '4xx' },
  { code: 404, name: 'Not Found', description: '服务器找不到请求的资源。资源可能不存在或 URL 路径错误。最常见的 HTTP 错误之一。', category: '4xx' },
  { code: 405, name: 'Method Not Allowed', description: '请求方法不被资源支持。例如对只读资源使用 POST。Allow 响应头列出允许的方法。', category: '4xx' },
  { code: 406, name: 'Not Acceptable', description: '服务器无法生成客户端 Accept 头指定的内容类型。内容协商失败。', category: '4xx' },
  { code: 407, name: 'Proxy Authentication Required', description: '需要通过代理服务器进行身份验证。与 401 类似，但针对代理服务器。', category: '4xx' },
  { code: 408, name: 'Request Timeout', description: '服务器等待请求超时。客户端在规定时间内未完成请求发送。', category: '4xx' },
  { code: 409, name: 'Conflict', description: '请求与服务器当前状态冲突。常见于并发写入或版本不匹配（如 PUT 操作）。', category: '4xx' },
  { code: 410, name: 'Gone', description: '资源已永久删除且没有转发地址。与 404 不同，410 表示资源曾经存在但已被有意移除。', category: '4xx' },
  { code: 411, name: 'Length Required', description: '服务器要求请求必须包含 Content-Length 头。', category: '4xx' },
  { code: 412, name: 'Precondition Failed', description: '客户端设置的先决条件（如 If-Match、If-Unmodified-Since）未满足。', category: '4xx' },
  { code: 413, name: 'Payload Too Large', description: '请求体大小超过服务器允许的上限。服务器可能关闭连接或返回 Retry-After 头。', category: '4xx' },
  { code: 414, name: 'URI Too Long', description: '请求的 URI 超过服务器允许的最大长度。常见于 GET 请求查询字符串过长或路径嵌套过深。', category: '4xx' },
  { code: 415, name: 'Unsupported Media Type', description: '服务器不支持请求体的媒体格式。例如客户端发送 XML 但服务器只接受 JSON。', category: '4xx' },
  { code: 416, name: 'Range Not Satisfiable', description: '请求的 Range 范围不在资源的有效范围内。例如请求的字节范围超过文件大小。', category: '4xx' },
  { code: 417, name: 'Expectation Failed', description: '服务器无法满足 Expect 请求头的要求。', category: '4xx' },
  { code: 418, name: "I'm a teapot", description: '服务器拒绝冲泡咖啡，因为它是茶壶。源自 1998 年愚人节 RFC 2324（HTCPCP 超文本咖啡壶控制协议）。', category: '4xx', note: '愚人节 RFC（RFC 2324），非正式状态码' },
  { code: 421, name: 'Misdirected Request', description: '请求被发送到无法生成响应的服务器。服务器没有针对该 URI scheme 和 authority 的响应。', category: '4xx' },
  { code: 422, name: 'Unprocessable Entity', description: '服务器理解请求内容类型且语法正确，但语义错误或无法处理。常用于表单验证失败。WebDAV 和 REST API 常用。', category: '4xx' },
  { code: 423, name: 'Locked', description: '目标资源被锁定。WebDAV 中使用 LOCK 方法设置的锁阻止了操作。', category: '4xx', note: 'WebDAV 扩展（RFC 4918）' },
  { code: 424, name: 'Failed Dependency', description: '请求失败，因为它依赖的另一个请求也失败了。WebDAV 中使用。', category: '4xx', note: 'WebDAV 扩展（RFC 4918）' },
  { code: 425, name: 'Too Early', description: '服务器拒绝处理可能被重放的请求。与 TLS 1.3 的 0-RTT 数据相关。', category: '4xx', note: 'RFC 8470' },
  { code: 426, name: 'Upgrade Required', description: '服务器要求客户端使用升级后的协议（如 HTTP/2、WebSocket）。Upgrade 头指定所需协议。', category: '4xx' },
  { code: 428, name: 'Precondition Required', description: '服务器要求请求必须是条件请求。防止"丢失更新"问题（如两个客户端同时编辑同一资源）。', category: '4xx', note: 'RFC 6585' },
  { code: 429, name: 'Too Many Requests', description: '客户端在给定时间内发送了过多请求（速率限制）。Retry-After 头指示需等待的时间。', category: '4xx', note: 'RFC 6585' },
  { code: 431, name: 'Request Header Fields Too Large', description: '请求头字段太大（可能是单个头字段或所有头字段的总大小）。减小请求头后重试。', category: '4xx', note: 'RFC 6585' },
  { code: 451, name: 'Unavailable For Legal Reasons', description: '因法律原因不可用。资源因政府审查、版权侵权等法律原因被屏蔽。参考 Ray Bradbury 的小说《华氏451度》。', category: '4xx', note: 'RFC 7725' },

  // 5xx - 服务器错误
  { code: 500, name: 'Internal Server Error', description: '服务器内部错误。服务器遇到了意料之外的情况，无法完成请求。最常见的服务器错误。', category: '5xx' },
  { code: 501, name: 'Not Implemented', description: '服务器不支持请求的功能（通常是 HTTP 方法）。可能在未来版本中支持。', category: '5xx' },
  { code: 502, name: 'Bad Gateway', description: '网关或代理从上游服务器收到无效响应。常见于 Nginx 反向代理后端服务宕机。', category: '5xx' },
  { code: 503, name: 'Service Unavailable', description: '服务暂时不可用。服务器过载或正在维护。Retry-After 头指示恢复时间。', category: '5xx' },
  { code: 504, name: 'Gateway Timeout', description: '网关或代理在规定时间内未收到上游服务器响应。常见于后端服务响应过慢。', category: '5xx' },
  { code: 505, name: 'HTTP Version Not Supported', description: '服务器不支持请求使用的 HTTP 版本。', category: '5xx' },
  { code: 506, name: 'Variant Also Negotiates', description: '透明内容协商导致循环引用。服务器配置错误。', category: '5xx', note: 'RFC 2295' },
  { code: 507, name: 'Insufficient Storage', description: '服务器存储空间不足，无法完成请求。WebDAV 中使用。', category: '5xx', note: 'WebDAV 扩展（RFC 4918）' },
  { code: 508, name: 'Loop Detected', description: '服务器在处理请求时检测到无限循环。WebDAV 中使用。', category: '5xx', note: 'WebDAV 扩展（RFC 5842）' },
  { code: 510, name: 'Not Extended', description: '服务器需要客户端进一步扩展请求才能处理。客户端应包含扩展声明。', category: '5xx', note: 'RFC 2774' },
  { code: 511, name: 'Network Authentication Required', description: '客户端需要通过网关的网络认证才能访问互联网。常用于公共 Wi-Fi 的强制门户。', category: '5xx', note: 'RFC 6585' }
]

// 分类定义
const categoryGroups = [
  { range: '1xx', label: '1xx — 信息性响应', codes: statusData.filter(s => s.category === '1xx') },
  { range: '2xx', label: '2xx — 成功响应', codes: statusData.filter(s => s.category === '2xx') },
  { range: '3xx', label: '3xx — 重定向', codes: statusData.filter(s => s.category === '3xx') },
  { range: '4xx', label: '4xx — 客户端错误', codes: statusData.filter(s => s.category === '4xx') },
  { range: '5xx', label: '5xx — 服务器错误', codes: statusData.filter(s => s.category === '5xx') }
]

const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return categoryGroups

  return categoryGroups
    .map(cat => ({
      ...cat,
      codes: cat.codes.filter(c =>
        String(c.code).includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
    }))
    .filter(cat => cat.codes.length > 0)
})

function selectCode(code, catLabel) {
  selected.value = code
  selectedCategory.value = catLabel
  success.value = false
}

async function copyDetail() {
  if (!selected.value) return
  const lines = [
    `HTTP ${selected.value.code} ${selected.value.name}`,
    `分类：${selectedCategory.value}`,
    `描述：${selected.value.description}`,
  ]
  if (selected.value.note) {
    lines.push(`备注：${selected.value.note}`)
  }
  const text = lines.join('\n')

  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  }
}
</script>

<style scoped>
/* === 状态码列表 === */
.status-list {
  max-height: 480px;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.category-header {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
  padding: 10px 12px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 1;
}

.category-header:first-child {
  border-top: none;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-family: var(--mono);
  font-size: 13px;
}

.status-item:last-child {
  border-bottom: none;
}

.status-item:hover {
  background: var(--green-soft);
}

.status-item.active {
  background: var(--green-soft);
  border-left: 3px solid var(--green);
  padding-left: 9px;
}

/* 状态码小徽章 */
.status-code-badge {
  display: inline-block;
  min-width: 42px;
  padding: 2px 6px;
  text-align: center;
  font-size: 12px;
  font-family: var(--mono);
  border: 1px solid;
  flex-shrink: 0;
}

.badge-1xx { color: #6c5ce7; border-color: rgba(108, 92, 231, 0.4); background: rgba(108, 92, 231, 0.08); }
.badge-2xx { color: #00b894; border-color: rgba(0, 184, 148, 0.4); background: rgba(0, 184, 148, 0.08); }
.badge-3xx { color: #fdcb6e; border-color: rgba(253, 203, 110, 0.4); background: rgba(253, 203, 110, 0.08); }
.badge-4xx { color: #e17055; border-color: rgba(225, 112, 85, 0.4); background: rgba(225, 112, 85, 0.08); }
.badge-5xx { color: #d63031; border-color: rgba(214, 48, 49, 0.4); background: rgba(214, 48, 49, 0.08); }

.status-name {
  color: var(--text);
  flex: 1;
}

.status-empty {
  padding: 20px;
  text-align: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
}

/* === 右侧详情卡片 === */
.detail-card {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-code-badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 22px;
  font-family: var(--mono);
  font-weight: bold;
  border: 1px solid;
  flex-shrink: 0;
}

.detail-name {
  font-size: 20px;
  font-family: var(--mono);
  color: var(--green);
  font-weight: bold;
}

.detail-category {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.detail-desc {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text);
  line-height: 1.8;
  margin-bottom: 12px;
}

.detail-note {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  background: rgba(0, 0, 0, 0.3);
  padding: 10px 12px;
  border: 1px solid var(--line);
  margin-bottom: 16px;
  line-height: 1.6;
}

.detail-note strong {
  color: var(--accent);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

/* === 空状态 === */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--panel-2);
  border: 1px dashed var(--line);
  opacity: 0.6;
}

.detail-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.detail-empty-text {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--muted);
}

/* 滚动条 */
.status-list::-webkit-scrollbar {
  width: 6px;
}

.status-list::-webkit-scrollbar-track {
  background: transparent;
}

.status-list::-webkit-scrollbar-thumb {
  background: var(--line);
}

.status-list::-webkit-scrollbar-thumb:hover {
  background: var(--line-strong);
}

/* 响应式：双栏内高度适配 */
@media (min-width: 900px) {
  .status-list {
    max-height: 520px;
    flex: 1;
  }
}

@media (max-width: 640px) {
  .status-list {
    max-height: 320px;
  }
  .detail-code-badge {
    font-size: 18px;
    padding: 3px 10px;
  }
  .detail-name {
    font-size: 17px;
  }
}
</style>
