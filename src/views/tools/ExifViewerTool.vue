<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 图片 EXIF 查看器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 + 预览 + 基本信息 -->
          <div class="tool-col">
            <label class="tool-label">上传图片：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击、拖拽或 Ctrl+V 粘贴图片</span>
                <span class="upload-hint">支持 JPEG / PNG（含 EXIF 元数据）</span>
              </div>
            </div>

            <template v-if="hasImage">
              <label class="tool-label">图片预览：</label>
              <div class="canvas-wrapper">
                <img :src="previewUrl" class="preview-img" alt="图片预览" />
              </div>

              <div class="image-info">
                <span class="info-item" :title="fileName">📄 {{ fileName }}</span>
                <span class="info-item">📐 {{ imgWidth }} × {{ imgHeight }} px</span>
                <span class="info-item">💾 {{ fileSizeText }}</span>
                <span class="info-item">🧩 {{ mimeType }}</span>
              </div>

              <div v-if="gps" class="gps-card">
                <div class="section-header">
                  <span class="section-title">📍 GPS 位置</span>
                  <button class="copy-btn-inline" @click="copyText(gps.fullText, 'GPS 坐标已复制')">📋</button>
                </div>
                <div class="gps-coord">{{ gps.decimal }}</div>
                <div class="gps-sub">{{ gps.latText }} · {{ gps.lonText }}<span v-if="gps.altitudeText"> · {{ gps.altitudeText }}</span></div>
                <a class="gps-link" :href="gps.mapUrl" target="_blank" rel="noopener noreferrer">
                  🗺️ 在 OpenStreetMap 中查看位置
                </a>
              </div>
            </template>
            <div v-else class="placeholder-preview">
              <span>上传 JPEG / PNG 图片后在此预览</span>
            </div>
          </div>

          <!-- 右栏：EXIF 元数据 -->
          <div class="tool-col">
            <div class="section-header">
              <span class="section-title">EXIF 元数据</span>
              <button
                class="copy-btn-inline"
                :disabled="!groups.length"
                @click="copyAll"
              >📋 复制全部</button>
            </div>

            <div v-if="!hasImage" class="exif-empty">尚未上传图片</div>
            <div v-else-if="parsing" class="exif-empty">正在解析…</div>
            <div v-else-if="!groups.length" class="exif-empty">
              未找到 EXIF 元数据<br />
              <span class="exif-empty-sub">图片可能被压缩、平台清除或本身不含元信息</span>
            </div>

            <div v-else class="exif-groups">
              <div v-for="g in groups" :key="g.key" class="exif-group">
                <div class="section-header">
                  <span class="section-title">{{ g.icon }} {{ g.title }}</span>
                  <button class="copy-btn-inline" @click="copyGroup(g)">📋</button>
                </div>
                <div class="kv-list">
                  <div v-for="e in g.entries" :key="g.key + '-' + e.tag + '-' + e.name" class="kv-row">
                    <span class="kv-key" :title="e.name">{{ e.name }}</span>
                    <span class="kv-val" :title="e.value">{{ e.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮组（双栏外） -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!groups.length" @click="copyAll">
            📋 复制全部
          </button>
          <button class="tool-button" :disabled="!hasImage" @click="exportJson">
            ⬇️ 导出 JSON
          </button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/* ============================================================
 * 纯前端 EXIF 解析（JPEG APP1 / PNG eXIf），无任何外部请求
 * ============================================================ */

const TYPE_NAMES = {
  1: 'BYTE', 2: 'ASCII', 3: 'SHORT', 4: 'LONG', 5: 'RATIONAL',
  6: 'SBYTE', 7: 'UNDEFINED', 8: 'SSHORT', 9: 'SLONG', 10: 'SRATIONAL',
  11: 'FLOAT', 12: 'DOUBLE'
}
const TYPE_SIZES = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8
}

/* ---------- 基础工具 ---------- */
function rat(vals) {
  const v = Array.isArray(vals) ? vals[0] : vals
  return Array.isArray(v) ? v : [v, 1]
}
function ratAt(vals, i) {
  const v = Array.isArray(vals) ? vals[i] : null
  if (!Array.isArray(v)) return null
  return v[1] ? v[0] / v[1] : null
}
function first(vals) {
  if (vals == null) return null
  if (typeof vals === 'string') return vals
  if (vals instanceof Uint8Array) return vals[0]
  return Array.isArray(vals) ? vals[0] : vals
}
function firstNum(vals) {
  const v = first(vals)
  return typeof v === 'number' ? v : null
}
function trimNum(x) {
  if (!isFinite(x)) return String(x)
  if (Number.isInteger(x)) return String(x)
  return String(Number(x.toFixed(4)))
}
function decodeText(u8) {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(u8).replace(/\u0000+$/g, '')
  } catch {
    let s = ''
    for (let i = 0; i < u8.length; i++) {
      if (u8[i] === 0) break
      s += String.fromCharCode(u8[i])
    }
    return s
  }
}
function decodeUtf16(u8) {
  let i = 0
  let le = true
  if (u8[0] === 0xff && u8[1] === 0xfe) { le = true; i = 2 }
  else if (u8[0] === 0xfe && u8[1] === 0xff) { le = false; i = 2 }
  let s = ''
  for (; i + 1 < u8.length; i += 2) {
    const code = le ? (u8[i] | (u8[i + 1] << 8)) : ((u8[i] << 8) | u8[i + 1])
    if (code === 0) break
    s += String.fromCharCode(code)
  }
  return s.replace(/\u0000+$/g, '')
}
function genericFormat(vals, type, count) {
  if (vals == null) return '—'
  if (type === 2) return String(vals)
  if (vals instanceof Uint8Array) {
    if (count > 32) return `〈二进制数据 ${count} 字节〉`
    return Array.from(vals).map((b) => b.toString(16).padStart(2, '0')).join(' ')
  }
  if (Array.isArray(vals)) {
    if (type === 5 || type === 10) {
      return vals.map((r) => (Array.isArray(r) ? (r[1] ? trimNum(r[0] / r[1]) : `${r[0]}/0`) : r)).join(', ')
    }
    return vals.map((v) => (typeof v === 'number' ? trimNum(v) : String(v))).join(', ')
  }
  return String(vals)
}

/* ---------- 各类值的格式化器 ---------- */
function fmtExposure(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  const x = n / d
  if (x > 0 && x < 1) return `1/${Math.round(d / n)} s`
  return `${trimNum(x)} s`
}
function fmtFNumber(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  return `f/${trimNum(n / d)}`
}
function fmtApertureValue(vals) {
  const x = firstNum(vals)
  if (x == null) return '—'
  return `f/${trimNum(Math.pow(2, x / 2))}`
}
function fmtShutterSpeed(vals) {
  const x = firstNum(vals)
  if (x == null) return '—'
  const sec = Math.pow(2, -x)
  if (sec < 1) return `1/${Math.round(1 / sec)} s`
  return `${trimNum(sec)} s`
}
function fmtFocalLength(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  return `${trimNum(n / d)} mm`
}
function fmtRationalPlain(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  return trimNum(n / d)
}
function fmtRationalPair(vals) {
  if (!Array.isArray(vals)) return '—'
  return vals.map((r) => (Array.isArray(r) && r[1] ? trimNum(r[0] / r[1]) : '—')).join(', ')
}
function fmtDatetime(vals) {
  if (typeof vals !== 'string') return String(vals)
  return vals.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
}
function fmtVersionBytes(vals) {
  if (vals instanceof Uint8Array) {
    let s = ''
    for (let i = 0; i < vals.length; i++) if (vals[i] !== 0) s += String.fromCharCode(vals[i])
    return s
  }
  return genericFormat(vals, 7, Array.isArray(vals) ? vals.length : 0)
}
function fmtGpsVersion(vals) {
  if (vals instanceof Uint8Array) return Array.from(vals).join('.')
  return genericFormat(vals, 7, 0)
}
function fmtComponentsConfig(vals) {
  if (!(vals instanceof Uint8Array)) return genericFormat(vals, 7, 0)
  const map = { 0: '-', 1: 'Y', 2: 'Cb', 3: 'Cr', 4: 'R', 5: 'G', 6: 'B' }
  return Array.from(vals).map((b) => map[b] || b).join(' ')
}
function fmtUserComment(vals) {
  if (!(vals instanceof Uint8Array) || vals.length < 8) return genericFormat(vals, 7, vals && vals.length)
  const prefix = String.fromCharCode(...vals.slice(0, 8))
  const body = vals.slice(8)
  if (prefix.startsWith('ASCII')) return decodeText(body) || '—'
  if (prefix.startsWith('UNICODE')) return decodeUtf16(body) || '—'
  return decodeText(body) || '—'
}
function fmtUtf16(vals) {
  if (typeof vals === 'string') return vals
  if (vals instanceof Uint8Array) return decodeUtf16(vals)
  return genericFormat(vals, 7, Array.isArray(vals) ? vals.length : 0)
}
function fmtLensSpec(vals) {
  if (!Array.isArray(vals) || vals.length < 4) return genericFormat(vals, 5, 0)
  const f1 = ratAt(vals, 0)
  const f2 = ratAt(vals, 1)
  const a1 = ratAt(vals, 2)
  const a2 = ratAt(vals, 3)
  const foc = f1 == null ? '' : f1 === f2 ? `${trimNum(f1)}mm` : `${trimNum(f1)}-${trimNum(f2)}mm`
  const ap = a1 == null ? '' : a1 === a2 ? `f/${trimNum(a1)}` : `f/${trimNum(a1)}-${trimNum(a2)}`
  return `${foc} ${ap}`.trim()
}
function fmtGpsCoord(vals) {
  if (!Array.isArray(vals) || vals.length < 3) return genericFormat(vals, 5, 0)
  const d = ratAt(vals, 0) || 0
  const m = ratAt(vals, 1) || 0
  const s = ratAt(vals, 2) || 0
  return `${Math.floor(d)}° ${Math.floor(m)}′ ${trimNum(s)}″`
}
function fmtGpsTime(vals) {
  if (!Array.isArray(vals)) return '—'
  const parts = vals.map((r) => {
    const x = Array.isArray(r) && r[1] ? r[0] / r[1] : 0
    return String(Math.floor(x)).padStart(2, '0')
  })
  return `${parts.join(':')} UTC`
}
function fmtAltitude(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  return `${trimNum(n / d)} m`
}
function fmtAltitudeRef(vals) {
  const v = firstNum(vals)
  return v === 1 ? '海平面以下' : '海平面以上'
}
function fmtMap(table, fallback = '—') {
  return (vals) => {
    let v = first(vals)
    if (v instanceof Uint8Array) v = v[0]
    if (v != null && table[v] != null) return table[v]
    return `${fallback}(${v})`
  }
}
const ORIENTATION_MAP = {
  1: '正常 (0°)', 2: '水平镜像', 3: '旋转 180°', 4: '垂直镜像',
  5: '顺时针 90° + 镜像', 6: '顺时针 90°', 7: '逆时针 90° + 镜像', 8: '逆时针 90°'
}
function fmtOrientation(vals) {
  const v = firstNum(vals)
  return ORIENTATION_MAP[v] || `未知(${v})`
}
function fmtFlash(vals) {
  const v = firstNum(vals)
  if (v == null) return '—'
  if (v & 0x20) return '无闪光灯功能'
  const parts = [v & 1 ? '已触发' : '未触发']
  const mode = (v >> 3) & 3
  const modeText = { 1: '强制', 2: '强制关闭', 3: '自动' }[mode]
  if (modeText) parts.push(modeText)
  if (!(v & 1) && mode === 3) parts.push('自动模式未闪光')
  if (v & 0x40) parts.push('防红眼')
  return parts.join('，')
}
function fmtExposureBias(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  const x = n / d
  return `${x > 0 ? '+' : ''}${trimNum(x)} EV`
}
function fmtDigitalZoom(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  return `${trimNum(n / d)}×`
}
function fmtFocal35(vals) {
  const v = firstNum(vals)
  return v == null ? '—' : `${v} mm`
}
function fmtSubjectDistance(vals) {
  const [n, d] = rat(vals)
  if (!d) return '—'
  const x = n / d
  if (x === 0) return '未知'
  return `${trimNum(x)} m`
}
function fmtBinary(vals, type, count) {
  if (vals instanceof Uint8Array) {
    if (count > 16) return `〈二进制数据 ${count} 字节〉`
    return Array.from(vals).map((b) => b.toString(16).padStart(2, '0')).join(' ')
  }
  return genericFormat(vals, type, count)
}

/* ---------- 标签字典（按 IFD 分组，避免 tag 冲突） ---------- */
const TAG_DEFS = {
  ifd0: {
    0x0100: { n: '图像宽度', f: (v) => `${firstNum(v)} px` },
    0x0101: { n: '图像高度', f: (v) => `${firstNum(v)} px` },
    0x0102: { n: '每像素位数' },
    0x0103: { n: '压缩方式', f: fmtMap({ 1: '未压缩', 5: 'LZW', 6: 'JPEG', 7: 'JPEG', 32773: 'PackBits' }, '方式') },
    0x0106: { n: '光度解释', f: fmtMap({ 0: '白=黑', 1: '黑=白', 2: 'RGB', 3: '调色板', 5: 'CMYK', 6: 'YCbCr' }, '类型') },
    0x010e: { n: '图像描述' },
    0x010f: { n: '制造商' },
    0x0110: { n: '相机型号' },
    0x0111: { n: '条带偏移' },
    0x0112: { n: '方向', f: fmtOrientation },
    0x0115: { n: '每像素样本数' },
    0x0116: { n: '每带行数' },
    0x0117: { n: '条带字节数' },
    0x011a: { n: '水平分辨率', f: fmtRationalPlain },
    0x011b: { n: '垂直分辨率', f: fmtRationalPlain },
    0x011c: { n: '平面配置' },
    0x0128: { n: '分辨率单位', f: fmtMap({ 1: '无单位', 2: '英寸', 3: '厘米' }, '单位') },
    0x0131: { n: '软件' },
    0x0132: { n: '修改时间', f: fmtDatetime },
    0x013b: { n: '作者/艺术家' },
    0x013e: { n: '白点色度', f: fmtRationalPair },
    0x013f: { n: '原色色度', f: fmtRationalPair },
    0x0213: { n: 'YCbCr 定位', f: fmtMap({ 1: '居中', 2: '同置' }, '定位') },
    0x8298: { n: '版权' },
    0x8769: { n: 'Exif IFD 指针' },
    0x8825: { n: 'GPS IFD 指针' },
    0xa005: { n: 'Interop IFD 指针' },
    0x9c9b: { n: 'XP 标题', f: fmtUtf16 },
    0x9c9c: { n: 'XP 备注', f: fmtUtf16 },
    0x9c9d: { n: 'XP 作者', f: fmtUtf16 },
    0x9c9e: { n: 'XP 关键词', f: fmtUtf16 },
    0x9c9f: { n: 'XP 主题', f: fmtUtf16 }
  },
  exif: {
    0x829a: { n: '曝光时间', f: fmtExposure },
    0x829d: { n: '光圈值', f: fmtFNumber },
    0x8822: { n: '曝光程序', f: fmtMap({ 0: '未定义', 1: '手动', 2: '程序自动', 3: '光圈优先', 4: '快门优先', 5: '创意模式', 6: '动作模式', 7: '人像', 8: '风景' }, '程序') },
    0x8827: { n: 'ISO 感光度', f: (v) => `ISO ${firstNum(v)}` },
    0x8830: { n: '感光度类型', f: fmtMap({ 0: '未知', 1: '标准输出感光度', 2: '推荐曝光指数', 3: 'ISO 感光度', 4: '标准输出 + 推荐', 5: '标准输出 + ISO', 6: '推荐 + ISO', 7: '全部' }, '类型') },
    0x8832: { n: '推荐曝光指数' },
    0x9000: { n: 'Exif 版本', f: fmtVersionBytes },
    0x9003: { n: '拍摄时间', f: fmtDatetime },
    0x9004: { n: '数字化时间', f: fmtDatetime },
    0x9010: { n: '时间偏移' },
    0x9011: { n: '原始时间偏移' },
    0x9012: { n: '数字化时间偏移' },
    0x9101: { n: '色彩空间配置', f: fmtComponentsConfig },
    0x9102: { n: '压缩位/像素', f: fmtRationalPlain },
    0x9201: { n: '快门速度', f: fmtShutterSpeed },
    0x9202: { n: '光圈 (APEX)', f: fmtApertureValue },
    0x9203: { n: '亮度', f: fmtRationalPlain },
    0x9204: { n: '曝光补偿', f: fmtExposureBias },
    0x9205: { n: '最大光圈', f: fmtApertureValue },
    0x9206: { n: '主体距离', f: fmtSubjectDistance },
    0x9207: { n: '测光模式', f: fmtMap({ 0: '未知', 1: '平均测光', 2: '中央重点', 3: '点测光', 4: '多点测光', 5: '矩阵测光', 6: '局部测光', 255: '其他' }, '模式') },
    0x9208: { n: '光源', f: fmtMap({ 0: '未知', 1: '日光', 2: '荧光灯', 3: '钨丝灯', 4: '闪光灯', 9: '晴天', 10: '阴天', 11: '阴影', 12: '荧光灯(暖白)', 13: '荧光灯(冷白)', 14: '荧光灯(日白)', 15: '白平衡日光', 17: '标准光源 A', 18: '标准光源 B', 19: '标准光源 C', 20: 'D55', 21: 'D65', 22: 'D75', 23: 'D50', 24: '摄影棚钨丝灯', 255: '其他' }, '光源') },
    0x9209: { n: '闪光灯', f: fmtFlash },
    0x920a: { n: '焦距', f: fmtFocalLength },
    0x9214: { n: '主体区域' },
    0x927c: { n: '厂商备注 (MakerNote)', f: fmtBinary },
    0x9286: { n: '用户备注', f: fmtUserComment },
    0x9290: { n: '亚秒时间' },
    0x9291: { n: '原始亚秒时间' },
    0x9292: { n: '数字化亚秒时间' },
    0xa000: { n: 'FlashPix 版本', f: fmtVersionBytes },
    0xa001: { n: '色彩空间', f: fmtMap({ 1: 'sRGB', 2: 'Adobe RGB', 65535: '未校准' }, '色彩空间') },
    0xa002: { n: '有效像素宽', f: (v) => `${firstNum(v)} px` },
    0xa003: { n: '有效像素高', f: (v) => `${firstNum(v)} px` },
    0xa004: { n: '相关声音文件' },
    0xa20e: { n: '焦平面水平分辨率', f: fmtRationalPlain },
    0xa20f: { n: '焦平面垂直分辨率', f: fmtRationalPlain },
    0xa210: { n: '焦平面分辨率单位', f: fmtMap({ 1: '无单位', 2: '英寸', 3: '厘米' }, '单位') },
    0xa215: { n: '曝光指数', f: fmtRationalPlain },
    0xa217: { n: '感光方式', f: fmtMap({ 1: '未定义', 2: '单芯片彩色区域', 3: '双芯片彩色区域', 4: '三芯片彩色区域', 5: '彩色序列区域', 7: '三线传感器', 8: '彩色序列线性' }, '方式') },
    0xa300: { n: '文件来源', f: fmtMap({ 3: '数码相机 (DSC)' }, '来源') },
    0xa301: { n: '场景类型', f: fmtMap({ 1: '直接拍摄' }, '场景') },
    0xa302: { n: 'CFA 模式', f: fmtBinary },
    0xa401: { n: '自定义渲染', f: fmtMap({ 0: '正常', 1: '自定义' }, '渲染') },
    0xa402: { n: '曝光模式', f: fmtMap({ 0: '自动曝光', 1: '手动曝光', 2: '自动包围曝光' }, '模式') },
    0xa403: { n: '白平衡', f: fmtMap({ 0: '自动', 1: '手动' }, '白平衡') },
    0xa404: { n: '数码变焦比', f: fmtDigitalZoom },
    0xa405: { n: '等效 35mm 焦距', f: fmtFocal35 },
    0xa406: { n: '场景拍摄类型', f: fmtMap({ 0: '标准', 1: '风景', 2: '人像', 3: '夜景' }, '类型') },
    0xa407: { n: '增益控制', f: fmtMap({ 0: '无', 1: '低增益', 2: '高增益', 3: '低增益(向下)', 4: '高增益(向上)' }, '增益') },
    0xa408: { n: '对比度', f: fmtMap({ 0: '标准', 1: '柔和', 2: '强烈' }, '对比度') },
    0xa409: { n: '饱和度', f: fmtMap({ 0: '标准', 1: '低饱和', 2: '高饱和' }, '饱和度') },
    0xa40a: { n: '锐度', f: fmtMap({ 0: '标准', 1: '柔和', 2: '强烈' }, '锐度') },
    0xa40c: { n: '主体距离范围', f: fmtMap({ 0: '未知', 1: '微距', 2: '近景', 3: '远景' }, '范围') },
    0xa420: { n: '图像唯一 ID' },
    0xa430: { n: '相机所有者' },
    0xa431: { n: '机身序列号' },
    0xa432: { n: '镜头规格', f: fmtLensSpec },
    0xa433: { n: '镜头制造商' },
    0xa434: { n: '镜头型号' },
    0xa435: { n: '镜头序列号' },
    0xa460: { n: '合成图像' },
    0xa461: { n: '合成图像源数量' },
    0xa500: { n: 'Gamma', f: fmtRationalPlain }
  },
  gps: {
    0x0000: { n: 'GPS 版本', f: fmtGpsVersion },
    0x0001: { n: '纬度参考', f: (v) => String(v) },
    0x0002: { n: '纬度', f: fmtGpsCoord },
    0x0003: { n: '经度参考', f: (v) => String(v) },
    0x0004: { n: '经度', f: fmtGpsCoord },
    0x0005: { n: '海拔参考', f: fmtAltitudeRef },
    0x0006: { n: '海拔高度', f: fmtAltitude },
    0x0007: { n: 'GPS 时间', f: fmtGpsTime },
    0x0008: { n: '卫星信息' },
    0x0009: { n: 'GPS 状态', f: fmtMap({ A: '测量有效', V: '测量无效' }, '状态') },
    0x000a: { n: '测量模式', f: fmtMap({ 2: '2D', 3: '3D' }, '模式') },
    0x000b: { n: '精度因子 DOP', f: fmtRationalPlain },
    0x000c: { n: '速度参考', f: fmtMap({ K: 'km/h', M: 'mph', N: '节' }, '单位') },
    0x000d: { n: '速度', f: fmtRationalPlain },
    0x000e: { n: '方向参考', f: fmtMap({ T: '真北', M: '磁北' }, '参考') },
    0x000f: { n: '方向', f: fmtRationalPlain },
    0x0010: { n: '图像方向参考' },
    0x0011: { n: '图像方向', f: fmtRationalPlain },
    0x0012: { n: '大地基准面' },
    0x0013: { n: '目标纬度参考' },
    0x0014: { n: '目标纬度', f: fmtGpsCoord },
    0x0015: { n: '目标经度参考' },
    0x0016: { n: '目标经度', f: fmtGpsCoord },
    0x001b: { n: '处理方法' },
    0x001c: { n: '区域信息' },
    0x001d: { n: 'GPS 日期' },
    0x001e: { n: '差分校正', f: fmtMap({ 0: '无差分', 1: '已差分' }, '差分') },
    0x001f: { n: '水平定位误差', f: fmtRationalPlain }
  },
  interop: {
    0x0001: { n: '互操作标识' },
    0x0002: { n: '互操作版本', f: fmtVersionBytes },
    0x1000: { n: '相关图像格式' },
    0x1001: { n: '相关图像宽' },
    0x1002: { n: '相关图像高' }
  }
}

const POINTER_TAGS = [0x8769, 0x8825, 0xa005]

/* ---------- TIFF 读取 ---------- */
function getBytes(dv, off, len) {
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) out[i] = dv.getUint8(off + i)
  return out
}

function readValues(dv, tiffStart, entryOff, little, type, count) {
  const size = TYPE_SIZES[type] || 1
  const total = size * count
  const off = total <= 4 ? entryOff + 8 : tiffStart + dv.getUint32(entryOff + 8, little)
  if (off < 0 || off + total > dv.byteLength) return null
  switch (type) {
    case 2: {
      let end = off
      const max = off + count
      while (end < max && dv.getUint8(end) !== 0) end++
      return decodeText(new Uint8Array(dv.buffer, dv.byteOffset + off, Math.max(0, end - off)))
    }
    case 1:
    case 7:
      return getBytes(dv, off, count)
    case 6: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getInt8(off + i))
      return a
    }
    case 3: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getUint16(off + i * 2, little))
      return a
    }
    case 8: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getInt16(off + i * 2, little))
      return a
    }
    case 4: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getUint32(off + i * 4, little))
      return a
    }
    case 9: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getInt32(off + i * 4, little))
      return a
    }
    case 5: {
      const a = []
      for (let i = 0; i < count; i++) a.push([dv.getUint32(off + i * 8, little), dv.getUint32(off + i * 8 + 4, little)])
      return a
    }
    case 10: {
      const a = []
      for (let i = 0; i < count; i++) a.push([dv.getInt32(off + i * 8, little), dv.getInt32(off + i * 8 + 4, little)])
      return a
    }
    case 11: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getFloat32(off + i * 4, little))
      return a
    }
    case 12: {
      const a = []
      for (let i = 0; i < count; i++) a.push(dv.getFloat64(off + i * 8, little))
      return a
    }
    default:
      return null
  }
}

function readIFD(dv, tiffStart, offset, little, dict, depth) {
  const entries = []
  let next = 0
  if (depth > 6 || !offset || offset + 2 > dv.byteLength) return { entries, next }
  const count = dv.getUint16(offset, little)
  let p = offset + 2
  for (let i = 0; i < count; i++) {
    if (p + 12 > dv.byteLength) break
    const tag = dv.getUint16(p, little)
    const type = dv.getUint16(p + 2, little)
    const num = dv.getUint32(p + 4, little)
    const vals = readValues(dv, tiffStart, p, little, type, num)
    const def = dict[tag]
    const name = def ? def.n : `Tag 0x${tag.toString(16).toUpperCase().padStart(4, '0')}`
    let value
    if (vals === null) value = '—'
    else value = def && def.f ? def.f(vals, type, num) : genericFormat(vals, type, num)
    entries.push({ tag, type, typeName: TYPE_NAMES[type] || String(type), count: num, name, value, vals })
    p += 12
  }
  if (p + 4 <= dv.byteLength) next = dv.getUint32(p, little)
  return { entries, next }
}

function findTag(entries, tag) {
  const e = entries.find((x) => x.tag === tag)
  return e ? firstNum(e.vals) : null
}

function parseTiff(bytes, tiffStart) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (tiffStart + 8 > dv.byteLength) return { ok: false, reason: 'bad-tiff' }
  const b0 = dv.getUint8(tiffStart)
  const b1 = dv.getUint8(tiffStart + 1)
  let little
  if (b0 === 0x49 && b1 === 0x49) little = true
  else if (b0 === 0x4d && b1 === 0x4d) little = false
  else return { ok: false, reason: 'bad-tiff' }
  if (dv.getUint16(tiffStart + 2, little) !== 42) return { ok: false, reason: 'bad-tiff' }

  const ifd0Off = tiffStart + dv.getUint32(tiffStart + 4, little)
  const ifd0 = readIFD(dv, tiffStart, ifd0Off, little, TAG_DEFS.ifd0, 0).entries

  let exif = []
  let gps = []
  let interop = []

  const exifPtr = findTag(ifd0, 0x8769)
  if (exifPtr) exif = readIFD(dv, tiffStart, tiffStart + exifPtr, little, TAG_DEFS.exif, 1).entries

  const gpsPtr = findTag(ifd0, 0x8825)
  if (gpsPtr) gps = readIFD(dv, tiffStart, tiffStart + gpsPtr, little, TAG_DEFS.gps, 1).entries

  const interopPtr = findTag(exif, 0xa005)
  if (interopPtr) interop = readIFD(dv, tiffStart, tiffStart + interopPtr, little, TAG_DEFS.interop, 2).entries

  return { ok: true, ifd0, exif, gps, interop }
}

/* ---------- PNG 文本块 ---------- */
function parsePngTextBlock(type, data) {
  if (type === 'tEXt') {
    const i = data.indexOf(0)
    if (i < 0) return null
    const key = decodeText(data.slice(0, i))
    return { name: key || '文本', value: decodeText(data.slice(i + 1)) || '—' }
  }
  if (type === 'iTXt') {
    const i = data.indexOf(0)
    if (i < 0) return null
    const key = decodeText(data.slice(0, i))
    let p = i + 1
    const compressed = data[p] === 1
    p += 2
    const langEnd = data.indexOf(0, p)
    const afterLang = langEnd < 0 ? p : langEnd + 1
    const transEnd = data.indexOf(0, afterLang)
    const textStart = transEnd < 0 ? afterLang : transEnd + 1
    if (compressed) return { name: key || '文本', value: '〈压缩文本块〉' }
    return { name: key || '文本', value: decodeText(data.slice(textStart)) || '—' }
  }
  return null
}

function parsePng(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let off = 8
  let exifStart = -1
  const pngText = []
  let idx = 0
  while (off + 8 <= bytes.length) {
    const len = dv.getUint32(off, false)
    const type = String.fromCharCode(dv.getUint8(off + 4), dv.getUint8(off + 5), dv.getUint8(off + 6), dv.getUint8(off + 7))
    const dataStart = off + 8
    if (dataStart + len > bytes.length) break
    if (type === 'eXIf') {
      exifStart = dataStart
    } else if (type === 'tEXt' || type === 'iTXt') {
      const data = new Uint8Array(dv.buffer, dv.byteOffset + dataStart, len)
      const t = parsePngTextBlock(type, data)
      if (t) pngText.push({ tag: `png-${idx++}`, name: t.name, value: t.value, type: 'TEXT', count: 0 })
    }
    off = dataStart + len + 4
    if (type === 'IEND') break
  }
  if (exifStart >= 0) {
    const r = parseTiff(bytes, exifStart)
    if (r.ok) return { ok: true, ifd0: r.ifd0, exif: r.exif, gps: r.gps, interop: r.interop, pngText }
  }
  return { ok: false, reason: 'no-exif', pngText }
}

function parseImage(buffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 8) return { ok: false, reason: 'too-small' }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let off = 2
    while (off + 4 <= bytes.length) {
      if (bytes[off] !== 0xff) { off++; continue }
      const marker = bytes[off + 1]
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { off += 2; continue }
      if (marker === 0xda || marker === 0xd9) break
      const len = (bytes[off + 2] << 8) | bytes[off + 3]
      if (len < 2 || off + 2 + len > bytes.length) break
      if (marker === 0xe1) {
        if (bytes[off + 4] === 0x45 && bytes[off + 5] === 0x78 && bytes[off + 6] === 0x69 &&
            bytes[off + 7] === 0x66 && bytes[off + 8] === 0x00 && bytes[off + 9] === 0x00) {
          const r = parseTiff(bytes, off + 10)
          return r.ok ? { ...r, pngText: [] } : { ok: false, reason: 'bad-tiff', pngText: [] }
        }
      }
      off += 2 + len
    }
    return { ok: false, reason: 'no-exif', pngText: [] }
  }
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return parsePng(bytes)
  }
  return { ok: false, reason: 'unsupported', pngText: [] }
}

/* ============================================================
 * 组件状态
 * ============================================================ */
const fileInput = ref(null)
const hasImage = ref(false)
const parsing = ref(false)
const previewUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const mimeType = ref('')
const imgWidth = ref(0)
const imgHeight = ref(0)
const dragOver = ref(false)
const parsed = ref(null)
const error = ref('')
const success = ref('')
let successTimer = null

const fileSizeText = computed(() => formatSize(fileSize.value))

/* ---------- 分组 ---------- */
function stripPointers(entries) {
  return entries.filter((e) => !POINTER_TAGS.includes(e.tag))
}
function buildGroups() {
  const d = parsed.value
  if (!d) return []
  const out = []
  const push = (key, icon, title, entries) => {
    if (entries && entries.length) out.push({ key, icon, title, entries: stripPointers(entries) })
  }
  // 关键参数摘要
  const summary = []
  if (d.ok) {
    const pick = (arr, tag) => (arr || []).find((e) => e.tag === tag)
    const s1 = pick(d.ifd0, 0x010f)
    const s2 = pick(d.ifd0, 0x0110)
    const s3 = pick(d.exif, 0xa434)
    const s4 = pick(d.exif, 0x829d)
    const s5 = pick(d.exif, 0x829a)
    const s6 = pick(d.exif, 0x8827)
    const s7 = pick(d.exif, 0x920a)
    const s8 = pick(d.exif, 0x9003)
    const s9 = pick(d.ifd0, 0x0112)
    ;[s1, s2, s3, s4, s5, s6, s7, s8, s9].forEach((e) => { if (e) summary.push(e) })
    if (summary.length) out.push({ key: 'summary', icon: '⭐', title: '关键参数', entries: summary })
  }
  if (d.ok) {
    push('ifd0', '📦', '图像信息 (IFD0)', d.ifd0)
    push('exif', '📷', '拍摄参数 (Exif)', d.exif)
    push('gps', '📍', 'GPS 定位', d.gps)
    push('interop', '🔗', '兼容信息 (Interop)', d.interop)
  }
  push('png', '📝', 'PNG 文本块', d.pngText)
  return out
}
const groups = computed(buildGroups)

/* ---------- GPS 卡片 ---------- */
function dms(vals) {
  if (!Array.isArray(vals) || vals.length < 3) return null
  const d = ratAt(vals, 0) || 0
  const m = ratAt(vals, 1) || 0
  const s = ratAt(vals, 2) || 0
  return d + m / 60 + s / 3600
}
const gps = computed(() => {
  const d = parsed.value
  if (!d || !d.ok || !d.gps || !d.gps.length) return null
  const byTag = {}
  d.gps.forEach((e) => { byTag[e.tag] = e })
  const lat = dms(byTag[0x0002] && byTag[0x0002].vals)
  const lon = dms(byTag[0x0004] && byTag[0x0004].vals)
  if (lat == null || lon == null) return null
  const latRef = byTag[0x0001] ? String(byTag[0x0001].vals) : 'N'
  const lonRef = byTag[0x0003] ? String(byTag[0x0003].vals) : 'E'
  const sLat = String(latRef).toUpperCase().startsWith('S') ? -lat : lat
  const sLon = String(lonRef).toUpperCase().startsWith('W') ? -lon : lon
  const dec = `${sLat.toFixed(6)}, ${sLon.toFixed(6)}`
  let altitudeText = ''
  if (byTag[0x0006]) {
    const [n, dn] = rat(byTag[0x0006].vals)
    if (dn) {
      const alt = Math.abs(n / dn)
      const below = byTag[0x0005] && firstNum(byTag[0x0005].vals) === 1
      altitudeText = `海拔 ${below ? '-' : ''}${trimNum(alt)} m`
    }
  }
  const fullText = `纬度 ${sLat.toFixed(6)}°，经度 ${sLon.toFixed(6)}°${altitudeText ? '，' + altitudeText : ''}`
  return {
    decimal: dec,
    latText: `纬度 ${sLat.toFixed(6)}°`,
    lonText: `经度 ${sLon.toFixed(6)}°`,
    altitudeText,
    fullText,
    mapUrl: `https://www.openstreetmap.org/?mlat=${sLat}&mlon=${sLon}#map=15/${sLat}/${sLon}`
  }
})

/* ---------- 辅助 ---------- */
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
function setSuccess(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}
async function copyText(text, okMsg = '已复制到剪贴板') {
  if (!text) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setSuccess(okMsg)
  } catch {
    error.value = '复制失败，请手动选择文本复制'
  }
}
function groupText(g) {
  return g.entries.map((e) => `${e.name}: ${e.value}`).join('\n')
}
function copyGroup(g) {
  copyText(groupText(g), `「${g.title}」已复制`)
}
function allText() {
  const lines = [
    `文件名: ${fileName.value}`,
    `尺寸: ${imgWidth.value} × ${imgHeight.value} px`,
    `大小: ${fileSizeText.value}`,
    `类型: ${mimeType.value}`
  ]
  groups.value.forEach((g) => {
    lines.push('', `── ${g.title} ──`)
    g.entries.forEach((e) => lines.push(`${e.name}: ${e.value}`))
  })
  return lines.join('\n')
}
function copyAll() {
  if (!groups.value.length) return
  copyText(allText(), '全部元数据已复制')
}

/* ---------- 文件载入 ---------- */
function handleFile(e) {
  const file = e.target.files && e.target.files[0]
  if (file) loadFile(file)
  e.target.value = ''
}
function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadFile(file)
}
function handlePaste(e) {
  const items = (e.clipboardData && e.clipboardData.items) || []
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const file = it.getAsFile()
      if (file) { loadFile(file); e.preventDefault(); return }
    }
  }
}

function loadFile(file) {
  error.value = ''
  success.value = ''
  if (!file.type || !file.type.startsWith('image/')) {
    error.value = '请选择图片文件（JPEG / PNG）'
    return
  }
  if (file.size > 30 * 1024 * 1024) {
    error.value = '图片过大，请选择小于 30MB 的文件'
    return
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  fileName.value = file.name || 'image'
  fileSize.value = file.size
  mimeType.value = file.type
  parsing.value = true

  const img = new Image()
  img.onload = () => {
    imgWidth.value = img.naturalWidth
    imgHeight.value = img.naturalHeight
  }
  img.src = previewUrl.value

  const reader = new FileReader()
  reader.onload = () => {
    try {
      parsed.value = parseImage(reader.result)
      if (file.type && file.type !== 'image/jpeg' && file.type !== 'image/png') {
        error.value = '仅支持解析 JPEG / PNG 的元数据，当前格式可能无法识别'
      }
    } catch {
      parsed.value = { ok: false, reason: 'error', pngText: [] }
      error.value = '元数据解析失败，文件可能已损坏'
    } finally {
      hasImage.value = true
      parsing.value = false
    }
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
    parsing.value = false
  }
  reader.readAsArrayBuffer(file)
}

function exportJson() {
  if (!hasImage.value) return
  const payload = {
    file: {
      name: fileName.value,
      size: fileSize.value,
      type: mimeType.value,
      width: imgWidth.value,
      height: imgHeight.value
    },
    gps: gps.value ? { decimal: gps.value.decimal, formatted: gps.value.fullText } : null,
    groups: {}
  }
  groups.value.forEach((g) => {
    if (g.key === 'summary') return
    payload.groups[g.title] = g.entries.reduce((acc, e) => {
      acc[e.name] = e.value
      return acc
    }, {})
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(fileName.value || 'image').replace(/\.[^.]+$/, '')}-exif.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  setSuccess('JSON 已导出')
}

function clearAll() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  hasImage.value = false
  parsing.value = false
  parsed.value = null
  fileName.value = ''
  fileSize.value = 0
  mimeType.value = ''
  imgWidth.value = 0
  imgHeight.value = 0
  error.value = ''
  success.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

onMounted(() => {
  window.addEventListener('paste', handlePaste)
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
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
.upload-icon { font-size: 2.2rem; }
.upload-text { color: var(--text); font-size: 14px; }
.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  line-height: 1.5;
}

/* === 图片预览 === */
.canvas-wrapper {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  text-align: center;
}
.preview-img {
  max-width: 100%;
  max-height: 320px;
  height: auto;
  display: block;
  margin: 0 auto;
  border-radius: 0;
}
.placeholder-preview {
  border: 1px dashed var(--line);
  background: var(--panel-2);
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: 13px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === 基本信息 === */
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

/* === GPS 卡片 === */
.gps-card {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--green);
  background: var(--green-soft);
}
.gps-coord {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--green);
  margin: 6px 0 4px;
  word-break: break-all;
}
.gps-sub {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}
.gps-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  text-decoration: none;
  border-bottom: 1px dashed var(--green);
}
.gps-link:hover { color: var(--text); border-bottom-color: var(--text); }

/* === 区块头 + 复制按钮 === */
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
  white-space: nowrap;
}
.copy-btn-inline:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}
.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* === EXIF 列表 === */
.exif-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 4px;
}
.exif-group { border: 1px solid var(--line); }
.exif-group > .section-header {
  padding: 6px 10px;
  background: var(--panel-2);
  border-bottom: 1px solid var(--line);
}
.kv-list { display: flex; flex-direction: column; }
.kv-row {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 8px;
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 13px;
  border-bottom: 1px solid var(--line);
}
.kv-row:last-child { border-bottom: none; }
.kv-row:nth-child(even) { background: var(--panel-2); }
.kv-key {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kv-val {
  color: var(--text);
  word-break: break-all;
}
.exif-empty {
  border: 1px dashed var(--line);
  background: var(--panel-2);
  padding: 2rem 1rem;
  text-align: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
}
.exif-empty-sub { color: var(--text-muted); font-size: 12px; }

@media (max-width: 640px) {
  .upload-area { padding: 1.2rem; }
  .upload-text { font-size: 13px; }
  .preview-img { max-height: 240px; }
  .kv-row { grid-template-columns: 42% 58%; font-size: 12px; padding: 6px 8px; }
  .exif-groups { max-height: none; overflow: visible; }
  .gps-coord { font-size: 14px; }
}
</style>
