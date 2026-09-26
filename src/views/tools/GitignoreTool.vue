<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🗂️ .gitignore 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 双栏：模板配置 / 生成结果 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              模板选择（{{ selected.length }} 项）
              <button
                class="copy-btn label-copy-btn"
                title="复制已选模板名称"
                :disabled="!selected.length"
                @click="copyNames"
              >📋</button>
            </label>
            <input
              v-model="search"
              class="code-input-sm"
              placeholder="🔍 搜索模板（如 node / python / vscode）..."
            />
            <div class="cat-group" v-for="cat in CATEGORIES" :key="cat.key">
              <div class="cat-head">
                <span class="cat-name">{{ cat.label }}</span>
                <button
                  class="cat-toggle"
                  :disabled="!visibleTemplates(cat.key).length"
                  @click="toggleCategory(cat.key)"
                >{{ catAllSelected(cat.key) ? '取消全选' : '全选' }}</button>
              </div>
              <div v-if="visibleTemplates(cat.key).length" class="tpl-grid">
                <label
                  v-for="t in visibleTemplates(cat.key)"
                  :key="t.id"
                  class="checkbox-label tpl-item"
                >
                  <input
                    type="checkbox"
                    :checked="selected.includes(t.id)"
                    @change="toggleSelect(t.id, $event.target.checked)"
                  />
                  <span>{{ t.name }}</span>
                </label>
              </div>
              <div v-else class="cat-empty">无匹配模板</div>
            </div>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              .gitignore 内容（{{ lineCount }} 行）
              <button
                class="copy-btn label-copy-btn"
                title="复制全部内容"
                :disabled="!output"
                @click="copyOutput"
              >📋</button>
            </label>
            <textarea
              class="code-input output"
              readonly
              :value="output"
              rows="20"
              placeholder="选择左侧模板后，这里将实时生成 .gitignore 内容...&#10;&#10;左侧勾选模板，右侧自动拼接去重，支持多选组合"
            ></textarea>
            <div class="field-hint">💡 左侧勾选任意模板组合，右侧实时生成并自动去重</div>
          </div>
        </div>

        <!-- 统计（双栏外） -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">已选模板</span>
              <span class="stat-value">{{ selected.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">生成行数</span>
              <span class="stat-value">{{ lineCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">模板总数</span>
              <span class="stat-value">{{ TEMPLATES.length }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!output" @click="copyOutput">
            📋 复制
          </button>
          <button class="tool-button" @click="loadPreset">
            🧪 常用组合
          </button>
          <button class="tool-button" @click="selectAll">
            ✅ 全选
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ---------- 模板数据 ---------- */
const CATEGORIES = [
  { key: 'language', label: '语言' },
  { key: 'framework', label: '框架' },
  { key: 'tool', label: '构建工具' },
  { key: 'ide', label: 'IDE / 编辑器' },
  { key: 'os', label: '操作系统' },
  { key: 'common', label: '通用' }
]

const TEMPLATES = [
  // ---- 语言 ----
  {
    id: 'node', name: 'Node.js', category: 'language',
    content: `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
.pnp.*
.npm/
.pnpm-store/
.yarn/cache/
.yarn/unplugged/
.yarn/build-state.yml
.yarn/install-state.gz
coverage/
.nyc_output/
*.tsbuildinfo`
  },
  {
    id: 'python', name: 'Python', category: 'language',
    content: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.venv/
venv/
env/
ENV/
.tox/
.nox/
.mypy_cache/
.pytype/
.pytest_cache/
.ruff_cache/
.coverage
.coverage.*
htmlcov/
.ipynb_checkpoints/`
  },
  {
    id: 'java', name: 'Java', category: 'language',
    content: `*.class
*.jar
*.war
*.ear
*.nar
hs_err_pid*
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.classpath
.project
.settings/`
  },
  {
    id: 'go', name: 'Go', category: 'language',
    content: `# 二进制产物
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
/bin/
/Debug/
# 依赖目录
vendor/
# 测试与覆盖率
coverage.out
coverage.html`
  },
  {
    id: 'rust', name: 'Rust', category: 'language',
    content: `/target
**/*.rs.bk
*.pdb
# 库项目可提交 Cargo.lock，应用项目建议忽略
# Cargo.lock`
  },
  {
    id: 'cpp', name: 'C / C++', category: 'language',
    content: `*.o
*.obj
*.exe
*.out
*.app
*.a
*.lib
*.so
*.so.*
*.dylib
*.dll
*.dll.a
*.dSYM
*.gcda
*.gcno
*.gcov
build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt
compile_commands.json`
  },
  {
    id: 'ruby', name: 'Ruby', category: 'language',
    content: `*.gem
*.rbc
/config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/
/vendor/bundle/
/bundler/
.bundle/`
  },
  {
    id: 'php', name: 'PHP', category: 'language',
    content: `/vendor/
composer.phar
composer.lock
.phpunit.result.cache
.phpunit.cache
phpunit.xml
.php_cs.cache
Homestead.json
Homestead.yaml
auth.json`
  },
  {
    id: 'swift', name: 'Swift', category: 'language',
    content: `/.build
/Packages
xcuserdata/
DerivedData/
.swiftpm/
build/
*.xccheckout
*.moved-aside
*.xcuserstate`
  },
  {
    id: 'kotlin', name: 'Kotlin', category: 'language',
    content: `.gradle/
build/
.kotlin/
!**/src/main/**/build/
!**/src/test/**/build/
captures/
.externalNativeBuild/
.cxx/
local.properties`
  },
  {
    id: 'dart', name: 'Dart / Flutter', category: 'language',
    content: `.dart_tool/
.packages
.pub/
build/
.flutter-plugins
.flutter-plugins-dependencies
# 应用项目建议提交 pubspec.lock
# pubspec.lock`
  },
  // ---- 框架 ----
  {
    id: 'vue', name: 'Vue.js', category: 'framework',
    content: `node_modules/
dist/
dist-ssr/
coverage/
*.local
.vite/
.vscode/*
!.vscode/extensions.json
.idea/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*`
  },
  {
    id: 'react', name: 'React (CRA)', category: 'framework',
    content: `node_modules/
build/
coverage/
*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*`
  },
  {
    id: 'angular', name: 'Angular', category: 'framework',
    content: `node_modules/
dist/
tmp/
out-tsc/
bazel-out/
coverage/
*.local
.nrwl/`
  },
  {
    id: 'next', name: 'Next.js', category: 'framework',
    content: `node_modules/
.next/
out/
build/
coverage/
*.tsbuildinfo
next-env.d.ts
*.local`
  },
  {
    id: 'nuxt', name: 'Nuxt.js', category: 'framework',
    content: `node_modules/
.nuxt/
.output/
dist/
coverage/
*.local`
  },
  {
    id: 'django', name: 'Django', category: 'framework',
    content: `__pycache__/
*.py[cod]
*.sqlite3
db.sqlite3
db.sqlite3-journal
/staticfiles/
/media/
/static/
local_settings.py`
  },
  {
    id: 'flask', name: 'Flask', category: 'framework',
    content: `__pycache__/
*.py[cod]
instance/
.webassets-cache
flask_session/
*.sqlite3`
  },
  {
    id: 'rails', name: 'Ruby on Rails', category: 'framework',
    content: `/tmp/
/log/*
!/log/.keep
/public/assets
/public/packs
/public/storage
/storage/*
!/storage/.keep
.byebug_history
config/master.key`
  },
  {
    id: 'laravel', name: 'Laravel', category: 'framework',
    content: `/vendor/
/node_modules/
/public/storage
/storage/*.key
.env.backup
.phpunit.result.cache
Homestead.json
Homestead.yaml
auth.json
npm-debug.log
yarn-error.log`
  },
  {
    id: 'dotnet', name: '.NET / ASP.NET', category: 'framework',
    content: `bin/
obj/
*.user
*.suo
.vs/
.vscode/
TestResults/
[Dd]ebug/
[Rr]elease/
x64/
x86/
*.nupkg
*.snupkg`
  },
  // ---- 构建工具 ----
  {
    id: 'vite', name: 'Vite', category: 'tool',
    content: `node_modules/
dist/
dist-ssr/
*.local
.vite/
coverage/`
  },
  {
    id: 'webpack', name: 'Webpack', category: 'tool',
    content: `node_modules/
dist/
coverage/
*.local`
  },
  {
    id: 'gradle', name: 'Gradle', category: 'tool',
    content: `.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/
!**/src/test/**/build/`
  },
  {
    id: 'npm', name: 'npm', category: 'tool',
    content: `node_modules/
npm-debug.log*
npm-error.log*
.pnp.*
.npm/
coverage/`
  },
  {
    id: 'yarn', name: 'Yarn', category: 'tool',
    content: `node_modules/
.yarn/cache/
.yarn/unplugged/
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*
yarn-debug.log*
yarn-error.log*`
  },
  {
    id: 'pnpm', name: 'pnpm', category: 'tool',
    content: `node_modules/
.pnpm-store/
pnpm-debug.log*
.pnpm/workspace-state`
  },
  {
    id: 'terraform', name: 'Terraform', category: 'tool',
    content: `*.tfstate
*.tfstate.*
.terraform/
*.tfvars
*.tfvars.json
crash.log
crash.*.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraform.lock.hcl`
  },
  {
    id: 'linters', name: 'ESLint / Prettier', category: 'tool',
    content: `.eslintcache
.stylelintcache
.parcel-cache/
.sass-cache/`
  },
  // ---- IDE / 编辑器 ----
  {
    id: 'vscode', name: 'VS Code', category: 'ide',
    content: `.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets
*.code-workspace`
  },
  {
    id: 'jetbrains', name: 'JetBrains (IDEA)', category: 'ide',
    content: `.idea/
*.iml
*.iws
out/
.idea_modules/
atlassian-ide-plugin.xml`
  },
  {
    id: 'vim', name: 'Vim', category: 'ide',
    content: `[._]*.s[a-v][a-z]
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]
*~
.netrwhist`
  },
  {
    id: 'emacs', name: 'Emacs', category: 'ide',
    content: `*~
\\#*\\#
/\\#*\\#
*.elc
.elpa/
.auto-save-list
tramp
.org-id-locations`
  },
  {
    id: 'eclipse', name: 'Eclipse', category: 'ide',
    content: `.classpath
.project
.settings/
.metadata/
bin/
*.tmp
*.log`
  },
  {
    id: 'xcode', name: 'Xcode', category: 'ide',
    content: `xcuserdata/
*.xcuserstate
DerivedData/
.build/
*.xccheckout
*.moved-aside
*.hmap
*.ipa
*.dSYM.zip
*.dSYM`
  },
  // ---- 操作系统 ----
  {
    id: 'macos', name: 'macOS', category: 'os',
    content: `.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
.fseventsd
.DocumentRevisions-V100
.temporaryitems
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
Network Trash Folder
Temporary Items
.apdisk`
  },
  {
    id: 'windows', name: 'Windows', category: 'os',
    content: `Thumbs.db
ehthumbs.db
ehthumbs_vista.db
Desktop.ini
$RECYCLE.BIN/
*.stackdump
*.lnk`
  },
  {
    id: 'linux', name: 'Linux', category: 'os',
    content: `*~
.fuse_hidden*
.directory
.Trash-*
.nfs*
.goutputstream-*
.thumbnails
.cache/`
  },
  // ---- 通用 ----
  {
    id: 'env', name: '环境变量文件', category: 'common',
    content: `.env
.env.*
!.env.example
!.env.sample
*.local`
  },
  {
    id: 'logs', name: '日志文件', category: 'common',
    content: `*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*`
  },
  {
    id: 'cache', name: '缓存目录', category: 'common',
    content: `.cache/
.sass-cache/
.parcel-cache/
.eslintcache
.stylelintcache
.mypy_cache/
.pytest_cache/
.ruff_cache/`
  },
  {
    id: 'uploads', name: '上传文件', category: 'common',
    content: `/uploads/
/media/
/public/uploads/
/storage/`
  },
  {
    id: 'coverage', name: '测试覆盖率', category: 'common',
    content: `coverage/
.nyc_output/
htmlcov/
lcov.info
*.lcov`
  }
]

/* ---------- 状态 ---------- */
const selected = ref([])
const search = ref('')
const error = ref('')
const success = ref('')
let successTimer = null

const q = computed(() => search.value.trim().toLowerCase())

function visibleTemplates(catKey) {
  const list = TEMPLATES.filter(t => t.category === catKey)
  if (!q.value) return list
  return list.filter(t =>
    t.name.toLowerCase().includes(q.value) || t.id.includes(q.value)
  )
}

function catAllSelected(catKey) {
  const list = visibleTemplates(catKey)
  return list.length > 0 && list.every(t => selected.value.includes(t.id))
}

function toggleSelect(id, checked) {
  if (checked) {
    if (!selected.value.includes(id)) selected.value.push(id)
  } else {
    selected.value = selected.value.filter(x => x !== id)
  }
}

function toggleCategory(catKey) {
  const list = visibleTemplates(catKey).map(t => t.id)
  if (!list.length) return
  const all = catAllSelected(catKey)
  if (all) {
    selected.value = selected.value.filter(x => !list.includes(x))
  } else {
    for (const id of list) {
      if (!selected.value.includes(id)) selected.value.push(id)
    }
  }
}

/* ---------- 生成 ---------- */
const output = computed(() => {
  const chosen = TEMPLATES.filter(t => selected.value.includes(t.id))
  if (!chosen.length) return ''
  const lines = []
  const seen = new Set()
  const push = line => {
    if (!line.trim()) {
      if (lines.length && lines[lines.length - 1] !== '') lines.push('')
      return
    }
    if (seen.has(line)) return
    seen.add(line)
    lines.push(line)
  }
  push('# ==================================================')
  push('# .gitignore — 由 403.li 在线工具生成')
  push(`# 生成时间: ${new Date().toLocaleString('zh-CN')}`)
  push(`# 模板: ${chosen.map(t => t.name).join(', ')}`)
  push('# ==================================================')
  push('')
  for (const t of chosen) {
    push(`# ---------- ${t.name} ----------`)
    for (const line of t.content.split('\n')) push(line)
    push('')
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
})

const lineCount = computed(() =>
  output.value ? output.value.split('\n').length : 0
)

const selectedNames = computed(() =>
  TEMPLATES.filter(t => selected.value.includes(t.id)).map(t => t.name).join('、')
)

/* ---------- 复制 / 操作 ---------- */
function flash(msg) {
  error.value = ''
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 3000)
}

function failCopy() {
  success.value = ''
  error.value = '复制失败，请手动选择文本复制'
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { error.value = '' }, 3000)
}

async function copyNames() {
  if (!selectedNames.value) return
  const ok = await copyText(selectedNames.value)
  ok ? flash('已复制所选模板名称') : failCopy()
}

async function copyOutput() {
  if (!output.value) return
  const ok = await copyText(output.value)
  ok ? flash('已复制 .gitignore 内容') : failCopy()
}

function loadPreset() {
  const preset = ['node', 'vue', 'vscode', 'env', 'logs', 'macos']
  selected.value = preset
  flash('已载入常用组合（Node.js + Vue + VS Code + 环境变量 + 日志 + macOS）')
}

function selectAll() {
  selected.value = TEMPLATES.map(t => t.id)
  flash(`已全选 ${TEMPLATES.length} 个模板`)
}

function clearAll() {
  selected.value = []
  search.value = ''
  error.value = ''
  success.value = ''
  clearTimeout(successTimer)
}
</script>

<style scoped>
/* 标签内联复制按钮 */
.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  vertical-align: middle;
  font-size: 14px;
}
.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.field-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

/* 模板分类分组 */
.cat-group {
  margin-top: 14px;
}
.cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--line);
}
.cat-name {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cat-toggle {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--line);
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.cat-toggle:hover:not(:disabled) {
  color: var(--green);
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}
.cat-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 模板勾选网格 */
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px 12px;
}
.tpl-item {
  font-size: 13px;
}
.cat-empty {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  padding: 6px 0;
}

/* 统计网格 */
.stats-section {
  margin-top: 12px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-item {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--accent);
  font-weight: bold;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .tpl-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
