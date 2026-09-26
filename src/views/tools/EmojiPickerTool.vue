<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>😀 Emoji 搜索器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：搜索 + 分类 + 列表 -->
          <div class="tool-col">
            <label class="tool-label">关键词搜索：</label>
            <input
              v-model="query"
              class="code-input-sm"
              placeholder="输入中文 / 英文 / 码点搜索，如：笑脸、heart、U+1F600..."
            />

            <label class="tool-label">分类筛选：</label>
            <div class="cat-group">
              <button
                v-for="cat in categories"
                :key="cat.key"
                class="cat-btn"
                :class="{ active: activeCat === cat.key }"
                @click="switchCategory(cat.key)"
              >{{ cat.label }}</button>
            </div>

            <div class="list-meta">
              <span class="list-count">共 {{ filtered.length }} 个 Emoji</span>
              <button class="copy-btn-inline" :disabled="filtered.length === 0" @click="copyAll" title="复制匹配列表">📋 复制列表</button>
            </div>

            <div class="emoji-list">
              <button
                v-for="item in filtered"
                :key="item.c + item.zh"
                class="emoji-cell"
                :class="{ active: selected && selected.c === item.c }"
                :title="item.zh + ' / ' + item.en + ' (' + cpString(item.c) + ')'"
                @click="selectEmoji(item)"
              >{{ item.c }}</button>
              <div v-if="filtered.length === 0" class="list-empty">未找到匹配的 Emoji</div>
            </div>
          </div>

          <!-- 右侧：详情 -->
          <div class="tool-col">
            <label class="tool-label">Emoji 详情：</label>
            <div v-if="selected" class="detail-card">
              <div class="detail-preview">{{ selected.c }}</div>

              <div class="detail-row">
                <span class="detail-label">中文名称</span>
                <span class="detail-value">{{ selected.zh }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">英文名称</span>
                <span class="detail-value">{{ selected.en }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">所属分类</span>
                <span class="detail-value">{{ catLabel(selected.cat) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Unicode 码点</span>
                <span class="detail-value">
                  {{ cpString(selected.c) }}
                  <button class="copy-btn-inline" @click="copyValue(cpString(selected.c))" title="复制">📋</button>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">UTF-8 编码</span>
                <span class="detail-value">
                  {{ utf8String(selected.c) }}
                  <button class="copy-btn-inline" @click="copyValue(utf8String(selected.c))" title="复制">📋</button>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">HTML 实体</span>
                <span class="detail-value">
                  {{ htmlEntity(selected.c) }}
                  <button class="copy-btn-inline" @click="copyValue(htmlEntity(selected.c))" title="复制">📋</button>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">CSS 转义</span>
                <span class="detail-value">
                  {{ cssEscape(selected.c) }}
                  <button class="copy-btn-inline" @click="copyValue(cssEscape(selected.c))" title="复制">📋</button>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">码点数量</span>
                <span class="detail-value">{{ Array.from(selected.c).length }} 个码点</span>
              </div>

              <div class="button-group button-group-2">
                <button class="tool-button primary" @click="copyValue(selected.c)">📋 复制 Emoji</button>
                <button class="tool-button" @click="copyAll">📝 复制列表</button>
              </div>
            </div>
            <div v-else class="detail-empty">
              <div class="detail-empty-icon">👆</div>
              <div class="detail-empty-text">搜索或点击左侧 Emoji 查看详情</div>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

// --- 分类 ---
const categories = [
  { key: 'all', label: '全部' },
  { key: 'smileys', label: '表情' },
  { key: 'people', label: '人物' },
  { key: 'animals', label: '动物自然' },
  { key: 'food', label: '食物' },
  { key: 'travel', label: '旅行地点' },
  { key: 'objects', label: '物品' },
  { key: 'symbols', label: '符号' },
  { key: 'flags', label: '旗帜' }
]

// --- Emoji 数据：按分类分组，每组 [字符, 中文名, 英文名] ---
const EMOJI_DATA = {
  // 表情 smileys
  smileys: [
  ['😀', '开心', 'Grinning Face'], ['😁', '露齿笑', 'Beaming Face with Smiling Eyes'],
  ['😂', '笑哭', 'Face with Tears of Joy'], ['🤣', '笑翻', 'Rolling on the Floor Laughing'],
  ['😃', '大笑', 'Grinning Face with Big Eyes'], ['😄', '眯眼笑', 'Grinning Face with Smiling Eyes'],
  ['😅', '尬笑', 'Grinning Face with Sweat'], ['😆', '斜眼笑', 'Grinning Squinting Face'],
  ['😉', '眨眼', 'Winking Face'], ['😊', '微笑', 'Smiling Face with Smiling Eyes'],
  ['😋', '美味', 'Face Savoring Food'], ['😎', '墨镜酷', 'Smiling Face with Sunglasses'],
  ['😍', '花痴', 'Smiling Face with Heart-Eyes'], ['😘', '飞吻', 'Face Blowing a Kiss'],
  ['🥰', '爱意', 'Smiling Face with Hearts'], ['😗', '亲吻', 'Kissing Face'],
  ['😙', '眯眼亲亲', 'Kissing Face with Smiling Eyes'], ['😚', '闭眼亲亲', 'Kissing Face with Closed Eyes'],
  ['🙂', '浅笑', 'Slightly Smiling Face'], ['🤗', '拥抱', 'Hugging Face'],
  ['🤩', '星星眼', 'Star-Struck'], ['🤔', '思考', 'Thinking Face'],
  ['🤨', '挑眉', 'Face with Raised Eyebrow'], ['😐', '无语', 'Neutral Face'],
  ['😑', '面无表情', 'Expressionless Face'], ['😶', '闭嘴', 'Face Without Mouth'],
  ['🙄', '翻白眼', 'Face with Rolling Eyes'], ['😏', '得意', 'Smirking Face'],
  ['😣', '痛苦', 'Persevering Face'], ['😥', '松气', 'Sad but Relieved Face'],
  ['😮', '惊讶', 'Face with Open Mouth'], ['🤐', '封嘴', 'Zipper-Mouth Face'],
  ['😯', '呆住', 'Hushed Face'], ['😪', '困倦', 'Sleepy Face'],
  ['😫', '疲惫', 'Tired Face'], ['😴', '睡觉', 'Sleeping Face'],
  ['😌', '安心', 'Relieved Face'], ['😛', '吐舌', 'Face with Tongue'],
  ['😜', '挤眼吐舌', 'Winking Face with Tongue'], ['😝', '眯眼吐舌', 'Squinting Face with Tongue'],
  ['🤤', '流口水', 'Drooling Face'], ['😒', '不悦', 'Unamused Face'],
  ['😓', '冷汗', 'Downcast Face with Sweat'], ['😔', '失落', 'Pensive Face'],
  ['😕', '困惑', 'Confused Face'], ['🙃', '倒脸', 'Upside-Down Face'],
  ['🤑', '钱眼', 'Money-Mouth Face'], ['😲', '震惊', 'Astonished Face'],
  ['☹️', '皱眉', 'Frowning Face'], ['🙁', '微皱眉', 'Slightly Frowning Face'],
  ['😖', '纠结', 'Confounded Face'], ['😞', '失望', 'Disappointed Face'],
  ['😟', '担心', 'Worried Face'], ['😤', '生气', 'Face with Steam From Nose'],
  ['😢', '哭泣', 'Crying Face'], ['😭', '大哭', 'Loudly Crying Face'],
  ['😦', '张嘴皱眉', 'Frowning Face with Open Mouth'], ['😧', '痛苦惊讶', 'Anguished Face'],
  ['😨', '惊恐', 'Fearful Face'], ['😩', '抓狂', 'Weary Face'],
  ['🤯', '爆炸头', 'Exploding Head'], ['😬', '龇牙', 'Grimacing Face'],
  ['😰', '焦虑', 'Anxious Face with Sweat'], ['😱', '尖叫', 'Face Screaming in Fear'],
  ['🥵', '热晕', 'Hot Face'], ['🥶', '冻僵', 'Cold Face'],
  ['😳', '脸红', 'Flushed Face'], ['🤪', '搞怪', 'Zany Face'],
  ['😵', '晕眩', 'Dizzy Face'], ['😡', '愤怒', 'Pouting Face'],
  ['😠', '发怒', 'Angry Face'], ['🤬', '骂人', 'Face with Symbols on Mouth'],
  ['😷', '戴口罩', 'Face with Medical Mask'], ['🤒', '发烧', 'Face with Thermometer'],
  ['🤕', '受伤', 'Face with Head-Bandage'], ['🤢', '恶心', 'Nauseated Face'],
  ['🤮', '呕吐', 'Face Vomiting'], ['🤧', '打喷嚏', 'Sneezing Face'],
  ['😇', '天使', 'Smiling Face with Halo'], ['🥳', '庆祝', 'Partying Face'],
  ['🥺', '可怜巴巴', 'Pleading Face'], ['🤠', '牛仔', 'Cowboy Hat Face'],
  ['🤡', '小丑', 'Clown Face'], ['🤥', '撒谎', 'Lying Face'],
  ['🤫', '嘘', 'Shushing Face'], ['🤭', '捂嘴', 'Face with Hand Over Mouth'],
  ['🧐', '戴单片镜', 'Face with Monocle'], ['🤓', '书呆子', 'Nerd Face'],
  ['😈', '恶魔笑', 'Smiling Face with Horns'], ['👿', '愤怒恶魔', 'Angry Face with Horns'],
  ['👹', '鬼怪', 'Ogre'], ['👺', '天狗', 'Goblin'],
  ['💀', '骷髅', 'Skull'], ['👻', '幽灵', 'Ghost'],
  ['👽', '外星人', 'Alien'], ['👾', '外星怪兽', 'Alien Monster'],
  ['🤖', '机器人', 'Robot'], ['💩', '便便', 'Pile of Poo'],
  ['😺', '开心猫', 'Grinning Cat'], ['😸', '眯眼笑猫', 'Grinning Cat with Smiling Eyes'],
  ['😹', '笑哭猫', 'Cat with Tears of Joy'], ['😻', '花痴猫', 'Smiling Cat with Heart-Eyes'],
  ['😼', '坏笑猫', 'Cat with Wry Smile'], ['😽', '亲亲猫', 'Kissing Cat'],
  ['🙀', '惊恐猫', 'Weary Cat'], ['😿', '哭泣猫', 'Crying Cat'],
  ['😾', '生气猫', 'Pouting Cat'],

  ],

  // 人物 people
  people: [
  ['👋', '挥手', 'Waving Hand'], ['🤚', '举手', 'Raised Back of Hand'],
  ['🖐️', '张开手掌', 'Hand with Fingers Splayed'], ['✋', '手掌', 'Raised Hand'],
  ['🖖', '瓦肯举手礼', 'Vulcan Salute'], ['👌', 'OK 手势', 'OK Hand'],
  ['🤌', '捏手指', 'Pinched Fingers'], ['🤏', '捏合', 'Pinching Hand'],
  ['✌️', '胜利', 'Victory Hand'], ['🤞', '交叉手指', 'Crossed Fingers'],
  ['🤟', '我爱你的手势', 'Love-You Gesture'], ['🤘', '摇滚', 'Sign of the Horns'],
  ['🤙', '打电话手势', 'Call Me Hand'], ['👈', '左指', 'Backhand Index Pointing Left'],
  ['👉', '右指', 'Backhand Index Pointing Right'], ['👆', '上指', 'Backhand Index Pointing Up'],
  ['🖕', '竖中指', 'Middle Finger'], ['👇', '下指', 'Backhand Index Pointing Down'],
  ['☝️', '食指向上', 'Index Pointing Up'], ['👍', '赞', 'Thumbs Up'],
  ['👎', '踩', 'Thumbs Down'], ['✊', '握拳', 'Raised Fist'],
  ['👊', '拳头', 'Oncoming Fist'], ['🤛', '左拳', 'Left-Facing Fist'],
  ['🤜', '右拳', 'Right-Facing Fist'], ['👏', '鼓掌', 'Clapping Hands'],
  ['🙌', '举手欢呼', 'Raising Hands'], ['👐', '张开双手', 'Open Hands'],
  ['🤲', '捧手', 'Palms Up Together'], ['🤝', '握手', 'Handshake'],
  ['🙏', '双手合十', 'Folded Hands'], ['💪', '肌肉', 'Flexed Biceps'],
  ['🦾', '机械臂', 'Mechanical Arm'], ['🦵', '腿', 'Leg'],
  ['🦶', '脚', 'Foot'], ['👂', '耳朵', 'Ear'],
  ['🦻', '助听器耳朵', 'Ear with Hearing Aid'], ['👃', '鼻子', 'Nose'],
  ['🧠', '大脑', 'Brain'], ['🦷', '牙齿', 'Tooth'],
  ['🦴', '骨头', 'Bone'], ['👀', '眼睛', 'Eyes'],
  ['👁️', '单眼', 'Eye'], ['👅', '舌头', 'Tongue'],
  ['👄', '嘴唇', 'Mouth'], ['👶', '宝宝', 'Baby'],
  ['🧒', '儿童', 'Child'], ['👦', '男孩', 'Boy'],
  ['👧', '女孩', 'Girl'], ['🧑', '大人', 'Adult'],
  ['👨', '男人', 'Man'], ['👩', '女人', 'Woman'],
  ['🧓', '老人', 'Older Adult'], ['👴', '老爷爷', 'Old Man'],
  ['👵', '老奶奶', 'Old Woman'], ['🙍', '皱眉的人', 'Person Frowning'],
  ['🙎', '撅嘴的人', 'Person Pouting'], ['🙅', '禁止手势', 'Person Gesturing No'],
  ['🙆', 'OK 手势的人', 'Person Gesturing OK'], ['💁', '服务生', 'Person Tipping Hand'],
  ['🙋', '举手的人', 'Person Raising Hand'], ['🧏', '聋人', 'Deaf Person'],
  ['🙇', '鞠躬', 'Person Bowing'], ['🤦', '捂脸', 'Person Facepalming'],
  ['🤷', '耸肩', 'Person Shrugging'], ['👮', '警察', 'Police Officer'],
  ['🕵️', '侦探', 'Detective'], ['💂', '卫兵', 'Guard'],
  ['👷', '建筑工人', 'Construction Worker'], ['🤴', '王子', 'Prince'],
  ['👸', '公主', 'Princess'], ['👳', '缠头巾的人', 'Person Wearing Turban'],
  ['👲', '瓜皮帽的人', 'Person with Skullcap'], ['🧕', '戴头巾的女子', 'Woman with Headscarf'],
  ['🤵', '穿燕尾服的人', 'Person in Tuxedo'], ['👰', '戴头纱的新娘', 'Bride with Veil'],
  ['🤰', '孕妇', 'Pregnant Woman'], ['🤱', '母乳喂养', 'Breast-Feeding'],
  ['👼', '小天使', 'Baby Angel'], ['🎅', '圣诞老人', 'Santa Claus'],
  ['🤶', '圣诞奶奶', 'Mrs. Claus'], ['🦸', '超级英雄', 'Superhero'],
  ['🦹', '超级反派', 'Supervillain'], ['🧙', '法师', 'Mage'],
  ['🧚', '精灵', 'Fairy'], ['🧛', '吸血鬼', 'Vampire'],
  ['🧜', '人鱼', 'Mermaid'], ['🧝', '精灵射手', 'Elf'],
  ['🧞', '灯神', 'Genie'], ['🧟', '僵尸', 'Zombie'],
  ['💆', '按摩', 'Person Getting Massage'], ['💇', '理发', 'Person Getting Haircut'],
  ['🚶', '走路', 'Person Walking'], ['🧍', '站立的人', 'Person Standing'],
  ['🧎', '跪着的人', 'Person Kneeling'], ['🏃', '跑步', 'Person Running'],
  ['💃', '跳舞女', 'Woman Dancing'], ['🕺', '跳舞男', 'Man Dancing'],
  ['🕴️', '悬浮西装男', 'Person in Suit Levitating'], ['👯', '双胞胎舞者', 'People with Bunny Ears'],
  ['🧖', '蒸桑拿的人', 'Person in Steamy Room'], ['🧗', '攀岩', 'Person Climbing'],
  ['🤺', '击剑', 'Person Fencing'], ['🏇', '赛马', 'Horse Racing'],
  ['⛷️', '滑雪', 'Skier'], ['🏂', '单板滑雪', 'Snowboarder'],
  ['🏌️', '打高尔夫', 'Person Golfing'], ['🏄', '冲浪', 'Person Surfing'],
  ['🚣', '划船', 'Person Rowing Boat'], ['🏊', '游泳', 'Person Swimming'],
  ['⛹️', '打球', 'Person Bouncing Ball'], ['🏋️', '举重', 'Person Lifting Weights'],
  ['🚴', '骑自行车', 'Person Biking'], ['🚵', '骑山地车', 'Person Mountain Biking'],
  ['🤸', '侧手翻', 'Person Cartwheeling'], ['🤼', '摔跤', 'People Wrestling'],
  ['🤽', '水球', 'Person Playing Water Polo'], ['🤾', '手球', 'Person Playing Handball'],
  ['🤹', '杂耍', 'Person Juggling'], ['🧘', '打坐', 'Person in Lotus Position'],
  ['🛀', '泡澡', 'Person Taking Bath'], ['🛌', '睡觉的人', 'Person in Bed'],

  ],

  // 动物自然 animals
  animals: [
  ['🐶', '狗', 'Dog Face'], ['🐱', '猫', 'Cat Face'],
  ['🐭', '老鼠', 'Mouse Face'], ['🐹', '仓鼠', 'Hamster'],
  ['🐰', '兔子', 'Rabbit Face'], ['🦊', '狐狸', 'Fox'],
  ['🐻', '熊', 'Bear'], ['🐼', '熊猫', 'Panda'],
  ['🐨', '考拉', 'Koala'], ['🐯', '老虎', 'Tiger Face'],
  ['🦁', '狮子', 'Lion'], ['🐮', '奶牛', 'Cow Face'],
  ['🐷', '猪', 'Pig Face'], ['🐽', '猪鼻子', 'Pig Nose'],
  ['🐸', '青蛙', 'Frog'], ['🐵', '猴脸', 'Monkey Face'],
  ['🙈', '非礼勿视', 'See-No-Evil Monkey'], ['🙉', '非礼勿听', 'Hear-No-Evil Monkey'],
  ['🙊', '非礼勿言', 'Speak-No-Evil Monkey'], ['🐒', '猴子', 'Monkey'],
  ['🐔', '鸡', 'Chicken'], ['🐧', '企鹅', 'Penguin'],
  ['🐦', '鸟', 'Bird'], ['🐤', '小鸡', 'Baby Chick'],
  ['🐣', '破壳小鸡', 'Hatching Chick'], ['🐥', '黄毛小鸡', 'Front-Facing Baby Chick'],
  ['🦆', '鸭子', 'Duck'], ['🦅', '老鹰', 'Eagle'],
  ['🦉', '猫头鹰', 'Owl'], ['🦇', '蝙蝠', 'Bat'],
  ['🐺', '狼', 'Wolf'], ['🐗', '野猪', 'Boar'],
  ['🐴', '马', 'Horse Face'], ['🦄', '独角兽', 'Unicorn'],
  ['🐝', '蜜蜂', 'Honeybee'], ['🐛', '毛毛虫', 'Bug'],
  ['🦋', '蝴蝶', 'Butterfly'], ['🐌', '蜗牛', 'Snail'],
  ['🐞', '瓢虫', 'Lady Beetle'], ['🐜', '蚂蚁', 'Ant'],
  ['🦟', '蚊子', 'Mosquito'], ['🦗', '蟋蟀', 'Cricket'],
  ['🕷️', '蜘蛛', 'Spider'], ['🕸️', '蜘蛛网', 'Spider Web'],
  ['🦂', '蝎子', 'Scorpion'], ['🐢', '乌龟', 'Turtle'],
  ['🐍', '蛇', 'Snake'], ['🦎', '蜥蜴', 'Lizard'],
  ['🦖', '霸王龙', 'T-Rex'], ['🦕', '腕龙', 'Sauropod'],
  ['🐙', '章鱼', 'Octopus'], ['🦑', '鱿鱼', 'Squid'],
  ['🦐', '虾', 'Shrimp'], ['🦞', '龙虾', 'Lobster'],
  ['🦀', '螃蟹', 'Crab'], ['🐡', '河豚', 'Blowfish'],
  ['🐠', '热带鱼', 'Tropical Fish'], ['🐟', '鱼', 'Fish'],
  ['🐬', '海豚', 'Dolphin'], ['🐳', '喷水鲸鱼', 'Spouting Whale'],
  ['🐋', '鲸鱼', 'Whale'], ['🦈', '鲨鱼', 'Shark'],
  ['🐊', '鳄鱼', 'Crocodile'], ['🐅', '老虎', 'Tiger'],
  ['🐆', '豹子', 'Leopard'], ['🦓', '斑马', 'Zebra'],
  ['🦍', '大猩猩', 'Gorilla'], ['🦧', '猩猩', 'Orangutan'],
  ['🐘', '大象', 'Elephant'], ['🦛', '河马', 'Hippopotamus'],
  ['🦏', '犀牛', 'Rhinoceros'], ['🐪', '单峰骆驼', 'Camel'],
  ['🐫', '双峰骆驼', 'Two-Hump Camel'], ['🦒', '长颈鹿', 'Giraffe'],
  ['🦘', '袋鼠', 'Kangaroo'], ['🐃', '水牛', 'Water Buffalo'],
  ['🐂', '公牛', 'Ox'], ['🐄', '母牛', 'Cow'],
  ['🐎', '马', 'Horse'], ['🐖', '猪', 'Pig'],
  ['🐏', '公羊', 'Ram'], ['🐑', '绵羊', 'Ewe'],
  ['🦙', '羊驼', 'Llama'], ['🐐', '山羊', 'Goat'],
  ['🦌', '鹿', 'Deer'], ['🐕', '狗', 'Dog'],
  ['🐩', '贵宾犬', 'Poodle'], ['🦮', '导盲犬', 'Guide Dog'],
  ['🐈', '猫', 'Cat'], ['🐓', '公鸡', 'Rooster'],
  ['🦃', '火鸡', 'Turkey'], ['🦚', '孔雀', 'Peacock'],
  ['🦜', '鹦鹉', 'Parrot'], ['🦢', '天鹅', 'Swan'],
  ['🦩', '火烈鸟', 'Flamingo'], ['🕊️', '和平鸽', 'Dove'],
  ['🐇', '兔子', 'Rabbit'], ['🦝', '浣熊', 'Raccoon'],
  ['🦨', '臭鼬', 'Skunk'], ['🦡', '獾', 'Badger'],
  ['🦦', '水獭', 'Otter'], ['🦥', '树懒', 'Sloth'],
  ['🐁', '老鼠', 'Mouse'], ['🐀', '大鼠', 'Rat'],
  ['🐿️', '松鼠', 'Chipmunk'], ['🦔', '刺猬', 'Hedgehog'],
  ['🌵', '仙人掌', 'Cactus'], ['🎄', '圣诞树', 'Christmas Tree'],
  ['🌲', '常青树', 'Evergreen Tree'], ['🌳', '落叶树', 'Deciduous Tree'],
  ['🌴', '棕榈树', 'Palm Tree'], ['🌱', '幼苗', 'Seedling'],
  ['🌿', '草药', 'Herb'], ['☘️', '三叶草', 'Shamrock'],
  ['🍀', '四叶草', 'Four Leaf Clover'], ['🎍', '门松', 'Pine Decoration'],
  ['🎋', '竹子', 'Tanabata Tree'], ['🍃', '飘叶', 'Leaf Fluttering in Wind'],
  ['🍂', '落叶', 'Fallen Leaf'], ['🍁', '枫叶', 'Maple Leaf'],
  ['🍄', '蘑菇', 'Mushroom'], ['🐚', '海螺', 'Spiral Shell'],
  ['🌾', '稻穗', 'Sheaf of Rice'], ['💐', '花束', 'Bouquet'],
  ['🌷', '郁金香', 'Tulip'], ['🌹', '玫瑰', 'Rose'],
  ['🥀', '枯萎的花', 'Wilted Flower'], ['🌺', '芙蓉', 'Hibiscus'],
  ['🌸', '樱花', 'Cherry Blossom'], ['🌼', '雏菊', 'Blossom'],
  ['🌻', '向日葵', 'Sunflower'], ['🌞', '太阳脸', 'Sun with Face'],
  ['🌝', '满月脸', 'Full Moon Face'], ['🌛', '上弦月脸', 'First Quarter Moon Face'],
  ['🌜', '下弦月脸', 'Last Quarter Moon Face'], ['🌚', '新月脸', 'New Moon Face'],
  ['🌕', '满月', 'Full Moon'], ['🌖', '亏凸月', 'Waning Gibbous Moon'],
  ['🌗', '下弦月', 'Last Quarter Moon'], ['🌘', '残月', 'Waning Crescent Moon'],
  ['🌑', '新月', 'New Moon'], ['🌒', '娥眉月', 'Waxing Crescent Moon'],
  ['🌓', '上弦月', 'First Quarter Moon'], ['🌔', '盈凸月', 'Waxing Gibbous Moon'],
  ['🌙', '弯月', 'Crescent Moon'], ['🌎', '地球美洲', 'Globe Showing Americas'],
  ['🌍', '地球非洲', 'Globe Showing Europe-Africa'], ['🌏', '地球亚洲', 'Globe Showing Asia-Australia'],
  ['🪐', '土星', 'Ringed Planet'], ['💫', '天旋地转', 'Dizzy'],
  ['⭐', '星星', 'Star'], ['🌟', '闪亮星星', 'Glowing Star'],
  ['✨', '闪光', 'Sparkles'], ['⚡', '闪电', 'High Voltage'],
  ['☄️', '彗星', 'Comet'], ['💥', '碰撞', 'Collision'],
  ['🔥', '火', 'Fire'], ['🌈', '彩虹', 'Rainbow'],
  ['☀️', '太阳', 'Sun'], ['🌤️', '晴间多云', 'Sun Behind Small Cloud'],
  ['⛅', '多云', 'Sun Behind Cloud'], ['🌥️', '阴天', 'Sun Behind Large Cloud'],
  ['☁️', '云', 'Cloud'], ['🌦️', '太阳雨', 'Sun Behind Rain Cloud'],
  ['🌧️', '下雨', 'Cloud with Rain'], ['⛈️', '雷雨', 'Cloud with Lightning and Rain'],
  ['🌩️', '雷电', 'Cloud with Lightning'], ['🌨️', '下雪', 'Cloud with Snow'],
  ['❄️', '雪花', 'Snowflake'], ['☃️', '雪人', 'Snowman'],
  ['⛄', '无雪雪人', 'Snowman Without Snow'], ['🌬️', '刮风', 'Wind Face'],
  ['💨', '飞奔', 'Dashing Away'], ['💧', '水滴', 'Droplet'],
  ['💦', '汗滴', 'Sweat Droplets'], ['☔', '雨伞', 'Umbrella with Rain Drops'],
  ['☂️', '雨伞', 'Umbrella'], ['🌊', '海浪', 'Water Wave'],
  ['🌫️', '雾', 'Fog'],

  ],

  // 食物 food
  food: [
  ['🍏', '青苹果', 'Green Apple'], ['🍎', '红苹果', 'Red Apple'],
  ['🍐', '梨', 'Pear'], ['🍊', '橘子', 'Tangerine'],
  ['🍋', '柠檬', 'Lemon'], ['🍌', '香蕉', 'Banana'],
  ['🍉', '西瓜', 'Watermelon'], ['🍇', '葡萄', 'Grapes'],
  ['🍓', '草莓', 'Strawberry'], ['🍈', '甜瓜', 'Melon'],
  ['🍒', '樱桃', 'Cherries'], ['🍑', '桃子', 'Peach'],
  ['🥭', '芒果', 'Mango'], ['🍍', '菠萝', 'Pineapple'],
  ['🥥', '椰子', 'Coconut'], ['🥝', '猕猴桃', 'Kiwi Fruit'],
  ['🍅', '番茄', 'Tomato'], ['🥑', '牛油果', 'Avocado'],
  ['🥦', '西兰花', 'Broccoli'], ['🥬', '青菜', 'Leafy Green'],
  ['🥒', '黄瓜', 'Cucumber'], ['🌶️', '辣椒', 'Hot Pepper'],
  ['🌽', '玉米', 'Ear of Corn'], ['🥕', '胡萝卜', 'Carrot'],
  ['🧄', '大蒜', 'Garlic'], ['🧅', '洋葱', 'Onion'],
  ['🥔', '土豆', 'Potato'], ['🍠', '红薯', 'Roasted Sweet Potato'],
  ['🥐', '牛角包', 'Croissant'], ['🥯', '贝果', 'Bagel'],
  ['🍞', '面包', 'Bread'], ['🥖', '法棍', 'Baguette Bread'],
  ['🥨', '椒盐卷饼', 'Pretzel'], ['🧀', '奶酪', 'Cheese Wedge'],
  ['🥚', '鸡蛋', 'Egg'], ['🍳', '煎蛋', 'Cooking'],
  ['🧈', '黄油', 'Butter'], ['🥞', '松饼', 'Pancakes'],
  ['🧇', '华夫饼', 'Waffle'], ['🥓', '培根', 'Bacon'],
  ['🥩', '牛排', 'Cut of Meat'], ['🍗', '鸡腿', 'Poultry Leg'],
  ['🍖', '肉骨头', 'Meat on Bone'], ['🌭', '热狗', 'Hot Dog'],
  ['🍔', '汉堡', 'Hamburger'], ['🍟', '薯条', 'French Fries'],
  ['🍕', '披萨', 'Pizza'], ['🥪', '三明治', 'Sandwich'],
  ['🥙', '肉夹馍', 'Stuffed Flatbread'], ['🧆', '炸丸子', 'Falafel'],
  ['🌮', '墨西哥卷饼', 'Taco'], ['🌯', '墨西哥卷', 'Burrito'],
  ['🥗', '沙拉', 'Green Salad'], ['🥘', '炖锅', 'Shallow Pan of Food'],
  ['🥫', '罐头', 'Canned Food'], ['🍝', '意面', 'Spaghetti'],
  ['🍜', '拉面', 'Steaming Bowl'], ['🍲', '火锅', 'Pot of Food'],
  ['🍛', '咖喱饭', 'Curry Rice'], ['🍣', '寿司', 'Sushi'],
  ['🍱', '便当', 'Bento Box'], ['🥟', '饺子', 'Dumpling'],
  ['🦪', '生蚝', 'Oyster'], ['🍤', '炸虾', 'Fried Shrimp'],
  ['🍙', '饭团', 'Rice Ball'], ['🍚', '米饭', 'Cooked Rice'],
  ['🍘', '米饼', 'Rice Cracker'], ['🍥', '鱼板', 'Fish Cake with Swirl'],
  ['🥠', '幸运饼干', 'Fortune Cookie'], ['🥮', '月饼', 'Moon Cake'],
  ['🍢', '关东煮', 'Oden'], ['🍡', '团子', 'Dango'],
  ['🍧', '刨冰', 'Shaved Ice'], ['🍨', '冰淇淋', 'Ice Cream'],
  ['🍦', '甜筒', 'Soft Ice Cream'], ['🥧', '派', 'Pie'],
  ['🧁', '纸杯蛋糕', 'Cupcake'], ['🍰', '蛋糕', 'Shortcake'],
  ['🎂', '生日蛋糕', 'Birthday Cake'], ['🍮', '布丁', 'Custard'],
  ['🍭', '棒棒糖', 'Lollipop'], ['🍬', '糖果', 'Candy'],
  ['🍫', '巧克力', 'Chocolate Bar'], ['🍿', '爆米花', 'Popcorn'],
  ['🍩', '甜甜圈', 'Doughnut'], ['🍪', '曲奇', 'Cookie'],
  ['🌰', '栗子', 'Chestnut'], ['🥜', '花生', 'Peanuts'],
  ['🍯', '蜂蜜', 'Honey Pot'], ['🥛', '牛奶', 'Glass of Milk'],
  ['🍼', '奶瓶', 'Baby Bottle'], ['☕', '咖啡', 'Hot Beverage'],
  ['🍵', '绿茶', 'Teacup Without Handle'], ['🧃', '果汁盒', 'Beverage Box'],
  ['🥤', '奶茶', 'Cup with Straw'], ['🍶', '清酒', 'Sake'],
  ['🍺', '啤酒', 'Beer Mug'], ['🍻', '干杯', 'Clinking Beer Mugs'],
  ['🥂', '碰杯', 'Clinking Glasses'], ['🍷', '红酒', 'Wine Glass'],
  ['🥃', '威士忌', 'Tumbler Glass'], ['🍸', '鸡尾酒', 'Cocktail Glass'],
  ['🍹', '热带饮料', 'Tropical Drink'], ['🧉', '马黛茶', 'Mate'],
  ['🍾', '香槟', 'Bottle with Popping Cork'], ['🧊', '冰块', 'Ice'],

  ],

  // 旅行地点 travel
  travel: [
  ['🚗', '汽车', 'Automobile'], ['🚕', '出租车', 'Taxi'],
  ['🚙', 'SUV', 'Sport Utility Vehicle'], ['🚌', '公交车', 'Bus'],
  ['🚎', '无轨电车', 'Trolleybus'], ['🏎️', '赛车', 'Racing Car'],
  ['🚓', '警车', 'Police Car'], ['🚑', '救护车', 'Ambulance'],
  ['🚒', '消防车', 'Fire Engine'], ['🚐', '面包车', 'Minibus'],
  ['🛻', '皮卡', 'Pickup Truck'], ['🚚', '卡车', 'Delivery Truck'],
  ['🚛', '货车', 'Articulated Lorry'], ['🚜', '拖拉机', 'Tractor'],
  ['🛴', '滑板车', 'Kick Scooter'], ['🚲', '自行车', 'Bicycle'],
  ['🛵', '小摩托', 'Motor Scooter'], ['🏍️', '摩托车', 'Motorcycle'],
  ['🛺', '三轮车', 'Auto Rickshaw'], ['🚨', '警灯', 'Police Car Light'],
  ['🚔', '警车', 'Oncoming Police Car'], ['🚍', '公交车', 'Oncoming Bus'],
  ['🚘', '汽车', 'Oncoming Automobile'], ['🚖', '出租车', 'Oncoming Taxi'],
  ['🚡', '缆车', 'Aerial Tramway'], ['🚠', '登山缆车', 'Mountain Cableway'],
  ['🚟', '悬挂铁路', 'Suspension Railway'], ['🚃', '电车', 'Railway Car'],
  ['🚋', '电车车厢', 'Tram Car'], ['🚞', '山区铁路', 'Mountain Railway'],
  ['🚝', '单轨列车', 'Monorail'], ['🚄', '高铁', 'High-Speed Train'],
  ['🚅', '高铁头', 'Bullet Train'], ['🚈', '轻轨', 'Light Rail'],
  ['🚂', '蒸汽火车', 'Locomotive'], ['🚆', '火车', 'Train'],
  ['🚇', '地铁', 'Metro'], ['🚊', '有轨电车', 'Tram'],
  ['🚉', '车站', 'Station'], ['✈️', '飞机', 'Airplane'],
  ['🛫', '起飞', 'Airplane Departure'], ['🛬', '降落', 'Airplane Arrival'],
  ['🛩️', '小飞机', 'Small Airplane'], ['💺', '座椅', 'Seat'],
  ['🛰️', '卫星', 'Satellite'], ['🚀', '火箭', 'Rocket'],
  ['🛸', '飞碟', 'Flying Saucer'], ['🚁', '直升机', 'Helicopter'],
  ['🛶', '独木舟', 'Canoe'], ['⛵', '帆船', 'Sailboat'],
  ['🚤', '快艇', 'Speedboat'], ['🛥️', '摩托艇', 'Motor Boat'],
  ['🛳️', '客轮', 'Passenger Ship'], ['⛴️', '渡轮', 'Ferry'],
  ['🚢', '轮船', 'Ship'], ['⚓', '船锚', 'Anchor'],
  ['⛽', '加油站', 'Fuel Pump'], ['🚧', '施工', 'Construction'],
  ['🚦', '红绿灯', 'Vertical Traffic Light'], ['🚥', '交通灯', 'Horizontal Traffic Light'],
  ['🗺️', '世界地图', 'World Map'], ['🗿', '摩艾石像', 'Moai'],
  ['🗽', '自由女神', 'Statue of Liberty'], ['🗼', '东京铁塔', 'Tokyo Tower'],
  ['🏰', '城堡', 'Castle'], ['🏯', '日本城堡', 'Japanese Castle'],
  ['🏟️', '体育场', 'Stadium'], ['🎡', '摩天轮', 'Ferris Wheel'],
  ['🎢', '过山车', 'Roller Coaster'], ['🎠', '旋转木马', 'Carousel Horse'],
  ['⛲', '喷泉', 'Fountain'], ['⛱️', '沙滩伞', 'Beach Umbrella'],
  ['🏖️', '海滩', 'Beach with Umbrella'], ['🏝️', '荒岛', 'Desert Island'],
  ['🏜️', '沙漠', 'Desert'], ['🌋', '火山', 'Volcano'],
  ['⛰️', '山', 'Mountain'], ['🏔️', '雪山', 'Snow-Capped Mountain'],
  ['🗻', '富士山', 'Mount Fuji'], ['🏕️', '露营', 'Camping'],
  ['⛺', '帐篷', 'Tent'], ['🏠', '房子', 'House'],
  ['🏡', '花园洋房', 'House with Garden'], ['🏘️', '房屋群', 'Houses'],
  ['🏚️', '废弃房屋', 'Derelict House'], ['🏗️', '建筑吊车', 'Building Construction'],
  ['🏭', '工厂', 'Factory'], ['🏢', '办公楼', 'Office Building'],
  ['🏬', '商场', 'Department Store'], ['🏣', '邮局', 'Japanese Post Office'],
  ['🏤', '邮局', 'Post Office'], ['🏥', '医院', 'Hospital'],
  ['🏦', '银行', 'Bank'], ['🏨', '酒店', 'Hotel'],
  ['🏪', '便利店', 'Convenience Store'], ['🏫', '学校', 'School'],
  ['🏩', '爱情酒店', 'Love Hotel'], ['💒', '教堂婚礼', 'Wedding'],
  ['🏛️', '古典建筑', 'Classical Building'], ['⛪', '教堂', 'Church'],
  ['🕌', '清真寺', 'Mosque'], ['🕍', '犹太教堂', 'Synagogue'],
  ['🛕', '印度教寺庙', 'Hindu Temple'], ['🕋', '天房', 'Kaaba'],
  ['⛩️', '神社', 'Shinto Shrine'], ['🛤️', '铁轨', 'Railway Track'],
  ['🛣️', '高速公路', 'Motorway'], ['🗾', '日本地图', 'Map of Japan'],
  ['🎑', '赏月', 'Moon Viewing Ceremony'], ['🏞️', '国家公园', 'National Park'],
  ['🌅', '日出', 'Sunrise'], ['🌄', '山顶日出', 'Sunrise Over Mountains'],
  ['🌠', '流星', 'Shooting Star'], ['🎇', '烟花', 'Sparkler'],
  ['🎆', '焰火', 'Fireworks'], ['🌇', '日落', 'Sunset'],
  ['🌆', '黄昏城市', 'Cityscape at Dusk'], ['🏙️', '城市夜景', 'Cityscape'],
  ['🌃', '星空城市', 'Night with Stars'], ['🌌', '银河', 'Milky Way'],
  ['🌉', '大桥夜景', 'Bridge at Night'], ['🌁', '雾都', 'Foggy'],

  ],

  // 物品 objects
  objects: [
  ['⌚', '手表', 'Watch'], ['📱', '手机', 'Mobile Phone'],
  ['📲', '手机信号', 'Mobile Phone with Arrow'], ['💻', '笔记本电脑', 'Laptop Computer'],
  ['⌨️', '键盘', 'Keyboard'], ['🖥️', '台式电脑', 'Desktop Computer'],
  ['🖨️', '打印机', 'Printer'], ['🖱️', '鼠标', 'Computer Mouse'],
  ['🖲️', '轨迹球', 'Trackball'], ['🕹️', '游戏手柄', 'Joystick'],
  ['🗜️', '夹具', 'Clamp'], ['💽', '迷你光盘', 'Computer Disk'],
  ['💾', '软盘', 'Floppy Disk'], ['💿', '光盘', 'Optical Disk'],
  ['📀', 'DVD', 'DVD'], ['📼', '录像带', 'Videocassette'],
  ['📷', '相机', 'Camera'], ['📸', '闪光相机', 'Camera with Flash'],
  ['📹', '摄像机', 'Video Camera'], ['🎥', '电影摄影机', 'Movie Camera'],
  ['📽️', '放映机', 'Film Projector'], ['🎞️', '胶片', 'Film Frames'],
  ['📞', '电话', 'Telephone Receiver'], ['☎️', '电话', 'Telephone'],
  ['📟', '寻呼机', 'Pager'], ['📠', '传真机', 'Fax Machine'],
  ['📺', '电视', 'Television'], ['📻', '收音机', 'Radio'],
  ['🎙️', '麦克风', 'Studio Microphone'], ['🎚️', '调音台', 'Level Slider'],
  ['🎛️', '控制台', 'Control Knobs'], ['🧭', '指南针', 'Compass'],
  ['⏱️', '秒表', 'Stopwatch'], ['⏲️', '计时器', 'Timer Clock'],
  ['⏰', '闹钟', 'Alarm Clock'], ['🕰️', '座钟', 'Mantelpiece Clock'],
  ['⌛', '沙漏', 'Hourglass Done'], ['⏳', '沙漏计时', 'Hourglass Not Done'],
  ['📡', '卫星天线', 'Satellite Antenna'], ['🔋', '电池', 'Battery'],
  ['🔌', '电源插头', 'Electric Plug'], ['💡', '灯泡', 'Light Bulb'],
  ['🔦', '手电筒', 'Flashlight'], ['🕯️', '蜡烛', 'Candle'],
  ['🪔', '油灯', 'Diya Lamp'], ['🧯', '灭火器', 'Fire Extinguisher'],
  ['🛢️', '油桶', 'Oil Drum'], ['💸', '飞钱', 'Money with Wings'],
  ['💵', '美元', 'Dollar Banknote'], ['💴', '日元', 'Yen Banknote'],
  ['💶', '欧元', 'Euro Banknote'], ['💷', '英镑', 'Pound Banknote'],
  ['🪙', '硬币', 'Coin'], ['💰', '钱袋', 'Money Bag'],
  ['💳', '信用卡', 'Credit Card'], ['💎', '钻石', 'Gem Stone'],
  ['⚖️', '天平', 'Balance Scale'], ['🧰', '工具箱', 'Toolbox'],
  ['🔧', '扳手', 'Wrench'], ['🔨', '锤子', 'Hammer'],
  ['⚒️', '锤镐', 'Hammer and Pick'], ['🛠️', '工具', 'Hammer and Wrench'],
  ['⛏️', '镐', 'Pick'], ['🔩', '螺母螺栓', 'Nut and Bolt'],
  ['⚙️', '齿轮', 'Gear'], ['🧱', '砖块', 'Brick'],
  ['⛓️', '锁链', 'Chains'], ['🧲', '磁铁', 'Magnet'],
  ['🔫', '水枪', 'Pistol'], ['💣', '炸弹', 'Bomb'],
  ['🧨', '鞭炮', 'Firecracker'], ['🪓', '斧头', 'Axe'],
  ['🔪', '菜刀', 'Kitchen Knife'], ['🗡️', '匕首', 'Dagger'],
  ['⚔️', '交叉剑', 'Crossed Swords'], ['🛡️', '盾牌', 'Shield'],
  ['🚬', '香烟', 'Cigarette'], ['⚰️', '棺材', 'Coffin'],
  ['⚱️', '骨灰盒', 'Funeral Urn'], ['🏺', '双耳瓶', 'Amphora'],
  ['🔮', '水晶球', 'Crystal Ball'], ['📿', '念珠', 'Prayer Beads'],
  ['🧿', '护身符', 'Nazar Amulet'], ['💈', '理发店灯', 'Barber Pole'],
  ['⚗️', '蒸馏器', 'Alembic'], ['🔭', '望远镜', 'Telescope'],
  ['🔬', '显微镜', 'Microscope'], ['🕳️', '洞穴', 'Hole'],
  ['💊', '药片', 'Pill'], ['💉', '注射器', 'Syringe'],
  ['🩸', '血滴', 'Drop of Blood'], ['🩹', '创可贴', 'Adhesive Bandage'],
  ['🩺', '听诊器', 'Stethoscope'], ['🌡️', '温度计', 'Thermometer'],
  ['🚽', '马桶', 'Toilet'], ['🚰', '饮水机', 'Potable Water'],
  ['🚿', '淋浴', 'Shower'], ['🛁', '浴缸', 'Bathtub'],
  ['🧴', '沐浴露', 'Lotion Bottle'], ['🧷', '别针', 'Safety Pin'],
  ['🧻', '纸巾', 'Roll of Paper'], ['🧼', '肥皂', 'Soap'],
  ['🧽', '海绵', 'Sponge'], ['🧹', '扫帚', 'Broom'],
  ['🧺', '篮子', 'Basket'], ['🪣', '水桶', 'Bucket'],
  ['🪥', '牙刷', 'Toothbrush'], ['🪒', '剃须刀', 'Razor'],
  ['🧶', '毛线', 'Yarn'], ['🧵', '线轴', 'Thread'],
  ['🪡', '缝衣针', 'Sewing Needle'], ['🧥', '大衣', 'Coat'],
  ['🥼', '白大褂', 'Lab Coat'], ['🦺', '救生衣', 'Safety Vest'],
  ['👔', '领带', 'Necktie'], ['👕', 'T 恤', 'T-Shirt'],
  ['👖', '牛仔裤', 'Jeans'], ['👗', '连衣裙', 'Dress'],
  ['👘', '和服', 'Kimono'], ['👙', '比基尼', 'Bikini'],
  ['👚', '女装', 'Woman\'s Clothes'], ['👛', '钱包', 'Purse'],
  ['👜', '手提包', 'Handbag'], ['👝', '手拿包', 'Clutch Bag'],
  ['🎒', '书包', 'Backpack'], ['👞', '男鞋', 'Man\'s Shoe'],
  ['👟', '运动鞋', 'Running Shoe'], ['🥾', '登山靴', 'Hiking Boot'],
  ['🥿', '平底鞋', 'Flat Shoe'], ['👠', '高跟鞋', 'High-Heeled Shoe'],
  ['👡', '凉鞋', 'Woman\'s Sandal'], ['👢', '长靴', 'Woman\'s Boot'],
  ['👑', '皇冠', 'Crown'], ['👒', '女帽', 'Woman\'s Hat'],
  ['🎩', '礼帽', 'Top Hat'], ['🎓', '毕业帽', 'Graduation Cap'],
  ['🧢', '棒球帽', 'Billed Cap'], ['⛑️', '救援头盔', 'Rescue Worker\'s Helmet'],
  ['💄', '口红', 'Lipstick'], ['💍', '戒指', 'Ring'],
  ['🌂', '折叠伞', 'Closed Umbrella'],

  ],

  // 符号 symbols
  symbols: [
  ['❤️', '红心', 'Red Heart'], ['🧡', '橙心', 'Orange Heart'],
  ['💛', '黄心', 'Yellow Heart'], ['💚', '绿心', 'Green Heart'],
  ['💙', '蓝心', 'Blue Heart'], ['💜', '紫心', 'Purple Heart'],
  ['🖤', '黑心', 'Black Heart'], ['🤍', '白心', 'White Heart'],
  ['🤎', '棕心', 'Brown Heart'], ['💔', '心碎', 'Broken Heart'],
  ['❣️', '心感叹号', 'Heart Exclamation'], ['💕', '两颗心', 'Two Hearts'],
  ['💞', '旋转的心', 'Revolving Hearts'], ['💓', '心跳', 'Beating Heart'],
  ['💗', '成长的心', 'Growing Heart'], ['💖', '闪亮的心', 'Sparkling Heart'],
  ['💘', '丘比特之箭', 'Heart with Arrow'], ['💝', '蝴蝶结心', 'Heart with Ribbon'],
  ['💟', '心形装饰', 'Heart Decoration'], ['☮️', '和平符号', 'Peace Symbol'],
  ['✝️', '拉丁十字', 'Latin Cross'], ['☪️', '星月', 'Star and Crescent'],
  ['🕉️', '唵', 'Om'], ['☸️', '法轮', 'Wheel of Dharma'],
  ['✡️', '大卫之星', 'Star of David'], ['🔯', '六芒星', 'Dotted Six-Pointed Star'],
  ['🕎', '烛台', 'Menorah'], ['☯️', '阴阳', 'Yin Yang'],
  ['☦️', '东正教十字', 'Orthodox Cross'], ['🛐', '礼拜堂', 'Place of Worship'],
  ['⛎', '蛇夫座', 'Ophiuchus'], ['♈', '白羊座', 'Aries'],
  ['♉', '金牛座', 'Taurus'], ['♊', '双子座', 'Gemini'],
  ['♋', '巨蟹座', 'Cancer'], ['♌', '狮子座', 'Leo'],
  ['♍', '处女座', 'Virgo'], ['♎', '天秤座', 'Libra'],
  ['♏', '天蝎座', 'Scorpio'], ['♐', '射手座', 'Sagittarius'],
  ['♑', '摩羯座', 'Capricorn'], ['♒', '水瓶座', 'Aquarius'],
  ['♓', '双鱼座', 'Pisces'], ['🆔', 'ID 标识', 'ID Button'],
  ['⚛️', '原子符号', 'Atom Symbol'], ['🉑', '可以', 'Japanese Acceptable Button'],
  ['☢️', '辐射', 'Radioactive'], ['☣️', '生物危害', 'Biohazard'],
  ['📴', '关机', 'Mobile Phone Off'], ['📳', '振动', 'Mobile Phone Vibration'],
  ['🈶', '有偿', 'Japanese Not Free of Charge Button'], ['🈚', '无偿', 'Japanese Free of Charge Button'],
  ['🈸', '申请', 'Japanese Application Button'], ['🈺', '营业', 'Japanese Open for Business Button'],
  ['🈷️', '月费', 'Japanese Monthly Amount Button'], ['✴️', '八角星', 'Eight-Pointed Star'],
  ['🆚', '对战', 'VS Button'], ['💮', '合格花章', 'White Flower'],
  ['🉐', '划算', 'Japanese Bargain Button'], ['㊙️', '秘密', 'Japanese Secret Button'],
  ['㊗️', '祝贺', 'Japanese Congratulations Button'], ['🈴', '合格', 'Japanese Passing Grade Button'],
  ['🈵', '满员', 'Japanese Full Moon Button'], ['🈹', '折扣', 'Japanese Discount Button'],
  ['🈲', '禁止', 'Japanese Prohibited Button'], ['🅰️', 'A 型血', 'A Blood Type'],
  ['🅱️', 'B 型血', 'B Blood Type'], ['🆎', 'AB 型血', 'AB Blood Type'],
  ['🆑', 'CL 按钮', 'CL Button'], ['🅾️', 'O 型血', 'O Blood Type'],
  ['🆘', 'SOS', 'SOS Button'], ['❌', '叉号', 'Cross Mark'],
  ['⭕', '圈号', 'Hollow Red Circle'], ['🛑', '停止', 'Stop Sign'],
  ['⛔', '禁止进入', 'No Entry'], ['📛', '名牌', 'Name Badge'],
  ['🚫', '禁止标志', 'Prohibited'], ['💯', '一百分', 'Hundred Points'],
  ['💢', '怒气', 'Anger Symbol'], ['♨️', '温泉', 'Hot Springs'],
  ['🚷', '禁止行人', 'No Pedestrians'], ['🚯', '禁止乱丢', 'No Littering'],
  ['🚳', '禁止自行车', 'No Bicycles'], ['🚱', '非饮用水', 'Non-Potable Water'],
  ['🔞', '十八禁', 'No One Under Eighteen'], ['📵', '禁止手机', 'No Mobile Phones'],
  ['🚭', '禁止吸烟', 'No Smoking'], ['❗', '红色感叹号', 'Red Exclamation Mark'],
  ['❕', '白色感叹号', 'White Exclamation Mark'], ['❓', '红色问号', 'Red Question Mark'],
  ['❔', '白色问号', 'White Question Mark'], ['‼️', '双感叹号', 'Double Exclamation Mark'],
  ['⁉️', '感叹问号', 'Exclamation Question Mark'], ['🔅', '调暗', 'Dim Button'],
  ['🔆', '调亮', 'Bright Button'], ['〽️', '交替符号', 'Part Alternation Mark'],
  ['⚠️', '警告', 'Warning'], ['🚸', '儿童过街', 'Children Crossing'],
  ['🔱', '三叉戟', 'Trident Emblem'], ['⚜️', '百合花饰', 'Fleur-de-lis'],
  ['🔰', '新手标记', 'Japanese Symbol for Beginner'], ['♻️', '回收', 'Recycling Symbol'],
  ['✅', '对勾', 'Check Mark Button'], ['🈯', '指', 'Japanese Reserved Button'],
  ['💹', '上涨图表', 'Chart Increasing with Yen'], ['❇️', '闪光', 'Sparkle'],
  ['✳️', '八瓣星', 'Eight-Spoked Asterisk'], ['❎', '叉号按钮', 'Cross Mark Button'],
  ['🌐', '地球', 'Globe with Meridians'], ['💠', '菱形花', 'Diamond with a Dot'],
  ['Ⓜ️', 'M 圆圈', 'Circled M'], ['🌀', '旋风', 'Cyclone'],
  ['💤', '睡觉符号', 'ZZZ'], ['🏧', 'ATM', 'ATM Sign'],
  ['🚾', '卫生间', 'Water Closet'], ['♿', '无障碍', 'Wheelchair Symbol'],
  ['🅿️', '停车场', 'P Button'], ['🛗', '电梯', 'Elevator'],
  ['🈳', '空位', 'Japanese Vacancy Button'], ['🈂️', '服务费', 'Japanese Service Charge Button'],
  ['🛂', '护照检查', 'Passport Control'], ['🛃', '海关', 'Customs'],
  ['🛄', '行李提取', 'Baggage Claim'], ['🛅', '行李寄存', 'Left Luggage'],
  ['🚹', '男厕', 'Men\'s Room'], ['🚺', '女厕', 'Women\'s Room'],
  ['🚼', '婴儿', 'Baby Symbol'], ['🚻', '卫生间', 'Restroom'], ['🚮', '丢垃圾', 'Litter in Bin Sign'],
  ['🎦', '影院', 'Cinema'], ['📶', '信号', 'Antenna Bars'],
  ['🈁', '片假名标示', 'Japanese Here Button'], ['🔣', '符号输入', 'Input Symbols'],
  ['ℹ️', '信息', 'Information'], ['🔤', '字母输入', 'Input Latin Letters'],
  ['🔡', '小写输入', 'Input Latin Lowercase'], ['🔠', '大写输入', 'Input Latin Uppercase'],
  ['🆖', 'NG 按钮', 'NG Button'], ['🆗', 'OK 按钮', 'OK Button'],
  ['🆙', 'UP 按钮', 'UP! Button'], ['🆒', 'COOL 按钮', 'COOL Button'],
  ['🆕', 'NEW 按钮', 'NEW Button'], ['🆓', 'FREE 按钮', 'FREE Button'],
  ['0️⃣', '数字 0', 'Keycap Digit Zero'], ['1️⃣', '数字 1', 'Keycap Digit One'],
  ['2️⃣', '数字 2', 'Keycap Digit Two'], ['3️⃣', '数字 3', 'Keycap Digit Three'],
  ['4️⃣', '数字 4', 'Keycap Digit Four'], ['5️⃣', '数字 5', 'Keycap Digit Five'],
  ['6️⃣', '数字 6', 'Keycap Digit Six'], ['7️⃣', '数字 7', 'Keycap Digit Seven'],
  ['8️⃣', '数字 8', 'Keycap Digit Eight'], ['9️⃣', '数字 9', 'Keycap Digit Nine'],
  ['🔟', '数字 10', 'Keycap Digit Ten'], ['🔢', '数字输入', 'Input Numbers'],
  ['#️⃣', '井号键', 'Keycap Number Sign'], ['*️⃣', '星号键', 'Keycap Asterisk'],
  ['⏏️', '弹出', 'Eject Button'], ['▶️', '播放', 'Play Button'],
  ['⏸️', '暂停', 'Pause Button'], ['⏯️', '播放暂停', 'Play or Pause Button'],
  ['⏹️', '停止', 'Stop Button'], ['⏺️', '录制', 'Record Button'],
  ['⏭️', '下一曲', 'Next Track Button'], ['⏮️', '上一曲', 'Previous Track Button'],
  ['⏩', '快进', 'Fast Forward Button'], ['⏪', '快退', 'Fast Reverse Button'],
  ['⏫', '快上', 'Fast Up Button'], ['⏬', '快下', 'Fast Down Button'],
  ['◀️', '后退', 'Reverse Button'], ['🔼', '向上', 'Upwards Button'],
  ['🔽', '向下', 'Downwards Button'], ['➡️', '右箭头', 'Right Arrow'],
  ['⬅️', '左箭头', 'Left Arrow'], ['⬆️', '上箭头', 'Up Arrow'],
  ['⬇️', '下箭头', 'Down Arrow'], ['↗️', '右上箭头', 'Up-Right Arrow'],
  ['↘️', '右下箭头', 'Down-Right Arrow'], ['↙️', '左下箭头', 'Down-Left Arrow'],
  ['↖️', '左上箭头', 'Up-Left Arrow'], ['↕️', '上下箭头', 'Up-Down Arrow'],
  ['↔️', '左右箭头', 'Left-Right Arrow'], ['↩️', '左弯箭头', 'Right Arrow Curving Left'],
  ['↪️', '右弯箭头', 'Left Arrow Curving Right'], ['⤴️', '右上弯箭头', 'Right Arrow Curving Up'],
  ['⤵️', '右下弯箭头', 'Right Arrow Curving Down'], ['🔃', '顺时针箭头', 'Clockwise Vertical Arrows'],
  ['🔄', '逆时针箭头', 'Counterclockwise Arrows Button'], ['🔙', 'BACK 箭头', 'BACK Arrow'],
  ['🔚', 'END 箭头', 'END Arrow'], ['🔛', 'ON! 箭头', 'ON! Arrow'],
  ['🔜', 'SOON 箭头', 'SOON Arrow'], ['🔝', 'TOP 箭头', 'TOP Arrow'],
  ['🔀', '随机播放', 'Shuffle Tracks Button'], ['🔁', '循环播放', 'Repeat Button'],
  ['🔂', '单曲循环', 'Repeat Single Button'], ['🕐', '一点钟', 'One O\'Clock'],
  ['🕑', '两点钟', 'Two O\'Clock'], ['🕒', '三点钟', 'Three O\'Clock'],
  ['🕓', '四点钟', 'Four O\'Clock'], ['🕔', '五点钟', 'Five O\'Clock'],
  ['🕕', '六点钟', 'Six O\'Clock'], ['🕖', '七点钟', 'Seven O\'Clock'],
  ['🕗', '八点钟', 'Eight O\'Clock'], ['🕘', '九点钟', 'Nine O\'Clock'],
  ['🕙', '十点钟', 'Ten O\'Clock'], ['🕚', '十一点钟', 'Eleven O\'Clock'],
  ['🕛', '十二点钟', 'Twelve O\'Clock'],

  ],

  // 旗帜 flags
  flags: [
  ['🏁', '终点旗', 'Chequered Flag'], ['🚩', '三角旗', 'Triangular Flag'],
  ['🎌', '日本国旗交叉', 'Crossed Flags'], ['🏴', '黑旗', 'Black Flag'],
  ['🏳️', '白旗', 'White Flag'], ['🏳️‍🌈', '彩虹旗', 'Rainbow Flag'],
  ['☠️', '骷髅旗', 'Pirate Flag'], ['🇨🇳', '中国', 'China'],
  ['🇺🇸', '美国', 'United States'], ['🇯🇵', '日本', 'Japan'],
  ['🇰🇷', '韩国', 'South Korea'], ['🇬🇧', '英国', 'United Kingdom'],
  ['🇫🇷', '法国', 'France'], ['🇩🇪', '德国', 'Germany'],
  ['🇮🇹', '意大利', 'Italy'], ['🇪🇸', '西班牙', 'Spain'],
  ['🇷🇺', '俄罗斯', 'Russia'], ['🇧🇷', '巴西', 'Brazil'],
  ['🇮🇳', '印度', 'India'], ['🇨🇦', '加拿大', 'Canada'],
  ['🇦🇺', '澳大利亚', 'Australia'], ['🇸🇬', '新加坡', 'Singapore'],
  ['🇭🇰', '中国香港', 'Hong Kong'], ['🇲🇴', '中国澳门', 'Macao'],
  ['🇹🇼', '中国台湾', 'Taiwan'], ['🇹🇭', '泰国', 'Thailand'],
  ['🇻🇳', '越南', 'Vietnam'], ['🇲🇾', '马来西亚', 'Malaysia'],
  ['🇮🇩', '印度尼西亚', 'Indonesia'], ['🇵🇭', '菲律宾', 'Philippines'],
  ['🇳🇿', '新西兰', 'New Zealand'], ['🇺🇳', '联合国', 'United Nations'],
  ['🇪🇺', '欧盟', 'European Union'], ['🇨🇭', '瑞士', 'Switzerland'],
  ['🇳🇱', '荷兰', 'Netherlands'], ['🇸🇪', '瑞典', 'Sweden'],
  ['🇳🇴', '挪威', 'Norway'], ['🇫🇮', '芬兰', 'Finland'],
  ['🇵🇹', '葡萄牙', 'Portugal'], ['🇵🇱', '波兰', 'Poland'],
  ['🇹🇷', '土耳其', 'Turkey'], ['🇸🇦', '沙特阿拉伯', 'Saudi Arabia'],
  ['🇦🇪', '阿联酋', 'United Arab Emirates'], ['🇲🇽', '墨西哥', 'Mexico'],
  ['🇦🇷', '阿根廷', 'Argentina'], ['🇿🇦', '南非', 'South Africa'],
  ['🇪🇬', '埃及', 'Egypt'], ['🇰🇵', '朝鲜', 'North Korea']
  ]
}

// --- 组装数据 ---
const emojis = Object.entries(EMOJI_DATA).flatMap(([cat, list]) =>
  list.map(([c, zh, en]) => ({ c, zh, en, cat }))
)

// --- 分类标签映射 ---
const catMap = Object.fromEntries(categories.map(c => [c.key, c.label]))

// --- 状态 ---
const query = ref('')
const activeCat = ref('all')
const selected = ref(null)
const error = ref('')
const success = ref('')

// --- 过滤 ---
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return emojis.filter(item => {
    if (activeCat.value !== 'all' && item.cat !== activeCat.value) return false
    if (!q) return true
    return (
      item.zh.toLowerCase().includes(q) ||
      item.en.toLowerCase().includes(q) ||
      item.c.includes(q) ||
      cpString(item.c).toLowerCase().includes(q)
    )
  })
})

// --- 工具函数 ---
function cpString(str) {
  return Array.from(str).map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')
}

function utf8String(str) {
  const bytes = new TextEncoder().encode(str)
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}

function htmlEntity(str) {
  return Array.from(str).map(ch => '&#x' + ch.codePointAt(0).toString(16).toUpperCase() + ';').join('')
}

function cssEscape(str) {
  return Array.from(str).map(ch => '\\' + ch.codePointAt(0).toString(16).toUpperCase().padStart(6, '0')).join('')
}

function catLabel(key) {
  return catMap[key] || key
}

// --- 交互 ---
function switchCategory(key) {
  activeCat.value = key
}

async function selectEmoji(item) {
  selected.value = item
  const ok = await copyText(item.c)
  if (ok) {
    success.value = `已复制 ${item.c} ${item.zh}`
    error.value = ''
  } else {
    error.value = '复制失败，请手动选择复制'
    success.value = ''
  }
}

async function copyValue(text) {
  const ok = await copyText(text)
  if (ok) {
    success.value = '已复制到剪贴板'
    error.value = ''
  } else {
    error.value = '复制失败，请手动选择复制'
    success.value = ''
  }
}

async function copyAll() {
  const text = filtered.value.map(item => item.c).join('')
  const ok = await copyText(text)
  if (ok) {
    success.value = `已复制 ${filtered.value.length} 个 Emoji`
    error.value = ''
  } else {
    error.value = '复制失败，请手动选择复制'
    success.value = ''
  }
}
</script>

<style scoped>
/* === 分类按钮组 === */
.cat-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.cat-btn {
  padding: 6px 12px;
  min-height: 32px;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.cat-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.cat-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

/* === 列表元信息 === */
.list-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 12px 0 8px;
}

.list-count {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.copy-btn-inline {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
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

/* === Emoji 网格 === */
.emoji-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 6px;
  overflow-y: auto;
  padding: 2px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  flex: 1;
  min-height: 200px;
  max-height: 460px;
}

.emoji-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
  padding: 8px 4px;
  background: var(--panel);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 0;
}

.emoji-cell:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 10px var(--green-glow);
  transform: scale(1.08);
}

.emoji-cell.active {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.list-empty {
  grid-column: 1 / -1;
  padding: 32px 12px;
  text-align: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
}

/* === 右侧详情 === */
.detail-card {
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 16px;
  flex: 1;
}

.detail-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  line-height: 1;
  padding: 20px 0;
  margin-bottom: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  user-select: all;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  flex-wrap: wrap;
}

.detail-label {
  flex-shrink: 0;
  width: 90px;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--muted);
}

.detail-value {
  flex: 1;
  min-width: 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-card .button-group {
  margin-top: 16px;
  margin-bottom: 0;
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

/* === 滚动条 === */
.emoji-list::-webkit-scrollbar {
  width: 6px;
}

.emoji-list::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-list::-webkit-scrollbar-thumb {
  background: var(--line);
}

.emoji-list::-webkit-scrollbar-thumb:hover {
  background: var(--line-strong);
}

/* === 响应式 === */
@media (max-width: 640px) {
  .emoji-list {
    max-height: 320px;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  }

  .emoji-cell {
    font-size: 22px;
  }

  .detail-preview {
    font-size: 56px;
  }

  .detail-label {
    width: 76px;
    font-size: 11px;
  }
}
</style>
