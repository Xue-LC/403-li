<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔐 SSL 证书解码器</span>
      <span>纯前端解析</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：输入 ============ -->
          <div class="tool-col">
            <label class="tool-label">证书内容（PEM / Base64 / HEX）：</label>
            <div
              class="upload-area"
              :class="{ dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
              @click="fileInput && fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pem,.crt,.cer,.der,.txt"
                multiple
                style="display: none"
                @change="onFileChange"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传证书文件</span>
                <span class="upload-hint">支持 PEM / CRT / CER / DER，可一次上传多张（证书链）</span>
              </div>
            </div>
            <div class="input-wrap">
              <textarea
                v-model="pemInput"
                class="code-input"
                rows="10"
                spellcheck="false"
                placeholder="-----BEGIN CERTIFICATE-----
MIID...
-----END CERTIFICATE-----"
              ></textarea>
              <button
                class="copy-btn"
                title="复制输入内容"
                :disabled="!pemInput.trim()"
                @click="copySection('输入内容', pemInput)"
              >📋</button>
            </div>

            <div v-if="certs.length > 1" class="chain-tabs">
              <span class="chain-hint">证书链（{{ certs.length }} 张）</span>
              <div class="chain-buttons">
                <button
                  v-for="(c, idx) in certs"
                  :key="idx"
                  class="chain-tab"
                  :class="{ active: idx === selected }"
                  @click="selected = idx"
                >
                  {{ idx + 1 }}. {{ c.shortName }}
                </button>
              </div>
            </div>
          </div>

          <!-- ============ 右栏：概览输出 ============ -->
          <div class="tool-col">
            <div class="section-header">
              <span class="section-title">▼ 证书概览</span>
              <button
                class="copy-btn-inline"
                :disabled="!current"
                title="复制概览"
                @click="copySection('证书概览', overviewText)"
              >📋</button>
            </div>
            <div v-if="current" class="result-display overview">
              <div v-for="row in overviewRows" :key="row.k" class="kv-row">
                <span class="kv-key">{{ row.k }}</span>
                <span class="kv-value" :class="row.cls">{{ row.v }}</span>
              </div>
            </div>
            <div v-else class="result-display placeholder">
              解析结果将显示在这里（全部在浏览器本地完成，不上传任何数据）
            </div>
          </div>
        </div>

        <!-- ============ 操作按钮 ============ -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!pemInput.trim()" @click="parseNow(true)">
            🔍 解析证书
          </button>
          <button class="tool-button" @click="loadSample">🧪 载入示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- ============ 详细信息 ============ -->
        <template v-if="current">
          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 有效期</span>
              <button class="copy-btn-inline" @click="copySection('有效期', sectionText(validityRows))">📋</button>
            </div>
            <div class="kv-table">
              <div v-for="row in validityRows" :key="row.k" class="kv-row">
                <span class="kv-key">{{ row.k }}</span>
                <span class="kv-value" :class="row.cls">{{ row.v }}</span>
              </div>
            </div>
            <div class="validity-bar" :class="current.validityClass">
              <div class="validity-fill" :style="{ width: current.progress + '%' }"></div>
            </div>
            <div class="validity-note">
              生命周期已过 <strong>{{ current.progress.toFixed(1) }}%</strong>
              <template v-if="current.daysRemaining !== null">
                · {{ current.daysRemaining >= 0 ? '剩余' : '已过期' }}
                {{ Math.abs(current.daysRemaining) }} 天
              </template>
            </div>
          </section>

          <div class="detail-grid">
            <section class="detail-section">
              <div class="section-header">
                <span class="section-title">▼ 主体 Subject</span>
                <button class="copy-btn-inline" @click="copySection('主体', sectionText(subjectRows))">📋</button>
              </div>
              <div class="kv-table">
                <div v-for="row in subjectRows" :key="row.k" class="kv-row">
                  <span class="kv-key">{{ row.k }}</span>
                  <span class="kv-value mono">{{ row.v }}</span>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <div class="section-header">
                <span class="section-title">▼ 颁发者 Issuer</span>
                <button class="copy-btn-inline" @click="copySection('颁发者', sectionText(issuerRows))">📋</button>
              </div>
              <div class="kv-table">
                <div v-for="row in issuerRows" :key="row.k" class="kv-row">
                  <span class="kv-key">{{ row.k }}</span>
                  <span class="kv-value mono">{{ row.v }}</span>
                </div>
              </div>
            </section>
          </div>

          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 公钥信息</span>
              <button class="copy-btn-inline" @click="copySection('公钥信息', sectionText(spkiRows))">📋</button>
            </div>
            <div class="kv-table">
              <div v-for="row in spkiRows" :key="row.k" class="kv-row">
                <span class="kv-key">{{ row.k }}</span>
                <span class="kv-value mono">{{ row.v }}</span>
                <button v-if="row.copy" class="row-copy" title="复制" @click="copySection(row.k, row.copy)">📋</button>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 扩展信息（{{ current.extensions.length }}）</span>
              <button class="copy-btn-inline" @click="copySection('扩展信息', extText)">📋</button>
            </div>
            <div v-if="!current.extensions.length" class="result-display placeholder">该证书没有扩展字段（v1/v2 证书）</div>
            <div v-else class="ext-grid">
              <div v-for="(ext, i) in current.extensions" :key="i" class="ext-card">
                <div class="ext-head">
                  <span class="ext-name">{{ ext.name }}</span>
                  <span v-if="ext.critical" class="ext-crit">CRITICAL</span>
                  <button class="copy-btn-inline small" @click="copySection(ext.name, extCopyText(ext))">📋</button>
                </div>
                <div class="ext-oid">{{ ext.oid }} · {{ ext.rawLen }} 字节</div>
                <ul class="ext-lines">
                  <li v-for="(line, li) in ext.lines" :key="li">{{ line }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 指纹 / 摘要</span>
              <button class="copy-btn-inline" @click="copySection('指纹', sectionText(fingerprintRows))">📋</button>
            </div>
            <div class="kv-table">
              <div v-for="row in fingerprintRows" :key="row.k" class="kv-row">
                <span class="kv-key">{{ row.k }}</span>
                <span class="kv-value mono">{{ row.v }}</span>
                <button class="row-copy" title="复制" @click="copySection(row.k, row.v)">📋</button>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 原始数据 / 签名</span>
              <button class="copy-btn-inline" @click="copySection('原始数据', sectionText(rawRows))">📋</button>
            </div>
            <div class="kv-table">
              <div v-for="row in rawRows" :key="row.k" class="kv-row">
                <span class="kv-key">{{ row.k }}</span>
                <span class="kv-value mono">{{ row.v }}</span>
              </div>
            </div>
            <div class="hex-head">
              <span>DER 头 64 字节：</span>
              <button class="copy-btn-inline small" @click="copySection('DER HEX', current.derHexHeadFull)">📋</button>
            </div>
            <pre class="hex-dump">{{ current.derHexHead }}</pre>
          </section>

          <section class="detail-section">
            <div class="section-header">
              <span class="section-title">▼ 证书原文（PEM）</span>
              <button class="copy-btn-inline" @click="copySection('PEM', current.pem)">📋</button>
            </div>
            <textarea class="code-input output pem-out" readonly rows="6" :value="current.pem"></textarea>
          </section>

          <div class="button-group button-group-2">
            <button class="tool-button primary" @click="copySection('完整报告', reportText)">📋 复制完整报告</button>
            <button class="tool-button" @click="downloadPem">💾 导出证书文件</button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ==================== DER PARSER START ==================== */
/* 纯 JavaScript 的 ASN.1 DER 解析 + X.509 证书解读，无任何外部依赖 */

const utf8Decoder = new TextDecoder('utf-8')
const latinDecoder = new TextDecoder('latin1')
const utf16beDecoder = new TextDecoder('utf-16be')

function toHex(bytes, sep = '') {
  if (!bytes) return ''
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
    if (sep && i !== bytes.length - 1) out += sep
  }
  return out
}

function toHexUpper(bytes, sep = ' ') {
  return toHex(bytes, sep).toUpperCase()
}

function b64ToBytes(b64) {
  const bin = atob(String(b64).replace(/\s+/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

function bytesToPem(bytes, label = 'CERTIFICATE') {
  const lines = bytesToB64(bytes).match(/.{1,64}/g) || []
  return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----'
}

function hexToBytes(text) {
  const clean = text.replace(/0x/gi, '').replace(/[\s:,]/g, '')
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) throw new Error('HEX 内容不合法')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

/** 解析单个 TLV 节点（含子节点） */
function parseNode(bytes, pos, end) {
  if (pos + 2 > end) throw new Error('DER 数据不完整')
  const first = bytes[pos]
  const cls = first >> 6
  const constructed = (first & 0x20) !== 0
  let num = first & 0x1f
  let p = pos + 1
  if (num === 0x1f) {
    num = 0
    let guard = 0
    while (p < end && (bytes[p] & 0x80)) {
      num = (num << 7) | (bytes[p] & 0x7f)
      p++
      if (++guard > 8) throw new Error('DER 标签编码异常')
    }
    if (p >= end) throw new Error('DER 标签编码不完整')
    num = (num << 7) | (bytes[p] & 0x7f)
    p++
  }
  if (p >= end) throw new Error('DER 长度字段缺失')
  let len = bytes[p++]
  if (len & 0x80) {
    const n = len & 0x7f
    if (n === 0) throw new Error('不支持不定长（Indefinite Length）编码')
    if (n > 4) throw new Error('DER 长度字段过长')
    if (p + n > end) throw new Error('DER 长度字段不完整')
    len = 0
    for (let i = 0; i < n; i++) len = len * 256 + bytes[p++]
  }
  const contentStart = p
  const contentEnd = p + len
  if (contentEnd > end) throw new Error('DER 长度越界，数据可能被截断或不完整')
  const node = {
    cls,
    constructed,
    num,
    start: pos,
    len,
    contentStart,
    contentEnd,
    end: contentEnd
  }
  if (constructed) {
    node.children = []
    let q = contentStart
    while (q < contentEnd) {
      const child = parseNode(bytes, q, contentEnd)
      if (child.end <= q) throw new Error('DER 解析异常')
      node.children.push(child)
      q = child.end
    }
  } else {
    node.value = bytes.subarray(contentStart, contentEnd)
  }
  return node
}

function parseDerBytes(bytes) {
  if (!bytes || !bytes.length) return null
  try {
    return parseNode(bytes, 0, bytes.length)
  } catch {
    return null
  }
}

function oidToString(v) {
  if (!v || !v.length) return ''
  const parts = []
  const first = v[0]
  parts.push(Math.floor(first / 40), first % 40)
  let val = 0
  for (let i = 1; i < v.length; i++) {
    val = val * 128 + (v[i] & 0x7f)
    if (!(v[i] & 0x80)) {
      parts.push(val)
      val = 0
    }
  }
  return parts.join('.')
}

function asString(node) {
  if (!node || !node.value) return ''
  const v = node.value
  switch (node.num) {
    case 12:
      try { return utf8Decoder.decode(v) } catch { return toHex(v) }
    case 30:
      try { return utf16beDecoder.decode(v) } catch { return toHex(v) }
    case 28: {
      let s = ''
      for (let i = 0; i + 3 < v.length; i += 4) {
        s += String.fromCodePoint(((v[i] << 24) | (v[i + 1] << 16) | (v[i + 2] << 8) | v[i + 3]) >>> 0)
      }
      return s
    }
    case 18: case 19: case 20: case 21: case 22: case 25: case 26: case 27:
      try { return latinDecoder.decode(v) } catch { return toHex(v) }
    default:
      return ''
  }
}

function bigIntFromBytes(v) {
  let n = 0n
  for (let i = 0; i < v.length; i++) n = (n << 8n) | BigInt(v[i])
  return n
}

function intOf(node) {
  if (!node || !node.value) return 0n
  return bigIntFromBytes(node.value)
}

function bitLengthOf(v) {
  let i = 0
  while (i < v.length && v[i] === 0) i++
  if (i >= v.length) return 0
  let bits = (v.length - i - 1) * 8
  let top = v[i]
  while (top > 0) {
    bits++
    top >>= 1
  }
  return bits
}

function bitStringBits(node) {
  const v = node && node.value
  if (!v || !v.length) return []
  const unused = v[0]
  const total = (v.length - 1) * 8 - unused
  const bits = []
  for (let i = 0; i < total; i++) {
    bits.push((v[1 + (i >> 3)] >> (7 - (i & 7))) & 1)
  }
  return bits
}

function bitStringPayload(node) {
  const v = node && node.value
  if (!v || !v.length) return new Uint8Array()
  return v.subarray(1)
}

/* ---------- 名称（DN） ---------- */

const DN_OIDS = {
  '2.5.4.3': 'CN',
  '2.5.4.4': 'SN',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'STREET',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.12': 'T',
  '2.5.4.13': 'description',
  '2.5.4.15': 'businessCategory',
  '2.5.4.17': 'postalCode',
  '2.5.4.42': 'GN',
  '2.5.4.43': 'initials',
  '2.5.4.44': 'generationQualifier',
  '2.5.4.46': 'dnQualifier',
  '2.5.4.65': 'pseudonym',
  '0.9.2342.19200300.100.1.1': 'UID',
  '0.9.2342.19200300.100.1.25': 'DC',
  '1.2.840.113549.1.9.1': 'E',
  '1.3.6.1.4.1.311.60.2.1.1': 'jurisdictionL',
  '1.3.6.1.4.1.311.60.2.1.2': 'jurisdictionST',
  '1.3.6.1.4.1.311.60.2.1.3': 'jurisdictionC'
}

function parseName(node) {
  const attrs = []
  if (!node || !node.children) return { attrs, text: '' }
  for (const rdn of node.children) {
    const list = rdn.children || []
    for (const atv of list) {
      if (!atv.children || atv.children.length < 2) continue
      const oid = oidToString(atv.children[0].value)
      const value = asString(atv.children[1]) || '#' + toHex(atv.children[1].value)
      attrs.push({ oid, short: DN_OIDS[oid] || oid, value })
    }
  }
  return { attrs, text: attrs.map(a => a.short + '=' + a.value).join(', ') }
}

/* ---------- 时间 ---------- */

function parseAsn1Time(node) {
  if (!node || !node.value) return null
  const s = latinDecoder.decode(node.value).trim()
  let m
  if (node.num === 23) {
    m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/.exec(s)
    if (!m) return null
    const yy = parseInt(m[1], 10)
    return new Date(Date.UTC(yy >= 50 ? 1900 + yy : 2000 + yy, +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)))
  }
  if (node.num === 24) {
    m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/.exec(s)
    if (!m) return null
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)))
  }
  return null
}

function formatUtc(d) {
  if (!d || isNaN(d.getTime())) return '—'
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
}

/* ---------- 通用名称（GeneralName） ---------- */

function ipFromBytes(v) {
  if (!v) return ''
  if (v.length === 4) return v[0] + '.' + v[1] + '.' + v[2] + '.' + v[3]
  if (v.length === 16) {
    const groups = []
    for (let i = 0; i < 16; i += 2) groups.push(((v[i] << 8) | v[i + 1]).toString(16))
    return groups.join(':')
  }
  return toHexUpper(v, ':')
}

function parseGeneralName(node) {
  if (!node) return { type: '未知', value: '' }
  if (node.cls === 2) {
    switch (node.num) {
      case 0: {
        const kids = node.children || []
        const oid = kids[0] ? oidToString(kids[0].value) : ''
        return { type: 'OtherName', value: oid || toHex(node.value || new Uint8Array()) }
      }
      case 1: return { type: 'Email', value: latinDecoder.decode(node.value || new Uint8Array()) }
      case 2: return { type: 'DNS', value: latinDecoder.decode(node.value || new Uint8Array()) }
      case 3: return { type: 'X400', value: toHex(node.value || new Uint8Array()) }
      case 4: {
        const inner = node.children && node.children[0]
        return { type: 'DirName', value: parseName(inner).text }
      }
      case 5: return { type: 'EDI', value: toHex(node.value || new Uint8Array()) }
      case 6: return { type: 'URI', value: latinDecoder.decode(node.value || new Uint8Array()) }
      case 7: return { type: 'IP', value: ipFromBytes(node.value) }
      case 8: return { type: 'RegisteredID', value: oidToString(node.value) }
      default: return { type: 'GeneralName[' + node.num + ']', value: toHex(node.value || new Uint8Array()) }
    }
  }
  if (node.num === 6) return { type: 'OID', value: oidToString(node.value) }
  return { type: '其他', value: asString(node) || toHex(node.value || new Uint8Array()) }
}

function collectUris(node, out) {
  if (!node) return out
  if (node.cls === 2 && node.num === 6 && node.value) out.push(latinDecoder.decode(node.value))
  if (node.children) node.children.forEach(c => collectUris(c, out))
  return out
}

/* ---------- 算法 / 曲线表 ---------- */

const SIG_ALG_NAMES = {
  '1.2.840.113549.1.1.2': 'MD2 with RSA',
  '1.2.840.113549.1.1.4': 'MD5 with RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.113549.1.1.14': 'SHA-224 with RSA',
  '1.2.840.10040.4.3': 'SHA-1 with DSA',
  '2.16.840.1.101.3.4.3.1': 'SHA-224 with DSA',
  '2.16.840.1.101.3.4.3.2': 'SHA-256 with DSA',
  '1.2.840.10045.4.1': 'SHA-1 with ECDSA',
  '1.2.840.10045.4.3.1': 'SHA-224 with ECDSA',
  '1.2.840.10045.4.3.2': 'SHA-256 with ECDSA',
  '1.2.840.10045.4.3.3': 'SHA-384 with ECDSA',
  '1.2.840.10045.4.3.4': 'SHA-512 with ECDSA',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448'
}

const PUBKEY_ALG_NAMES = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.10045.2.1': 'EC (椭圆曲线)',
  '1.2.840.10040.4.1': 'DSA',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  '1.3.101.110': 'X25519',
  '1.3.101.111': 'X448'
}

const CURVES = {
  '1.2.840.10045.3.1.1': { name: 'secp192r1 (P-192)', bits: 192 },
  '1.3.132.0.33': { name: 'secp224r1 (P-224)', bits: 224 },
  '1.2.840.10045.3.1.7': { name: 'prime256v1 (P-256)', bits: 256 },
  '1.3.132.0.10': { name: 'secp256k1', bits: 256 },
  '1.3.132.0.34': { name: 'secp384r1 (P-384)', bits: 384 },
  '1.3.132.0.35': { name: 'secp521r1 (P-521)', bits: 521 },
  '1.3.36.3.3.2.8.1.1.7': { name: 'brainpoolP256r1', bits: 256 },
  '1.3.36.3.3.2.8.1.1.11': { name: 'brainpoolP384r1', bits: 384 },
  '1.3.36.3.3.2.8.1.1.13': { name: 'brainpoolP512r1', bits: 512 }
}

const POLICY_NAMES = {
  '2.23.140.1.1': 'EV（扩展验证）',
  '2.23.140.1.2.1': 'DV（域名验证）',
  '2.23.140.1.2.2': 'OV（组织验证）',
  '2.23.140.1.2.3': 'IV（个人验证）',
  '2.23.140.1.3': 'EV 代码签名',
  '2.23.140.1.4.1': '代码签名',
  '2.23.140.1.31': '政府验证'
}

const EXT_NAMES = {
  '2.5.29.9': 'Subject Directory Attributes',
  '2.5.29.14': 'Subject Key Identifier',
  '2.5.29.15': 'Key Usage',
  '2.5.29.16': 'Private Key Usage Period',
  '2.5.29.17': 'Subject Alternative Name',
  '2.5.29.18': 'Issuer Alternative Name',
  '2.5.29.19': 'Basic Constraints',
  '2.5.29.20': 'CRL Number',
  '2.5.29.27': 'Delta CRL Indicator',
  '2.5.29.28': 'Issuing Distribution Point',
  '2.5.29.29': 'Certificate Issuer',
  '2.5.29.30': 'Name Constraints',
  '2.5.29.31': 'CRL Distribution Points',
  '2.5.29.32': 'Certificate Policies',
  '2.5.29.33': 'Policy Mappings',
  '2.5.29.35': 'Authority Key Identifier',
  '2.5.29.36': 'Policy Constraints',
  '2.5.29.37': 'Extended Key Usage',
  '2.5.29.46': 'Freshest CRL',
  '2.5.29.54': 'Inhibit Any Policy',
  '1.3.6.1.5.5.7.1.1': 'Authority Information Access',
  '1.3.6.1.5.5.7.1.11': 'Subject Information Access',
  '1.3.6.1.5.5.7.1.24': 'TLS Feature (OCSP Must-Staple)',
  '1.3.6.1.5.5.7.48.1.5': 'OCSP No Check',
  '1.3.6.1.4.1.11129.2.4.2': 'CT Signed Certificate Timestamps',
  '2.16.840.1.113730.1.1': 'Netscape Cert Type',
  '2.16.840.1.113730.1.13': 'Netscape Comment',
  '1.2.840.113533.7.65.0': 'Entrust Version Information',
  '2.23.42.7.0': 'SET Hashed Root Key',
  '1.3.6.1.4.1.311.20.2': 'Microsoft Certificate Type',
  '1.3.6.1.4.1.311.21.1': 'Microsoft CA Version',
  '1.3.6.1.4.1.311.21.7': 'Microsoft Certificate Template'
}

const KEY_USAGE_NAMES = [
  'digitalSignature（数字签名）',
  'contentCommitment / nonRepudiation（内容承诺）',
  'keyEncipherment（密钥加密）',
  'dataEncipherment（数据加密）',
  'keyAgreement（密钥协商）',
  'keyCertSign（签发证书）',
  'cRLSign（签发 CRL）',
  'encipherOnly（仅加密）',
  'decipherOnly（仅解密）'
]

const EKU_NAMES = {
  '1.3.6.1.5.5.7.3.1': 'TLS Web 服务器认证 (serverAuth)',
  '1.3.6.1.5.5.7.3.2': 'TLS Web 客户端认证 (clientAuth)',
  '1.3.6.1.5.5.7.3.3': '代码签名 (codeSigning)',
  '1.3.6.1.5.5.7.3.4': '邮件保护 (emailProtection)',
  '1.3.6.1.5.5.7.3.5': 'IPSec 终端系统',
  '1.3.6.1.5.5.7.3.6': 'IPSec 隧道终端',
  '1.3.6.1.5.5.7.3.7': 'IPSec 用户',
  '1.3.6.1.5.5.7.3.8': '时间戳 (timeStamping)',
  '1.3.6.1.5.5.7.3.9': 'OCSP 签名 (OCSPSigning)',
  '1.3.6.1.5.5.7.3.13': 'EAP over PPP',
  '1.3.6.1.5.5.7.3.14': 'EAP over LAN',
  '1.3.6.1.5.5.7.3.15': 'SCEP',
  '1.3.6.1.5.5.7.3.17': 'IPSec IKE 中间设备',
  '1.3.6.1.5.5.7.3.18': 'IPSec IKE 中间设备 (2)',
  '2.5.29.37.0': '任意用途 (anyExtendedKeyUsage)',
  '1.3.6.1.4.1.311.10.3.4': '加密文件系统 (EFS)',
  '1.3.6.1.4.1.311.10.3.12': '文档签名'
}

const TLS_FEATURE_NAMES = {
  5: 'status_request（OCSP Must-Staple，必须附装 OCSP 响应）',
  17: 'status_request_v2'
}

/* ---------- 扩展解析 ---------- */

function parseExtensions(extSeq) {
  const list = []
  const extra = { san: [], keyUsage: [], eku: [], isCA: false, pathLen: null }
  if (!extSeq || !extSeq.children) return { list, extra }
  for (const ext of extSeq.children) {
    const kids = ext.children || []
    if (kids.length < 2) continue
    const oid = oidToString(kids[0].value)
    let critical = false
    let octet = kids[1]
    if (kids.length >= 3) {
      critical = !!(kids[1].value && kids[1].value[0] !== 0)
      octet = kids[2]
    }
    const inner = parseDerBytes(octet.value)
    let lines = []
    try {
      lines = formatExtension(oid, inner, octet, extra)
    } catch (e) {
      lines = ['⚠️ 该扩展解析失败：' + e.message]
    }
    list.push({
      oid,
      name: EXT_NAMES[oid] || '未知扩展',
      critical,
      lines: lines.length ? lines : ['（无可显示内容）'],
      hex: toHex(octet.value),
      rawLen: octet.value ? octet.value.length : 0
    })
  }
  return { list, extra }
}

function formatExtension(oid, inner, octet, extra) {
  const out = []
  switch (oid) {
    case '2.5.29.17':
    case '2.5.29.18': {
      const names = (inner && inner.children ? inner.children : []).map(parseGeneralName)
      names.forEach(n => out.push(n.type + ': ' + n.value))
      if (!names.length) out.push('（空列表）')
      if (oid === '2.5.29.17') extra.san = names
      return out
    }
    case '2.5.29.19': {
      const kids = inner && inner.children ? inner.children : []
      let ca = false
      let pathLen = null
      for (const k of kids) {
        if (k.cls === 0 && k.num === 1) ca = !!(k.value && k.value[0] !== 0)
        if (k.cls === 0 && k.num === 2) pathLen = Number(intOf(k))
      }
      extra.isCA = ca
      extra.pathLen = pathLen
      out.push('CA 证书：' + (ca ? '是 (TRUE)' : '否 (FALSE)'))
      out.push('路径长度约束：' + (pathLen === null ? '无限制' : pathLen))
      return out
    }
    case '2.5.29.15': {
      const bits = inner ? bitStringBits(inner) : []
      const names = []
      KEY_USAGE_NAMES.forEach((n, i) => { if (bits[i]) names.push(n) })
      extra.keyUsage = names
      if (!names.length) out.push('（未声明任何用途）')
      names.forEach(n => out.push('· ' + n))
      return out
    }
    case '2.5.29.14': {
      const v = inner && inner.value
      out.push(toHexUpper(v, ':'))
      return out
    }
    case '2.5.29.37': {
      const kids = inner && inner.children ? inner.children : []
      const names = []
      for (const k of kids) {
        const o = oidToString(k.value)
        names.push(EKU_NAMES[o] || o)
      }
      extra.eku = names
      if (!names.length) out.push('（未声明用途）')
      names.forEach(n => out.push('· ' + n))
      return out
    }
    case '2.5.29.9': {
      const kids = inner && inner.children ? inner.children : []
      for (const attr of kids) {
        const o = attr.children && attr.children[0] ? oidToString(attr.children[0].value) : ''
        const vals = attr.children ? attr.children.slice(1).map(asString).filter(Boolean) : []
        out.push('· ' + (DN_OIDS[o] || o) + ': ' + (vals.join(' | ') || '—'))
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '2.5.29.27': {
      out.push('Delta CRL 基准编号：' + (inner && inner.value ? BigInt('0x' + (toHex(inner.value) || '0')).toString() : '—'))
      return out
    }
    case '2.5.29.29': {
      const kids = inner && inner.children ? inner.children : []
      const g = kids.map(n => { const x = parseGeneralName(n); return x.type + ':' + x.value })
      out.push(g.length ? g.join(' | ') : '（空）')
      return out
    }
    case '2.5.29.33': {
      const kids = inner && inner.children ? inner.children : []
      for (const m of kids) {
        const a = m.children && m.children[0] ? oidToString(m.children[0].value) : ''
        const b = m.children && m.children[1] ? oidToString(m.children[1].value) : ''
        out.push(a + ' → ' + b)
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '2.5.29.28': {
      const kids = inner && inner.children ? inner.children : []
      const flags = []
      for (const k of kids) {
        if (k.cls === 2 && k.num === 0) flags.push('仅包含用户证书')
        if (k.cls === 2 && k.num === 1) flags.push('仅包含 CA 证书')
        if (k.cls === 2 && k.num === 2) {
          const uris = collectUris(k, [])
          flags.push('分发点: ' + (uris.join(', ') || '—'))
        }
        if (k.cls === 2 && k.num === 3) flags.push('仅包含间接 CRL')
        if (k.cls === 2 && k.num === 5) {
          const bs = k.children && k.children[0] ? bitStringBits(k.children[0]) : bitStringBits(k)
          const reasonLabels = ['unused', 'keyCompromise', 'cACompromise', 'affiliationChanged', 'superseded', 'cessationOfOperation', 'certificateHold', 'privilegeWithdrawn', 'aACompromise']
          const active = []
          reasonLabels.forEach((r, i) => { if (bs[i + 1]) active.push(r) })
          flags.push('仅包含原因码: ' + (active.join(', ') || '—'))
        }
        if (k.cls === 2 && k.num === 6) flags.push('仅包含增量 CRL')
      }
      if (!flags.length) out.push(toHexUpper(octet.value, ':'))
      flags.forEach(f => out.push('· ' + f))
      return out
    }
    case '2.5.29.35': {
      const kids = inner && inner.children ? inner.children : []
      for (const k of kids) {
        if (k.cls === 2 && k.num === 0 && k.value) out.push('Key Identifier: ' + toHexUpper(k.value, ':'))
        else if (k.cls === 2 && k.num === 1) out.push('颁发者: ' + (k.children || []).map(parseGeneralName).map(n => n.type + ': ' + n.value).join('; '))
        else if (k.cls === 2 && k.num === 2 && k.value) out.push('序列号(HEX): ' + toHexUpper(k.value, ':'))
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '2.5.29.16': {
      const kids = inner && inner.children ? inner.children : []
      for (const k of kids) {
        const d = parseAsn1Time(k)
        out.push((k.num === 0 ? '生效起：' : '生效止：') + formatUtc(d))
      }
      return out
    }
    case '2.5.29.30': {
      const kids = inner && inner.children ? inner.children : []
      for (const k of kids) {
        const isPermitted = k.num === 0
        const list = (k.children || []).map(ng => {
          const g = ng.children ? ng.children.map(parseGeneralName) : []
          return g.map(x => x.type + ':' + x.value).join(', ')
        }).filter(Boolean)
        out.push((isPermitted ? '允许：' : '禁止：') + (list.join(' | ') || '—'))
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '2.5.29.31':
    case '2.5.29.46': {
      const uris = collectUris(inner, [])
      if (!uris.length) out.push('（未包含可读的 URL）')
      uris.forEach(u => out.push('URI: ' + u))
      return out
    }
    case '2.5.29.32': {
      const kids = inner && inner.children ? inner.children : []
      for (const pi of kids) {
        const pOid = pi.children && pi.children[0] ? oidToString(pi.children[0].value) : ''
        out.push('策略 ' + pOid + (POLICY_NAMES[pOid] ? '（' + POLICY_NAMES[pOid] + '）' : ''))
        const quals = pi.children && pi.children[1] ? pi.children[1].children || [] : []
        for (const q of quals) {
          if (q.children && q.children[0] && oidToString(q.children[0].value) === '1.3.6.1.5.5.7.2.1' && q.children[1]) {
            out.push('  · CPS: ' + (asString(q.children[1]) || toHex(q.children[1].value)))
          } else if (q.children && q.children.length) {
            out.push('  · 限定符 ' + oidToString(q.children[0].value))
          }
        }
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '2.5.29.36':
    case '2.5.29.54': {
      const kids = inner && inner.children ? inner.children : []
      for (const k of kids) {
        if (k.num === 0) out.push('要求显式证书策略：是')
        if (k.num === 1) out.push('策略映射禁止：是')
        if (k.cls === 0 && k.num === 2) out.push('可跳过的策略数：' + Number(intOf(k)))
        if (k.num === 3) out.push('值：' + toHex(k.value || new Uint8Array()))
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '1.3.6.1.5.5.7.1.1':
    case '1.3.6.1.5.5.7.1.11': {
      const kids = inner && inner.children ? inner.children : []
      for (const ad of kids) {
        const m = ad.children && ad.children[0] ? oidToString(ad.children[0].value) : ''
        const loc = ad.children && ad.children[1] ? parseGeneralName(ad.children[1]) : { value: '' }
        const label = m === '1.3.6.1.5.5.7.48.1' ? 'OCSP' : m === '1.3.6.1.5.5.7.48.2' ? 'CA Issuers' : m === '1.3.6.1.5.5.7.48.3' ? 'Time Stamping' : m
        out.push(label + ': ' + loc.value)
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '1.3.6.1.5.5.7.1.24': {
      const kids = inner && inner.children ? inner.children : []
      for (const k of kids) {
        const v = Number(intOf(k))
        out.push(TLS_FEATURE_NAMES[v] || '特性 ' + v)
      }
      if (!out.length) out.push('（空）')
      return out
    }
    case '1.3.6.1.5.5.7.48.1.5':
      out.push('OCSP 响应者声明无需再查询（OCSP No Check）')
      return out
    case '2.5.29.20': {
      out.push('CRL 编号：' + (inner && inner.value ? BigInt('0x' + (toHex(inner.value) || '0')).toString() : '—'))
      return out
    }
    case '1.3.6.1.4.1.11129.2.4.2': {
      const b = inner && inner.value
      if (!b || b.length < 4) {
        out.push('SCT 数据长度：' + (b ? b.length : 0) + ' 字节')
        return out
      }
      try {
        const total = (b[0] << 8) | b[1]
        let off = 2
        const stop = Math.min(b.length, 2 + total)
        let count = 0
        while (off + 2 <= stop && count < 128) {
          const l = (b[off] << 8) | b[off + 1]
          off += 2 + l
          count++
        }
        out.push('包含 ' + count + ' 条 SCT（证书透明度签名时间戳）')
        out.push('SCT 列表总长：' + total + ' 字节')
      } catch {
        out.push('SCT 数据长度：' + b.length + ' 字节')
      }
      return out
    }
    case '2.16.840.1.113730.1.1': {
      const bits = inner ? bitStringBits(inner) : []
      const labels = ['SSL 客户端', 'SSL 服务器', 'S/MIME', '对象签名', '保留', 'SSL CA', 'S/MIME CA', '对象签名 CA']
      labels.forEach((l, i) => { if (bits[i]) out.push('· ' + l) })
      if (!out.length) out.push(toHexUpper(octet.value, ':'))
      return out
    }
    default: {
      const s = asString(inner)
      if (s) out.push(s)
      else {
        const hex = toHex(inner && inner.value ? inner.value : octet.value)
        out.push('原始值(' + Math.ceil(hex.length / 2) + ' 字节)：' + (hex.length > 160 ? hex.slice(0, 160) + '…' : hex))
      }
      return out
    }
  }
}

/* ---------- 公钥 ---------- */

function describeAlgParams(algSeq) {
  if (!algSeq || !algSeq.children || algSeq.children.length < 2) return 'NULL / 无参数'
  const p = algSeq.children[1]
  if (p.cls === 0 && p.num === 5) return 'NULL'
  if (p.cls === 0 && p.num === 6) {
    const o = oidToString(p.value)
    return CURVES[o] ? CURVES[o].name : 'curve ' + o
  }
  if (p.cls === 0 && p.num === 16) {
    const kids = p.children || []
    const parts = []
    for (const k of kids) {
      if (k.cls === 2 && k.num === 0) parts.push('hashAlgorithm: [explicit]')
      else if (k.cls === 2 && k.num === 1) {
        const hk = (k.children || [])[0]
        const ho = hk && hk.children && hk.children[0] ? oidToString(hk.children[0].value) : ''
        parts.push('hash=' + (ho || '默认'))
      } else if (k.cls === 2 && k.num === 2) parts.push('MGF1')
      else if (k.cls === 2 && k.num === 3) parts.push('saltLength=' + Number(intOf(k.children ? k.children[0] : k)))
      else if (k.cls === 2 && k.num === 4) parts.push('trailerField=' + Number(intOf(k.children ? k.children[0] : k)))
    }
    return 'RSASSA-PSS（' + parts.join(', ') + '）'
  }
  return toHexUpper(p.value || new Uint8Array(), ':')
}

function parseSpki(spkiNode) {
  const res = { algOid: '', algName: '', params: '', keyBits: 0, keyHex: '', lines: [], rsa: null, curve: null }
  if (!spkiNode || !spkiNode.children || spkiNode.children.length < 2) return res
  const algSeq = spkiNode.children[0]
  const bitStr = spkiNode.children[1]
  const algOid = algSeq && algSeq.children && algSeq.children[0] ? oidToString(algSeq.children[0].value) : ''
  res.algOid = algOid
  res.algName = PUBKEY_ALG_NAMES[algOid] || '未知算法（' + algOid + '）'
  res.params = describeAlgParams(algSeq)
  const keyBytes = bitStringPayload(bitStr)
  res.keyHex = toHex(keyBytes)

  if (algOid === '1.2.840.113549.1.1.1') {
    const seq = parseDerBytes(keyBytes)
    if (seq && seq.children && seq.children.length >= 2) {
      const mod = seq.children[0].value || new Uint8Array()
      const expBytes = seq.children[1].value || new Uint8Array()
      const exponent = bigIntFromBytes(expBytes).toString()
      res.keyBits = bitLengthOf(mod)
      res.rsa = { modulusBits: res.keyBits, modulusHex: toHex(mod), exponent }
      res.lines.push('模数位数：' + res.keyBits + ' bit')
      res.lines.push('公钥指数 e：' + exponent + (exponent === '65537' ? '（0x010001，常见值）' : ''))
      res.lines.push('模数 HEX：' + (res.keyHex.length > 64 ? res.keyHex.slice(0, 64) + '…' : res.keyHex))
    } else {
      res.keyBits = bitLengthOf(keyBytes)
    }
  } else if (algOid === '1.2.840.10045.2.1') {
    const curveOid = algSeq.children[1] && algSeq.children[1].num === 6 ? oidToString(algSeq.children[1].value) : ''
    const curve = CURVES[curveOid] || null
    res.curve = curve ? curve.name : curveOid
    if (curve) res.keyBits = curve.bits
    else if (keyBytes[0] === 4) res.keyBits = ((keyBytes.length - 1) / 2) * 8
    res.lines.push('曲线：' + (curve ? curve.name : '未知 ' + curveOid))
    res.lines.push('公钥点格式：' + (keyBytes[0] === 4 ? '未压缩 (0x04)' : keyBytes[0] === 2 || keyBytes[0] === 3 ? '压缩' : '未知'))
    res.lines.push('公钥 HEX：' + (res.keyHex.length > 64 ? res.keyHex.slice(0, 64) + '…' : res.keyHex))
  } else if (algOid === '1.3.101.112' || algOid === '1.3.101.113') {
    res.keyBits = algOid === '1.3.101.112' ? 256 : 456
    res.lines.push('公钥 HEX：' + (res.keyHex.length > 64 ? res.keyHex.slice(0, 64) + '…' : res.keyHex))
  } else if (algOid === '1.2.840.10040.4.1') {
    const seq = parseDerBytes(keyBytes)
    if (seq && seq.children && seq.children.length) {
      res.keyBits = bitLengthOf(seq.children[0].value || new Uint8Array())
    }
  } else {
    res.keyBits = bitLengthOf(keyBytes)
  }
  return res
}

/* ---------- 摘要 ---------- */

async function digestHex(alg, bytes) {
  if (!bytes || !bytes.length) return '—'
  if (!(globalThis.crypto && globalThis.crypto.subtle)) return '（当前环境不支持 Web Crypto）'
  const buf = await crypto.subtle.digest(alg, bytes)
  return toHex(new Uint8Array(buf), ':').toUpperCase()
}

/* ---------- 证书主解析 ---------- */

async function buildCertificate(der, pem, index) {
  if (der.length < 40) throw new Error('数据长度过短，不是有效的证书')
  const root = parseNode(der, 0, der.length)
  if (!(root.cls === 0 && root.num === 16 && root.children)) {
    throw new Error('证书结构异常：顶层不是 SEQUENCE，可能不是 X.509 证书')
  }
  if (root.children.length < 3) throw new Error('证书结构异常：字段数量不足')
  const tbs = root.children[0]
  const sigAlgNode = root.children[1]
  const sigValNode = root.children[2]
  if (!(tbs.cls === 0 && tbs.num === 16 && tbs.children)) {
    throw new Error('证书结构异常：tbsCertificate 不是 SEQUENCE')
  }
  const kids = tbs.children
  let i = 0
  let version = 1
  if (kids[0] && kids[0].cls === 2 && kids[0].num === 0 && kids[0].children && kids[0].children[0]) {
    version = Number(intOf(kids[0].children[0])) + 1
    i = 1
  }
  const serialNode = kids[i++]
  const tbsSigNode = kids[i++]
  const issuerNode = kids[i++]
  const validityNode = kids[i++]
  const subjectNode = kids[i++]
  const spkiNode = kids[i++]
  if (!serialNode || !validityNode || !subjectNode || !spkiNode) {
    throw new Error('证书结构异常：必要字段缺失，可能不是 X.509 证书')
  }
  let extWrapper = null
  for (let j = i; j < kids.length; j++) {
    if (kids[j].cls === 2 && kids[j].num === 3 && kids[j].children) extWrapper = kids[j]
  }

  const serialBytesRaw = serialNode.value || new Uint8Array()
  // DER 中正整数会在最高位为 1 时补一个 0x00，展示时去掉多余的前导零（与 openssl 一致）
  let serialOffset = 0
  while (serialOffset < serialBytesRaw.length - 1 && serialBytesRaw[serialOffset] === 0) serialOffset++
  const serialBytes = serialBytesRaw.subarray(serialOffset)
  const subject = parseName(subjectNode)
  const issuer = parseName(issuerNode)
  const times = validityNode.children || []
  const notBefore = parseAsn1Time(times[0])
  const notAfter = parseAsn1Time(times[1])
  const sigOid = sigAlgNode && sigAlgNode.children && sigAlgNode.children[0] ? oidToString(sigAlgNode.children[0].value) : ''
  const tbsSigOid = tbsSigNode && tbsSigNode.children && tbsSigNode.children[0] ? oidToString(tbsSigNode.children[0].value) : ''
  const sigParams = describeAlgParams(sigAlgNode)
  const extInfo = parseExtensions(extWrapper && extWrapper.children ? extWrapper.children[0] : null)
  const spki = parseSpki(spkiNode)
  const sigValue = bitStringPayload(sigValNode)

  const now = Date.now()
  let daysRemaining = null
  let progress = 0
  let validityText = '有效'
  let validityClass = 'ok'
  if (notBefore && notAfter) {
    const total = notAfter.getTime() - notBefore.getTime()
    daysRemaining = Math.floor((notAfter.getTime() - now) / 86400000)
    progress = total > 0 ? Math.max(0, Math.min(100, ((now - notBefore.getTime()) / total) * 100)) : 100
    if (now < notBefore.getTime()) {
      validityText = '尚未生效'
      validityClass = 'warn'
    } else if (now > notAfter.getTime()) {
      validityText = '已过期'
      validityClass = 'bad'
    } else if (notAfter.getTime() - now < 30 * 86400000) {
      validityText = '即将到期（30 天内）'
      validityClass = 'warn'
    }
  }

  const spkiRaw = der.subarray(spkiNode.start, spkiNode.end)
  let fingerprints = { sha1: '—', sha256: '—', sha384: '—', spkiSha256: '—' }
  try {
    const [sha1, sha256, sha384, spkiSha256] = await Promise.all([
      digestHex('SHA-1', der),
      digestHex('SHA-256', der),
      digestHex('SHA-384', der),
      digestHex('SHA-256', spkiRaw)
    ])
    fingerprints = { sha1, sha256, sha384, spkiSha256 }
  } catch {
    fingerprints = { sha1: '—', sha256: '—', sha384: '—', spkiSha256: '—' }
  }

  const cnAttr = subject.attrs.find(a => a.short === 'CN')
  const shortName = cnAttr ? cnAttr.value : subject.attrs.length ? subject.attrs[0].value : '证书 #' + (index + 1)
  const derHexHeadFull = toHex(der.subarray(0, 256), ' ')
  const derHexHead = toHex(der.subarray(0, 64), ' ').replace(/(.{32})/g, '$1\n').trim()

  return {
    index,
    pem,
    der,
    derLen: der.length,
    shortName,
    version,
    versionText: 'v' + version + (version === 3 ? '（X.509 v3）' : version === 2 ? '（v2）' : '（v1）'),
    serialHex: toHexUpper(serialBytes, ''),
    serialColonHex: toHexUpper(serialBytes, ':'),
    serialDec: bigIntFromBytes(serialBytes).toString(),
    serialBytes: serialBytes.length,
    sigAlgOid: sigOid,
    sigAlgName: SIG_ALG_NAMES[sigOid] || sigOid || '未知',
    sigParams,
    tbsSigAlgName: SIG_ALG_NAMES[tbsSigOid] || tbsSigOid || '—',
    sigValueHex: toHexUpper(sigValue, ':'),
    sigValueLen: sigValue.length,
    subject,
    issuer,
    selfSigned: subject.text === issuer.text && !!subject.text,
    notBefore,
    notAfter,
    notBeforeText: formatUtc(notBefore),
    notAfterText: formatUtc(notAfter),
    validityText,
    validityClass,
    daysRemaining,
    progress: progress || 0,
    spki,
    extensions: extInfo.list,
    extra: extInfo.extra,
    isCA: extInfo.extra.isCA,
    pathLen: extInfo.extra.pathLen,
    fingerprints,
    derHexHead,
    derHexHeadFull
  }
}

/** 从文本中提取 PEM 块 */
function extractPemBlocks(text) {
  const blocks = []
  const re = /-----BEGIN ([A-Z0-9 ]+?)-----([\s\S]*?)-----END \1-----/g
  let m
  while ((m = re.exec(text)) !== null) {
    blocks.push({ label: m[1].trim().toUpperCase(), body: m[2].replace(/\s+/g, '') })
  }
  return blocks
}

/** 解析任意输入，返回证书数组 */
async function parseCertificateInput(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('请先粘贴证书内容或上传证书文件')
  const blocks = extractPemBlocks(trimmed)
  if (blocks.length) {
    const certBlocks = blocks.filter(b =>
      b.label === 'CERTIFICATE' || b.label === 'X509 CERTIFICATE' || b.label === 'TRUSTED CERTIFICATE'
    )
    if (!certBlocks.length) {
      const label = blocks[0].label
      if (label.includes('REQUEST')) throw new Error('这是证书签名请求（CSR）而不是证书，本工具仅解析 X.509 证书')
      if (label.includes('PRIVATE KEY')) throw new Error('检测到私钥内容，请勿上传私钥，本工具仅解析证书（CERTIFICATE）')
      if (label.includes('PUBLIC KEY')) throw new Error('检测到 PEM 公钥文件，本工具仅解析 X.509 证书')
      throw new Error('未找到证书块，需要 -----BEGIN CERTIFICATE----- 包裹的内容')
    }
    const out = []
    for (const b of certBlocks) {
      let der
      try {
        der = b64ToBytes(b.body)
      } catch {
        throw new Error('证书 Base64 内容解码失败，请检查内容是否复制完整')
      }
      out.push(await buildCertificate(der, bytesToPem(der), out.length))
    }
    return out
  }

  const compact = trimmed.replace(/\s+/g, '')
  if (/^[0-9a-fA-F]+$/.test(compact) && compact.length % 2 === 0 && compact.length > 60) {
    const der = hexToBytes(compact)
    return [await buildCertificate(der, bytesToPem(der), 0)]
  }
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length > 60) {
    const der = b64ToBytes(compact)
    return [await buildCertificate(der, bytesToPem(der), 0)]
  }
  throw new Error('无法识别输入格式：请粘贴包含 -----BEGIN CERTIFICATE----- 的 PEM 内容，或上传 .pem / .crt / .cer / .der 文件')
}

/** DER 字节 → 情况判断（文件上传用） */
function looksLikePem(bytes) {
  return bytes.length > 10 && bytes[0] === 0x2d && bytes[1] === 0x2d
}
/* ==================== DER PARSER END ==================== */

/* ==================== 示例证书（自签名 EC P-256 演示证书） ==================== */
const SAMPLE_CERT = [
  '-----BEGIN CERTIFICATE-----',
  'MIIDTjCCAvOgAwIBAgIUAsFdJQEsKy9+ShQmtZv6gCBmQtkwCgYIKoZIzj0EAwIw',
  'djELMAkGA1UEBhMCQ04xETAPBgNVBAgMCFpoZWppYW5nMREwDwYDVQQHDAhIYW5n',
  'emhvdTEYMBYGA1UECgwPNDAzLmxpIERlbW8gT3JnMREwDwYDVQQLDAhEZXZUb29s',
  'czEUMBIGA1UEAwwLZGVtby40MDMubGkwHhcNMjYwOTE0MTgwMTEzWhcNMzYwOTEx',
  'MTgwMTEzWjB2MQswCQYDVQQGEwJDTjERMA8GA1UECAwIWmhlamlhbmcxETAPBgNV',
  'BAcMCEhhbmd6aG91MRgwFgYDVQQKDA80MDMubGkgRGVtbyBPcmcxETAPBgNVBAsM',
  'CERldlRvb2xzMRQwEgYDVQQDDAtkZW1vLjQwMy5saTBZMBMGByqGSM49AgEGCCqG',
  'SM49AwEHA0IABNgRyDDiBCyH6fXJxo1loIbRm/h2jigmeBVbu/FxNTiJ8ARr2oeQ',
  'ltWWmnDm/0DWvJDmWs3H4PU1nlZWevF6eKujggFdMIIBWTAMBgNVHRMBAf8EAjAA',
  'MA4GA1UdDwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIw',
  'RQYDVR0RBD4wPIILZGVtby40MDMubGmCCCouNDAzLmxphwR/AAABgQxhZG1pbkA0',
  'MDMubGmGD2h0dHBzOi8vNDAzLmxpLzAdBgNVHQ4EFgQU0Nfsesz0oyLkbFY1fSxW',
  'NLOoFEUwHwYDVR0gBBgwFjAKBggrBgEFBQcCATAIBgZngQwBAgEwMAYDVR0fBCkw',
  'JzAloCOgIYYfaHR0cDovL2NybC5leGFtcGxlLmNvbS9kZW1vLmNybDBhBggrBgEF',
  'BQcBAQRVMFMwJAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLmV4YW1wbGUuY29tLzAr',
  'BggrBgEFBQcwAoYfaHR0cDovL2NydC5leGFtcGxlLmNvbS9kZW1vLmNydDAKBggq',
  'hkjOPQQDAgNJADBGAiEA4k4DoEMDKBvVrIFZSFslB6fPn1sNjoXli/SjVrzsf88C',
  'IQC8KH5KZ7rM467EZr3CbAOpmfIbivsCX459XoL5+YRunQ==',
  '-----END CERTIFICATE-----'
].join('\n')

/* ==================== 组件状态 ==================== */
const pemInput = ref('')
const certs = ref([])
const selected = ref(0)
const error = ref('')
const success = ref('')
const dragging = ref(false)
const fileInput = ref(null)

let successTimer = null
let parseTimer = null

const current = computed(() => certs.value[selected.value] || null)

function flash(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 2400)
}

/* ---------- 解析入口 ---------- */
async function parseNow(showMessage = false) {
  error.value = ''
  const text = pemInput.value
  if (!text.trim()) {
    error.value = '请先粘贴证书内容'
    certs.value = []
    return
  }
  try {
    const result = await parseCertificateInput(text)
    certs.value = result
    if (selected.value >= result.length) selected.value = 0
    if (showMessage) flash('解析完成：共识别 ' + result.length + ' 张证书')
  } catch (e) {
    certs.value = []
    selected.value = 0
    error.value = e && e.message ? e.message : '解析失败，请检查证书内容是否完整'
  }
}

watch(pemInput, () => {
  if (parseTimer) clearTimeout(parseTimer)
  const text = pemInput.value
  if (!text.trim()) {
    certs.value = []
    error.value = ''
    return
  }
  if (!/-----BEGIN |^[A-Za-z0-9+/\s=]{80,}$/.test(text.trim())) return
  parseTimer = setTimeout(() => { parseNow(false) }, 400)
})

onBeforeUnmount(() => {
  if (successTimer) clearTimeout(successTimer)
  if (parseTimer) clearTimeout(parseTimer)
})

/* ---------- 文件上传 ---------- */
function onFileChange(e) {
  const files = Array.from(e.target.files || [])
  if (files.length) readFiles(files)
  e.target.value = ''
}

function onDrop(e) {
  dragging.value = false
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || [])
  if (files.length) readFiles(files)
}

function readFiles(files) {
  error.value = ''
  const parts = []
  let pending = files.length
  const finish = () => {
    if (parts.length) {
      pemInput.value = parts.join('\n\n')
      parseNow(true)
    } else {
      error.value = '未能从文件中读取到证书内容'
    }
  }
  files.forEach((file, idx) => {
    if (file.size > 2 * 1024 * 1024) {
      error.value = '文件过大（超过 2MB），请确认是证书文件'
      pending--
      if (!pending) finish()
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bytes = new Uint8Array(reader.result)
        if (looksLikePem(bytes)) {
          parts[idx] = utf8Decoder.decode(bytes).trim()
        } else {
          parts[idx] = bytesToPem(bytes)
        }
      } catch {
        error.value = '文件「' + file.name + '」读取失败'
      }
      pending--
      if (!pending) finish()
    }
    reader.onerror = () => {
      error.value = '文件「' + file.name + '」读取失败'
      pending--
      if (!pending) finish()
    }
    reader.readAsArrayBuffer(file)
  })
}

function loadSample() {
  pemInput.value = SAMPLE_CERT
  parseNow(true)
}

function clearAll() {
  pemInput.value = ''
  certs.value = []
  selected.value = 0
  error.value = ''
  success.value = ''
}

function downloadPem() {
  if (!current.value) return
  try {
    const blob = new Blob([current.value.pem + '\n'], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (current.value.shortName || 'certificate').replace(/[^\w.-]/g, '_') + '.pem'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    flash('证书已导出为 PEM 文件')
  } catch {
    error.value = '导出失败，请改用复制 PEM 的方式'
  }
}

/* ---------- 复制 ---------- */
async function copySection(label, text) {
  if (!text) return
  const ok = await copyText(String(text))
  if (ok) flash(label + ' 已复制到剪贴板')
  else error.value = '复制失败，请手动选择文本复制'
}

function sectionText(rows) {
  return (rows || []).map(r => r.k + ': ' + r.v).join('\n')
}

function extCopyText(ext) {
  return [
    ext.name + ' (' + ext.oid + ')' + (ext.critical ? ' [CRITICAL]' : ''),
    ...ext.lines,
    '原始 HEX: ' + (ext.hex.length > 512 ? ext.hex.slice(0, 512) + '…' : ext.hex)
  ].join('\n')
}

/* ---------- 展示数据 ---------- */
const overviewRows = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { k: '主体 (Subject)', v: c.subject.text || '—' },
    { k: '颁发者 (Issuer)', v: c.issuer.text || '—' },
    { k: '有效期状态', v: c.validityText, cls: c.validityClass },
    { k: '生效时间', v: c.notBeforeText },
    { k: '到期时间', v: c.notAfterText },
    { k: '序列号', v: c.serialColonHex },
    { k: '版本', v: c.versionText },
    { k: '签名算法', v: c.sigAlgName },
    { k: '公钥算法', v: c.spki.algName + (c.spki.keyBits ? ' · ' + c.spki.keyBits + ' bit' : '') },
    { k: '密钥用途 (KU)', v: c.extra.keyUsage.length ? c.extra.keyUsage.join('、') : '未声明' },
    { k: '扩展用途 (EKU)', v: c.extra.eku.length ? c.extra.eku.join('、') : '未声明' },
    { k: 'CA 证书', v: c.isCA ? '是' : '否' },
    { k: '自签名', v: c.selfSigned ? '是（主体与颁发者相同）' : '否' },
    { k: '扩展数量', v: String(c.extensions.length) }
  ]
})

const overviewText = computed(() => sectionText(overviewRows.value))

const validityRows = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { k: '生效时间 (Not Before)', v: c.notBeforeText },
    { k: '到期时间 (Not After)', v: c.notAfterText },
    { k: '有效期状态', v: c.validityText, cls: c.validityClass },
    {
      k: '剩余天数',
      v: c.daysRemaining === null ? '—' : (c.daysRemaining >= 0 ? c.daysRemaining + ' 天' : '已过期 ' + Math.abs(c.daysRemaining) + ' 天'),
      cls: c.validityClass
    },
    { k: '总时长', v: c.notBefore && c.notAfter ? Math.round((c.notAfter - c.notBefore) / 86400000) + ' 天' : '—' }
  ]
})

const subjectRows = computed(() => {
  const c = current.value
  if (!c) return []
  const rows = c.subject.attrs.map(a => ({ k: a.short, v: a.value }))
  rows.push({ k: '完整 DN', v: c.subject.text || '—' })
  const san = c.extra.san || []
  if (san.length) rows.push({ k: 'SAN', v: san.map(s => s.type + ':' + s.value).join('  |  ') })
  return rows
})

const issuerRows = computed(() => {
  const c = current.value
  if (!c) return []
  const rows = c.issuer.attrs.map(a => ({ k: a.short, v: a.value }))
  rows.push({ k: '完整 DN', v: c.issuer.text || '—' })
  return rows
})

const spkiRows = computed(() => {
  const c = current.value
  if (!c) return []
  const rows = [
    { k: '算法', v: c.spki.algName + '（' + c.spki.algOid + '）' },
    { k: '算法参数', v: c.spki.params },
    { k: '密钥强度', v: c.spki.keyBits ? c.spki.keyBits + ' bit' : '—' }
  ]
  if (c.spki.curve) rows.push({ k: '曲线', v: c.spki.curve })
  if (c.spki.rsa) {
    rows.push({ k: 'RSA 模数', v: c.spki.rsa.modulusBits + ' bit' })
    rows.push({ k: 'RSA 指数 e', v: c.spki.rsa.exponent })
  }
  const hexFull = c.spki.keyHex
  rows.push({ k: '公钥 HEX', v: hexFull.length > 120 ? hexFull.slice(0, 120) + '…（共 ' + hexFull.length / 2 + ' 字节）' : hexFull, copy: hexFull })
  return rows
})

const fingerprintRows = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { k: 'SHA-1', v: c.fingerprints.sha1 },
    { k: 'SHA-256', v: c.fingerprints.sha256 },
    { k: 'SHA-384', v: c.fingerprints.sha384 },
    { k: 'SPKI SHA-256 (公钥指纹)', v: c.fingerprints.spkiSha256 }
  ]
})

const rawRows = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { k: 'DER 总长度', v: c.derLen + ' 字节（' + c.derLen * 8 + ' bit）' },
    { k: 'PEM 行数', v: String((c.pem.match(/\n/g) || []).length + 1) },
    { k: '序列号长度', v: c.serialBytes + ' 字节' },
    { k: '签名值长度', v: c.sigValueLen + ' 字节' },
    { k: '签名值 (HEX)', v: c.sigValueHex.length > 120 ? c.sigValueHex.slice(0, 120) + '…' : c.sigValueHex },
    { k: 'tbs 签名算法', v: c.tbsSigAlgName },
    { k: '签名算法参数', v: c.sigParams }
  ]
})

const extText = computed(() => {
  const c = current.value
  if (!c) return ''
  return c.extensions.map(extCopyText).join('\n\n')
})

const reportText = computed(() => {
  const c = current.value
  if (!c) return ''
  const lines = []
  lines.push('========== X.509 证书信息 ==========')
  lines.push('[概览]')
  lines.push(sectionText(overviewRows.value))
  lines.push('')
  lines.push('[有效期]')
  lines.push(sectionText(validityRows.value))
  lines.push('')
  lines.push('[主体 Subject]')
  lines.push(sectionText(subjectRows.value))
  lines.push('')
  lines.push('[颁发者 Issuer]')
  lines.push(sectionText(issuerRows.value))
  lines.push('')
  lines.push('[公钥]')
  lines.push(sectionText(spkiRows.value))
  lines.push('')
  lines.push('[扩展 ' + c.extensions.length + ' 项]')
  lines.push(extText.value)
  lines.push('')
  lines.push('[指纹]')
  lines.push(sectionText(fingerprintRows.value))
  lines.push('')
  lines.push('[原始数据]')
  lines.push(sectionText(rawRows.value))
  lines.push('')
  lines.push('[PEM]')
  lines.push(c.pem)
  lines.push('')
  lines.push('（由 403.li SSL 证书解码器在浏览器本地解析，未上传任何数据）')
  return lines.join('\n')
})
</script>

<style scoped>
/* ============ 上传区域 ============ */
.input-wrap {
  position: relative;
}

.input-wrap .code-input {
  display: block;
}

.input-wrap .copy-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.upload-area {
  border: 1px dashed var(--line-strong);
  background: var(--panel-2);
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 18px var(--green-glow);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.upload-icon {
  font-size: 20px;
}

.upload-text {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
}

.upload-hint {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* ============ 证书链选择 ============ */
.chain-tabs {
  margin-top: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px 10px;
}

.chain-hint {
  display: block;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.chain-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chain-tab {
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-tab:hover {
  border-color: var(--green);
  color: var(--green);
}

.chain-tab.active {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

/* ============ 段落标题 ============ */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  text-transform: uppercase;
}

.copy-btn-inline {
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 13px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  border-radius: 0;
}

.copy-btn-inline:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}

.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copy-btn-inline.small {
  font-size: 12px;
  padding: 2px 6px;
}

/* ============ 概览与键值表 ============ */
.result-display.overview {
  margin: 0;
  color: var(--text);
  padding: 10px 12px;
}

.result-display.placeholder {
  margin: 0;
  color: var(--muted);
  background: var(--panel-2);
  border-color: var(--line);
  font-size: 12px;
}

.kv-table {
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.kv-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--line);
}

.kv-row:last-child {
  border-bottom: none;
}

.kv-key {
  flex: 0 0 40%;
  max-width: 40%;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  word-break: break-word;
}

.kv-value {
  flex: 1 1 auto;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  white-space: pre-wrap;
}

.kv-value.mono {
  color: var(--green);
}

.kv-value.ok {
  color: var(--green);
}

.kv-value.warn {
  color: var(--accent);
}

.kv-value.bad {
  color: var(--red);
}

.row-copy {
  flex: 0 0 auto;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  font-size: 12px;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.row-copy:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.result-display.overview .kv-row {
  border-bottom: 1px dashed var(--line);
}

.result-display.overview .kv-row:last-child {
  border-bottom: none;
}

/* ============ 详细区块 ============ */
.detail-section {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

/* ============ 有效期进度条 ============ */
.validity-bar {
  margin-top: 10px;
  height: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.validity-fill {
  height: 100%;
  background: var(--green);
  transition: width 0.3s;
}

.validity-bar.warn .validity-fill {
  background: var(--accent);
}

.validity-bar.bad .validity-fill {
  background: var(--red);
}

.validity-note {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.validity-note strong {
  color: var(--green);
}

/* ============ 扩展卡片 ============ */
.ext-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 900px) {
  .ext-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.ext-card {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px;
}

.ext-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.ext-name {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  flex: 1 1 auto;
  word-break: break-word;
}

.ext-crit {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--red);
  border: 1px solid var(--red);
  padding: 1px 5px;
  flex-shrink: 0;
}

.ext-oid {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 6px;
  word-break: break-all;
}

.ext-lines {
  margin: 0;
  padding-left: 16px;
  list-style: square;
}

.ext-lines li {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  margin-bottom: 2px;
}

/* ============ HEX 预览 ============ */
.hex-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.hex-dump {
  margin: 6px 0 0;
  padding: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}

.pem-out {
  min-height: 140px;
  font-size: 12px;
}

@media (max-width: 640px) {
  .kv-key {
    flex: 0 0 100%;
    max-width: 100%;
    color: var(--green);
  }

  .kv-row {
    flex-wrap: wrap;
    gap: 4px;
  }

  .hex-dump {
    font-size: 11px;
  }

  .detail-section {
    padding: 10px;
  }
}
</style>
