<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🃏 Mock 数据生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左侧：配置面板 -->
          <div class="tool-col">
            <label class="tool-label">数据类型：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.name" />
                <span>姓名</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.phone" />
                <span>手机号</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.email" />
                <span>邮箱</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.idCard" />
                <span>身份证号</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.address" />
                <span>地址</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.company" />
                <span>公司名</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.url" />
                <span>网址</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="types.date" />
                <span>日期</span>
              </label>
            </div>

            <label class="tool-label">生成数量：{{ count }} 条</label>
            <input type="range" v-model.number="count" min="1" max="100" class="range-input" />
            <div class="length-display"><span>{{ count }}</span></div>

            <label class="tool-label">导出格式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="exportFormat" value="json" />
                <span>JSON</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="exportFormat" value="csv" />
                <span>CSV</span>
              </label>
            </div>
          </div>

          <!-- 右侧：输出区 -->
          <div class="tool-col">
            <label class="tool-label">生成结果：</label>
            <textarea
              class="code-input output"
              :value="outputText"
              readonly
              rows="16"
              placeholder="点击「生成」按钮生成 Mock 数据..."
            ></textarea>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="generate" :disabled="!hasSelection">
            🎲 生成
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!outputText">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button" @click="exportData('json')" :disabled="!data.length">
            ⬇ 导出 JSON
          </button>
          <button class="tool-button" @click="exportData('csv')" :disabled="!data.length">
            ⬇ 导出 CSV
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- 数据表格 -->
        <div v-if="data.length" class="mock-table-wrapper">
          <table class="mock-table">
            <thead>
              <tr>
                <th v-for="col in activeColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in data" :key="ri">
                <td v-for="col in activeColumns" :key="col">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
const SURNAMES = [
  '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨',
  '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜',
  '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎',
  '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐',
  '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
  '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄',
  '和', '穆', '萧', '尹', '姚', '邵', '湛', '汪', '祁', '毛', '禹', '狄', '米', '贝', '明', '臧',
  '计', '伏', '成', '戴', '谈', '宋', '茅', '庞', '熊', '纪', '舒', '屈', '项', '祝', '董', '梁'
]

const GIVEN_NAMES = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '艳', '杰', '娟', '涛',
  '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '飞', '玉兰', '桂花', '斌', '玲',
  '建国', '建军', '志强', '志明', '秀珍', '小红', '小丽', '小芳', '宇轩', '子涵', '梓涵', '一诺',
  '欣怡', '诗涵', '浩宇', '浩然', '子墨', '雨泽', '俊杰', '皓轩', '梓萱', '子轩'
]

const PROVINCES = [
  '北京市', '上海市', '天津市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省'
]

const CITIES = [
  '石家庄市', '太原市', '沈阳市', '长春市', '哈尔滨市', '南京市', '杭州市', '合肥市', '福州市',
  '南昌市', '济南市', '郑州市', '武汉市', '长沙市', '广州市', '成都市', '贵阳市', '昆明市',
  '西安市', '兰州市', '西宁市', '南宁市', '呼和浩特市', '银川市', '乌鲁木齐市'
]

const STREETS = [
  '中山路', '人民路', '建设路', '解放路', '文化路', '和平路', '光明路', '长安街', '南京路',
  '朝阳路', '青年路', '胜利路', '花园路', '东风路', '长江路', '黄河路', '北京路', '上海路'
]

const COMPANIES = [
  '华为技术有限公司', '阿里巴巴集团', '腾讯科技有限公司', '百度在线网络技术',
  '京东集团股份有限公司', '字节跳动科技有限公司', '美团科技有限公司', '小米科技有限公司',
  '网易集团', '联想集团有限公司', '中科曙光信息产业', '浪潮电子信息产业',
  '中兴通讯股份有限公司', '海康威视数字技术', '大疆创新科技有限公司', '比亚迪股份有限公司',
  '蔚来汽车有限公司', '理想汽车有限公司', '商汤科技开发有限公司', '科大讯飞股份有限公司'
]

const DOMAINS = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'sohu.com', 'aliyun.com', 'foxmail.com', 'proton.me', 'icloud.com']

export default {
  name: 'MockDataTool',
  data() {
    return {
      types: {
        name: true,
        phone: true,
        email: true,
        idCard: false,
        address: false,
        company: false,
        url: false,
        date: false
      },
      count: 10,
      exportFormat: 'json',
      data: [],
      error: '',
      success: ''
    }
  },
  computed: {
    hasSelection() {
      return Object.values(this.types).some(v => v)
    },
    activeColumns() {
      const cols = []
      if (this.types.name) cols.push('姓名')
      if (this.types.phone) cols.push('手机号')
      if (this.types.email) cols.push('邮箱')
      if (this.types.idCard) cols.push('身份证号')
      if (this.types.address) cols.push('地址')
      if (this.types.company) cols.push('公司名')
      if (this.types.url) cols.push('网址')
      if (this.types.date) cols.push('日期')
      return cols
    },
    outputText() {
      if (!this.data.length) return ''
      if (this.exportFormat === 'json') {
        return JSON.stringify(this.data, null, 2)
      }
      // CSV format
      const cols = this.activeColumns
      const header = cols.join(',')
      const rows = this.data.map(row => cols.map(c => {
        const val = row[c] || ''
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
      }).join(','))
      return [header, ...rows].join('\n')
    }
  },
  methods: {
    rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    pick(arr) {
      return arr[this.rand(0, arr.length - 1)]
    },
    genName() {
      return this.pick(SURNAMES) + this.pick(GIVEN_NAMES)
    },
    genPhone() {
      const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
        '150', '151', '152', '153', '155', '156', '157', '158', '159',
        '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
      return this.pick(prefixes) + String(this.rand(10000000, 99999999))
    },
    genEmail() {
      const firstName = this.pick(GIVEN_NAMES)
      const prefix = firstName.toLowerCase().replace(/\s/g, '') + this.rand(100, 9999)
      return prefix + '@' + this.pick(DOMAINS)
    },
    genIdCard() {
      // Generate plausible 18-digit ID
      const areaCodes = ['110101', '310101', '440103', '510104', '320102', '330103', '420103', '610103']
      const area = this.pick(areaCodes)
      const year = this.rand(1970, 2005)
      const month = String(this.rand(1, 12)).padStart(2, '0')
      const day = String(this.rand(1, 28)).padStart(2, '0')
      const seq = String(this.rand(0, 999)).padStart(3, '0')
      const id17 = `${area}${year}${month}${day}${seq}`
      // Simple checksum (not fully accurate but plausible)
      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
      const checkCodes = '10X98765432'
      let sum = 0
      for (let i = 0; i < 17; i++) sum += parseInt(id17[i]) * weights[i]
      return id17 + checkCodes[sum % 11]
    },
    genAddress() {
      const province = this.pick(PROVINCES)
      const city = this.pick(CITIES)
      const street = this.pick(STREETS)
      const num = this.rand(1, 500)
      return `${province}${city}${street}${num}号`
    },
    genCompany() {
      return this.pick(COMPANIES)
    },
    genUrl() {
      const protocols = ['https', 'https', 'https']
      const words = ['api', 'www', 'm', 'blog', 'docs', 'admin', 'dev', 'app']
      const tlds = ['.com', '.cn', '.io', '.org', '.net']
      return `${this.pick(protocols)}://${this.pick(words)}.example${this.pick(tlds)}`
    },
    genDate() {
      const y = this.rand(2020, 2026)
      const m = String(this.rand(1, 12)).padStart(2, '0')
      const d = String(this.rand(1, 28)).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    generate() {
      this.error = ''
      this.success = ''
      if (!this.hasSelection) {
        this.error = '请至少选择一种数据类型'
        return
      }
      this.data = []
      for (let i = 0; i < this.count; i++) {
        const row = {}
        const cols = this.activeColumns
        if (this.types.name) row['姓名'] = this.genName()
        if (this.types.phone) row['手机号'] = this.genPhone()
        if (this.types.email) row['邮箱'] = this.genEmail()
        if (this.types.idCard) row['身份证号'] = this.genIdCard()
        if (this.types.address) row['地址'] = this.genAddress()
        if (this.types.company) row['公司名'] = this.genCompany()
        if (this.types.url) row['网址'] = this.genUrl()
        if (this.types.date) row['日期'] = this.genDate()
        this.data.push(row)
      }
      this.success = `已生成 ${this.count} 条 Mock 数据`
    },
    clear() {
      this.data = []
      this.error = ''
      this.success = ''
    },
    async copyOutput() {
      try {
        await navigator.clipboard.writeText(this.outputText)
        this.success = '已复制到剪贴板'
        setTimeout(() => { if (this.success === '已复制到剪贴板') this.success = '' }, 2000)
      } catch {
        this.error = '复制失败，请手动复制'
      }
    },
    exportData(format) {
      if (!this.data.length) return
      let content, filename, mime
      if (format === 'json') {
        content = JSON.stringify(this.data, null, 2)
        filename = `mock-data-${Date.now()}.json`
        mime = 'application/json'
      } else {
        const cols = this.activeColumns
        const header = cols.join(',')
        const rows = this.data.map(row => cols.map(c => {
          const val = row[c] || ''
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
        }).join(','))
        content = '\uFEFF' + [header, ...rows].join('\n') // BOM for Excel
        filename = `mock-data-${Date.now()}.csv`
        mime = 'text/csv;charset=utf-8'
      }
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      this.success = `已导出 ${filename}`
      setTimeout(() => { if (this.success === `已导出 ${filename}`) this.success = '' }, 3000)
    }
  }
}
</script>

<style scoped>
.mock-table-wrapper {
  margin-top: 16px;
  overflow-x: auto;
  border: 1px solid var(--line);
}

.mock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: inherit;
}

.mock-table th,
.mock-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.mock-table th {
  background: var(--panel-2);
  color: var(--green);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  position: sticky;
  top: 0;
}

.mock-table td {
  color: var(--text);
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
}

.mock-table tr:hover td {
  background: var(--green-soft);
}

@media (max-width: 640px) {
  .mock-table th,
  .mock-table td {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>
