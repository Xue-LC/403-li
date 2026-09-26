<template>

    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔑 SSH 密钥对生成</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">密钥类型：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="keyType" value="rsa" />
                  <span>RSA</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="keyType" value="ed25519" />
                  <span>Ed25519</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="keyType" value="ecdsa-p256" />
                  <span>ECDSA P-256</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="keyType" value="ecdsa-p384" />
                  <span>ECDSA P-384</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="keyType" value="ecdsa-p521" />
                  <span>ECDSA P-521</span>
                </label>
              </div>

              <label v-if="keyType === 'rsa'" class="tool-label">密钥长度：</label>
              <div v-if="keyType === 'rsa'" class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="rsaBits" :value="2048" />
                  <span>2048 位</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="rsaBits" :value="3072" />
                  <span>3072 位</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="rsaBits" :value="4096" />
                  <span>4096 位</span>
                </label>
              </div>

              <label class="tool-label">备注（comment）：</label>
              <input class="code-input-sm" v-model="comment"
                placeholder="默认: 403-li-generated" />

              <button class="tool-button primary" @click="generate"
                :disabled="generating" style="margin-top: 1rem;">
                {{ generating ? '⏳ 正在生成...' : '🔑 生成密钥对' }}
              </button>

              <div v-if="keyType === 'rsa'" style="margin-top: 0.5rem; font-size: 11px; color: var(--muted);">
                RSA 生成可能需要几秒钟，密钥越长越慢
              </div>
              <div style="margin-top: 0.5rem; font-size: 11px; color: var(--muted);">
                {{ keyTypeInfo }}
              </div>
            </div>

            <div class="tool-col">
              <div class="section-header">
                <span class="section-title">🔒 公钥</span>
                <button class="copy-btn-inline" @click="copyPublicKey" title="复制公钥"
                  :disabled="!publicKey">📋</button>
              </div>
              <textarea class="code-input output" :value="publicKey" readonly rows="5"
                placeholder="公钥将显示在这里..."></textarea>

              <div class="section-header">
                <span class="section-title">🔐 私钥（OpenSSH 格式）</span>
                <button class="copy-btn-inline" @click="copyPrivateKey" title="复制私钥"
                  :disabled="!privateKey">📋</button>
              </div>
              <textarea class="code-input output" :value="privateKey" readonly rows="11"
                placeholder="私钥将显示在这里..."></textarea>

              <div v-if="fingerprint" class="result-display" style="margin-top: 1rem;">
                🔍 指纹：SHA256:{{ fingerprint }}
                <button class="copy-btn" @click="copyFingerprint" title="复制指纹">📋</button>
              </div>

              <div v-if="publicKey" style="margin-top: 0.75rem;">
                <button class="tool-button" @click="downloadPrivateKey" style="font-size: 12px;">
                  💾 下载私钥文件
                </button>
                <button class="tool-button" @click="downloadPublicKey" style="font-size: 12px; margin-left: 0.5rem;">
                  💾 下载公钥文件
                </button>
              </div>
            </div>
          </div>

          <div v-if="error" class="status-error">
            ❌ {{ error }}
          </div>

          <div v-if="success" class="status-success">
            ✅ {{ success }}
          </div>
        </div>
      </div>
    </section>

</template>

<script>
import { copyText } from '../../utils/clipboard'
import { loadToolPrefs, saveToolPrefs } from '../../utils/prefs'
import { ed25519 } from '@noble/curves/ed25519.js'
import { p256, p384, p521 } from '@noble/curves/nist.js'

// ========== ASN.1 DER Reader ==========
class ASN1Reader {
  constructor(data) {
    this.data = new Uint8Array(data)
    this.pos = 0
  }

  readTag() {
    return this.data[this.pos++]
  }

  readLength() {
    const b = this.data[this.pos++]
    if (b < 0x80) return b
    const numBytes = b & 0x7f
    let len = 0
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | this.data[this.pos++]
    }
    return len
  }

  readInteger() {
    const tag = this.readTag()
    if (tag !== 0x02) throw new Error('Expected INTEGER (0x02), got 0x' + tag.toString(16))
    const len = this.readLength()
    const val = this.data.slice(this.pos, this.pos + len)
    this.pos += len
    return val
  }

  readOctetString() {
    const tag = this.readTag()
    if (tag !== 0x04) throw new Error('Expected OCTET STRING (0x04), got 0x' + tag.toString(16))
    const len = this.readLength()
    const val = this.data.slice(this.pos, this.pos + len)
    this.pos += len
    return val
  }

  readBitString() {
    const tag = this.readTag()
    if (tag !== 0x03) throw new Error('Expected BIT STRING (0x03), got 0x' + tag.toString(16))
    const len = this.readLength()
    const unusedBits = this.data[this.pos++]
    const val = this.data.slice(this.pos, this.pos + len - 1)
    this.pos += len - 1
    return val
  }

  readSequence() {
    const tag = this.readTag()
    if (tag !== 0x30) throw new Error('Expected SEQUENCE (0x30), got 0x' + tag.toString(16))
    const len = this.readLength()
    const endPos = this.pos + len
    return { endPos }
  }

  readNull() {
    const tag = this.readTag()
    if (tag !== 0x05) throw new Error('Expected NULL (0x05), got 0x' + tag.toString(16))
    const len = this.readLength()
    if (len !== 0) throw new Error('NULL with non-zero length')
  }

  skipOID() {
    const tag = this.readTag()
    if (tag !== 0x06) throw new Error('Expected OID (0x06), got 0x' + tag.toString(16))
    const len = this.readLength()
    this.pos += len
  }
}

// ========== SSH Wire Format Helpers ==========
function concatUint8(...arrays) {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const a of arrays) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function uint32BE(value) {
  const buf = new Uint8Array(4)
  new DataView(buf.buffer).setUint32(0, value, false)
  return buf
}

function sshString(data) {
  return concatUint8(uint32BE(data.length), data)
}

function sshMpint(bytes) {
  let i = 0
  while (i < bytes.length - 1 && bytes[i] === 0) i++
  const stripped = bytes.slice(i)
  if (stripped[0] & 0x80) {
    const padded = new Uint8Array(stripped.length + 1)
    padded.set(stripped, 1)
    return sshString(padded)
  }
  return sshString(stripped)
}

function sshRawString(str) {
  const encoder = new TextEncoder()
  return sshString(encoder.encode(str))
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function chunkBase64(b64, width) {
  const chunks = []
  for (let i = 0; i < b64.length; i += width) {
    chunks.push(b64.substring(i, i + width))
  }
  return chunks.join('\n') + '\n'
}

// ========== OpenSSH v1 Private Key Builder ==========
function buildOpenSshPrivateKey(keyType, publicKeyWire, privateSectionBody, comment) {
  const magic = new TextEncoder().encode('openssh-key-v1\0')
  const cipher = sshRawString('none')
  const kdf = sshRawString('none')
  const kdfOpts = uint32BE(0)
  const numKeys = uint32BE(1)
  const pubKeyBlob = sshString(publicKeyWire)

  const paddedKeyType = concatUint8(new TextEncoder().encode(keyType), new Uint8Array([0]))
  const privateBody = concatUint8(paddedKeyType, privateSectionBody, sshRawString(comment || ''))

  const blockSize = 8
  let padLen = blockSize - (privateBody.length % blockSize)
  if (padLen === 0) padLen = blockSize
  const padding = new Uint8Array(padLen)
  for (let i = 0; i < padLen; i++) padding[i] = i + 1

  const checkBytes = new Uint8Array(8)
  crypto.getRandomValues(checkBytes)

  const privateSectionInner = concatUint8(checkBytes, privateBody, padding)
  const privateSection = sshString(privateSectionInner)

  const total = concatUint8(magic, cipher, kdf, kdfOpts, numKeys, pubKeyBlob, privateSection)
  const b64 = arrayBufferToBase64(total.buffer)
  const pem = chunkBase64(b64, 70)
  return '-----BEGIN OPENSSH PRIVATE KEY-----\n' + pem + '-----END OPENSSH PRIVATE KEY-----\n'
}

// ========== RSA Key Processing ==========
function buildRsaPublicKeyWire(n, e) {
  const keyTypeBytes = new TextEncoder().encode('ssh-rsa')
  return concatUint8(
    sshString(keyTypeBytes),
    sshMpint(e),
    sshMpint(n)
  )
}

function buildRsaPublicKey(n, e, comment) {
  const wire = buildRsaPublicKeyWire(n, e)
  const b64 = arrayBufferToBase64(wire.buffer)
  return 'ssh-rsa ' + b64 + ' ' + (comment || '403-li-generated')
}

function buildRsaPrivateKey(n, e, d, p, q, iqmp, comment) {
  const wire = buildRsaPublicKeyWire(n, e)
  const privateBody = concatUint8(
    sshMpint(n),
    sshMpint(e),
    sshMpint(d),
    sshMpint(iqmp),
    sshMpint(p),
    sshMpint(q)
  )
  return buildOpenSshPrivateKey('ssh-rsa', wire, privateBody, comment || '403-li-generated')
}

function parseRsaSpki(spkiData) {
  const reader = new ASN1Reader(spkiData)
  reader.readSequence()
  reader.readSequence()
  reader.skipOID()
  reader.readNull()
  const bitString = reader.readBitString()
  const innerReader = new ASN1Reader(bitString.buffer.slice(bitString.byteOffset, bitString.byteOffset + bitString.length))
  innerReader.readSequence()
  const n = innerReader.readInteger()
  const e = innerReader.readInteger()
  return { n, e }
}

function parseRsaPkcs8(pkcs8Data) {
  const reader = new ASN1Reader(pkcs8Data)
  reader.readSequence()
  reader.readInteger()
  reader.readSequence()
  reader.skipOID()
  reader.readNull()
  const octetData = reader.readOctetString()
  const inner = new ASN1Reader(octetData.buffer.slice(octetData.byteOffset, octetData.byteOffset + octetData.length))
  inner.readSequence()
  inner.readInteger()
  const n = inner.readInteger()
  const e = inner.readInteger()
  const d = inner.readInteger()
  const p = inner.readInteger()
  const q = inner.readInteger()
  const dmp1 = inner.readInteger()
  const dmq1 = inner.readInteger()
  const iqmp = inner.readInteger()
  return { n, e, d, p, q, dmp1, dmq1, iqmp }
}

// ========== Ed25519 Key Processing ==========
function buildEd25519PublicKeyWire(pubKeyBytes) {
  const keyTypeBytes = new TextEncoder().encode('ssh-ed25519')
  return concatUint8(
    sshString(keyTypeBytes),
    sshString(pubKeyBytes)
  )
}

function buildEd25519PublicKey(pubKeyBytes, comment) {
  const wire = buildEd25519PublicKeyWire(pubKeyBytes)
  const b64 = arrayBufferToBase64(wire.buffer)
  return 'ssh-ed25519 ' + b64 + ' ' + (comment || '403-li-generated')
}

function buildEd25519PrivateKey(pubKeyBytes, privKeyBytes, comment) {
  const wire = buildEd25519PublicKeyWire(pubKeyBytes)
  const privateBody = concatUint8(
    sshString(pubKeyBytes),
    sshString(concatUint8(privKeyBytes, pubKeyBytes))
  )
  return buildOpenSshPrivateKey('ssh-ed25519', wire, privateBody, comment || '403-li-generated')
}

// ========== ECDSA Key Processing ==========
const ECDSA_CURVES = {
  'ecdsa-p256': { curve: p256, sshName: 'ecdsa-sha2-nistp256', curveId: 'nistp256' },
  'ecdsa-p384': { curve: p384, sshName: 'ecdsa-sha2-nistp384', curveId: 'nistp384' },
  'ecdsa-p521': { curve: p521, sshName: 'ecdsa-sha2-nistp521', curveId: 'nistp521' }
}

const ECDSA_CURVES_BY_ID = {
  'nistp256': ECDSA_CURVES['ecdsa-p256'],
  'nistp384': ECDSA_CURVES['ecdsa-p384'],
  'nistp521': ECDSA_CURVES['ecdsa-p521']
}

function buildEcdsaPublicKeyWire(pubKeyBytes, curveId) {
  const keyTypeBytes = new TextEncoder().encode(ECDSA_CURVES_BY_ID[curveId].sshName)
  const curveIdBytes = new TextEncoder().encode(curveId)
  return concatUint8(
    sshString(keyTypeBytes),
    sshString(curveIdBytes),
    sshString(pubKeyBytes)
  )
}

function buildEcdsaPublicKey(pubKeyBytes, curveId, comment) {
  const wire = buildEcdsaPublicKeyWire(pubKeyBytes, curveId)
  const b64 = arrayBufferToBase64(wire.buffer)
  return ECDSA_CURVES_BY_ID[curveId].sshName + ' ' + b64 + ' ' + (comment || '403-li-generated')
}

function buildEcdsaPrivateKey(privKeyBytes, pubKeyBytes, curveId, comment) {
  const sshName = ECDSA_CURVES_BY_ID[curveId].sshName
  const wire = buildEcdsaPublicKeyWire(pubKeyBytes, curveId)
  const privateBody = concatUint8(
    sshString(pubKeyBytes),
    sshString(privKeyBytes)
  )
  return buildOpenSshPrivateKey(sshName, wire, privateBody, comment || '403-li-generated')
}

// ========== SHA256 Fingerprint ==========
async function sha256Fingerprint(data) {
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, '')
}

export default {
  name: 'SshKeygenTool',

  data() {
    return {
      keyType: 'ed25519',
      rsaBits: 3072,
      comment: '',
      publicKey: '',
      privateKey: '',
      fingerprint: '',
      generating: false,
      error: '',
      success: ''
    }
  },

  computed: {
    keyTypeInfo() {
      const infos = {
        'rsa': 'RSA — 兼容性最广，适合所有 SSH 服务器',
        'ed25519': 'Ed25519 — 推荐首选，速度快、密钥短、安全性高',
        'ecdsa-p256': 'ECDSA P-256 — NIST 标准曲线，广泛支持',
        'ecdsa-p384': 'ECDSA P-384 — 更高安全级别',
        'ecdsa-p521': 'ECDSA P-521 — 最高安全级别（521 位）'
      }
      return infos[this.keyType] || ''
    }
  },

  mounted() {
    const saved = loadToolPrefs('ssh-keygen')
    if (saved) {
      if (saved.keyType) this.keyType = saved.keyType
      if (saved.rsaBits) this.rsaBits = saved.rsaBits
    }
  },

  watch: {
    keyType() { this.savePrefs() },
    rsaBits() { this.savePrefs() }
  },

  methods: {
    savePrefs() {
      saveToolPrefs('ssh-keygen', {
        keyType: this.keyType,
        rsaBits: this.rsaBits
      })
    },

    async generate() {
      this.error = ''
      this.success = ''
      this.publicKey = ''
      this.privateKey = ''
      this.fingerprint = ''
      this.generating = true

      try {
        const comment = this.comment || '403-li-generated'

        if (this.keyType === 'rsa') {
          await this.generateRsa(comment)
        } else if (this.keyType === 'ed25519') {
          await this.generateEd25519(comment)
        } else {
          await this.generateEcdsa(comment)
        }

        this.success = '密钥对生成成功！请妥善保管私钥'
        setTimeout(() => { this.success = '' }, 5000)
      } catch (err) {
        this.error = '生成失败：' + (err.message || err)
        console.error('SSH keygen error:', err)
      } finally {
        this.generating = false
      }
    },

    async generateRsa(comment) {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: this.rsaBits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      )

      const spkiRaw = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const pkcs8Raw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

      const { n, e } = parseRsaSpki(spkiRaw)
      const priv = parseRsaPkcs8(pkcs8Raw)

      this.publicKey = buildRsaPublicKey(n, e, comment)
      this.privateKey = buildRsaPrivateKey(priv.n, priv.e, priv.d, priv.p, priv.q, priv.iqmp, comment)

      const pubWire = buildRsaPublicKeyWire(n, e)
      this.fingerprint = await sha256Fingerprint(pubWire)
    },

    async generateEd25519(comment) {
      const { secretKey, publicKey } = ed25519.keygen()
      const privateKeyBytes = secretKey
      const publicKeyBytes = publicKey

      this.publicKey = buildEd25519PublicKey(publicKeyBytes, comment)
      this.privateKey = buildEd25519PrivateKey(publicKeyBytes, privateKeyBytes, comment)

      const pubWire = buildEd25519PublicKeyWire(publicKeyBytes)
      this.fingerprint = await sha256Fingerprint(pubWire)
    },

    async generateEcdsa(comment) {
      const curveInfo = ECDSA_CURVES[this.keyType]
      const curve = curveInfo.curve
      const { secretKey, publicKey } = curve.keygen()
      const privKeyBytes = secretKey
      const pubKeyBytes = publicKey

      this.publicKey = buildEcdsaPublicKey(pubKeyBytes, curveInfo.curveId, comment)
      this.privateKey = buildEcdsaPrivateKey(privKeyBytes, pubKeyBytes, curveInfo.curveId, comment)

      const pubWire = buildEcdsaPublicKeyWire(pubKeyBytes, curveInfo.curveId)
      this.fingerprint = await sha256Fingerprint(pubWire)
    },

    async copyPublicKey() {
      if (await copyText(this.publicKey)) {
        this.success = '公钥已复制！'
        setTimeout(() => { this.success = '' }, 2000)
      }
    },

    async copyPrivateKey() {
      if (await copyText(this.privateKey)) {
        this.success = '私钥已复制！请妥善保管'
        setTimeout(() => { this.success = '' }, 2000)
      }
    },

    async copyFingerprint() {
      if (await copyText('SHA256:' + this.fingerprint)) {
        this.success = '指纹已复制！'
        setTimeout(() => { this.success = '' }, 2000)
      }
    },

    downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    downloadPrivateKey() {
      const ext = this.keyType === 'rsa' ? 'rsa' : this.keyType.replace(/-/g, '_')
      this.downloadFile(this.privateKey, 'id_' + ext)
      this.success = '私钥文件已下载'
      setTimeout(() => { this.success = '' }, 2000)
    },

    downloadPublicKey() {
      const ext = this.keyType === 'rsa' ? 'rsa' : this.keyType.replace(/-/g, '_')
      this.downloadFile(this.publicKey, 'id_' + ext + '.pub')
      this.success = '公钥文件已下载'
      setTimeout(() => { this.success = '' }, 2000)
    }
  }
}
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.section-title {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.copy-btn-inline {
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 14px;
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
</style>
