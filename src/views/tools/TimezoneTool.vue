<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🕐 时区转换</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入与控制 -->
          <div class="tool-col">
            <label class="tool-label">日期时间：</label>
            <div class="dt-row">
              <input
                type="datetime-local"
                v-model="input"
                class="code-input-sm dt-input"
                placeholder="选择或输入日期时间"
              />
              <button class="tool-button dt-now" @click="useNow" title="填入当前时刻">
                🕐 现在
              </button>
            </div>

            <label class="tool-label">源时区：</label>
            <select v-model="sourceTz" class="tz-select">
              <option v-for="z in filteredZones" :key="z" :value="z">{{ z }}</option>
            </select>

            <label class="tool-label">目标时区：</label>
            <select v-model="targetTz" class="tz-select">
              <option v-for="z in filteredZones" :key="z" :value="z">{{ z }}</option>
            </select>

            <input
              class="code-input-sm"
              v-model="tzFilter"
              placeholder="🔍 筛选时区，如 Shanghai / UTC / 400+"
            />

            <div class="button-group button-group-3">
              <button class="tool-button primary" @click="useNow">🕐 当前时刻</button>
              <button class="tool-button" @click="swap">⇄ 互换时区</button>
              <button class="tool-button" @click="copyInput" :disabled="!input">
                📋 复制输入
              </button>
            </div>
          </div>

          <!-- 右栏：输出与预览 -->
          <div class="tool-col">
            <label class="tool-label">转换结果（{{ targetTz }}）：</label>
            <div class="result-display" :class="{ 'result-placeholder': !converted }">
              {{ converted || (input.trim() ? '正在转换…' : '输入日期时间后自动转换…') }}
              <button class="copy-btn" @click="copyResult" title="复制" :disabled="!converted">📋</button>
            </div>

            <label class="tool-label">时间戳（Unix）：</label>
            <div class="epoch-row">
              <span class="epoch-label">秒</span>
              <span class="epoch-value">{{ epochSeconds || '—' }}</span>
              <button class="copy-btn" @click="copyEpoch('s')" title="复制" :disabled="epochMs == null">📋</button>
            </div>
            <div class="epoch-row">
              <span class="epoch-label">毫秒</span>
              <span class="epoch-value">{{ epochMsValue || '—' }}</span>
              <button class="copy-btn" @click="copyEpoch('ms')" title="复制" :disabled="epochMs == null">📋</button>
            </div>

            <label class="tool-label">输出格式：</label>
            <input class="code-input-sm" v-model="formatPattern" placeholder="如 YYYY-MM-DD HH:mm:ss" />
            <div class="preset-row">
              <button
                v-for="p in presets"
                :key="p.pattern"
                :class="['preset-btn', { active: formatPattern === p.pattern }]"
                @click="formatPattern = p.pattern"
              >{{ p.label }}</button>
            </div>
            <p class="token-hint">令牌：YYYY MM DD HH mm ss SSS · ddd/dddd 星期 · MMM/MMMM 月名 · Z 偏移 · X/x 时间戳</p>

            <label class="tool-label">世界时钟（实时）：</label>
            <div class="clock-list">
              <div v-for="c in clocks" :key="c.zone" class="clock-row">
                <span class="clock-zone" :title="c.zone">{{ c.zone }}</span>
                <span class="clock-offset">{{ c.offset }}</span>
                <span class="clock-time">{{ c.time }}</span>
                <span class="clock-weekday">{{ c.weekday }}</span>
                <button class="copy-btn" @click="copyClock(c)" title="复制">📋</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="invalid" class="status-error">
          ❌ 时间格式无效，请使用 YYYY-MM-DD HH:mm 格式
        </div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const sourceTz = ref('Asia/Shanghai')
const targetTz = ref('UTC')
const formatPattern = ref('YYYY-MM-DD HH:mm:ss')
const tzFilter = ref('')
const now = ref(Date.now())
const success = ref('')

let tickTimer = null
let successTimer = null

/* === 时区列表（优先 Intl.supportedValuesOf，约 400+，不支持时降级为常用列表） === */
const FALLBACK_ZONES = [
  'UTC', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Singapore',
  'Asia/Seoul', 'Asia/Taipei', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Jakarta',
  'Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Manila', 'Asia/Kuala_Lumpur',
  'Asia/Karachi', 'Asia/Dhaka', 'Asia/Kathmandu', 'Asia/Riyadh', 'Asia/Tehran',
  'Asia/Baghdad', 'Asia/Tbilisi', 'Asia/Yerevan', 'Asia/Baku', 'Asia/Almaty',
  'Asia/Ulaanbaatar', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Novosibirsk',
  'Asia/Yekaterinburg', 'Asia/Tashkent', 'Asia/Jerusalem', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Damascus', 'Asia/Nicosia', 'Asia/Tokyo',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
  'Australia/Adelaide', 'Australia/Darwin', 'Pacific/Auckland', 'Pacific/Fiji',
  'Pacific/Guam', 'Pacific/Honolulu', 'Pacific/Kiritimati', 'Pacific/Noumea',
  'Pacific/Port_Moresby', 'Pacific/Tarawa',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Zurich',
  'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Warsaw',
  'Europe/Prague', 'Europe/Budapest', 'Europe/Bucharest', 'Europe/Athens',
  'Europe/Helsinki', 'Europe/Kyiv', 'Europe/Istanbul', 'Europe/Moscow',
  'Europe/Lisbon', 'Europe/Dublin', 'Europe/Reykjavik', 'Europe/Belgrade',
  'Europe/Sofia', 'Europe/Zagreb', 'Europe/Vilnius', 'Europe/Riga', 'Europe/Tallinn',
  'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Nairobi',
  'Africa/Casablanca', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
  'Africa/Khartoum', 'Africa/Kinshasa', 'Africa/Tunis',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'America/Honolulu', 'America/Toronto',
  'America/Vancouver', 'America/Montreal', 'America/Edmonton', 'America/Winnipeg',
  'America/Regina', 'America/Halifax', 'America/St_Johns', 'America/Mexico_City',
  'America/Guatemala', 'America/Panama', 'America/Bogota', 'America/Lima',
  'America/Caracas', 'America/Santiago', 'America/La_Paz', 'America/Manaus',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Montevideo',
  'America/Asuncion', 'America/Havana', 'America/Jamaica', 'America/Puerto_Rico',
  'America/Indianapolis', 'America/Juneau', 'America/Boise', 'America/Nome',
  'America/Detroit', 'America/Louisville', 'America/Menominee', 'America/Sitka',
  'America/Dawson_Creek', 'America/Dawson', 'America/Whitehorse', 'America/Creston',
  'America/Cancun', 'America/El_Salvador', 'America/Managua', 'America/Costa_Rica',
  'America/Port-au-Prince', 'America/Guayaquil', 'America/Belize', 'America/Chihuahua',
  'Atlantic/Azores', 'Atlantic/Reykjavik', 'Atlantic/Cape_Verde', 'Atlantic/South_Georgia',
  'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Madeira',
  'Indian/Maldives', 'Indian/Mauritius', 'Indian/Reunion', 'Indian/Mahe', 'Indian/Chagos',
  'Antarctica/Troll', 'Antarctica/McMurdo', 'Antarctica/Palmer', 'Antarctica/Casey',
  'Etc/GMT', 'Etc/GMT+1', 'Etc/GMT-1', 'Etc/UTC'
]

const allZones = (() => {
  let zones = []
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      zones = Intl.supportedValuesOf('timeZone')
    }
  } catch (e) { /* ignore */ }
  if (!zones || zones.length <= 100) zones = [...FALLBACK_ZONES]
  // 某些实现不包含 UTC，手动补上
  if (!zones.includes('UTC')) zones.unshift('UTC')
  return zones
})()

// 默认源时区取浏览器本地时区
try {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (local && allZones.includes(local)) sourceTz.value = local
} catch (e) { /* ignore */ }

const filteredZones = computed(() => {
  const q = tzFilter.value.trim().toLowerCase()
  if (!q) return allZones
  return allZones.filter(z => z.toLowerCase().includes(q))
})

/* === Intl 时间部件（按时区缓存 formatter） === */
const fmtCache = new Map()

function getParts(epochMs, timeZone) {
  let fmt = fmtCache.get(timeZone)
  if (!fmt) {
    fmt = {
      main: new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'longOffset'
      }),
      week: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }),
      weekLong: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }),
      mon: new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }),
      monLong: new Intl.DateTimeFormat('en-US', { timeZone, month: 'long' })
    }
    fmtCache.set(timeZone, fmt)
  }
  const d = new Date(epochMs)
  const parts = fmt.main.formatToParts(d)
  const get = (t) => {
    const p = parts.find(x => x.type === t)
    return p ? p.value : ''
  }
  return {
    year: +get('year'),
    month: +get('month'),
    day: +get('day'),
    hour: +get('hour'),
    minute: +get('minute'),
    second: +get('second'),
    weekday: fmt.week.format(d),
    weekdayLong: fmt.weekLong.format(d),
    monthShort: fmt.mon.format(d),
    monthLong: fmt.monLong.format(d),
    offset: parseOffset(get('timeZoneName'))
  }
}

/** "GMT+08:00" / "GMT" / "GMT+8:00" → "+08:00" / "+00:00" */
function parseOffset(str) {
  if (!str) return '+00:00'
  const s = String(str).replace(/^GMT/i, '').trim()
  if (!s) return '+00:00'
  const m = /^([+-])(\d{1,2}):?(\d{2})$/.exec(s)
  if (m) return `${m[1]}${m[2].padStart(2, '0')}:${m[3]}`
  return s
}

function offsetToMs(offsetStr) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(offsetStr)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  return sign * (parseInt(m[2], 10) * 3600 + parseInt(m[3], 10) * 60) * 1000
}

function pad(n, w = 2) {
  return String(n).padStart(w, '0')
}

/** 目标时区格式化（moment 风格令牌） */
function formatEpoch(epochMs, timeZone, pattern) {
  const p = getParts(epochMs, timeZone)
  const h12 = p.hour % 12 || 12
  const map = {
    YYYY: pad(p.year, 4),
    YY: pad(p.year % 100),
    MMMM: p.monthLong,
    MMM: p.monthShort,
    MM: pad(p.month),
    M: String(p.month),
    dddd: p.weekdayLong,
    ddd: p.weekday,
    DD: pad(p.day),
    D: String(p.day),
    HH: pad(p.hour),
    H: String(p.hour),
    hh: pad(h12),
    h: String(h12),
    mm: pad(p.minute),
    m: String(p.minute),
    ss: pad(p.second),
    s: String(p.second),
    SSS: pad(epochMs % 1000, 3),
    A: p.hour < 12 ? 'AM' : 'PM',
    Z: p.offset,
    ZZ: p.offset.replace(':', ''),
    X: String(Math.floor(epochMs / 1000)),
    x: String(epochMs)
  }
  return pattern.replace(
    /YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|A|ZZ|Z|X|x/g,
    (t) => map[t] ?? t
  )
}

/** 解析 datetime-local 值 "YYYY-MM-DDTHH:mm[:ss]" */
function parseInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim())
  if (!m) return null
  return {
    year: +m[1],
    month: +m[2],
    day: +m[3],
    hour: +m[4],
    minute: +m[5],
    second: m[6] ? +m[6] : 0
  }
}

/** 将指定时区的墙钟时间转换为 epoch 毫秒（迭代收敛偏移量） */
function wallToEpoch(comp, timeZone) {
  // w 表示「把墙钟时间当作 UTC」的参考值，迭代中保持不变
  const w = Date.UTC(comp.year, comp.month - 1, comp.day, comp.hour, comp.minute, comp.second)
  let e = w
  for (let i = 0; i < 4; i++) {
    const off = offsetToMs(getParts(e, timeZone).offset)
    const next = w - off
    if (next === e) break
    e = next
  }
  return e
}

/* === 计算属性 === */
const epochMs = computed(() => {
  if (!input.value.trim()) return null
  const comp = parseInput(input.value)
  if (!comp) return null
  try {
    return wallToEpoch(comp, sourceTz.value)
  } catch (e) {
    return null
  }
})

const invalid = computed(() => input.value.trim() !== '' && epochMs.value == null)

const converted = computed(() => {
  if (epochMs.value == null) return ''
  try {
    return formatEpoch(epochMs.value, targetTz.value, formatPattern.value)
  } catch (e) {
    return ''
  }
})

const epochSeconds = computed(() =>
  epochMs.value == null ? '' : String(Math.floor(epochMs.value / 1000))
)
const epochMsValue = computed(() =>
  epochMs.value == null ? '' : String(epochMs.value)
)

const presets = [
  { label: 'ISO', pattern: 'YYYY-MM-DD HH:mm:ss' },
  { label: 'RFC 2822', pattern: 'ddd, DD MMM YYYY HH:mm:ss Z' },
  { label: '中文', pattern: 'YYYY年MM月DD日 dddd HH:mm:ss' },
  { label: '时间戳', pattern: 'X' }
]

/* === 世界时钟 === */
const CLOCK_PRESET = ['UTC', 'Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'America/New_York']

const clocks = computed(() => {
  const seen = new Set()
  const list = []
  for (const z of [sourceTz.value, targetTz.value, ...CLOCK_PRESET]) {
    if (seen.has(z)) continue
    seen.add(z)
    try {
      const p = getParts(now.value, z)
      list.push({
        zone: z,
        time: `${pad(p.year)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`,
        weekday: p.weekdayLong,
        offset: p.offset
      })
    } catch (e) { /* 忽略无法格式化的时区 */ }
  }
  return list
})

/* === 操作 === */
function useNow() {
  now.value = Date.now()
  input.value = formatEpoch(now.value, sourceTz.value, 'YYYY-MM-DDTHH:mm:ss')
}

function swap() {
  const t = sourceTz.value
  sourceTz.value = targetTz.value
  targetTz.value = t
}

function flash(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 2000)
}

async function safeCopy(text, label) {
  if (!text) return
  const ok = await copyText(text)
  if (ok) flash(`${label}已复制到剪贴板`)
  else flash('复制失败，请手动复制')
}

function copyInput() { safeCopy(input.value, '输入时间') }
function copyResult() { safeCopy(converted.value, '转换结果') }
function copyEpoch(unit) {
  safeCopy(unit === 's' ? epochSeconds.value : epochMsValue.value, unit === 's' ? '秒级时间戳' : '毫秒级时间戳')
}
function copyClock(c) {
  safeCopy(`${c.zone} ${c.time} ${c.offset}`, '时钟时间')
}

/* === 生命周期 === */
onMounted(() => {
  useNow()
  tickTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(tickTimer)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* 日期时间输入行 */
.dt-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dt-input {
  flex: 1;
  min-width: 0;
}

.dt-now {
  min-height: 40px;
  padding: 0 14px;
  white-space: nowrap;
  font-size: 12px;
  flex-shrink: 0;
}

/* 时区下拉 */
.tz-select {
  width: 100%;
  height: 40px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0 10px;
  border-radius: 0;
  transition: all 0.2s;
}

.tz-select:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.tz-select option {
  background: var(--panel-2);
  color: var(--text);
}

/* 时间戳行 */
.epoch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 8px 10px;
  margin-bottom: 8px;
}

.epoch-label {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.epoch-value {
  flex: 1;
  min-width: 0;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  word-break: break-all;
}

/* 格式预设 */
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preset-btn {
  padding: 6px 12px;
  font-family: var(--mono);
  font-size: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}

.preset-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.preset-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.token-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono);
  line-height: 1.6;
}

/* 世界时钟 */
.clock-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clock-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 7px 10px;
}

.clock-zone {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  flex-shrink: 0;
  max-width: 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clock-offset {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  flex-shrink: 0;
}

.clock-time {
  flex: 1;
  min-width: 0;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clock-weekday {
  color: var(--muted);
  font-size: 12px;
  flex-shrink: 0;
}

/* 行内复制按钮（覆盖全局 .copy-btn 的 absolute） */
.clock-row .copy-btn,
.epoch-row .copy-btn {
  position: static;
  flex-shrink: 0;
  border: 1px solid var(--line);
  padding: 3px 8px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
}

.clock-row .copy-btn:hover,
.epoch-row .copy-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  transform: none;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.result-placeholder {
  color: var(--muted);
}

@media (max-width: 640px) {
  .clock-row {
    flex-wrap: wrap;
    gap: 4px 10px;
  }

  .clock-time {
    flex-basis: 100%;
    order: 3;
    white-space: normal;
  }

  .dt-now {
    font-size: 11px;
    padding: 0 10px;
  }

  .token-hint {
    font-size: 11px;
  }
}
</style>
