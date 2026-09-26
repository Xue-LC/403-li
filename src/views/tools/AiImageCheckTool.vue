<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔍 AI 图片检测</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：上传与预览 ============ -->
          <div class="tool-col">
            <label class="tool-label">图片来源：</label>
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
                <span class="upload-text">点击或拖拽上传图片</span>
                <span class="upload-hint">支持 JPEG / PNG / WebP / TIFF，也可 Ctrl+V 粘贴</span>
              </div>
            </div>

            <template v-if="hasImage">
              <label class="tool-label">图片预览：</label>
              <div class="canvas-wrapper">
                <img ref="previewImg" class="preview-img" alt="preview" />
              </div>
              <div class="image-info">
                <span class="info-item">{{ imgW }} × {{ imgH }} px</span>
                <span class="info-item">{{ fileName }}</span>
                <span v-if="fileSizeText" class="info-item">{{ fileSizeText }}</span>
              </div>
            </template>
          </div>

          <!-- ============ 右栏：检测结果 ============ -->
          <div class="tool-col">
            <div class="section-header">
              <span class="section-title">▼ 检测结果</span>
              <button class="copy-btn-inline" @click="copyReport" title="复制报告">📋</button>
            </div>

            <template v-if="!scanned">
              <div class="empty-hint">上传图片后自动开始检测</div>
            </template>

            <template v-if="scanned">
              <!-- AI 判定 -->
              <div class="verdict-box" :class="verdictClass">
                <span class="verdict-icon">{{ verdictIcon }}</span>
                <div class="verdict-text">
                  <div class="verdict-title">{{ verdictTitle }}</div>
                  <div class="verdict-desc">{{ verdictDesc }}</div>
                </div>
              </div>

              <!-- AI 关键词命中 -->
              <div v-if="aiHits.length" class="section-block">
                <div class="section-subtitle">🔎 AI 关键词命中 ({{ aiHits.length }})</div>
                <div class="hit-list">
                  <div v-for="(h, i) in aiHits" :key="i" class="hit-item">
                    <span class="hit-tag">{{ h.source }}</span>
                    <span class="hit-key" :class="{ 'hit-key-ai': h.isAI }">{{ h.keyword }}</span>
                    <span class="hit-val">{{ h.value }}</span>
                  </div>
                </div>
              </div>

              <!-- EXIF 概览 -->
              <div v-if="exifFields.length" class="section-block">
                <div class="section-subtitle">📷 EXIF 元数据 ({{ exifFields.length }})</div>
                <div class="meta-table">
                  <div v-for="(f, i) in exifFields" :key="i" class="meta-row">
                    <span class="meta-k">{{ f.key }}</span>
                    <span class="meta-v" :class="{ 'meta-v-ai': f.isAI }">{{ f.value }}</span>
                  </div>
                </div>
              </div>

              <!-- XMP 概览 -->
              <div v-if="xmpFields.length" class="section-block">
                <div class="section-subtitle">📄 XMP 元数据 ({{ xmpFields.length }})</div>
                <div class="meta-table">
                  <div v-for="(f, i) in xmpFields" :key="i" class="meta-row">
                    <span class="meta-k">{{ f.key }}</span>
                    <span class="meta-v" :class="{ 'meta-v-ai': f.isAI }">{{ f.value }}</span>
                  </div>
                </div>
              </div>

              <!-- C2PA -->
              <div v-if="c2paInfo" class="section-block">
                <div class="section-subtitle">🔐 C2PA Content Credentials</div>
                <div class="meta-table">
                  <div v-for="(f, i) in c2paInfo" :key="i" class="meta-row">
                    <span class="meta-k">{{ f.key }}</span>
                    <span class="meta-v">{{ f.value }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="button-group">
          <button class="tool-button primary" :disabled="busy || !hasImage" @click="scan">
            {{ busy ? '检测中...' : '🔍 开始检测' }}
          </button>
          <button class="tool-button" :disabled="!scanned" @click="copyReport">📋 复制报告</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="successMsg" class="status-success">✅ {{ successMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ============ AI 关键词库 ============
const AI_KEYWORDS = [
  // 生成工具
  { keyword: 'midjourney', label: 'Midjourney', category: 'generator' },
  { keyword: 'dall-e', label: 'DALL·E', category: 'generator' },
  { keyword: 'dalle', label: 'DALL·E', category: 'generator' },
  { keyword: 'stable diffusion', label: 'Stable Diffusion', category: 'generator' },
  { keyword: 'stablediffusion', label: 'Stable Diffusion', category: 'generator' },
  { keyword: 'comfyui', label: 'ComfyUI', category: 'generator' },
  { keyword: 'automatic1111', label: 'Automatic1111', category: 'generator' },
  { keyword: 'adobe firefly', label: 'Adobe Firefly', category: 'generator' },
  { keyword: 'firefly', label: 'Adobe Firefly', category: 'generator' },
  { keyword: 'imagen', label: 'Google Imagen', category: 'generator' },
  { keyword: 'synthid', label: 'Google SynthID', category: 'watermark' },
  { keyword: 'leonardo.ai', label: 'Leonardo.AI', category: 'generator' },
  { keyword: 'leonardo ai', label: 'Leonardo.AI', category: 'generator' },
  { keyword: 'playground ai', label: 'Playground AI', category: 'generator' },
  { keyword: 'dreamstudio', label: 'DreamStudio', category: 'generator' },
  { keyword: 'nightcafe', label: 'NightCafe', category: 'generator' },
  { keyword: 'craiyon', label: 'Craiyon', category: 'generator' },
  { keyword: 'artbreeder', label: 'Artbreeder', category: 'generator' },
  { keyword: 'deepai', label: 'DeepAI', category: 'generator' },
  { keyword: 'replicate', label: 'Replicate', category: 'generator' },
  { keyword: 'novelai', label: 'NovelAI', category: 'generator' },
  { keyword: 'nai', label: 'NovelAI', category: 'generator' },
  { keyword: 'waifu', label: 'Waifu Diffusion', category: 'generator' },
  { keyword: 'flux', label: 'Flux', category: 'generator' },
  { keyword: 'ideogram', label: 'Ideogram', category: 'generator' },
  { keyword: 'recraft', label: 'Recraft', category: 'generator' },
  { keyword: 'gpt-image', label: 'GPT Image', category: 'generator' },
  { keyword: 'chatgpt', label: 'ChatGPT', category: 'generator' },
  { keyword: 'gemini', label: 'Google Gemini', category: 'generator' },
  { keyword: 'nano banana', label: 'Google Nano Banana', category: 'generator' },
  { keyword: 'grok', label: 'Grok', category: 'generator' },
  // 通用 AI 标记
  { keyword: 'ai generated', label: 'AI Generated', category: 'tag' },
  { keyword: 'ai-generated', label: 'AI Generated', category: 'tag' },
  { keyword: 'artificial intelligence', label: 'Artificial Intelligence', category: 'tag' },
  { keyword: 'machine learning', label: 'Machine Learning', category: 'tag' },
  { keyword: 'neural network', label: 'Neural Network', category: 'tag' },
  { keyword: 'generative', label: 'Generative AI', category: 'tag' },
  { keyword: 'text-to-image', label: 'Text-to-Image', category: 'tag' },
  { keyword: 'txt2img', label: 'Text-to-Image', category: 'tag' },
  { keyword: 'img2img', label: 'Image-to-Image', category: 'tag' },
  { keyword: 'prompt:', label: 'Prompt', category: 'tag' },
  { keyword: 'negative prompt', label: 'Negative Prompt', category: 'tag' },
  { keyword: 'cfg scale', label: 'CFG Scale (SD)', category: 'tag' },
  { keyword: 'sampler:', label: 'Sampler (SD)', category: 'tag' },
  { keyword: 'steps:', label: 'Steps (SD)', category: 'tag' },
  { keyword: 'seed:', label: 'Seed (SD)', category: 'tag' },
  { keyword: 'denoising strength', label: 'Denoising Strength', category: 'tag' },
  { keyword: 'checkpoint', label: 'Checkpoint Model', category: 'tag' },
  { keyword: 'lora', label: 'LoRA Model', category: 'tag' },
  { keyword: 'vae', label: 'VAE Model', category: 'tag' },
  { keyword: 'controlnet', label: 'ControlNet', category: 'tag' },
  // C2PA 相关
  { keyword: 'c2pa', label: 'C2PA', category: 'c2pa' },
  { keyword: 'content credential', label: 'Content Credentials', category: 'c2pa' },
  { keyword: 'contentauth', label: 'Content Authenticity', category: 'c2pa' },
  { keyword: 'jumbf', label: 'JUMBF (C2PA container)', category: 'c2pa' },
  { keyword: 'claim', label: 'C2PA Claim', category: 'c2pa' },
  { keyword: 'assertion', label: 'C2PA Assertion', category: 'c2pa' },
]

// EXIF 常用标签（简化版 IFD0 + ExifIFD）
const EXIF_TAGS = {
  0x010F: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011A: 'XResolution',
  0x011B: 'YResolution',
  0x0131: 'Software',
  0x0132: 'ModifyDate',
  0x013B: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'ExifIFD',
  0x8825: 'GPSInfo',
  0x0100: 'ImageWidth',
  0x0101: 'ImageHeight',
  0x0102: 'BitsPerSample',
  0x0103: 'Compression',
  0x0106: 'PhotometricInterpretation',
  0x0115: 'SamplesPerPixel',
  0x011C: 'PlanarConfiguration',
  0x0201: 'ThumbnailOffset',
  0x0202: 'ThumbnailLength',
  // ExifIFD tags
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'CreateDate',
  0x920A: 'FocalLength',
  0x829A: 'ExposureTime',
  0x829D: 'FNumber',
  0x8827: 'ISO',
  0xA001: 'ColorSpace',
  0xA002: 'ExifImageWidth',
  0xA003: 'ExifImageHeight',
  0xA405: 'FocalLengthIn35mmFormat',
  0xA406: 'SceneCaptureType',
  0xA420: 'ImageUniqueID',
  0xA430: 'CameraOwnerName',
  0xA431: 'BodySerialNumber',
  0xA432: 'LensModel',
  0xA433: 'LensMake',
  0xA434: 'LensSerialNumber',
  0x9286: 'UserComment',
  0x927C: 'MakerNote',
  0xA435: 'LensSerialNumber2',
}

const EXIF_STRING_TAGS = new Set([
  0x010F, 0x0110, 0x0131, 0x0132, 0x013B, 0x8298,
  0x9000, 0x9003, 0x9004, 0xA001, 0xA420, 0xA430, 0xA431,
  0xA432, 0xA433, 0xA434, 0xA435, 0x9286,
])

// ============ 状态 ============
const fileInput = ref(null)
const previewImg = ref(null)
const dragOver = ref(false)
const hasImage = ref(false)
const imgW = ref(0)
const imgH = ref(0)
const fileName = ref('')
const fileSizeVal = ref(0)
const busy = ref(false)
const scanned = ref(false)
const error = ref('')
const successMsg = ref('')
const rawBytes = ref(null)

const aiHits = ref([])
const exifFields = ref([])
const xmpFields = ref([])
const c2paInfo = ref(null)
const verdict = ref('unknown') // 'ai' | 'likely' | 'clean' | 'unknown'

let successTimer = null

const fileSizeText = computed(() => {
  if (!fileSizeVal.value) return ''
  const kb = fileSizeVal.value / 1024
  return kb >= 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB'
})

const verdictClass = computed(() => ({
  'verdict-ai': verdict.value === 'ai',
  'verdict-likely': verdict.value === 'likely',
  'verdict-clean': verdict.value === 'clean',
  'verdict-unknown': verdict.value === 'unknown',
}))

const verdictIcon = computed(() => {
  if (verdict.value === 'ai') return '🤖'
  if (verdict.value === 'likely') return '⚠️'
  if (verdict.value === 'clean') return '✅'
  return '❓'
})

const verdictTitle = computed(() => {
  if (verdict.value === 'ai') return '检测到 AI 生成标记'
  if (verdict.value === 'likely') return '疑似 AI 生成'
  if (verdict.value === 'clean') return '未发现 AI 生成标记'
  return '无法判定'
})

const verdictDesc = computed(() => {
  if (verdict.value === 'ai') return '元数据中包含明确的 AI 生成工具或标记信息'
  if (verdict.value === 'likely') return '元数据中发现可能与 AI 相关的关键词，但不完全确定'
  if (verdict.value === 'clean') return '未在元数据中发现已知的 AI 生成工具或标记'
  return '图片无元数据或格式不支持解析'
})

function setSuccess(msg) {
  successMsg.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { successMsg.value = '' }, 4000)
}

// ============ 图片加载 ============
function loadImage(file) {
  if (!file) return
  if (file.type && !file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  error.value = ''
  scanned.value = false
  fileName.value = file.name || '未命名'
  fileSizeVal.value = file.size || 0

  // 读取原始字节用于 EXIF 解析
  const reader = new FileReader()
  reader.onload = () => {
    rawBytes.value = new Uint8Array(reader.result)
    // 预览
    const blob = new Blob([rawBytes.value], { type: file.type || 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    if (previewImg.value) {
      previewImg.value.onload = () => {
        imgW.value = previewImg.value.naturalWidth
        imgH.value = previewImg.value.naturalHeight
        hasImage.value = true
      }
      previewImg.value.src = url
    } else {
      hasImage.value = true
    }
  }
  reader.readAsArrayBuffer(file)
}

function handleFile(e) {
  const file = e.target.files && e.target.files[0]
  if (file) loadImage(file)
  e.target.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadImage(file)
}

function onPaste(e) {
  const items = e.clipboardData && e.clipboardData.items
  if (!items) return
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        loadImage(file)
        return
      }
    }
  }
}

// ============ EXIF 解析 ============
function parseExif(buf) {
  const data = new Uint8Array(buf)
  const fields = []
  const allText = []

  // JPEG: 找 APP1 段 (FF E1)
  if (data[0] === 0xFF && data[1] === 0xD8) {
    let offset = 2
    while (offset < data.length - 4) {
      if (data[offset] !== 0xFF) break
      const marker = data[offset + 1]
      const segLen = (data[offset + 2] << 8) | data[offset + 3]

      // APP1 = EXIF / XMP
      if (marker === 0xE1) {
        const segData = data.slice(offset + 4, offset + 2 + segLen)
        const segStr = bytesToAscii(segData.slice(0, 10))

        if (segStr.startsWith('Exif')) {
          // EXIF 段
          const tiffStart = offset + 4 + 6 // skip "Exif\0\0"
          parseTiffHeader(data, tiffStart, fields, allText)
        }
        if (segStr.startsWith('http://ns.adobe.com/xap')) {
          // XMP 段
          const xmpStr = bytesToUtf8(segData.slice(segData.indexOf(60))) // 找 '<'
          parseXmp(xmpStr, allText)
        }
      }

      // APP0 = JFIF, skip
      // APP2 = ICC, skip
      // 其他段跳过
      if (marker === 0xDA) break // SOS, 后面是压缩数据
      offset += 2 + segLen
    }
  }

  // PNG: 找 iTXt / tEXt / eXIf 块
  if (data[0] === 0x89 && data[1] === 0x50) {
    let offset = 8 // skip PNG signature
    while (offset < data.length - 8) {
      const chunkLen = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
      const chunkType = bytesToAscii(data.slice(offset + 4, offset + 8))
      const chunkData = data.slice(offset + 8, offset + 8 + chunkLen)

      if (chunkType === 'eXIf') {
        parseTiffHeader(data, offset + 8, fields, allText)
      }
      if (chunkType === 'iTXt' || chunkType === 'tEXt') {
        const str = bytesToUtf8(chunkData)
        allText.push(str)
        // 解析 key=value
        const nullIdx = chunkData.indexOf(0)
        if (nullIdx > 0) {
          const key = bytesToUtf8(chunkData.slice(0, nullIdx))
          let val
          if (chunkType === 'tEXt') {
            val = bytesToUtf8(chunkData.slice(nullIdx + 1))
          } else {
            // iTXt: compression(1) + language(0-term) + translated(0-term) + text
            const compFlag = chunkData[nullIdx + 1]
            let textStart = nullIdx + 2
            // skip language
            while (textStart < chunkData.length && chunkData[textStart] !== 0) textStart++
            textStart++
            // skip translated
            while (textStart < chunkData.length && chunkData[textStart] !== 0) textStart++
            textStart++
            val = bytesToUtf8(chunkData.slice(textStart))
          }
          fields.push({ key, value: val, source: 'PNG Text', isAI: false })
        }
      }

      offset += 12 + chunkLen // 4(len) + 4(type) + data + 4(crc)
    }
  }

  // TIFF (standalone)
  if ((data[0] === 0x49 && data[1] === 0x49) || (data[0] === 0x4D && data[1] === 0x4D)) {
    parseTiffHeader(data, 0, fields, allText)
  }

  // WebP: 找 EXIF 块
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) {
    let offset = 12 // RIFF + size + WEBP
    while (offset < data.length - 8) {
      const chunkId = bytesToAscii(data.slice(offset, offset + 4))
      const chunkSize = data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24)
      if (chunkId === 'EXIF') {
        parseTiffHeader(data, offset + 8, fields, allText)
      }
      if (chunkId === 'XMP ') {
        const xmpStr = bytesToUtf8(data.slice(offset + 8, offset + 8 + chunkSize))
        parseXmp(xmpStr, allText)
      }
      offset += 8 + chunkSize + (chunkSize % 2) // padding
    }
  }

  return { fields, allText: allText.join('\n') }
}

function parseTiffHeader(data, start, fields, allText) {
  if (start + 8 > data.length) return
  const isLE = data[start] === 0x49 && data[start + 1] === 0x49
  const read16 = isLE
    ? (o) => data[start + o] | (data[start + o + 1] << 8)
    : (o) => (data[start + o] << 8) | data[start + o + 1]
  const read32 = isLE
    ? (o) => data[start + o] | (data[start + o + 1] << 8) | (data[start + o + 2] << 16) | (data[start + o + 3] << 24)
    : (o) => (data[start + o] << 24) | (data[start + o + 1] << 16) | (data[start + o + 2] << 8) | data[start + o + 3]

  const ifd0Offset = read32(4)
  parseIfd(data, start, ifd0Offset, read16, read32, isLE, fields, allText, true)
}

function parseIfd(data, tiffStart, ifdOffset, read16, read32, isLE, fields, allText, followExifIFD) {
  const abs = tiffStart + ifdOffset
  if (abs + 2 > data.length) return
  const count = isLE
    ? data[abs] | (data[abs + 1] << 8)
    : (data[abs] << 8) | data[abs + 1]

  for (let i = 0; i < count && abs + 2 + i * 12 + 12 <= data.length; i++) {
    const entryOff = abs + 2 + i * 12
    const tag = isLE
      ? data[entryOff] | (data[entryOff + 1] << 8)
      : (data[entryOff] << 8) | data[entryOff + 1]
    const type = isLE
      ? data[entryOff + 2] | (data[entryOff + 3] << 8)
      : (data[entryOff + 2] << 8) | data[entryOff + 3]
    const count32 = read32(entryOff + 4 - tiffStart + tiffStart) // relative to tiffStart
    // re-read count32 properly
    const c32 = isLE
      ? data[entryOff + 4] | (data[entryOff + 5] << 8) | (data[entryOff + 6] << 16) | (data[entryOff + 7] << 24)
      : (data[entryOff + 4] << 24) | (data[entryOff + 5] << 16) | (data[entryOff + 6] << 8) | data[entryOff + 7]

    const valueOffset = isLE
      ? data[entryOff + 8] | (data[entryOff + 9] << 8) | (data[entryOff + 10] << 16) | (data[entryOff + 11] << 24)
      : (data[entryOff + 8] << 24) | (data[entryOff + 9] << 16) | (data[entryOff + 10] << 8) | data[entryOff + 11]

    const tagName = EXIF_TAGS[tag] || `Tag_0x${tag.toString(16).padStart(4, '0')}`

    // 追踪 ExifIFD
    if (followExifIFD && tag === 0x8769) {
      parseIfd(data, tiffStart, valueOffset, read16, read32, isLE, fields, allText, false)
      continue
    }

    // 读取值
    let value = ''
    const typeSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] || 1
    const totalBytes = c32 * typeSize

    if (totalBytes <= 4) {
      // 值直接在 offset 字段中
      if (EXIF_STRING_TAGS.has(tag) || type === 2) {
        const chars = []
        for (let b = 0; b < Math.min(4, totalBytes); b++) {
          const ch = isLE ? data[entryOff + 8 + b] : data[entryOff + 11 - b]
          if (ch === 0) break
          chars.push(ch)
        }
        value = String.fromCharCode(...chars)
      } else {
        value = valueOffset.toString()
      }
    } else {
      // 值在偏移处
      const absVal = tiffStart + valueOffset
      if (absVal + totalBytes > data.length) continue
      if (EXIF_STRING_TAGS.has(tag) || type === 2) {
        const chars = []
        for (let b = 0; b < Math.min(totalBytes, 256); b++) {
          const ch = data[absVal + b]
          if (ch === 0) break
          chars.push(ch)
        }
        value = String.fromCharCode(...chars)
      } else if (type === 5 || type === 10) {
        // rational
        const num = isLE
          ? data[absVal] | (data[absVal + 1] << 8) | (data[absVal + 2] << 16) | (data[absVal + 3] << 24)
          : (data[absVal] << 24) | (data[absVal + 1] << 16) | (data[absVal + 2] << 8) | data[absVal + 3]
        const den = isLE
          ? data[absVal + 4] | (data[absVal + 5] << 8) | (data[absVal + 6] << 16) | (data[absVal + 7] << 24)
          : (data[absVal + 4] << 24) | (data[absVal + 5] << 16) | (data[absVal + 6] << 8) | data[absVal + 7]
        value = den ? `${num}/${den} (${(num / den).toFixed(4)})` : `${num}/${den}`
      } else {
        const vals = []
        for (let j = 0; j < Math.min(c32, 10); j++) {
          if (type === 3) { // SHORT
            const v = isLE
              ? data[absVal + j * 2] | (data[absVal + j * 2 + 1] << 8)
              : (data[absVal + j * 2] << 8) | data[absVal + j * 2 + 1]
            vals.push(v)
          } else if (type === 4) { // LONG
            vals.push(read32At(data, absVal + j * 4, isLE))
          }
        }
        value = vals.join(', ')
      }
    }

    if (value && tagName !== 'ExifIFD' && tagName !== 'GPSInfo') {
      fields.push({ key: tagName, value: value.trim(), source: 'EXIF', isAI: false })
      allText.push(`${tagName}: ${value}`)
    }
  }
}

function read32At(data, off, isLE) {
  if (isLE) return data[off] | (data[off + 1] << 8) | (data[off + 2] << 16) | (data[off + 3] << 24)
  return (data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]
}

function bytesToAscii(arr) {
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return s
}

function bytesToUtf8(arr) {
  try {
    return new TextDecoder('utf-8').decode(arr)
  } catch {
    return bytesToAscii(arr)
  }
}

// ============ XMP 解析 ============
const xmpFieldsGlobal = ref([])

function parseXmp(xmlStr, allText) {
  if (!xmlStr || !xmlStr.includes('<')) return
  allText.push(xmlStr)

  // 简单正则提取属性和文本内容
  const attrRe = /(\w[\w:-]*)\s*=\s*"([^"]*)"/g
  let m
  while ((m = attrRe.exec(xmlStr))) {
    const key = m[1]
    const val = m[2]
    if (val && val.length < 500) {
      xmpFieldsGlobal.value.push({ key, value: val, source: 'XMP', isAI: false })
    }
  }

  // 提取标签内容 <dc:description>...</dc:description> 等
  const tagRe = /<([\w:-]+)[^>]*>([^<]{1,500})<\/\1>/g
  while ((m = tagRe.exec(xmlStr))) {
    const key = m[1]
    const val = m[2].trim()
    if (val) {
      xmpFieldsGlobal.value.push({ key, value: val, source: 'XMP', isAI: false })
    }
  }
}

// ============ C2PA 检测 ============
function detectC2pa(buf) {
  const data = new Uint8Array(buf)
  const info = []

  // JPEG: 检查 APP11 段 (FF EB) — C2PA 使用 JUMBF
  // 也检查是否有 "c2pa" 或 "jumb" 标记
  const str = bytesToAscii(data.slice(0, Math.min(data.length, 50000)))

  // 搜索 C2PA 标记
  if (str.includes('c2pa') || str.includes('C2PA')) {
    info.push({ key: 'C2PA 标记', value: '检测到 C2PA 标记数据' })
  }
  if (str.includes('jumb')) {
    info.push({ key: 'JUMBF 容器', value: '检测到 JUMBF (JPEG Universal Metadata Box Format)' })
  }
  if (str.includes('contentauth')) {
    info.push({ key: 'Content Authenticity', value: 'Adobe Content Authenticity Initiative' })
  }

  // 搜索 claim / assertion 等 C2PA 关键词
  if (str.includes('claim') && str.includes('assertion')) {
    info.push({ key: 'Manifest 结构', value: '检测到 claim/assertion 结构' })
  }

  // 更深入：搜索整个文件
  if (!info.length) {
    const fullStr = bytesToAscii(data)
    const c2paMarkers = ['c2pa', 'C2PA', 'jumb', 'JUMBF', 'contentauth', 'contentcredential']
    for (const marker of c2paMarkers) {
      if (fullStr.includes(marker)) {
        info.push({ key: 'C2PA 数据', value: `在文件中发现 "${marker}" 标记` })
        break
      }
    }
  }

  return info.length ? info : null
}

// ============ AI 关键词匹配 ============
function matchAIKeywords(allText, exifList, xmpList) {
  const hits = []
  const lowerText = allText.toLowerCase()

  for (const kw of AI_KEYWORDS) {
    if (lowerText.includes(kw.keyword.toLowerCase())) {
      // 找到关键词在哪个字段
      const findInFields = (list, source) => {
        for (const f of list) {
          if (f.value.toLowerCase().includes(kw.keyword.toLowerCase())) {
            hits.push({
              keyword: kw.label,
              value: f.value.length > 80 ? f.value.slice(0, 80) + '...' : f.value,
              source: `${source} · ${f.key}`,
              isAI: true,
            })
            f.isAI = true
          }
        }
      }
      findInFields(exifList, 'EXIF')
      findInFields(xmpList, 'XMP')
    }
  }

  // 去重
  const seen = new Set()
  return hits.filter(h => {
    const key = `${h.keyword}|${h.source}|${h.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============ 扫描主流程 ============
async function scan() {
  if (!rawBytes.value) {
    error.value = '请先上传图片'
    return
  }
  busy.value = true
  error.value = ''
  scanned.value = false
  aiHits.value = []
  exifFields.value = []
  xmpFields.value = []
  c2paInfo.value = null
  xmpFieldsGlobal.value = []

  try {
    // 1. 解析 EXIF
    const result = parseExif(rawBytes.value.buffer)
    exifFields.value = result.fields
    xmpFields.value = [...xmpFieldsGlobal.value]

    // 2. C2PA 检测
    c2paInfo.value = detectC2pa(rawBytes.value.buffer)

    // 3. AI 关键词匹配
    aiHits.value = matchAIKeywords(result.allText, exifFields.value, xmpFields.value)

    // 4. 判定
    const hasStrongHit = aiHits.value.some(h => {
      const kw = AI_KEYWORDS.find(k => k.label === h.keyword)
      return kw && (kw.category === 'generator' || kw.category === 'watermark')
    })
    const hasWeakHit = aiHits.value.length > 0

    if (c2paInfo.value && hasStrongHit) {
      verdict.value = 'ai'
    } else if (hasStrongHit) {
      verdict.value = 'ai'
    } else if (hasWeakHit) {
      verdict.value = 'likely'
    } else if (exifFields.value.length === 0 && xmpFields.value.length === 0 && !c2paInfo.value) {
      verdict.value = 'unknown'
    } else {
      verdict.value = 'clean'
    }

    scanned.value = true
  } catch (e) {
    error.value = '检测失败：' + (e.message || '未知错误')
  } finally {
    busy.value = false
  }
}

// ============ 复制报告 ============
function copyReport() {
  const lines = ['=== AI 图片检测报告 ===']
  lines.push(`判定: ${verdictTitle.value}`)
  lines.push(`图片: ${fileName.value} (${imgW.value}×${imgH.value})`)
  lines.push('')

  if (aiHits.value.length) {
    lines.push(`--- AI 关键词命中 (${aiHits.value.length}) ---`)
    for (const h of aiHits.value) {
      lines.push(`  [${h.source}] ${h.keyword}: ${h.value}`)
    }
    lines.push('')
  }

  if (exifFields.value.length) {
    lines.push(`--- EXIF 元数据 (${exifFields.value.length}) ---`)
    for (const f of exifFields.value) {
      lines.push(`  ${f.key}: ${f.value}`)
    }
    lines.push('')
  }

  if (xmpFields.value.length) {
    lines.push(`--- XMP 元数据 (${xmpFields.value.length}) ---`)
    for (const f of xmpFields.value.slice(0, 30)) {
      lines.push(`  ${f.key}: ${f.value}`)
    }
    lines.push('')
  }

  if (c2paInfo.value) {
    lines.push('--- C2PA Content Credentials ---')
    for (const f of c2paInfo.value) {
      lines.push(`  ${f.key}: ${f.value}`)
    }
  }

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    setSuccess('报告已复制到剪贴板')
  }).catch(() => {
    error.value = '复制失败'
  })
}

// ============ 清空 ============
function clearAll() {
  hasImage.value = false
  scanned.value = false
  rawBytes.value = null
  aiHits.value = []
  exifFields.value = []
  xmpFields.value = []
  c2paInfo.value = null
  verdict.value = 'unknown'
  error.value = ''
  fileName.value = ''
  fileSizeVal.value = 0
  imgW.value = 0
  imgH.value = 0
  if (previewImg.value) previewImg.value.src = ''
}

// ============ 生命周期 ============
onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  clearTimeout(successTimer)
})
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--line);
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  margin-bottom: 12px;
}
.upload-area:hover,
.upload-dragover {
  border-color: var(--accent);
}
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.upload-icon {
  font-size: 28px;
}
.upload-text {
  color: var(--text);
  font-size: 14px;
}
.upload-hint {
  color: var(--muted);
  font-size: 12px;
}

.canvas-wrapper {
  background: var(--panel-2);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-height: 300px;
  overflow: hidden;
  margin-bottom: 8px;
}
.preview-img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.image-info {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.info-item {
  font-size: 12px;
  color: var(--muted);
  background: var(--panel);
  padding: 2px 8px;
  border: 1px solid var(--line);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-title {
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
}

.empty-hint {
  color: var(--muted);
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}

/* 判定框 */
.verdict-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--line);
  margin-bottom: 14px;
}
.verdict-icon {
  font-size: 28px;
  flex-shrink: 0;
}
.verdict-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}
.verdict-desc {
  font-size: 12px;
  color: var(--muted);
}
.verdict-ai {
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 8%, transparent);
}
.verdict-ai .verdict-title { color: var(--red); }
.verdict-likely {
  border-color: #d4a017;
  background: color-mix(in srgb, #d4a017 8%, transparent);
}
.verdict-likely .verdict-title { color: #d4a017; }
.verdict-clean {
  border-color: var(--accent);
  background: var(--green-soft);
}
.verdict-clean .verdict-title { color: var(--accent); }
.verdict-unknown {
  border-color: var(--line);
}
.verdict-unknown .verdict-title { color: var(--muted); }

/* 区块 */
.section-block {
  margin-bottom: 14px;
}
.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}

/* 命中列表 */
.hit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
}
.hit-tag {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
  min-width: 80px;
}
.hit-key {
  font-weight: 600;
  white-space: nowrap;
}
.hit-key-ai {
  color: var(--red);
}
.hit-val {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* 元数据表 */
.meta-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
}
.meta-row {
  display: flex;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid var(--line);
  background: var(--panel);
}
.meta-k {
  color: var(--muted);
  min-width: 110px;
  flex-shrink: 0;
}
.meta-v {
  color: var(--text);
  word-break: break-all;
  flex: 1;
}
.meta-v-ai {
  color: var(--red);
  font-weight: 600;
}

/* 按钮 */
.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.tool-button {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--line);
}
.tool-button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.tool-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tool-button.primary {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}
.tool-button.primary:hover:not(:disabled) {
  background: #b0ff8a;
}
.tool-button.danger:hover:not(:disabled) {
  border-color: var(--red);
  color: var(--red);
}

.copy-btn-inline {
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}
.copy-btn-inline:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.status-error {
  color: var(--red);
  font-size: 13px;
  margin-top: 8px;
}
.status-success {
  color: var(--accent);
  font-size: 13px;
  margin-top: 8px;
}
</style>
