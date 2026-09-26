<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>💻 终端模拟器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 双栏：左 = 命令输入与控制，右 = 终端窗口 -->
        <div class="tool-two-col">
          <!-- ============ 左栏：命令输入 ============ -->
          <div class="tool-col">
            <div class="term-head">
              <label class="tool-label">命令输入：</label>
              <button class="copy-btn" title="复制当前命令" @click="copyCommand">📋</button>
            </div>
            <div class="term-input-wrap">
              <input
                v-model="commandInput"
                class="code-input-sm"
                type="text"
                spellcheck="false"
                autocomplete="off"
                placeholder="输入命令后回车执行，如 help"
                @keyup.enter="runLeft"
              />
            </div>
            <div class="term-hint">回车执行 · 支持 help / ls / cd / cat / echo / cowsay / neofetch 等</div>

            <div class="config-section term-opts">
              <div class="config-row">
                <span class="cfg-label">用户名</span>
                <input v-model="user" class="code-input-sm term-sm" type="text" spellcheck="false" maxlength="16" />
                <span class="cfg-label">主机名</span>
                <input v-model="host" class="code-input-sm term-sm" type="text" spellcheck="false" maxlength="16" />
              </div>
              <div class="config-row">
                <label class="checkbox-label">
                  <input v-model="bootBanner" type="checkbox" />
                  <span>开机自检动画</span>
                </label>
                <label class="checkbox-label">
                  <input v-model="verbose" type="checkbox" checked />
                  <span>目录列表着色</span>
                </label>
              </div>
            </div>

            <label class="tool-label">快捷命令：</label>
            <div class="chip-grid">
              <button
                v-for="c in quickCommands"
                :key="c.cmd"
                class="term-chip"
                :title="c.cmd"
                @click="runString(c.cmd)"
              >{{ c.label }}</button>
            </div>
          </div>

          <!-- ============ 右栏：终端窗口 ============ -->
          <div class="tool-col">
            <div class="term-head">
              <label class="tool-label">终端会话：</label>
              <button class="copy-btn" title="复制全部会话内容" @click="copyTranscript">📋</button>
            </div>
            <div class="term-window" @click="focusTerm">
              <div class="term-titlebar">
                <span class="term-dots">
                  <i class="td td-red"></i><i class="td td-amber"></i><i class="td td-green"></i>
                </span>
                <span class="term-title">{{ user }}@{{ host }}: {{ dispPathStr() }}</span>
                <span class="term-brand">403.li</span>
              </div>
              <div ref="screenEl" class="term-screen">
                <div class="term-lines">
                  <div
                    v-for="(line, i) in lines"
                    :key="i"
                    class="term-line"
                    :class="'tl-' + line.kind"
                  >
                    <template v-for="(s, j) in line.segs" :key="j">
                      <span
                        v-if="s.c"
                        :class="['c-' + s.c, { 'seg-art': s.art, 'nf-pad': s.pad }]"
                      >{{ s.t }}</span>
                      <span
                        v-else
                        :class="{ 'seg-art': s.art, 'nf-pad': s.pad }"
                      >{{ s.t }}</span>
                    </template>
                  </div>
                  <div class="term-line term-prompt-line">
                    <span
                      v-for="(ps, j) in promptSegs()"
                      :key="'p' + j"
                      :class="'c-' + ps.c"
                    >{{ ps.t }}</span>
                    <input
                      ref="termInput"
                      v-model="typed"
                      class="term-input"
                      type="text"
                      spellcheck="false"
                      autocomplete="off"
                      autocapitalize="off"
                      placeholder="输入 help 查看命令…"
                      @keydown="onKey"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="term-hint">
              点击终端窗口聚焦直接输入 · ↑/↓ 历史 · Tab 补全 · Ctrl+L 清屏 · 鼠标可选中复制
            </div>
          </div>
        </div>

        <!-- 全宽按钮区 -->
        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="runLeft">▶ 运行命令</button>
          <button class="tool-button danger" @click="doClear">🗑️ 清空会话</button>
        </div>

        <div v-if="msg" :class="msgOk ? 'status-success' : 'status-error'">{{ msg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

/* ================= 状态 ================= */
const user = ref('guest')
const host = ref('403li')
const bootBanner = ref(true)
const verbose = ref(true)
const commandInput = ref('')
const typed = ref('')
const lines = ref([])
const history = ref([])
const historyIdx = ref(-1)
const draft = ref('')
const msg = ref('')
const msgOk = ref(true)
let msgTimer = null
let bootTimers = []
const screenEl = ref(null)
const termInput = ref(null)

const sessionStart = Date.now()

/* ================= 虚拟文件系统（只读） ================= */
/* 每个目录节点：{ dirs: {name: node}, files: {name: 内容字符串} } */
const FS = {
  dirs: {
    home: {
      dirs: {
        guest: {
          dirs: {
            docs: {
              dirs: {},
              files: {
                'guide.md': `# 终端模拟器使用指南
1. help —— 查看全部命令
2. ls -l —— 查看详细列表
3. cat 文件 —— 查看文件内容
4. cd 目录 —— 切换工作目录
5. clear —— 清空屏幕`
              }
            },
            projects: {
              dirs: {
                'game-of-life': { dirs: {}, files: {} },
                'terminal-sim': { dirs: {}, files: {} }
              },
              files: {
                'README.md': `这里存放 403.li 的未解之谜（其实啥也没有）。
子目录仅供 cd / ls 练习使用。`
              }
            }
          },
          files: {
            'README.md': `# 403.li Terminal Simulator
这是一个纯前端实现的仿真终端，没有连接任何后端。

# 快速上手
- 输入 help 查看全部可用命令
- ↑ / ↓ 浏览历史命令，Tab 自动补全
- Ctrl + L 或输入 clear 清屏

# 试试这些
- ls -la
- cat .bashrc
- cowsay 你好，终端世界
- neofetch`,
            'notes.txt': `403.li 工具站开发笔记
- 纯前端是原则，浏览器即沙箱
- 颜色纪律：绿色是唯一的光
- 圆角是敌人，直角是信仰
- TODO：把 403 做成一个动词`,
            '.secret.txt': `恭喜你找到了隐藏彩蛋 🥚
成就解锁：火眼金睛（cat 隐藏文件）
奖励口令：403-forbidden-easter-egg`,
            '.bashrc': `# ~/.bashrc —— 每次打开终端自动加载
alias ll='ls -l'
alias la='ls -a'
alias 403='echo "Forbidden？不，这里是 403.li"'
export PS1='\\u@\\h:\\w\\$ '
export EDITOR=vim`,
            '.gitconfig': `[user]
  name = 403.li
  email = hello@403.li
[core]
  editor = vim
  autocrlf = input`,
            'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>403.li</title>
</head>
<body>
  <p>403 Forbidden — 但你可以继续浏览。</p>
</body>
</html>`,
            'style.css': `:root {
  --green: #9dff6b;  /* 主题光 */
  --line: #30363d;
}
body {
  background: #0d1117;
  color: var(--text);
}`,
            'app.js': `// 403.li 前端脚本
console.log('403 Forbidden — 403.li 欢迎你');
document.title = '403.li · 工具站';`,
            'package.json': `{
  "name": "403-li",
  "version": "1.0.0",
  "private": true,
  "description": "纯前端工具站，绿色主题，直角美学",
  "license": "MIT"
}`
          }
        }
      },
      files: {}
    },
    etc: {
      dirs: {},
      files: {
        hosts: `127.0.0.1   localhost
127.0.0.1   terminal.403.li
::1         localhost ip6-localhost
# 别把 403.li 解析到别处，懂？`,
        'os-release': `PRETTY_NAME="403.li OS (Cyb0rg)"
NAME=403.li OS
ID=403li
VERSION_ID=1.0.3
VERSION_CODENAME=forbidden
HOME_URL=https://403.li`,
        motd: '欢迎使用 403.li 终端模拟器。\n今天也要写纯前端哦。'
      }
    },
    tmp: {
      dirs: {},
      files: {
        'hello.txt': '我是 /tmp/hello.txt，重启即消失（这里不会，因为都是假的）。'
      }
    }
  },
  files: {
    '403.txt': 'Forbidden？才怪。\n这只是一行可以随便 cat 的文本。'
  }
}

const cwd = ref(['home', 'guest'])
let prevDir = null

/* ================= 小工具 ================= */
const HOME_PATH = () => ['home', user.value]
const homeStr = () => '/' + HOME_PATH().join('/')

function dispPathStr() {
  const arr = cwd.value
  const home = HOME_PATH()
  if (arr.length >= home.length && home.every((p, i) => arr[i] === p)) {
    return '~' + (arr.length > home.length ? '/' + arr.slice(home.length).join('/') : '')
  }
  return '/' + arr.join('/')
}

function seg(t, c = '') {
  return { t: String(t), c }
}
function artSeg(t, cls) {
  return { t: String(t), c: cls, art: true }
}
function padSeg(n) {
  return { t: ' '.repeat(n), c: '', pad: true }
}
function pushLine(segsList, kind = 'out') {
  lines.value.push({ segs: segsList, kind })
  while (lines.value.length > 600) lines.value.shift()
  scrollBottom()
}
function printErr(text) {
  pushLine([seg(text, 'err')], 'err')
}
function printDim(text) {
  pushLine([seg(text, 'dim')], 'out')
}
function promptSegs() {
  return [
    seg(user.value, 'user'),
    seg('@', 'mut'),
    seg(host.value, 'host'),
    seg(':' + dispPathStr(), 'path'),
    seg(' $ ', 'dollar')
  ]
}
function promptStr() {
  return `${user.value}@${host.value}:${dispPathStr()} $ `
}
async function scrollBottom() {
  await nextTick()
  const el = screenEl.value
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  if (nearBottom) el.scrollTop = el.scrollHeight
}
function flash(text, ok = true) {
  msg.value = (ok ? '✅ ' : '❌ ') + text
  msgOk.value = ok
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { msg.value = '' }, 2200)
}

/* ================= 复制 ================= */
async function copyText(text) {
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
    flash('已复制到剪贴板')
  } catch (e) {
    flash('复制失败，请手动选择复制', false)
  }
}
function copyCommand() {
  copyText(commandInput.value.trim() || typed.value.trim() || promptStr())
}
function copyTranscript() {
  const txt = lines.value
    .map(l => {
      if (l.kind === 'cmd') {
        const prompt = l.segs.slice(0, -1).map(s => s.t).join('')
        return prompt + l.segs[l.segs.length - 1].t
      }
      return l.segs.map(s => s.t).join('').replace(/\s+$/, '')
    })
    .filter(t => t.trim() !== '')
    .join('\n')
  copyText(txt)
}

/* ================= 路径解析 ================= */
function resolveParts(base, target) {
  let path
  if (target === '~') {
    path = [...HOME_PATH()]
  } else if (target.startsWith('~/')) {
    path = [...HOME_PATH(), ...target.slice(2).split('/').filter(s => s)]
  } else if (target.startsWith('/')) {
    path = [...target.split('/').filter(s => s)]
  } else {
    path = [...base]
    for (const s of target.split('/')) {
      if (!s || s === '.') continue
      if (s === '..') { if (path.length) path.pop(); continue }
      if (s === '-') {
        if (!prevDir) return { err: 'OLDPWD 未设置，还没有上一个目录' }
        return { path: [...prevDir] }
      }
      path.push(s)
    }
  }
  return { path }
}
/* 解析路径：返回 { kind:'dir', node } | { kind:'file', content } | { err } */
function resolvePath(base, target) {
  const r = resolveParts(base, target)
  if (r.err) return r
  const parts = r.path
  if (!parts.length) return { kind: 'dir', node: FS }
  let cur = FS
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const isLast = i === parts.length - 1
    if (cur.dirs && p in cur.dirs) {
      cur = cur.dirs[p]
      continue
    }
    if (cur.files && p in cur.files) {
      if (isLast) return { kind: 'file', content: cur.files[p] }
      return { err: '不是目录' }
    }
    return { err: '没有那个文件或目录' }
  }
  return { kind: 'dir', node: cur }
}
function resolveDirAt(pathArr) {
  let cur = FS
  for (const p of pathArr) {
    cur = cur.dirs && cur.dirs[p]
    if (!cur) return null
  }
  return cur
}

/* ================= 命令执行 ================= */
function runLeft() {
  const v = commandInput.value
  if (v.trim()) {
    execute(v)
    commandInput.value = ''
  } else if (typed.value.trim()) {
    execute(typed.value)
    typed.value = ''
  }
}
function runString(cmd) {
  execute(cmd)
}
function execute(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return
  history.value.push(trimmed)
  if (history.value.length > 200) history.value.shift()
  historyIdx.value = -1
  pushLine([...promptSegs(), seg(trimmed, 'bold')], 'cmd')

  const parts = trimmed.split(/\s+/)
  let name = parts[0].toLowerCase()
  if (name === 'll') {
    name = 'ls'
    parts.splice(1, 0, '-l')
  }
  const rest = trimmed.slice(parts[0].length).trim()

  const registry = cmdRegistry()
  if (name === 'clear' || name === 'cls') { doClear(); return }
  if (registry[name]) { registry[name](parts, rest); return }

  pushLine([seg(`bash: ${name}: 未找到命令`, 'err')], 'err')
  pushLine([seg('（输入 help 查看可用命令列表，命令名可用 Tab 补全）', 'dim')], 'out')
}

/* ================= 命令注册表 ================= */
function cmdRegistry() {
  return {
    help(parts) {
      const topic = parts[1]
      if (topic) {
        if (CMD_HELP[topic]) {
          pushLine([seg(' ' + topic.padEnd(11), 'green'), seg(CMD_HELP[topic], '')], 'out')
        } else {
          pushLine([seg(`help: 没有关于 “${topic}” 的帮助（试试 help 看全部命令）`, 'dim')], 'out')
        }
        return
      }
      const names = Object.keys(CMD_HELP).sort()
      pushLine([seg('可用命令列表：', 'bold')], 'out')
      names.forEach(n => {
        pushLine([seg('  ' + n.padEnd(11), 'green'), seg(' ' + CMD_HELP[n], '')], 'out')
      })
      pushLine([seg('', '')], 'out')
      pushLine([
        seg('  ↑/↓ ', 'green'), seg('历史命令', ''),
        seg('   Tab ', 'green'), seg('自动补全', ''),
        seg('   Ctrl+L ', 'green'), seg('清屏', '')
      ], 'out')
    },
    ls(parts) {
      const args = parts.slice(1)
      const flags = { a: false, l: false }
      args.forEach(a => {
        if (!a.startsWith('-')) return
        a.slice(1).split('').forEach(ch => { if (ch in flags) flags[ch] = true })
      })
      const target = args.find(a => !a.startsWith('-'))

      // 解析目标目录
      let node
      let entryName = null
      if (!target) {
        node = resolveDirAt(cwd.value)
      } else {
        const r = resolvePath(cwd.value, target)
        if (r.err) {
          pushLine([seg(`ls: ${target}: ${r.err}`, 'err')], 'err')
          return
        }
        if (r.kind === 'file') {
          pushLine([seg(target.split('/').pop(), 'file')], 'out')
          return
        }
        node = r.node
      }

      const dirs = node.dirs ? Object.keys(node.dirs) : []
      const files = node.files ? Object.keys(node.files) : []
      let entries = [
        ...dirs.map(d => ({ name: d, dir: true })),
        ...files.map(f => ({ name: f, dir: false }))
      ]
      if (!flags.a) entries = entries.filter(e => !e.name.startsWith('.'))
      if (!entries.length) { pushLine([seg('（空目录）', 'dim')], 'out'); return }
      entries.sort((x, y) => {
        if (x.dir !== y.dir) return x.dir ? -1 : 1
        return x.name.localeCompare(y.name)
      })

      if (flags.l) {
        const d = new Date()
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        let total = 0
        entries.forEach(e => { total += e.dir ? 4096 : byteLen(node.files[e.name] || '') })
        pushLine([seg(`total ${total}`, 'dim')], 'out')
        entries.forEach(e => {
          const size = e.dir ? 4096 : byteLen(node.files[e.name] || '')
          const mode = e.dir ? 'drwxr-xr-x' : (e.name.endsWith('.sh') ? '-rwxr-xr-x' : '-rw-r--r--')
          pushLine([
            seg(`${mode}   1 ${user.value.padEnd(6)} ${user.value.padEnd(6)} ${String(size).padStart(6)} ${ds} 12:00 `, 'dim'),
            seg(e.name, e.dir ? 'dir' : (e.name.startsWith('.') ? 'dim' : 'file'))
          ], 'out')
        })
        return
      }

      // 普通列表：每行 4 列按列宽对齐
      const colW = Math.min(24, Math.max(8, ...entries.map(e => e.name.length)) + 2)
      for (let i = 0; i < entries.length; i += 4) {
        const row = entries.slice(i, i + 4).map(e => {
          const cls = e.dir ? 'dir' : (e.name.startsWith('.') ? 'dim' : 'file')
          return seg(e.name.padEnd(colW), verbose.value ? cls : '')
        })
        pushLine(row, 'out')
      }
    },
    cd(parts) {
      const target = parts[1]
      if (!target || target === '~' || target === '~/') {
        cwd.value = [...HOME_PATH()]
        return
      }
      const r = resolvePath(cwd.value, target)
      if (r.err || r.kind === 'file') {
        printErr(`bash: cd: ${target}: ${r.err || '不是目录'}`)
        return
      }
      const newPath = resolveParts(cwd.value, target).path
      prevDir = [...cwd.value]
      cwd.value = newPath
    },
    pwd() {
      pushLine([seg('/' + cwd.value.join('/'), 'bold')], 'out')
    },
    cat(parts) {
      const targets = parts.slice(1)
      if (!targets.length) {
        pushLine([seg('用法：cat <文件> [文件...]', 'dim')], 'out')
        return
      }
      targets.forEach(t => {
        const r = resolvePath(cwd.value, t)
        if (r.err) {
          printErr(`cat: ${t}: ${r.err}`)
          return
        }
        if (r.kind === 'dir') {
          printErr(`cat: ${t}: 是一个目录`)
          return
        }
        if (targets.length > 1) pushLine([seg(`==> ${t} <==`, 'mut')], 'out')
        classifyLines(r.content).forEach(cl => pushLine([seg(cl.t, cl.c)], 'out'))
      })
    },
    echo(parts, rest) {
      if (!rest) { pushLine([seg('', '')], 'out'); return }
      let text = rest
      const m = text.match(/^(['"])([\s\S]*)\1$/)
      if (m) text = m[2]
      pushLine([seg(expandVars(text), '')], 'out')
    },
    date() {
      const d = new Date()
      const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
      const pad = n => String(n).padStart(2, '0')
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      pushLine([
        seg(`${d.getFullYear()}年 ${pad(d.getMonth() + 1)}月 ${pad(d.getDate())}日 星期${wd} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, ''),
        seg(` ${tz}`, 'dim')
      ], 'out')
    },
    whoami() { pushLine([seg(user.value, 'green')], 'out') },
    hostname() { pushLine([seg(host.value, 'green')], 'out') },
    uname(parts) {
      const all = parts.some(p => p === '-a' || p === '--all')
      if (all) {
        pushLine([seg(`Linux ${host.value} 6.6.43-403li #1 SMP 2026 x86_64 GNU/Linux（纯前端模拟）`, '')], 'out')
      } else {
        pushLine([seg('Linux', 'green')], 'out')
      }
    },
    history(parts) {
      if (parts[1] === '-c') {
        history.value = []
        pushLine([seg('历史记录已清空', 'dim')], 'out')
        return
      }
      history.value.forEach((h, i) => {
        pushLine([seg(String(i + 1).padStart(4), 'dim'), seg('  ' + h, '')], 'out')
      })
    },
    cowsay(parts, rest) {
      let text = rest
      const m = text.match(/^(['"])([\s\S]*)\1$/)
      if (m) text = m[2]
      if (!text) text = '哞～ 欢迎来到 403.li 终端！'
      const w = dw(text)
      pushLine([seg('  ' + '_'.repeat(w + 4), 'dim')], 'out')
      pushLine([seg(`< ${text} >`, 'bold')], 'out')
      pushLine([seg('  ' + '-'.repeat(w + 4), 'dim')], 'out')
      pushLine([seg('        \\   ^__^', '')], 'out')
      pushLine([seg('         \\  ('), seg('oo', 'green'), seg(')\\_______', '')], 'out')
      pushLine([seg('            (__)\\       )\\/\\', '')], 'out')
      pushLine([seg('                ||----w |', '')], 'out')
      pushLine([seg('                ||     ||', '')], 'out')
    },
    neofetch() {
      const up = fmtUptime()
      const theme = (document.documentElement.getAttribute('data-theme') === 'light')
        ? '403-paper（浅色）' : '403-green（暗色）'
      const memUsed = 300 + Math.floor(Math.random() * 900)
      const NFW = 19 // art 宽度 + 间隔
      const artRows = [
        '██ ██ ██ ██ ██ ██',
        '██ ██ ██ ██ ██ ██',
        '██ ██ ██ ██ ██ ██',
        '██ ██ ██ ██ ██ ██',
        '██ ██ ██ ██ ██ ██',
        '██ ██ ██ ██ ██ ██'
      ]
      const pairs = [
        ['OS', '403.li OS 1.0.3 (Cyb0rg)'],
        ['Host', '403.li Virtual Machine'],
        ['Kernel', '6.6.43-403li-terminal'],
        ['Uptime', up],
        ['Shell', 'bash 5.2.15'],
        ['Terminal', '403li-terminal']
      ]
      const extras = [
        ['CPU', '8 × Forbidden Core @ 4.03GHz'],
        ['Memory', `${memUsed}MiB / 4096MiB`],
        ['Theme', theme],
        ['Font', 'Maple Mono NF CN 13px'],
        ['Resolution', '自适应窗口'],
        ['DE', '无（纯终端，最纯粹）']
      ]
      pushLine([seg(`${user.value}@${host.value}`, 'user'), seg(' — 403.li terminal', 'mut')], 'out')
      pairs.forEach(([k, v], i) => {
        const art = i < artRows.length
          ? [artSeg(artRows[i], i % 2 ? 'art2' : 'art'), padSeg(2)]
          : []
        pushLine([...art, seg(k.padEnd(10), 'bold'), seg(v, '')], 'out')
      })
      extras.forEach(([k, v]) => {
        pushLine([padSeg(NFW), seg(k.padEnd(10), 'bold'), seg(v, '')], 'out')
      })
      pushLine([seg('', '')], 'out')
    },
    sudo(parts, rest) {
      printErr(`sudo: ${rest || '以 root 身份执行'}：权限被拒绝`)
      pushLine([seg('403 Forbidden — 这里禁止 root，只有绿色的光明。', 'dim')], 'out')
    },
    exit() {
      printErr('logout：想退出？这里 403，禁止离开。')
      pushLine([seg('（这个终端会一直陪着你，直到你关掉浏览器）', 'dim')], 'out')
    }
  }
}
const CMD_HELP = {
  help: '显示可用命令列表（help <命令> 查看详情）',
  ls: '列出目录内容（-a 含隐藏文件，-l 详细列表）',
  cd: '切换目录，支持 ~ .. - 及绝对/相对路径',
  pwd: '显示当前工作目录',
  cat: '查看文本文件内容',
  echo: '输出文本，支持 $USER $HOST $PWD $RANDOM 等变量',
  date: '显示当前日期与时间',
  whoami: '显示当前用户名',
  hostname: '显示主机名',
  uname: '显示系统信息（-a 查看全部）',
  history: '查看命令历史（-c 清空历史）',
  clear: '清空屏幕（快捷键 Ctrl+L）',
  cowsay: '让奶牛替你说话',
  neofetch: '终端系统信息展示',
  sudo: '尝试获取 root 权限（开玩笑的）',
  exit: '尝试退出登录（禁止！403）'
}

/* ================= 帮助函数 ================= */
function byteLen(s) {
  try { return new TextEncoder().encode(s).length } catch (e) { return s.length }
}
function dw(s) {
  let n = 0
  for (const ch of s) n += ch.codePointAt(0) > 0x2e80 ? 2 : 1
  return n
}
function fmtUptime() {
  const s = Math.floor((Date.now() - sessionStart) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h) return `up ${h} 小时 ${m} 分`
  if (m) return `up ${m} 分 ${sec} 秒`
  return `up ${sec} 秒`
}
function expandVars(text) {
  const vars = {
    USER: user.value,
    HOST: host.value,
    HOSTNAME: host.value,
    HOME: homeStr(),
    PWD: '/' + cwd.value.join('/'),
    SHELL: '/bin/bash',
    TERM: '403li-term',
    PATH: '/usr/local/bin:/usr/bin:/bin（模拟）',
    RANDOM: Math.floor(Math.random() * 32768)
  }
  return text
    .replace(/\$\?/g, '0')
    .replace(/\$([A-Z_]+)/g, (m, k) => (k in vars ? String(vars[k]) : ''))
}
function classifyLines(content) {
  return content.split('\n').filter(l => l !== '').map(line => {
    if (/^#\s/.test(line)) return { t: line, c: 'green' }
    if (/^#/.test(line) || /^\/\//.test(line)) return { t: line, c: 'dim' }
    if (/^(alias|export)\s/.test(line)) return { t: line, c: 'green' }
    return { t: line, c: '' }
  })
}

/* ================= 键盘交互 ================= */
function onKey(e) {
  if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
    e.preventDefault()
    doClear()
    return
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    doTabComplete()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!history.value.length) return
    if (historyIdx.value === -1) {
      draft.value = typed.value
      historyIdx.value = history.value.length - 1
    } else if (historyIdx.value > 0) {
      historyIdx.value--
    }
    typed.value = history.value[historyIdx.value]
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (historyIdx.value === -1) return
    historyIdx.value++
    if (historyIdx.value >= history.value.length) {
      historyIdx.value = -1
      typed.value = draft.value
    } else {
      typed.value = history.value[historyIdx.value]
    }
    return
  }
  if (e.key === 'Enter') {
    const v = typed.value
    if (v.trim()) {
      execute(v)
      typed.value = ''
    }
  }
}
function doTabComplete() {
  const cur = typed.value
  const parts = cur.split(/\s+/)
  if (parts.length <= 1) {
    const head = (parts[0] || '').toLowerCase()
    const names = [...new Set([...Object.keys(CMD_HELP), 'clear', 'cls', 'll'])]
      .sort((a, b) => a.localeCompare(b))
    const matches = names.filter(n => n.toLowerCase().startsWith(head))
    if (matches.length === 1) {
      typed.value = matches[0] + ' '
    } else if (matches.length > 1) {
      pushLine([seg(' '.repeat(promptStr().length) + matches.join('   '), 'dim')], 'out')
    }
    return
  }
  // cd 目录名补全
  if (parts[0].toLowerCase() === 'cd' && parts.length === 2) {
    const dirNode = resolveDirAt(cwd.value)
    const names = dirNode && dirNode.dirs ? Object.keys(dirNode.dirs) : []
    const head = parts[1] || ''
    const matches = names.filter(n => n.startsWith(head))
    if (matches.length === 1) {
      typed.value = `cd ${matches[0]}/`
    } else if (matches.length > 1) {
      pushLine([seg(' '.repeat(promptStr().length) + matches.join('   '), 'dim')], 'out')
    }
  }
}
function doClear() {
  lines.value = []
}
function focusTerm() {
  const sel = window.getSelection && window.getSelection()
  if (sel && sel.toString()) return
  const el = termInput.value
  if (el) el.focus({ preventScroll: true })
}

/* ================= 启动动画 ================= */
function boot() {
  const bootLines = [
    [seg('403.li Virtual Terminal v1.0.0', 'green')],
    [seg('模拟环境初始化完成：CPU 403 核，内存 403MiB，磁盘 403GiB（均为虚构）', 'dim')],
    [seg('纯前端仿真终端 —— 不联网、不出网、不上当', 'dim')]
  ]
  bootLines.forEach((b, i) => {
    bootTimers.push(setTimeout(() => {
      pushLine(b, 'sys')
      if (i === bootLines.length - 1) {
        pushLine([
          seg(`${user.value}@${host.value}:${dispPathStr()} $ `, 'dim'),
          seg('输入 help 查看可用命令，clear 或 Ctrl+L 清屏', 'hint')
        ], 'cmd')
      }
    }, 200 * (i + 1)))
  })
}

const quickCommands = [
  { label: 'help', cmd: 'help' },
  { label: 'ls -la', cmd: 'ls -la' },
  { label: 'cd docs', cmd: 'cd docs' },
  { label: 'cat README.md', cmd: 'cat README.md' },
  { label: 'echo Hello 403!', cmd: 'echo Hello 403!' },
  { label: 'date', cmd: 'date' },
  { label: 'uname -a', cmd: 'uname -a' },
  { label: 'history', cmd: 'history' },
  { label: 'cowsay 你好', cmd: 'cowsay 你好' },
  { label: 'neofetch', cmd: 'neofetch' },
  { label: 'cat .secret.txt', cmd: 'cat .secret.txt' },
  { label: 'clear', cmd: 'clear' }
]

onMounted(() => {
  if (bootBanner.value) {
    boot()
  } else {
    pushLine([seg('输入 help 查看可用命令，clear 或 Ctrl+L 清屏', 'dim')], 'sys')
  }
})
onUnmounted(() => {
  bootTimers.forEach(t => clearTimeout(t))
  bootTimers = []
  clearTimeout(msgTimer)
})
</script>

<style scoped>
/* 本组件只写终端独有样式，通用布局类来自 tools.css */
.term-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.term-head .tool-label {
  margin: 0;
}
.term-head .copy-btn {
  position: static;
  font-size: 15px;
  padding: 2px 8px;
}

.term-input-wrap {
  position: relative;
}
.term-input-wrap .code-input-sm {
  padding-right: 46px;
  border-radius: 0;
}
.term-input-wrap .copy-btn {
  top: 8px;
  right: 8px;
}

.term-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  line-height: 1.6;
}

.term-opts {
  margin-top: 12px;
}
.cfg-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.term-sm {
  width: 110px;
  flex: 0 0 110px;
  padding: 0 10px;
}
.config-row .checkbox-label {
  font-size: 13px;
}

/* 快捷命令 */
.chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 8px;
}
.term-chip {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 7px 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.term-chip:hover {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

/* ===== 终端窗口 ===== */
.term-window {
  border: 1px solid var(--line);
  background: var(--bg);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  min-height: 380px;
  height: clamp(360px, 62vh, 560px);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.term-window:focus-within {
  border-color: var(--green);
  box-shadow: 0 0 24px var(--green-glow);
}

.term-titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.term-dots {
  display: inline-flex;
  gap: 6px;
}
.td {
  width: 11px;
  height: 11px;
  border-radius: 0;
  transform: rotate(45deg) scale(0.85);
}
.td-red { background: var(--red); opacity: 0.85; }
.td-amber { background: var(--amber); opacity: 0.85; }
.td-green { background: var(--green); opacity: 0.85; }
.term-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.term-brand {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
  letter-spacing: 1px;
}

.term-screen {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  cursor: text;
  scrollbar-width: thin;
}
.term-lines {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.term-line {
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.65;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}
.tl-err { color: var(--red); }

/* 颜色分段（只用主题 CSS 变量） */
.c-green { color: var(--green); }
.c-art { color: var(--green); }
.c-art2 { color: var(--green); opacity: 0.5; }
.c-err { color: var(--red); }
.c-dim { color: var(--dim); }
.c-mut { color: var(--muted); }
.c-user { color: var(--green); font-weight: 700; }
.c-host { color: var(--green); opacity: 0.85; }
.c-path { color: var(--dim); }
.c-dollar { color: var(--green); font-weight: 700; }
.c-bold { font-weight: 700; }
.c-dir { color: var(--green); font-weight: 700; }
.c-file { color: var(--text); }
.c-hint { color: var(--dim); }

.seg-art {
  display: inline-block;
  white-space: pre;
}
.nf-pad {
  display: inline-block;
  white-space: pre;
}

/* 提示行 = 输入框 */
.term-prompt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.term-prompt-line > span {
  white-space: pre;
}
.term-input {
  flex: 1;
  min-width: 80px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.65;
  caret-color: var(--green);
  padding: 0;
}
.term-input::placeholder {
  color: var(--dim);
  opacity: 0.7;
}

@media (max-width: 900px) {
  .term-screen {
    padding: 8px 10px;
  }
}
@media (max-width: 640px) {
  .term-window {
    height: clamp(300px, 58vh, 480px);
    min-height: 300px;
  }
  .term-line,
  .term-input {
    font-size: 12px;
  }
  .seg-art,
  .nf-pad {
    display: none;
  }
  .chip-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .term-sm {
    width: 96px;
    flex-basis: 96px;
  }
}
@media (max-width: 375px) {
  .chip-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
