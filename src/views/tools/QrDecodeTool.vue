<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔍 二维码解码器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：图片来源与参数 ============ -->
          <div class="tool-col">
            <label class="tool-label">二维码图片：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="fileInput && fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">🖼️</span>
                <span class="upload-text">点击或拖拽上传二维码图片</span>
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / BMP，也可 Ctrl+V 粘贴截图</span>
              </div>
            </div>

            <div class="input-with-copy">
              <input
                class="code-input-sm"
                v-model="srcInput"
                placeholder="或粘贴 Base64 / data:image/... 数据，回车加载..."
                @keyup.enter="loadFromDataUri"
              />
              <button class="copy-btn" @click="copyInput" title="复制输入内容">📋</button>
            </div>

            <div class="button-row">
              <button
                class="tool-button primary"
                :disabled="busy || !srcInput.trim()"
                @click="loadFromDataUri"
              >
                加载 Base64
              </button>
              <button class="tool-button" :disabled="busy" @click="pasteImage">
                📋 读取剪贴板图片
              </button>
            </div>

            <template v-if="hasImage">
              <label class="tool-label">图片预览：</label>
              <div class="canvas-wrapper">
                <canvas ref="previewCanvas" class="preview-canvas"></canvas>
              </div>
              <div class="image-info">
                <span class="info-item">{{ imgW }} × {{ imgH }} px</span>
                <span class="info-item">{{ sourceLabel }}</span>
                <span v-if="fileSizeText" class="info-item">{{ fileSizeText }}</span>
              </div>
            </template>

            <label class="tool-label">放大倍数：{{ scale }}×</label>
            <input
              type="range"
              class="range-input"
              v-model.number="scale"
              min="1"
              max="4"
              step="1"
            />
            <div class="length-display"><span>{{ scale }}×</span></div>

            <label class="tool-label">反色尝试：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="inversion" value="attemptBoth" />
                <span>自动（标准 + 反色）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="inversion" value="dontInvert" />
                <span>仅标准</span>
              </label>
            </div>

            <label class="checkbox-label">
              <input type="checkbox" v-model="autoTune" />
              <span>自动多倍率搜索（失败时依次尝试 1×~4×）</span>
            </label>
          </div>

          <!-- ============ 右栏：解码结果 ============ -->
          <div class="tool-col">
            <div class="section-header">
              <span class="section-title">▼ 解码结果</span>
              <button class="copy-btn-inline" @click="copyResult" title="复制结果">📋</button>
            </div>
            <textarea
              class="code-input output"
              :value="result"
              readonly
              rows="10"
              placeholder="点击「开始解码」，识别结果将显示在这里..."
            ></textarea>

            <div v-if="meta" class="meta-chips">
              <span class="meta-chip">{{ meta.typeLabel }}</span>
              <span class="meta-chip">版本 v{{ meta.version }}</span>
              <span class="meta-chip">{{ meta.modeLabel }}</span>
              <span class="meta-chip">{{ meta.chars }} 字符</span>
            </div>

            <div v-if="meta" class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">内容类型</span>
                <span class="stat-value">{{ meta.typeLabel }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">QR 版本</span>
                <span class="stat-value">v{{ meta.version }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">编码模式</span>
                <span class="stat-value">{{ meta.modeLabel }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">字符 / 字节</span>
                <span class="stat-value">{{ meta.chars }} / {{ meta.bytes }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">识别倍率</span>
                <span class="stat-value">{{ meta.scale }}×</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">解码耗时</span>
                <span class="stat-value">{{ meta.time }} ms</span>
              </div>
            </div>

            <div v-if="meta && meta.parsed && meta.parsed.length" class="parsed-box">
              <div class="parsed-title">解析字段</div>
              <div v-for="(item, i) in meta.parsed" :key="i" class="parsed-row">
                <span class="parsed-k">{{ item.k }}</span>
                <span class="parsed-v">{{ item.v }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="busy || !hasImage" @click="decode">
            {{ busy ? '解码中...' : '🔍 开始解码' }}
          </button>
          <button class="tool-button" :disabled="!result" @click="copyResult">📋 复制结果</button>
          <button class="tool-button danger" :disabled="busy" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import jsQRModule from 'jsqr'

// jsQR 为 UMD 包，兼容 default / 直接函数两种导出形态
const jsQR = typeof jsQRModule === 'function' ? jsQRModule : (jsQRModule && jsQRModule.default)

const fileInput = ref(null)
const previewCanvas = ref(null)

const dragOver = ref(false)
const srcInput = ref('')
const hasImage = ref(false)
const imgW = ref(0)
const imgH = ref(0)
const sourceLabel = ref('')
const fileSize = ref(0)

const scale = ref(1)
const inversion = ref('attemptBoth')
const autoTune = ref(true)

const result = ref('')
const meta = ref(null)
const error = ref('')
const success = ref('')
const busy = ref(false)

let loadedImg = null
let successTimer = null

const fileSizeText = computed(() => {
  if (!fileSize.value) return ''
  const kb = fileSize.value / 1024
  return kb >= 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB'
})

// ============ 工具函数 ============
function cssVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch (e) {
    return fallback
  }
}

function setSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 4000)
}

function resetOutput() {
  result.value = ''
  meta.value = null
}

// ============ 图片加载 ============
function loadImageFromSrc(src, label, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      loadedImg = img
      imgW.value = img.naturalWidth || img.width || 0
      imgH.value = img.naturalHeight || img.height || 0
      if (!imgW.value || !imgH.value) {
        loadedImg = null
        reject(new Error('无法获取图片尺寸，请换一张图片重试'))
        return
      }
      sourceLabel.value = label
      fileSize.value = size || 0
      hasImage.value = true
      resetOutput()
      renderPreview(null, 1)
      resolve(img)
    }
    img.onerror = () => reject(new Error('图片加载失败：文件可能已损坏或格式不支持'))
    img.src = src
  })
}

function readFile(file) {
  if (!file) return
  if (file.type && !file.type.startsWith('image/')) {
    error.value = '请选择图片文件（PNG / JPEG / WebP / GIF / BMP）'
    return
  }
  error.value = ''
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      await loadImageFromSrc(reader.result, file.name || '本地图片', file.size)
      await decode()
    } catch (err) {
      error.value = err.message || '图片读取失败'
    }
  }
  reader.onerror = () => { error.value = '读取文件失败，请重试' }
  reader.readAsDataURL(file)
}

function handleFile(e) {
  const file = e.target.files && e.target.files[0]
  if (file) readFile(file)
  e.target.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) readFile(file)
}

async function loadFromDataUri() {
  const raw = srcInput.value.trim()
  if (!raw) {
    error.value = '请粘贴 Base64 或 data:image/... 数据'
    return
  }
  if (/^(https?:)?\/\//i.test(raw)) {
    error.value = '本工具不请求外部网络。请先下载图片再上传，或粘贴 Base64 / Data URI 数据'
    return
  }
  let src = raw
  if (!/^data:image\//i.test(raw)) {
    const cleaned = raw.replace(/\s+/g, '')
    let mime = 'image/png'
    if (/^\/9j/.test(cleaned)) mime = 'image/jpeg'
    else if (/^R0lGOD/.test(cleaned)) mime = 'image/gif'
    else if (/^Qk/.test(cleaned)) mime = 'image/bmp'
    else if (/^UklGR/.test(cleaned)) mime = 'image/webp'
    src = `data:${mime};base64,${cleaned}`
  }
  error.value = ''
  try {
    await loadImageFromSrc(src, 'Base64 图片', 0)
    await decode()
  } catch (err) {
    error.value = err.message || 'Base64 数据无效'
  }
}

async function pasteImage() {
  error.value = ''
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      throw new Error('当前浏览器不支持读取剪贴板，请直接按 Ctrl+V 粘贴图片')
    }
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const type = (item.types || []).find(t => t.startsWith('image/'))
      if (type) {
        const blob = await item.getType(type)
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            await loadImageFromSrc(reader.result, '剪贴板图片', blob.size)
            await decode()
          } catch (err) {
            error.value = err.message || '剪贴板图片解析失败'
          }
        }
        reader.readAsDataURL(blob)
        return
      }
    }
    error.value = '剪贴板中没有图片，请先截图或复制图片'
  } catch (e) {
    error.value = '读取剪贴板失败：' + (e.message || '请改用 Ctrl+V 粘贴图片')
  }
}

function onPaste(e) {
  const items = e.clipboardData && e.clipboardData.items
  if (!items) return
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        readFile(file)
        return
      }
    }
  }
}

// ============ 解码核心 ============
function tryDecodeAt(img, factor) {
  const maxSide = 2400
  let w = Math.round(imgW.value * factor)
  let h = Math.round(imgH.value * factor)
  const shrink = Math.min(1, maxSide / Math.max(w, h))
  w = Math.max(1, Math.round(w * shrink))
  h = Math.max(1, Math.round(h * shrink))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  // 放大时用最近邻保留硬边缘，缩小时做平滑
  ctx.imageSmoothingEnabled = w < imgW.value
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  let imageData
  try {
    imageData = ctx.getImageData(0, 0, w, h)
  } catch (e) {
    throw new Error('图片像素读取失败，请换一张图片重试')
  }
  const options = { inversionAttempts: inversion.value === 'dontInvert' ? 'dontInvert' : 'attemptBoth' }
  let code = null
  try {
    code = jsQR(imageData.data, w, h, options)
  } catch (e) {
    code = null
  }
  return code ? { code, realFactor: w / imgW.value } : null
}

function modeLabel(type) {
  const map = {
    numeric: '数字',
    alphanumeric: '字母数字',
    byte: '字节 (UTF-8)',
    kanji: 'Kanji',
    eci: 'ECI'
  }
  return map[type] || String(type || '未知')
}

function detectType(data) {
  const text = (data || '').trim()
  const out = { key: 'text', label: '纯文本', fields: null }

  if (/^WIFI:/i.test(text)) {
    out.key = 'wifi'
    out.label = 'WiFi 配置'
    const fields = []
    const body = text.replace(/^WIFI:/i, '').replace(/;;\s*$/, '')
    body.split(';').forEach(seg => {
      if (!seg) return
      const idx = seg.indexOf(':')
      if (idx < 0) return
      const k = seg.slice(0, idx).toUpperCase()
      const v = seg.slice(idx + 1)
      const names = { S: '网络名称 (SSID)', T: '加密方式', P: '密码', H: '隐藏网络' }
      if (k === 'P' && !v) return
      fields.push({ k: names[k] || k, v: k === 'P' ? v : (v || '—') })
    })
    out.fields = fields
    return out
  }
  if (/^BEGIN:VCARD/i.test(text)) {
    out.key = 'vcard'
    out.label = 'vCard 名片'
    out.fields = pickLines(text, {
      FN: '姓名', N: '姓名(结构化)', ORG: '组织', TITLE: '职位',
      TEL: '电话', EMAIL: '邮箱', URL: '网址', ADR: '地址', NOTE: '备注'
    })
    return out
  }
  if (/^BEGIN:VEVENT/i.test(text) || /^BEGIN:VCALENDAR/i.test(text)) {
    out.key = 'calendar'
    out.label = '日历事件'
    out.fields = pickLines(text, { SUMMARY: '标题', DTSTART: '开始时间', DTEND: '结束时间', LOCATION: '地点', DESCRIPTION: '描述' })
    return out
  }
  if (/^mailto:/i.test(text)) {
    out.key = 'email'
    out.label = '电子邮件'
    const after = text.replace(/^mailto:/i, '')
    const [addr, query] = after.split('?')
    const fields = [{ k: '收件人', v: addr }]
    if (query) {
      query.split('&').forEach(pair => {
        const [k, v] = pair.split('=')
        if (k) fields.push({ k: decodeURIComponent(k), v: decodeURIComponent(v || '') })
      })
    }
    out.fields = fields
    return out
  }
  if (/^MATMSG:/i.test(text)) {
    out.key = 'email'
    out.label = '电子邮件'
    out.fields = pickLines(text.replace(/^MATMSG:/i, '').replace(/;;\s*$/, '').replace(/;/g, '\n'), {
      TO: '收件人', SUB: '主题', BODY: '正文'
    })
    return out
  }
  if (/^smsto:/i.test(text) || /^sms:/i.test(text) || /^SMSTO:/i.test(text)) {
    out.key = 'sms'
    out.label = '短信'
    const body = text.replace(/^(smsto:|sms:|SMSTO:)/i, '')
    const [num, msg] = body.split(/[:?]/, 2)
    out.fields = [{ k: '号码', v: num }, { k: '内容', v: msg || '—' }]
    return out
  }
  if (/^tel:/i.test(text)) {
    out.key = 'tel'
    out.label = '电话号码'
    out.fields = [{ k: '号码', v: text.replace(/^tel:/i, '') }]
    return out
  }
  if (/^geo:/i.test(text)) {
    out.key = 'geo'
    out.label = '地理位置'
    const parts = text.replace(/^geo:/i, '').split(/[,?]/)
    out.fields = [
      { k: '纬度', v: parts[0] || '—' },
      { k: '经度', v: parts[1] || '—' }
    ]
    return out
  }
  if (/^otpauth:\/\//i.test(text)) {
    out.key = 'otp'
    out.label = '两步验证 (OTP)'
    try {
      const u = new URL(text)
      out.fields = [
        { k: '类型', v: u.host },
        { k: '账号', v: decodeURIComponent(u.pathname.replace(/^\/+/, '')) || '—' },
        { k: '发行方', v: u.searchParams.get('issuer') || '—' },
        { k: '算法', v: u.searchParams.get('algorithm') || 'SHA1' },
        { k: '位数', v: u.searchParams.get('digits') || '6' },
        { k: '周期', v: (u.searchParams.get('period') || '30') + 's' },
        { k: '密钥', v: u.searchParams.get('secret') || '—' }
      ]
    } catch (e) { /* ignore */ }
    return out
  }
  if (/^bitcoin:/i.test(text)) {
    out.key = 'bitcoin'
    out.label = '加密货币支付'
    out.fields = [{ k: '地址', v: text.replace(/^bitcoin:/i, '').split('?')[0] }]
    return out
  }
  if (/^https?:\/\//i.test(text)) {
    out.key = 'url'
    out.label = '网址 URL'
    try {
      const u = new URL(text)
      out.fields = [
        { k: '协议', v: u.protocol.replace(':', '') },
        { k: '主机', v: u.host },
        { k: '路径', v: u.pathname || '/' },
        { k: '查询参数', v: u.search || '—' }
      ]
    } catch (e) { /* ignore */ }
    return out
  }
  if (/^[{[][\s\S]*[}\]]$/.test(text)) {
    try {
      const parsed = JSON.parse(text)
      out.key = 'json'
      out.label = Array.isArray(parsed) ? 'JSON 数组' : 'JSON 对象'
      out.fields = [{ k: '节点数', v: String(Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length) }]
      return out
    } catch (e) { /* 非合法 JSON，继续判断 */ }
  }
  if (/^\d{1,20}$/.test(text)) {
    out.key = 'number'
    out.label = '纯数字'
    return out
  }
  return out
}

function pickLines(text, map) {
  const fields = []
  text.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':')
    if (idx <= 0) return
    const key = line.slice(0, idx).split(';')[0].toUpperCase()
    if (map[key]) {
      fields.push({ k: map[key], v: line.slice(idx + 1).replace(/\\n/g, ' ').trim() })
    }
  })
  return fields
}

function buildMeta(code, scaleUsed, time) {
  const info = detectType(code.data)
  const modes = []
  ;(code.chunks || []).forEach(c => {
    const label = modeLabel(c.type)
    if (!modes.includes(label)) modes.push(label)
  })
  return {
    typeLabel: info.label,
    parsed: info.fields,
    version: code.version,
    modeLabel: modes.join(' + ') || '—',
    chars: code.data.length,
    bytes: (code.binaryData || []).length,
    scale: scaleUsed,
    time
  }
}

async function decode() {
  if (!hasImage.value || !loadedImg) {
    error.value = '请先上传或加载二维码图片'
    return
  }
  if (typeof jsQR !== 'function') {
    error.value = '解码库加载失败，请刷新页面后重试'
    return
  }
  busy.value = true
  error.value = ''
  success.value = ''
  const t0 = performance.now()
  try {
    const factors = autoTune.value ? [1, 2, 3, 4] : [scale.value]
    if (!factors.includes(scale.value)) factors.unshift(scale.value)

    let found = null
    let usedScale = 1
    for (const f of factors) {
      found = tryDecodeAt(loadedImg, f)
      if (found) {
        usedScale = f
        break
      }
    }
    if (!found) {
      resetOutput()
      error.value = '未识别到二维码。请尝试提高图片清晰度与对比度、裁掉多余边缘，或开启「自动多倍率搜索 / 反色尝试」后重试'
      renderPreview(null, 1)
      return
    }

    const time = Math.round(performance.now() - t0)
    result.value = found.code.data
    meta.value = buildMeta(found.code, usedScale, time)
    renderPreview(found.code.location, found.realFactor)
    setSuccess(`解码成功：识别到 ${found.code.data.length} 个字符（QR 版本 v${found.code.version}，${usedScale}× 倍率）`)
  } catch (e) {
    error.value = '解码出错：' + (e.message || '未知错误')
  } finally {
    busy.value = false
  }
}

// ============ 预览绘制 ============
function renderPreview(location, realFactor) {
  const canvas = previewCanvas.value
  if (!canvas || !loadedImg) return
  const maxDim = 720
  const ratio = Math.min(1, maxDim / Math.max(imgW.value, imgH.value))
  const w = Math.max(1, Math.round(imgW.value * ratio))
  const h = Math.max(1, Math.round(imgH.value * ratio))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(loadedImg, 0, 0, w, h)
  if (!location) return

  const k = (realFactor || 1) * ratio
  const corners = [
    location.topLeftCorner,
    location.topRightCorner,
    location.bottomRightCorner,
    location.bottomLeftCorner
  ].filter(Boolean)
  if (!corners.length) return

  const green = cssVar('--green', '#9dff6b')
  ctx.save()
  ctx.strokeStyle = green
  ctx.lineWidth = 2
  ctx.beginPath()
  corners.forEach((p, i) => {
    const x = p.x * k
    const y = p.y * k
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = green
  corners.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x * k, p.y * k, 3.5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

// ============ 复制 / 清空 ============
async function copyText(text, okMsg) {
  if (!text) {
    error.value = '没有可复制的内容'
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    setSuccess(okMsg)
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      setSuccess(okMsg)
    } catch (e2) {
      error.value = '复制失败，请手动选择内容复制'
    }
    document.body.removeChild(ta)
  }
}

function copyResult() {
  copyText(result.value, '解码结果已复制')
}

function copyInput() {
  copyText(srcInput.value.trim(), '输入内容已复制')
}

function clearAll() {
  loadedImg = null
  hasImage.value = false
  imgW.value = 0
  imgH.value = 0
  sourceLabel.value = ''
  fileSize.value = 0
  srcInput.value = ''
  result.value = ''
  meta.value = null
  error.value = ''
  success.value = ''
  clearTimeout(successTimer)
  const canvas = previewCanvas.value
  if (canvas) {
    canvas.width = 0
    canvas.height = 0
  }
}

onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* === 上传区域 === */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.6rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--panel-2);
}

.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2.2rem;
}

.upload-text {
  color: var(--text);
  font-size: 14px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  line-height: 1.5;
}

/* === 按钮行 === */
.button-row {
  display: flex;
  gap: 10px;
}

.button-row .tool-button {
  flex: 1;
}

/* === 图片预览 === */
.canvas-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  text-align: center;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  image-rendering: pixelated;
}

.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.info-item {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.length-display {
  text-align: right;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  margin-top: -4px;
}

/* === 结果区 === */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  text-transform: uppercase;
}

.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 3px 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn-inline:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-chip {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--green);
  border: 1px solid var(--line);
  background: var(--green-soft);
  padding: 3px 8px;
}

/* === 统计网格 === */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px 10px;
  min-width: 0;
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* === 解析字段 === */
.parsed-box {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px;
}

.parsed-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.parsed-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--line);
  font-family: var(--mono);
  font-size: 12px;
}

.parsed-row:last-child {
  border-bottom: 0;
}

.parsed-k {
  color: var(--muted);
  flex: 0 0 40%;
  word-break: break-all;
}

.parsed-v {
  color: var(--text);
  flex: 1;
  word-break: break-all;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1.3rem 1rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .button-row {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
