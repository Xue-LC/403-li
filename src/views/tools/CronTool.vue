<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>⏰ Cron 生成器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <!-- 快速模板 -->
          <label class="tool-label">快速模板：</label>
          <div class="template-group">
            <button 
              v-for="tpl in templates" 
              :key="tpl.name"
              class="template-btn"
              :class="{ active: isActiveTemplate(tpl) }"
              @click="applyTemplate(tpl)"
            >
              {{ tpl.name }}
            </button>
          </div>

          <!-- 时区设置 -->
          <div class="timezone-section">
            <label class="tool-label">时区设置：</label>
            <div class="timezone-row">
              <div class="timezone-select-group">
                <span class="timezone-label">用户时区：</span>
                <select v-model="userTimezone" class="timezone-select" @change="onTimezoneChange">
                  <optgroup label="🌍 国际协调时">
                    <option v-for="tz in timezones.utc" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌏 亚洲">
                    <option v-for="tz in timezones.asia" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌍 欧洲">
                    <option v-for="tz in timezones.europe" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌎 美洲">
                    <option v-for="tz in timezones.americas" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌏 大洋洲">
                    <option v-for="tz in timezones.oceania" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                </select>
              </div>
              <div class="timezone-select-group">
                <span class="timezone-label">Cron 时区：</span>
                <select v-model="cronTimezone" class="timezone-select" @change="onTimezoneChange">
                  <optgroup label="🌍 国际协调时">
                    <option v-for="tz in timezones.utc" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌏 亚洲">
                    <option v-for="tz in timezones.asia" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌍 欧洲">
                    <option v-for="tz in timezones.europe" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌎 美洲">
                    <option v-for="tz in timezones.americas" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                  <optgroup label="🌏 大洋洲">
                    <option v-for="tz in timezones.oceania" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                  </optgroup>
                </select>
              </div>
            </div>
            
            <!-- 时区转换说明 -->
            <div class="timezone-hint">
              <span class="hint-text">
                选择的时间是 <strong>{{ userTimezone }}</strong> 的时间，将自动转换为 <strong>{{ cronTimezone }}</strong> 的 Cron 表达式
              </span>
            </div>
            
            <!-- 时区转换结果 -->
            <div v-if="conversionResult" class="conversion-result">
              <div class="conversion-item">
                <span class="conversion-label">转换结果：</span>
                <span class="conversion-value">{{ conversionResult }}</span>
              </div>
            </div>
          </div>

          <!-- 分钟选择 -->
          <div class="cron-section">
            <div class="section-header">
              <label class="tool-label">分钟：</label>
              <div class="section-actions">
                <button class="action-btn" @click="selectAll('minute')">全选</button>
                <button class="action-btn" @click="clearAll('minute')">清空</button>
              </div>
            </div>
            <div class="checkbox-grid">
              <label 
                v-for="n in 60" 
                :key="'m'+n"
                class="checkbox-label small"
                :class="{ checked: cron.minute.includes(n-1) }"
              >
                <input 
                  type="checkbox" 
                  :value="n-1"
                  v-model="cron.minute"
                  @change="onCronChange"
                />
                {{ n-1 }}
              </label>
            </div>
          </div>

          <!-- 小时选择 -->
          <div class="cron-section">
            <div class="section-header">
              <label class="tool-label">小时（{{ userTimezone }}）：</label>
              <div class="section-actions">
                <button class="action-btn" @click="selectAll('hour')">全选</button>
                <button class="action-btn" @click="clearAll('hour')">清空</button>
              </div>
            </div>
            <div class="checkbox-grid">
              <label 
                v-for="n in 24" 
                :key="'h'+n"
                class="checkbox-label small"
                :class="{ checked: cron.hour.includes(n-1) }"
              >
                <input 
                  type="checkbox" 
                  :value="n-1"
                  v-model="cron.hour"
                  @change="onCronChange"
                />
                {{ n-1 }}
              </label>
            </div>
          </div>

          <!-- 日期选择 -->
          <div class="cron-section">
            <div class="section-header">
              <label class="tool-label">日期：</label>
              <div class="section-actions">
                <button class="action-btn" @click="selectAll('day')">全选</button>
                <button class="action-btn" @click="clearAll('day')">清空</button>
              </div>
            </div>
            <div class="checkbox-grid">
              <label 
                v-for="n in 31" 
                :key="'d'+n"
                class="checkbox-label small"
                :class="{ checked: cron.day.includes(n) }"
              >
                <input 
                  type="checkbox" 
                  :value="n"
                  v-model="cron.day"
                  @change="onCronChange"
                />
                {{ n }}
              </label>
            </div>
          </div>

          <!-- 月份选择 -->
          <div class="cron-section">
            <div class="section-header">
              <label class="tool-label">月份：</label>
              <div class="section-actions">
                <button class="action-btn" @click="selectAll('month')">全选</button>
                <button class="action-btn" @click="clearAll('month')">清空</button>
              </div>
            </div>
            <div class="checkbox-grid">
              <label 
                v-for="n in 12" 
                :key="'mo'+n"
                class="checkbox-label"
                :class="{ checked: cron.month.includes(n) }"
              >
                <input 
                  type="checkbox" 
                  :value="n"
                  v-model="cron.month"
                  @change="onCronChange"
                />
                {{ n }}月
              </label>
            </div>
          </div>

          <!-- 星期选择 -->
          <div class="cron-section">
            <div class="section-header">
              <label class="tool-label">星期：</label>
              <div class="section-actions">
                <button class="action-btn" @click="selectAll('weekday')">全选</button>
                <button class="action-btn" @click="clearAll('weekday')">清空</button>
              </div>
            </div>
            <div class="checkbox-grid weekday-grid">
              <label 
                v-for="(day, idx) in weekdays" 
                :key="'w'+idx"
                class="checkbox-label"
                :class="{ checked: cron.weekday.includes(idx) }"
              >
                <input 
                  type="checkbox" 
                  :value="idx"
                  v-model="cron.weekday"
                  @change="onCronChange"
                />
                {{ day }}
              </label>
            </div>
          </div>

          <!-- 手动输入 -->
          <div class="manual-input">
            <label class="tool-label">Cron 表达式（{{ cronTimezone }}）：</label>
            <div class="input-row">
              <input 
                type="text" 
                v-model="cronExpression"
                class="code-input"
                placeholder="* * * * *"
                @change="parseExpression"
              />
              <button class="copy-btn-inline" @click="copyCron">📋</button>
            </div>
          </div>

          <!-- 中文描述 -->
          <div class="result-section">
            <div class="value-row">
              <span class="label">中文描述：</span>
              <span class="value chinese-desc">{{ chineseDesc }}</span>
            </div>
          </div>

          <!-- 下次运行时间 -->
          <div class="next-runs">
            <label class="tool-label">下次运行时间（未来5次）：</label>
            <div class="runs-list">
              <div v-for="(run, idx) in nextRunsDisplay" :key="idx" class="run-item">
                <span class="run-number">{{ idx + 1 }}.</span>
                <span class="run-time">{{ run.userTime }}</span>
                <span v-if="run.cronTime !== run.userTime" class="run-time-cron">
                  ({{ run.cronTime }})
                </span>
              </div>
            </div>
          </div>

          <!-- 状态提示 -->
          <div v-if="error" class="status-error">
            ❌ {{ error }}
          </div>
          <div v-if="success" class="status-success">
            ✅ {{ success }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'CronTool',
  components: {},
  data() {
    return {
      cron: {
        minute: [0],
        hour: [3],
        day: [],
        month: [],
        weekday: []
      },
      cronExpression: '0 3 * * *',
      chineseDesc: '每天凌晨 3 点执行',
      nextRuns: [],
      error: '',
      success: '',
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      debounceTimer: null,  // 防抖定时器
      templates: [
        { name: '每天凌晨3点', expr: '0 3 * * *' },
        { name: '每小时', expr: '0 * * * *' },
        { name: '每5分钟', expr: '*/5 * * * *' },
        { name: '每周一', expr: '0 0 * * 1' },
        { name: '每月1号', expr: '0 0 1 * *' },
        { name: '每分钟', expr: '* * * * *' },
        { name: '每天', expr: '0 0 * * *' },
        { name: '工作日', expr: '0 9 * * 1-5' }
      ],
      // 时区相关 - 默认都设为 UTC
      userTimezone: 'UTC',
      cronTimezone: 'UTC',
      timezones: {
        utc: [
          { label: '⏰ UTC (国际协调时)', value: 'UTC', offset: 0 }
        ],
        asia: [
          { label: '🇨🇳 北京/上海 (UTC+8)', value: 'Asia/Shanghai', offset: 8 },
          { label: '🇨🇳 香港 (UTC+8)', value: 'Asia/Hong_Kong', offset: 8 },
          { label: '🇨🇳 台北 (UTC+8)', value: 'Asia/Taipei', offset: 8 },
          { label: '🇯🇵 东京 (UTC+9)', value: 'Asia/Tokyo', offset: 9 },
          { label: '🇰🇷 首尔 (UTC+9)', value: 'Asia/Seoul', offset: 9 },
          { label: '🇸🇬 新加坡 (UTC+8)', value: 'Asia/Singapore', offset: 8 },
          { label: '🇹🇭 曼谷 (UTC+7)', value: 'Asia/Bangkok', offset: 7 },
          { label: '🇮🇳 新德里 (UTC+5:30)', value: 'Asia/Kolkata', offset: 5.5 },
          { label: '🇦🇪 迪拜 (UTC+4)', value: 'Asia/Dubai', offset: 4 },
          { label: '🇮🇩 雅加达 (UTC+7)', value: 'Asia/Jakarta', offset: 7 },
          { label: '🇲🇾 吉隆坡 (UTC+8)', value: 'Asia/Kuala_Lumpur', offset: 8 },
          { label: '🇵🇭 马尼拉 (UTC+8)', value: 'Asia/Manila', offset: 8 },
          { label: '🇻🇳 河内 (UTC+7)', value: 'Asia/Ho_Chi_Minh', offset: 7 }
        ],
        europe: [
          { label: '🇬🇧 伦敦 (UTC+0/+1)', value: 'Europe/London', offset: 0 },
          { label: '🇫🇷 巴黎 (UTC+1/+2)', value: 'Europe/Paris', offset: 1 },
          { label: '🇩🇪 柏林 (UTC+1/+2)', value: 'Europe/Berlin', offset: 1 },
          { label: '🇷🇺 莫斯科 (UTC+3)', value: 'Europe/Moscow', offset: 3 },
          { label: '🇳🇱 阿姆斯特丹 (UTC+1/+2)', value: 'Europe/Amsterdam', offset: 1 },
          { label: '🇪🇸 马德里 (UTC+1/+2)', value: 'Europe/Madrid', offset: 1 },
          { label: '🇮🇹 罗马 (UTC+1/+2)', value: 'Europe/Rome', offset: 1 },
          { label: '🇨🇭 苏黎世 (UTC+1/+2)', value: 'Europe/Zurich', offset: 1 }
        ],
        americas: [
          { label: '🇺🇸 纽约 (UTC-5/-4)', value: 'America/New_York', offset: -5 },
          { label: '🇺🇸 洛杉矶 (UTC-8/-7)', value: 'America/Los_Angeles', offset: -8 },
          { label: '🇺🇸 芝加哥 (UTC-6/-5)', value: 'America/Chicago', offset: -6 },
          { label: '🇺🇸 旧金山 (UTC-8/-7)', value: 'America/San_Francisco', offset: -8 },
          { label: '🇨🇦 多伦多 (UTC-5/-4)', value: 'America/Toronto', offset: -5 },
          { label: '🇨🇦 温哥华 (UTC-8/-7)', value: 'America/Vancouver', offset: -8 },
          { label: '🇧🇷 圣保罗 (UTC-3)', value: 'America/Sao_Paulo', offset: -3 },
          { label: '🇲🇽 墨西哥城 (UTC-6)', value: 'America/Mexico_City', offset: -6 },
          { label: '🇦🇷 布宜诺斯艾利斯 (UTC-3)', value: 'America/Argentina/Buenos_Aires', offset: -3 }
        ],
        oceania: [
          { label: '🇦🇺 悉尼 (UTC+10/11)', value: 'Australia/Sydney', offset: 10 },
          { label: '🇦🇺 墨尔本 (UTC+10/11)', value: 'Australia/Melbourne', offset: 10 },
          { label: '🇳🇿 奥克兰 (UTC+12/13)', value: 'Pacific/Auckland', offset: 12 },
          { label: '🇦🇺 珀斯 (UTC+8)', value: 'Australia/Perth', offset: 8 },
          { label: '🇦🇺 布里斯班 (UTC+10)', value: 'Australia/Brisbane', offset: 10 }
        ]
      }
    }
  },
  computed: {
    // 时区转换结果显示
    conversionResult() {
      if (this.cron.hour.length === 0 || this.cron.hour.length > 5) return ''
      if (this.cron.minute.length !== 1) return ''
      
      const userOffset = this.getTimezoneOffset(this.userTimezone)
      const cronOffset = this.getTimezoneOffset(this.cronTimezone)
      const offsetDiff = userOffset - cronOffset
      
      if (offsetDiff === 0) return ''
      
      const minute = this.cron.minute[0]
      const hours = [...this.cron.hour].sort((a, b) => a - b)
      
      const results = hours.map(h => {
        const userTime = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        // 转换公式：cronHour = (userHour - offsetDiff + 24) % 24
        let cronHour = (h - offsetDiff + 24) % 24
        let dayOffset = ''
        
        // 检查是否需要跨天
        const rawCronHour = h - offsetDiff
        if (rawCronHour < 0) {
          dayOffset = '（前一天）'
        } else if (rawCronHour >= 24) {
          dayOffset = '（后一天）'
        }
        
        const cronTime = `${String(cronHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        return `${this.userTimezone} ${userTime} = ${this.cronTimezone} ${cronTime}${dayOffset}`
      })
      
      return results.join('；')
    },
    
    // 下次运行时间显示（带时区对比）
    nextRunsDisplay() {
      return this.nextRuns.map(run => {
        return {
          userTime: this.formatDateTimeInTimezone(run, this.userTimezone),
          cronTime: this.formatDateTimeInTimezone(run, this.cronTimezone)
        }
      })
    }
  },
  mounted() {
    this.onCronChange()
  },
  beforeUnmount() {
    // 清理防抖定时器，避免内存泄漏
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  },
  methods: {
    // 获取时区偏移量（小时）
    getTimezoneOffset(timezone) {
      // 在所有分组中查找时区
      for (const group of Object.values(this.timezones)) {
        const tz = group.find(t => t.value === timezone)
        if (tz) return tz.offset
      }
      return 0
    },
    
    // 时区变化处理
    onTimezoneChange() {
      this.onCronChange()
    },
    
    // 将用户时区的小时转换为 Cron 时区的小时
    convertHourToCronTimezone(userHour) {
      const userOffset = this.getTimezoneOffset(this.userTimezone)
      const cronOffset = this.getTimezoneOffset(this.cronTimezone)
      const offsetDiff = userOffset - cronOffset
      
      // 转换公式：cronHour = (userHour - offsetDiff + 24) % 24
      return (userHour - offsetDiff + 24) % 24
    },
    
    // 将时间转换到指定时区
    convertToTimezone(date, timezone) {
      const userOffset = this.getTimezoneOffset(this.userTimezone)
      const targetOffset = this.getTimezoneOffset(timezone)
      const diff = targetOffset - userOffset
      
      const newDate = new Date(date.getTime() + diff * 60 * 60 * 1000)
      return newDate
    },
    
    // 格式化日期时间为指定时区
    formatDateTimeInTimezone(date, timezone) {
      const converted = this.convertToTimezone(date, timezone)
      const year = converted.getUTCFullYear()
      const month = String(converted.getUTCMonth() + 1).padStart(2, '0')
      const day = String(converted.getUTCDate()).padStart(2, '0')
      const hour = String(converted.getUTCHours()).padStart(2, '0')
      const minute = String(converted.getUTCMinutes()).padStart(2, '0')
      
      const tzAbbr = this.getTimezoneAbbr(timezone)
      return `${year}-${month}-${day} ${hour}:${minute} ${tzAbbr}`
    },
    
    // 获取时区缩写
    getTimezoneAbbr(timezone) {
      const map = {
        'UTC': 'UTC',
        'Asia/Shanghai': 'CST',
        'Asia/Hong_Kong': 'HKT',
        'Asia/Taipei': 'CST',
        'Asia/Tokyo': 'JST',
        'Asia/Seoul': 'KST',
        'Asia/Singapore': 'SGT',
        'Asia/Bangkok': 'ICT',
        'Asia/Kolkata': 'IST',
        'Asia/Dubai': 'GST',
        'Asia/Jakarta': 'WIB',
        'Asia/Kuala_Lumpur': 'MYT',
        'Asia/Manila': 'PHT',
        'Asia/Ho_Chi_Minh': 'ICT',
        'Europe/London': 'GMT/BST',
        'Europe/Paris': 'CET/CEST',
        'Europe/Berlin': 'CET/CEST',
        'Europe/Moscow': 'MSK',
        'Europe/Amsterdam': 'CET/CEST',
        'Europe/Madrid': 'CET/CEST',
        'Europe/Rome': 'CET/CEST',
        'Europe/Zurich': 'CET/CEST',
        'America/New_York': 'EST/EDT',
        'America/Los_Angeles': 'PST/PDT',
        'America/Chicago': 'CST/CDT',
        'America/San_Francisco': 'PST/PDT',
        'America/Toronto': 'EST/EDT',
        'America/Vancouver': 'PST/PDT',
        'America/Sao_Paulo': 'BRT',
        'America/Mexico_City': 'CST',
        'America/Argentina/Buenos_Aires': 'ART',
        'Australia/Sydney': 'AEST/AEDT',
        'Australia/Melbourne': 'AEST/AEDT',
        'Pacific/Auckland': 'NZST/NZDT',
        'Australia/Perth': 'AWST',
        'Australia/Brisbane': 'AEST'
      }
      return map[timezone] || timezone
    },
    
    // 生成 Cron 表达式
    generateExpression() {
      const minute = this.fieldToExpr(this.cron.minute, 0, 59)
      
      // 关键修改：将用户选择的小时转换为 Cron 时区的小时
      const cronHours = this.cron.hour.map(h => this.convertHourToCronTimezone(h))
      const hour = this.fieldToExpr(cronHours, 0, 23)
      
      const day = this.fieldToExpr(this.cron.day, 1, 31)
      const month = this.fieldToExpr(this.cron.month, 1, 12)
      const weekday = this.fieldToExpr(this.cron.weekday, 0, 6)
      
      this.cronExpression = `${minute} ${hour} ${day} ${month} ${weekday}`
      this.updateChineseDesc()
      this.updateNextRuns()
    },

    // 将选择转换为表达式
    fieldToExpr(arr, min, max) {
      if (arr.length === 0 || arr.length === (max - min + 1)) {
        return '*'
      }
      
      // 检查是否是连续的范围
      const sorted = [...arr].sort((a, b) => a - b)
      const ranges = []
      let start = sorted[0]
      let end = sorted[0]
      
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
          end = sorted[i]
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`)
          start = end = sorted[i]
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      
      return ranges.join(',')
    },

    // 解析表达式
    parseExpression() {
      try {
        const parts = this.cronExpression.trim().split(/\s+/)
        if (parts.length !== 5) {
          this.error = 'Cron 表达式需要 5 个字段'
          return
        }
        
        this.cron.minute = this.parseField(parts[0], 0, 59)
        
        // 关键修改：解析 Cron 表达式的小时后，需要转换回用户时区
        const cronHours = this.parseField(parts[1], 0, 23)
        this.cron.hour = cronHours.map(h => this.convertHourToUserTimezone(h))
        
        this.cron.day = this.parseField(parts[2], 1, 31)
        this.cron.month = this.parseField(parts[3], 1, 12)
        this.cron.weekday = this.parseField(parts[4], 0, 6)
        
        this.updateChineseDesc()
        this.updateNextRuns()
        this.error = ''
      } catch (e) {
        this.error = '解析失败：' + e.message
      }
    },

    // 将 Cron 时区的小时转换为用户时区的小时
    convertHourToUserTimezone(cronHour) {
      const userOffset = this.getTimezoneOffset(this.userTimezone)
      const cronOffset = this.getTimezoneOffset(this.cronTimezone)
      const offsetDiff = userOffset - cronOffset
      
      // 反向转换公式：userHour = (cronHour + offsetDiff + 24) % 24
      return (cronHour + offsetDiff + 24) % 24
    },

    // 解析单个字段
    parseField(expr, min, max) {
      if (expr === '*') {
        return []
      }
      
      const result = []
      const parts = expr.split(',')
      
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          for (let i = start; i <= end; i++) {
            if (i >= min && i <= max) result.push(i)
          }
        } else if (part.includes('/')) {
          const [range, step] = part.split('/')
          const stepNum = parseInt(step)
          const start = range === '*' ? min : parseInt(range)
          for (let i = start; i <= max; i += stepNum) {
            result.push(i)
          }
        } else {
          const num = parseInt(part)
          if (num >= min && num <= max) result.push(num)
        }
      }
      
      return [...new Set(result)].sort((a, b) => a - b)
    },

    // 更新中文描述
    updateChineseDesc() {
      this.chineseDesc = this.cronToChinese(this.cronExpression)
    },

    // Cron 转中文
    cronToChinese(expr) {
      const parts = expr.split(' ')
      const minute = parts[0]
      const hour = parts[1]
      const day = parts[2]
      const month = parts[3]
      const weekday = parts[4]
      
      // 扩展的常用模板库（50+）
      const templates = {
        // 每分钟/小时/每天
        '* * * * *': '每分钟',
        '0 * * * *': '每小时整点',
        '0 0 * * *': '每天零点',
        '0 3 * * *': '每天凌晨 3 点',
        '0 6 * * *': '每天早上 6 点',
        '0 9 * * *': '每天早上 9 点',
        '0 12 * * *': '每天中午 12 点',
        '0 14 * * *': '每天下午 2 点',
        '0 15 * * *': '每天下午 3 点',
        '0 18 * * *': '每天傍晚 6 点',
        '0 21 * * *': '每天晚上 9 点',
        '0 22 * * *': '每天晚上 10 点',
        '0 23 * * *': '每天晚上 11 点',
        
        // 每周
        '0 0 * * 0': '每周日凌晨',
        '0 0 * * 1': '每周一凌晨',
        '0 0 * * 6': '每周六凌晨',
        '0 9 * * 1': '每周一早上 9 点',
        '0 9 * * 1-5': '工作日早上 9 点',
        '0 9 * * 6,0': '周末早上 9 点',
        '0 18 * * 1-5': '工作日下午 6 点',
        
        // 每月
        '0 0 1 * *': '每月 1 号凌晨',
        '0 0 15 * *': '每月 15 号凌晨',
        '0 9 1 * *': '每月 1 号早上 9 点',
        '0 0 L * *': '每月最后一天',
        
        // 间隔 - 分钟
        '*/1 * * * *': '每分钟',
        '*/2 * * * *': '每 2 分钟',
        '*/5 * * * *': '每 5 分钟',
        '*/10 * * * *': '每 10 分钟',
        '*/15 * * * *': '每 15 分钟',
        '*/30 * * * *': '每 30 分钟',
        
        // 间隔 - 小时
        '0 */2 * * *': '每 2 小时整点',
        '0 */3 * * *': '每 3 小时整点',
        '0 */4 * * *': '每 4 小时整点',
        '0 */6 * * *': '每 6 小时整点',
        '0 */8 * * *': '每 8 小时整点',
        '0 */12 * * *': '每 12 小时整点',
        
        // 组合常用
        '0 0 * * 0-6': '每天零点',
        '0 2 * * *': '每天凌晨 2 点',
        '0 4 * * *': '每天凌晨 4 点',
        '0 5 * * *': '每天早上 5 点',
        '0 7 * * *': '每天早上 7 点',
        '0 8 * * *': '每天早上 8 点',
        '0 10 * * *': '每天上午 10 点',
        '0 11 * * *': '每天上午 11 点',
        '0 13 * * *': '每天下午 1 点',
        '0 16 * * *': '每天下午 4 点',
        '0 17 * * *': '每天下午 5 点',
        '0 19 * * *': '每天傍晚 7 点',
        '0 20 * * *': '每天晚上 8 点',
      }
      
      if (templates[expr]) {
        return templates[expr]
      }
      
      // 解析各字段
      const minuteParsed = this.parseCronField(minute, 0, 59)
      const hourParsed = this.parseCronField(hour, 0, 23)
      const dayParsed = this.parseCronField(day, 1, 31)
      const monthParsed = this.parseCronField(month, 1, 12)
      const weekdayParsed = this.parseCronField(weekday, 0, 6)
      
      // 构建自然语言描述
      let desc = this.buildCronDesc(minuteParsed, hourParsed, dayParsed, monthParsed, weekdayParsed)
      
      return desc
    },

    // 解析 Cron 字段
    parseCronField(expr, min, max) {
      if (expr === '*') {
        return { type: 'all', values: [] }
      }
      
      if (expr.includes('/')) {
        const [range, step] = expr.split('/')
        const stepNum = parseInt(step)
        const start = range === '*' ? min : parseInt(range)
        return { type: 'step', start, step: stepNum, expr }
      }
      
      const values = []
      const parts = expr.split(',')
      
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          for (let i = start; i <= end; i++) {
            if (i >= min && i <= max) values.push(i)
          }
        } else {
          const num = parseInt(part)
          if (num >= min && num <= max) values.push(num)
        }
      }
      
      if (values.length === 1) {
        return { type: 'single', value: values[0], values }
      }
      
      // 检查是否是连续范围
      const sorted = [...values].sort((a, b) => a - b)
      const isContinuous = sorted.length > 1 && 
        sorted.every((v, i) => i === 0 || v === sorted[i-1] + 1)
      
      if (isContinuous) {
        return { type: 'range', start: sorted[0], end: sorted[sorted.length - 1], values: sorted }
      }
      
      return { type: 'list', values: sorted }
    },

    // 获取小时的人性化描述
    getHourDesc(hour) {
      const h = parseInt(hour)
      if (h === 0) return '零点'
      if (h >= 1 && h <= 5) return `凌晨 ${h} 点`
      if (h >= 6 && h <= 8) return `早上 ${h} 点`
      if (h >= 9 && h <= 11) return `上午 ${h} 点`
      if (h === 12) return '中午 12 点'
      if (h >= 13 && h <= 17) return `下午 ${h-12} 点`
      if (h >= 18 && h <= 20) return `傍晚 ${h-12} 点`
      if (h >= 21 && h <= 23) return `晚上 ${h-12} 点`
      return `${h} 点`
    },

    // 获取星期的人性化描述
    getWeekdayDesc(weekday) {
      const dayNames = ['日', '一', '二', '三', '四', '五', '六']
      return dayNames[weekday] || weekday
    },

    // 获取月份的人性化描述
    getMonthDesc(month) {
      return `${month} 月`
    },

    // 构建 Cron 描述
    buildCronDesc(minute, hour, day, month, weekday) {
      const parts = []
      
      // 处理分钟间隔（最高优先级）
      if (minute.type === 'step') {
        if (minute.step === 1) {
          parts.push('每分钟')
        } else {
          parts.push(`每 ${minute.step} 分钟`)
        }
        
        // 如果有小时限制
        if (hour.type !== 'all') {
          if (hour.type === 'single') {
            parts.push(`的 ${this.getHourDesc(hour.value)}`)
          } else if (hour.type === 'range') {
            parts.push(`的 ${hour.start} 点到 ${hour.end} 点`)
          } else if (hour.type === 'list') {
            const hourDescs = hour.values.map(h => this.getHourDesc(h).replace(/.*\s/, ''))
            parts.push(`的 ${hourDescs.join('、')}`)
          }
        }
        
        // 添加其他限制
        if (day.type !== 'all') {
          if (day.type === 'single') {
            parts.push(`${day.value} 号`)
          } else if (day.type === 'range') {
            parts.push(`${day.start} 号到 ${day.end} 号`)
          } else if (day.type === 'list') {
            parts.push(`${day.values.join('、')} 号`)
          }
        }
        
        if (month.type !== 'all') {
          if (month.type === 'single') {
            parts.push(`${this.getMonthDesc(month.value)}`)
          } else {
            parts.push(`${month.values.map(m => this.getMonthDesc(m)).join('、')}`)
          }
        }
        
        if (weekday.type !== 'all') {
          if (weekday.type === 'single') {
            parts.push(`每周${this.getWeekdayDesc(weekday.value)}`)
          } else if (weekday.type === 'range') {
            if (weekday.start === 1 && weekday.end === 5) {
              parts.push('工作日')
            } else if (weekday.start === 0 && weekday.end === 6) {
              parts.push('每天')
            } else {
              parts.push(`每周${this.getWeekdayDesc(weekday.start)}到${this.getWeekdayDesc(weekday.end)}`)
            }
          } else if (weekday.type === 'list') {
            const isWorkday = weekday.values.length === 5 && 
              weekday.values.every((v, i) => v === i + 1)
            if (isWorkday) {
              parts.push('工作日')
            } else {
              const dayNames = weekday.values.map(d => this.getWeekdayDesc(d))
              parts.push(`每周${dayNames.join('、')}`)
            }
          }
        }
        
        return parts.join('')
      }
      
      // 处理小时间隔
      if (hour.type === 'step') {
        parts.push(`每 ${hour.step} 小时整点`)
        
        if (day.type !== 'all') {
          if (day.type === 'single') {
            parts.push(`${day.value} 号`)
          } else if (day.type === 'range') {
            parts.push(`${day.start} 号到 ${day.end} 号`)
          } else if (day.type === 'list') {
            parts.push(`${day.values.join('、')} 号`)
          }
        }
        
        if (month.type !== 'all') {
          parts.push(`${month.values.map(m => this.getMonthDesc(m)).join('、')}`)
        }
        
        if (weekday.type !== 'all') {
          if (weekday.type === 'single') {
            parts.push(`每周${this.getWeekdayDesc(weekday.value)}`)
          } else if (weekday.type === 'range') {
            if (weekday.start === 1 && weekday.end === 5) {
              parts.push('工作日')
            } else {
              parts.push(`每周${this.getWeekdayDesc(weekday.start)}到${this.getWeekdayDesc(weekday.end)}`)
            }
          } else if (weekday.type === 'list') {
            const dayNames = weekday.values.map(d => this.getWeekdayDesc(d))
            parts.push(`每周${dayNames.join('、')}`)
          }
        }
        
        return parts.join('')
      }
      
      // 标准格式：每天 XX 点 XX 分
      if (day.type === 'all' && month.type === 'all' && weekday.type === 'all') {
        if (minute.type === 'all' && hour.type === 'all') {
          return '每分钟'
        }
        
        if (minute.type === 'single' && hour.type === 'single') {
          if (minute.value === 0) {
            return `每天${this.getHourDesc(hour.value)}整点`
          }
          return `每天${this.getHourDesc(hour.value)}${minute.value} 分`
        }
        
        if (minute.type === 'single' && hour.type === 'all') {
          if (minute.value === 0) {
            return '每小时整点'
          }
          return `每小时 ${minute.value} 分`
        }
        
        if (minute.type === 'all' && hour.type === 'single') {
          return `每天${this.getHourDesc(hour.value)}的每分钟`
        }
      }
      
      // 复杂组合描述
      let timeDesc = ''
      
      // 构建时间部分
      if (minute.type === 'single' && hour.type === 'single') {
        if (minute.value === 0) {
          timeDesc = this.getHourDesc(hour.value)
        } else {
          timeDesc = `${this.getHourDesc(hour.value)}${minute.value} 分`
        }
      } else if (minute.type === 'single') {
        if (minute.value === 0) {
          timeDesc = '整点'
        } else {
          timeDesc = `${minute.value} 分`
        }
        
        if (hour.type === 'range') {
          timeDesc = `${hour.start} 点到 ${hour.end} 点的${timeDesc}`
        } else if (hour.type === 'list') {
          const hourDescs = hour.values.map(h => this.getHourDesc(h).replace(/.*\s/, ''))
          timeDesc = `${hourDescs.join('、')}${timeDesc}`
        }
      } else {
        timeDesc = `${minute.values.join('、')} 分`
        if (hour.type === 'single') {
          timeDesc = `${this.getHourDesc(hour.value)}的 ${timeDesc}`
        }
      }
      
      // 构建日期/星期部分
      // 分别处理月份和星期，然后组合
      let monthDesc = ''
      let weekdayDesc = ''
      
      // 处理月份部分
      if (month.type !== 'all') {
        if (month.type === 'single') {
          monthDesc = `每年 ${this.getMonthDesc(month.value)}`
        } else {
          monthDesc = `每年 ${month.values.map(m => this.getMonthDesc(m)).join('、')}`
        }
      }
      
      // 处理星期部分
      if (weekday.type !== 'all') {
        if (weekday.type === 'single') {
          weekdayDesc = `每周${this.getWeekdayDesc(weekday.value)}`
        } else if (weekday.type === 'range') {
          if (weekday.start === 1 && weekday.end === 5) {
            weekdayDesc = '工作日'
          } else if (weekday.start === 0 && weekday.end === 6) {
            weekdayDesc = '每天'
          } else {
            weekdayDesc = `每周${this.getWeekdayDesc(weekday.start)}到${this.getWeekdayDesc(weekday.end)}`
          }
        } else if (weekday.type === 'list') {
          const isWorkday = weekday.values.length === 5 && 
            weekday.values.every((v, i) => v === i + 1)
          if (isWorkday) {
            weekdayDesc = '工作日'
          } else {
            const isWeekend = weekday.values.length === 2 && 
              weekday.values.includes(0) && weekday.values.includes(6)
            if (isWeekend) {
              weekdayDesc = '周末'
            } else {
              const dayNames = weekday.values.map(d => this.getWeekdayDesc(d))
              weekdayDesc = `每周${dayNames.join('、')}`
            }
          }
        }
      }
      
      // 组合日期描述
      let dateDesc = ''
      
      // 检测日期和星期同时存在（Cron 的 OR 逻辑）
      if (day.type !== 'all' && weekday.type !== 'all') {
        // OR 逻辑：日期 或 星期
        // 注意：月份同时应用于日期和星期！
        // 
        // Cron 逻辑：执行 = 月份匹配 AND (日期匹配 OR 星期匹配)
        // 例如 "0 3 29 10 3" 表示：10月份的(29号 OR 周三)凌晨3点
        
        if (monthDesc) {
          // 有月份限制：月份同时应用于日期和星期
          // 简洁表达："每年 10 月的每周三和 29 号"
          let dayPart = ''
          if (day.type === 'single') {
            dayPart = `${day.value} 号`
          } else if (day.type === 'range') {
            dayPart = `${day.start} 号到 ${day.end} 号`
          } else if (day.type === 'list') {
            dayPart = `${day.values.join('、')} 号`
          }
          
          dateDesc = `${monthDesc}的${weekdayDesc}和${dayPart}`
        } else {
          // 没有月份限制：使用"以及"表达 OR 关系
          let dayPart = ''
          if (day.type === 'single') {
            dayPart = `每月${day.value}号`
          } else if (day.type === 'range') {
            dayPart = `每月${day.start}号到${day.end}号`
          } else if (day.type === 'list') {
            dayPart = `每月${day.values.join('、')}号`
          }
          
          dateDesc = `${weekdayDesc}，以及${dayPart}`
        }
      } else if (monthDesc && weekdayDesc) {
        // 月份 + 星期同时存在
        dateDesc = `${monthDesc}，${weekdayDesc}`
      } else if (weekdayDesc) {
        // 只有星期
        dateDesc = weekdayDesc
      } else if (day.type !== 'all') {
        // 处理日期（月份已在上面处理或没有月份）
        if (monthDesc) {
          // 月份 + 日期
          if (day.type === 'single') {
            dateDesc = `${monthDesc}${day.value} 号`
          } else if (day.type === 'range') {
            dateDesc = `${monthDesc}${day.start} 号到 ${day.end} 号`
          } else if (day.type === 'list') {
            dateDesc = `${monthDesc}${day.values.join('、')} 号`
          }
        } else {
          // 只有日期，没有月份
          if (day.type === 'single') {
            dateDesc = `每月 ${day.value} 号`
          } else if (day.type === 'range') {
            dateDesc = `每月 ${day.start} 号到 ${day.end} 号`
          } else if (day.type === 'list') {
            dateDesc = `每月 ${day.values.join('、')} 号`
          }
        }
      } else if (monthDesc) {
        // 只有月份，没有星期和日期
        dateDesc = `${monthDesc}，每天`
      } else {
        dateDesc = '每天'
      }
      
      return `${dateDesc}${timeDesc}`
    },

    // 更新下次运行时间
    updateNextRuns() {
      this.nextRuns = this.getNextRuns(this.cronExpression, 5)
    },

    // 获取下次运行时间
    getNextRuns(expr, count) {
      const runs = []
      let date = new Date()
      date.setMinutes(date.getMinutes() + 1)
      date.setSeconds(0)
      date.setMilliseconds(0)

      const maxIterations = 366 * 24 * 60
      let iterations = 0

      while (runs.length < count && iterations < maxIterations) {
        // 将日期转换为 Cron 时区时间进行匹配
        const cronTime = this.convertDateToTimezone(date, this.cronTimezone)

        if (this.matchesCron(cronTime, expr)) {
          runs.push(new Date(date))  // 存储原始时间（用于显示）
        }
        date.setMinutes(date.getMinutes() + 1)
        iterations++
      }

      return runs
    },

    // 辅助方法：将日期转换为目标时区的时间
    convertDateToTimezone(date, timezone) {
      const offset = this.getTimezoneOffset(timezone)
      const utcTime = date.getTime() + date.getTimezoneOffset() * 60000
      return new Date(utcTime + offset * 3600000)
    },

    // 检查日期是否匹配 Cron
    matchesCron(date, expr) {
      const parts = expr.split(' ')
      const minute = date.getMinutes()
      const hour = date.getHours()
      const day = date.getDate()
      const month = date.getMonth() + 1
      const weekday = date.getDay()
      
      return this.fieldMatches(parts[0], minute, 0, 59) &&
             this.fieldMatches(parts[1], hour, 0, 23) &&
             this.fieldMatches(parts[2], day, 1, 31) &&
             this.fieldMatches(parts[3], month, 1, 12) &&
             this.fieldMatches(parts[4], weekday, 0, 6)
    },

    // 检查字段是否匹配
    fieldMatches(expr, value, min, max) {
      if (expr === '*') return true
      
      const parts = expr.split(',')
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          if (value >= start && value <= end) return true
        } else if (part.includes('/')) {
          const [range, step] = part.split('/')
          const stepNum = parseInt(step)
          const start = range === '*' ? min : parseInt(range)
          if ((value - start) % stepNum === 0 && value >= start) return true
        } else {
          if (parseInt(part) === value) return true
        }
      }
      return false
    },

    // 全选
    selectAll(field) {
      const ranges = {
        minute: Array.from({length: 60}, (_, i) => i),
        hour: Array.from({length: 24}, (_, i) => i),
        day: Array.from({length: 31}, (_, i) => i + 1),
        month: Array.from({length: 12}, (_, i) => i + 1),
        weekday: Array.from({length: 7}, (_, i) => i)
      }
      this.cron[field] = ranges[field]
      this.onCronChange()
    },

    // 清空
    clearAll(field) {
      this.cron[field] = []
      this.onCronChange()
    },

    // Cron 变化处理（带防抖）
    onCronChange() {
      // 清除之前的定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      // 延迟 300ms 执行，避免频繁计算
      this.debounceTimer = setTimeout(() => {
        this.generateExpression()
        this.debounceTimer = null
      }, 300)
    },

    // 应用模板
    applyTemplate(tpl) {
      this.cronExpression = tpl.expr
      this.parseExpression()
    },

    // 检查是否是活动模板
    isActiveTemplate(tpl) {
      return this.cronExpression === tpl.expr
    },

    // 复制 Cron
    async copyCron() {
      if (await copyText(this.cronExpression)) {
        this.showSuccess('Cron 表达式已复制')
      }
    },

    // 显示成功消息
    showSuccess(msg) {
      this.success = msg
      setTimeout(() => {
        this.success = ''
      }, 3000)
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

/* 模板按钮组 */
.template-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
}

.template-btn {
  padding: 6px 12px;
  font-family: var(--mono);
  font-size: 13px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.template-btn.active {
  background: var(--green);
  border-color: var(--green);
  color: #000;
}

/* 时区设置区域 */
.timezone-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
}

.timezone-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.timezone-select-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timezone-label {
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 13px;
  white-space: nowrap;
}

.timezone-select {
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 13px;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  min-width: 140px;
}

.timezone-select:focus {
  outline: none;
  border-color: var(--green);
}

/* 时区提示 */
.timezone-hint {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(0,255,0,0.05);
  border: 1px solid var(--green);
  border-radius: 0;
}

.hint-text {
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
}

.hint-text strong {
  color: var(--green);
}

/* 转换结果显示 */
.conversion-result {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.conversion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.conversion-label {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  flex-shrink: 0;
}

.conversion-value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
}

/* Cron 选择区 */
.cron-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 10px;
  font-family: var(--mono);
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

/* 复选框网格 */
.checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-family: var(--mono);
  font-size: 13px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.checkbox-label.small {
  font-size: 12px;
  padding: 3px 6px;
}

.checkbox-label:hover {
  border-color: var(--green);
}

.checkbox-label.checked {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.checkbox-label input {
  display: none;
}

/* 星期网格 */
.weekday-grid {
  gap: 8px;
}

.weekday-grid .checkbox-label {
  padding: 6px 16px;
}

/* 手动输入区 */
.manual-input {
  margin: 1.5rem 0;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.input-row .code-input {
  flex: 1;
}

.input-row textarea.code-input {
  resize: vertical;
  min-height: 120px;
}

.copy-btn-inline {
  padding: 8px 12px;
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

/* 结果显示区 */
.result-section {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  padding: 1rem;
  margin: 1rem 0;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.value-row .label {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  flex-shrink: 0;
}

.value-row .value {
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* 中文描述特殊处理 - 允许换行 */
.value-row .chinese-desc {
  white-space: normal;
  word-break: break-all;
}

/* 下次运行时间 */
.next-runs {
  margin: 1.5rem 0;
}

.runs-list {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  padding: 1rem;
}

.run-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-family: var(--mono);
  font-size: 14px;
  align-items: center;
}

.run-number {
  color: var(--green);
  min-width: 24px;
}

.run-time {
  color: var(--text);
}

.run-time-cron {
  color: var(--text-dim);
  font-size: 13px;
}

/* 响应式 */
@media (max-width: 640px) {
  .template-group {
    gap: 6px;
  }
  
  .template-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .timezone-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .timezone-select-group {
    width: 100%;
  }
  
  .timezone-select {
    flex: 1;
  }
  
  .timezone-hint {
    padding: 0.75rem;
  }
  
  .hint-text {
    font-size: 12px;
    line-height: 1.4;
  }
  
  .conversion-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .checkbox-label {
    font-size: 12px;
    padding: 3px 6px;
  }
  
  .checkbox-label.small {
    font-size: 11px;
    padding: 2px 4px;
  }
  
  .weekday-grid .checkbox-label {
    padding: 5px 12px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .input-row {
    flex-direction: column;
  }
  
  .copy-btn-inline {
    width: 100%;
    padding: 10px;
  }
  
  .run-item {
    flex-direction: column;
    gap: 2px;
    padding: 8px 0;
  }
}

@media (max-width: 375px) {
  .checkbox-grid {
    gap: 3px;
  }
  
  .checkbox-label.small {
    font-size: 10px;
    padding: 2px 3px;
  }
}
</style>
