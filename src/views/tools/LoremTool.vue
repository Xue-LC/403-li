<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📝 Lorem Ipsum 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">参数设置：</label>

            <label class="tool-label">语言：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="lang" value="en" />
                <span>英文 (Lorem Ipsum)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="lang" value="zh" />
                <span>中文 (乱数假文)</span>
              </label>
            </div>

            <label class="tool-label">段落数：{{ paragraphs }}</label>
            <input type="range" v-model.number="paragraphs" min="1" max="20" class="range-input" />
            <div class="length-display"><span>{{ paragraphs }}</span></div>

            <label class="tool-label">每段句子数：{{ sentencesPerPara }}</label>
            <input type="range" v-model.number="sentencesPerPara" min="2" max="20" class="range-input" />
            <div class="length-display"><span>{{ sentencesPerPara }}</span></div>

            <label class="tool-label">开头文字：</label>
            <input
              class="code-input-sm"
              v-model="startText"
              :placeholder="lang === 'en' ? 'Lorem ipsum dolor sit amet' : '夫天地者万物之逆旅也'"
            />
          </div>

          <!-- 右侧：输出 -->
          <div class="tool-col">
            <label class="tool-label">生成结果：</label>
            <textarea
              v-model="output"
              readonly
              rows="16"
              class="code-input output"
              placeholder="点击「生成」按钮生成占位文本..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="generate">⚡ 生成</button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">📋 复制</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const lang = ref('en')
const paragraphs = ref(3)
const sentencesPerPara = ref(5)
const startText = ref('')
const output = ref('')
const error = ref('')
const success = ref(false)

// 英文 Lorem Ipsum 词库
const enWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
  'est', 'laborum', 'pellentesque', 'habitant', 'morbi', 'tristique', 'senectus',
  'netus', 'malesuada', 'fames', 'turpis', 'egestas', 'maecenas', 'accumsan',
  'lacus', 'vel', 'facilisis', 'volutpat', 'est', 'velit', 'egestas', 'dui',
  'id', 'ornare', 'arcu', 'odio', 'ut', 'sem', 'nulla', 'pharetra', 'diam',
  'sit', 'amet', 'nisl', 'suscipit', 'adipiscing', 'bibendum', 'est', 'ultricies',
  'integer', 'quis', 'auctor', 'elit', 'sed', 'vulputate', 'mi', 'sit', 'amet',
  'mauris', 'commodo', 'quis', 'imperdiet', 'massa', 'tincidunt', 'nunc',
  'pulvinar', 'sapien', 'et', 'ligula', 'ullamcorper', 'malesuada', 'proin',
  'libero', 'nunc', 'consequat', 'interdum', 'varius', 'sit', 'amet', 'mattis',
  'vulputate', 'enim', 'nulla', 'aliquet', 'porttitor', 'lacus', 'luctus',
  'accumsan', 'tortor', 'posuere', 'ac', 'ut', 'consequat', 'semper', 'viverra',
  'nam', 'libero', 'justo', 'laoreet', 'sit', 'amet', 'cursus', 'sit', 'amet',
  'dictum', 'sit', 'amet', 'justo', 'donec', 'enim', 'diam', 'vulputate', 'ut',
  'pharetra', 'sit', 'amet', 'aliquam', 'id', 'diam', 'maecenas', 'ultricies',
  'mi', 'eget', 'mauris', 'pharetra', 'et', 'ultrices', 'neque', 'ornare',
  'aenean', 'euismod', 'elementum', 'nisi', 'quis', 'eleifend', 'quam',
  'adipiscing', 'vitae', 'proin', 'sagittis', 'nisl', 'rhoncus', 'mattis',
  'rhoncus', 'urna', 'neque', 'viverra', 'justo', 'nec', 'ultrices', 'dui',
  'sapien', 'eget', 'mi', 'proin', 'sed', 'libero', 'enim', 'sed', 'faucibus',
  'turpis', 'in', 'eu', 'mi', 'bibendum', 'neque', 'egestas', 'congue',
  'quisque', 'egestas', 'diam', 'in', 'arcu', 'cursus', 'euismod', 'quis',
  'viverra', 'nibh', 'cras', 'pulvinar', 'mattis', 'nunc', 'sed', 'blandit',
  'libero', 'volutpat', 'sed', 'cras', 'ornare', 'arcu', 'dui', 'vivamus'
]

// 中文乱数假文字库（常用汉字）
const zhPool = [
  '天', '地', '玄', '黄', '宇', '宙', '洪', '荒', '日', '月', '盈', '昃',
  '辰', '宿', '列', '张', '寒', '来', '暑', '往', '秋', '收', '冬', '藏',
  '云', '腾', '致', '雨', '露', '结', '为', '霜', '金', '生', '丽', '水',
  '玉', '出', '昆', '冈', '剑', '号', '巨', '阙', '珠', '称', '夜', '光',
  '果', '珍', '李', '柰', '菜', '重', '芥', '姜', '海', '咸', '河', '淡',
  '鳞', '潜', '羽', '翔', '龙', '师', '火', '帝', '鸟', '官', '人', '皇',
  '始', '制', '文', '字', '乃', '服', '衣', '裳', '推', '位', '让', '国',
  '有', '虞', '陶', '唐', '吊', '民', '伐', '罪', '周', '发', '殷', '汤',
  '坐', '朝', '问', '道', '垂', '拱', '平', '章', '爱', '育', '黎', '首',
  '臣', '伏', '戎', '羌', '遐', '迩', '一', '体', '率', '宾', '归', '王',
  '鸣', '凤', '在', '竹', '白', '驹', '食', '场', '化', '被', '草', '木',
  '赖', '及', '万', '方', '盖', '此', '身', '发', '四', '大', '五', '常',
  '恭', '惟', '鞠', '养', '岂', '敢', '毁', '伤', '女', '慕', '贞', '洁',
  '男', '效', '才', '良', '知', '过', '必', '改', '得', '能', '莫', '忘',
  '罔', '谈', '彼', '短', '靡', '恃', '己', '长', '信', '使', '可', '覆',
  '器', '欲', '难', '量', '墨', '悲', '丝', '染', '诗', '赞', '羔', '羊',
  '景', '行', '维', '贤', '克', '念', '作', '圣', '德', '建', '名', '立',
  '形', '端', '表', '正', '空', '谷', '传', '声', '虚', '堂', '习', '听',
  '祸', '因', '恶', '积', '福', '缘', '善', '庆', '尺', '璧', '非', '宝',
  '寸', '阴', '是', '竞', '资', '父', '事', '君', '曰', '严', '与', '敬',
  '孝', '当', '竭', '力', '忠', '则', '尽', '命', '临', '深', '履', '薄',
  '夙', '兴', '温', '清', '似', '兰', '斯', '馨', '如', '松', '之', '盛',
  '川', '流', '不', '息', '渊', '澄', '取', '映', '容', '止', '若', '思',
  '言', '辞', '安', '定', '笃', '初', '诚', '美', '慎', '终', '宜', '令',
  '荣', '业', '所', '基', '籍', '甚', '无', '竟', '学', '优', '登', '仕',
  '摄', '职', '从', '政', '存', '以', '甘', '棠', '去', '而', '益', '咏',
  '乐', '殊', '贵', '贱', '礼', '别', '尊', '卑', '上', '和', '下', '睦',
  '夫', '唱', '妇', '随', '外', '受', '傅', '训', '入', '奉', '母', '仪',
  '诸', '姑', '伯', '叔', '犹', '子', '比', '儿', '孔', '怀', '兄', '弟',
  '同', '气', '连', '枝', '交', '友', '投', '分', '切', '磨', '箴', '规',
  '仁', '慈', '隐', '恻', '造', '次', '弗', '离', '节', '义', '廉', '退',
  '颠', '沛', '匪', '亏', '性', '静', '情', '逸', '心', '动', '神', '疲',
  '守', '真', '志', '满', '逐', '物', '意', '移', '坚', '持', '雅', '操',
  '好', '爵', '自', '縻', '都', '邑', '华', '夏', '东', '西', '二', '京',
  '背', '邙', '面', '洛', '浮', '渭', '据', '泾', '宫', '殿', '盘', '郁',
  '楼', '观', '飞', '惊', '图', '写', '禽', '兽', '画', '彩', '仙', '灵',
  '丙', '舍', '旁', '启', '甲', '帐', '对', '楹', '肆', '筵', '设', '席',
  '鼓', '瑟', '吹', '笙', '升', '阶', '纳', '陛', '弁', '转', '疑', '星',
  '右', '通', '广', '内', '左', '达', '承', '明', '既', '集', '坟', '典',
  '亦', '聚', '群', '英', '杜', '稿', '钟', '隶', '漆', '书', '壁', '经'
]

// 中文标点
const zhPunct = ['，', '。', '；', '：', '、', '！', '？']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 生成一段英文 Lorem Ipsum */
function generateEnSentence(minWords = 5, maxWords = 18) {
  const count = randomInt(minWords, maxWords)
  const words = []
  for (let i = 0; i < count; i++) {
    words.push(randomChoice(enWords))
  }
  let s = words.join(' ')
  s = s.charAt(0).toUpperCase() + s.slice(1) + '.'
  return s
}

/** 生成一个英文段落 */
function generateEnParagraph(sentenceCount, firstSentence = '') {
  const sentences = []
  if (firstSentence) {
    sentences.push(firstSentence)
  }
  const remaining = firstSentence ? sentenceCount - 1 : sentenceCount
  for (let i = 0; i < remaining; i++) {
    sentences.push(generateEnSentence())
  }
  return sentences.join(' ')
}

/** 生成一句中文 */
function generateZhSentence(minLen = 8, maxLen = 25) {
  const len = randomInt(minLen, maxLen)
  const chars = []
  for (let i = 0; i < len; i++) {
    chars.push(randomChoice(zhPool))
  }
  let end = randomChoice(['。', '。', '。', '！', '？', '；'])
  return chars.join('') + end
}

/** 生成一个中文段落 */
function generateZhParagraph(sentenceCount, firstSentence = '') {
  const sentences = []
  if (firstSentence) {
    sentences.push(firstSentence)
  }
  const remaining = firstSentence ? sentenceCount - 1 : sentenceCount
  for (let i = 0; i < remaining; i++) {
    sentences.push(generateZhSentence())
  }
  return sentences.join('')
}

function generate() {
  error.value = ''
  success.value = false

  const count = paragraphs.value
  const sp = sentencesPerPara.value
  const first = startText.value.trim()

  if (count < 1 || count > 20) {
    error.value = '段落数应在 1-20 之间'
    return
  }
  if (sp < 2 || sp > 20) {
    error.value = '每段句子数应在 2-20 之间'
    return
  }

  const paras = []
  for (let i = 0; i < count; i++) {
    if (lang.value === 'en') {
      const firstLine = i === 0 && first ? first : ''
      paras.push(generateEnParagraph(sp, firstLine))
    } else {
      const firstLine = i === 0 && first ? first : ''
      paras.push(generateZhParagraph(sp, firstLine))
    }
  }

  output.value = paras.join('\n\n')
  success.value = '生成成功'
  setTimeout(() => { success.value = false }, 2000)
}

async function copyOutput() {
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  output.value = ''
  startText.value = ''
  paragraphs.value = 3
  sentencesPerPara.value = 5
  error.value = ''
  success.value = false
}
</script>

<style scoped>
/* 组件特有样式 - 主要使用全局样式 */
</style>
