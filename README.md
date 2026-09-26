# 403.li

终端风格在线工具站。

## 技术栈

- Vue 3 + Vite
- Vue Router（SPA 路由）
- 纯前端，无后端依赖

## 工具列表

| 工具 | 路径 | 说明 |
|------|------|------|
| JSON 格式化 | /tools/json | 格式化、压缩、校验 JSON |
| Base64 编解码 | /tools/base64 | 文本和图片的编解码 |
| 二维码生成 | /tools/qrcode | 输入文本或链接生成二维码 |
| 时间戳转换 | /tools/timestamp | Unix/ISO 时间戳互转 |
| URL 编解码 | /tools/url | URL 编码解码，支持中文 |
| 哈希计算 | /tools/hash | MD5/SHA1/SHA256/SHA512 |
| 密码生成 | /tools/password | 随机密码生成，可自定义长度和字符集 |
| 颜色转换 | /tools/color | HEX/RGB/HSL 互转 |
| 字体压缩 | /tools/font | TTF/OTF 转 WOFF2，基于 WASM |
| 像素头像 | /tools/avatar | 对称像素风格随机头像 |
| ASCII 艺术 | /tools/ascii | 多种风格的字符艺术生成 |
| UUID/ULID | /tools/uuid | UUID v4/v7 和 ULID，支持批量 |
| 正则测试 | /tools/regex | 正则匹配高亮、分组捕获、替换 |
| JWT 解码 | /tools/jwt | 解析 JWT，验证签名和过期时间 |
| Cron 生成 | /tools/cron | 可视化生成 Cron 表达式 |
| 文本 Diff | /tools/diff | 两段文本差异对比 |
| Lorem Ipsum | /tools/lorem | 中英文占位文本生成，支持段落/句子数 |
| Markdown 预览 | /tools/markdown | 实时预览 Markdown 渲染，支持导出 HTML |
| CSS 单位转换 | /tools/css-unit | px/rem/em/vw/vh/% 互转 |
| JSON ↔ YAML 转换 | /tools/json-yaml | JSON 和 YAML 双向转换，自动检测格式 |
| 文本统计 | /tools/text-stats | 文本字数、字符数、行数、段落数、阅读时间统计 |
| User-Agent 解析器 | /tools/user-agent | 解析 UA 字符串，识别浏览器、OS、设备类型、渲染引擎 |
| HTTP 状态码查询 | /tools/http-status | 查询 HTTP 状态码含义，支持搜索和分类浏览（1xx-5xx） |
| 图片转 Base64 | /tools/img-base64 | 上传图片转为 Base64 字符串，支持格式转换和质量调整 |
| CSS 渐变生成器 | /tools/gradient | 可视化编辑线性/径向渐变，拖拽色标，生成 CSS 代码 |
| Flexbox 可视化 | /tools/flexbox | 可视化调试 Flexbox 属性，实时预览布局效果，生成 CSS 代码 |
| Grid 布局可视化 | /tools/grid | 可视化调试 CSS Grid 属性，支持行列模板预设、对齐方式、间距调节和项目跨列/跨行，实时预览并生成 CSS 代码 |
| 数字格式化 | /tools/number-format | 千分位、货币、百分比、科学计数法，支持 13 种语言/地区和 15 种货币 |
| 时间计算器 | /tools/time-calc | 时间差计算、日期加减（天/月/年）、工作日计算 |
| Mock 数据生成器 | /tools/mock-data | 生成随机姓名、手机号、邮箱、身份证号、地址等测试数据，支持 JSON/CSV 导出 |
| SSH 密钥对生成 | /tools/ssh-keygen | Web Crypto API 前端生成 RSA/Ed25519 密钥对，OpenSSH 格式输出，支持 SHA256 指纹 |
| 高位端口生成器 | /tools/port-gen | 随机生成 1024-65535 高位端口，支持批量生成、排除端口范围、常用端口参考 |
| Chmod 转换器 | /tools/chmod | 八进制(755/4755)与符号(rwxr-xr-x)权限互转，支持 SUID/SGID/Sticky 特殊权限位 |
| 进制转换器 | /tools/radix | 二进制/八进制/十进制/十六进制互相转换，输入任意进制实时联动，支持字节序翻转 |
| CSV ↔ JSON 转换器 | /tools/csv-json | CSV 和 JSON 双向转换，支持逗号/制表符/分号/竖线四种分隔符、首行表头开关、自动类型推断 |
| HTML 实体编解码 | /tools/html-entity | HTML 实体编码和解码，支持命名实体(&amp;)和数字实体(&#38;)两种模式，双向实时转换 |
| CIDR 子网计算器 | /tools/cidr | CIDR 表示法解析，计算子网掩码、IP 范围、可用主机数，支持 IPv4 |
| JSON Schema 生成器 | /tools/json-schema | 粘贴 JSON 样本自动生成 JSON Schema，支持 Draft 2020-12 和 Draft-07 |
| Cookie 解析器 | /tools/cookie-parser | 解析 HTTP Cookie/Set-Cookie 字符串为结构化数据，支持构造新的 Set-Cookie |
| JSON → TypeScript 类型 | /tools/json-ts | 粘贴 JSON 自动生成 TypeScript interface/type 定义，支持嵌套对象、数组类型推断 |
| 文本加密解密 | /tools/crypto | 使用 AES-GCM + PBKDF2 在浏览器端对文本进行加密和解密，支持自定义密码 |
| Base32 编解码 | /tools/base32 | Base32 编码和解码，支持 RFC 4648 标准字母表和扩展十六进制字母表 |
| Unicode 字符查询器 | /tools/unicode | 输入字符查看 Unicode 码点、UTF-8/UTF-16 编码、类别和名称，支持搜索 |
| XML 格式化 | /tools/xml-format | XML 格式化、压缩、校验，支持文本/树形视图切换，纯浏览器端 DOMParser 实现 |
| JSON Path 查询器 | /tools/json-path | 粘贴 JSON 数据，输入点号路径表达式查询嵌套值，支持数组索引和实时预览 |
| URL 解析器 | /tools/url-parser | 解析 URL 各组成部分（协议/主机/端口/路径/查询参数/片段），支持从组件构造新 URL |
| Morse 摩斯电码转换器 | /tools/morse | 文本与 Morse 电码双向实时转换，支持字母/数字/标点，Web Audio API 播放电码音频 |
| CSS Box Shadow 生成器 | /tools/box-shadow | 可视化编辑 CSS box-shadow，支持多层阴影、内阴影、扩散半径、颜色选择器，实时预览并生成 CSS 代码 |
| 图片压缩裁剪 | /tools/img-resize | 上传图片后支持缩放、旋转、翻转、格式转换和质量压缩，Canvas 实时预览并下载 |
| 文本去重排序 | /tools/text-dedup | 对文本行去重、排序、去除空行和首尾空白，支持统计重复次数 |
| 网络带宽换算器 | /tools/bandwidth | 带宽单位换算（bps/Kbps/Mbps/Gbps/Tbps），支持估算文件下载时间 |
| HTTP Header 分析器 | /tools/http-headers | 粘贴 HTTP 响应头文本，解析为结构化表格，自动检测安全头并给出评分建议 |
| Cron 表达式解析器 | /tools/cron-parser | 输入 Cron 表达式实时解析为人类可读描述，展示字段分解和未来 10 次执行时间，支持 5/6 字段格式及常用宏 |
| JSON 表格查看器 | /tools/json-table | 粘贴 JSON 数组自动渲染为可排序、可搜索筛选的 HTML 表格，支持 CSV 导出下载 |
| CSS 压缩美化 | /tools/css-format | CSS 代码格式化和压缩，支持缩进美化、去除注释和空白、保留/压缩选择器 |
| SQL 格式化 | /tools/sql-format | SQL 语句格式化和压缩，支持关键字大写、缩进对齐、子查询换行 |
| 调色板生成器 | /tools/color-palette | 输入基础颜色生成互补色、类比色、三角色等 6 种配色方案，WCAG 对比度评分，一键复制 CSS 变量或 Tailwind 配置 |
| HTML 格式化压缩 | /tools/html-format | HTML 代码格式化和压缩，支持缩进美化、去除注释和多余空白、保留结构层级 |
| CSS Clip-Path 生成器 | /tools/clip-path | 可视化编辑 CSS clip-path，支持圆形/椭圆/多边形/inset，拖拽控制点调整形状，实时预览并生成 CSS 代码 |
| Markdown 表格生成器 | /tools/md-table | 可视化编辑 Markdown 表格，支持增删行列、列对齐设置、实时预览渲染，支持粘贴 Markdown 表格反向解析编辑 |
| CSS 动画生成器 | /tools/css-animation | 可视化配置 CSS @keyframes 动画，支持平移/旋转/缩放/透明度/颜色变化，设置持续时间/延迟/缓动函数/循环次数，实时预览并生成 CSS 代码 |
| 数据大小换算器 | /tools/data-size | 数据存储单位换算，支持十进制（B/KB/MB/GB/TB/PB）和二进制（B/KiB/MiB/GiB/TiB/PiB），支持带宽传输时间估算 |
| 密码强度检测器 | /tools/password-strength | 输入密码自动分析强度，检测弱密码/字典/键盘序列/重复字符，输出评分和破解时间估算，提供改进建议 |
| 颜色对比度检查器 | /tools/contrast-check | 输入前景色和背景色计算 WCAG 对比度，检测 AA/AAA 级别是否通过，支持文本预览和推荐配色方案 |
| Unicode 转义转换器 | /tools/unicode-escape | 文本与 Unicode 转义序列互转，支持 JS/Python/HTML/CSS 四种格式，实时双向转换 |
| XML ↔ JSON 转换器 | /tools/xml-json | XML 和 JSON 双向转换，支持属性 @ 前缀展开、智能数组检测、自定义根节点名称，纯浏览器端 DOMParser 实现 |
| Markdown 目录生成器 | /tools/md-toc | 粘贴 Markdown 文本自动提取标题层级，生成带 GitHub 风格锚点链接的目录，支持调整起始层级和编号方式（无序/有序/纯链接），纯前端实现 |
| HMAC 生成器 | /tools/hmac | 基于 Web Crypto API 的纯前端 HMAC 计算工具，支持 SHA-1/SHA-256/SHA-384/SHA-512 四种算法，支持文本和 Hex 密钥输入，结果以 Hex 或 Base64 格式输出 |
| CSS Text Shadow 生成器 | /tools/text-shadow | 可视化编辑 CSS text-shadow 属性，支持多层阴影叠加、调整偏移/模糊/颜色，实时预览文字效果并生成 CSS 代码 |
| CSS Filter 生成器 | /tools/css-filter | 可视化编辑 9 种 CSS filter 属性，Canvas 实时预览，支持随机组合和一键复制 CSS 代码 |
| SVG Data URI 转换器 | /tools/svg-data-uri | 粘贴 SVG 代码或上传 SVG 文件，转换为 data:image/svg+xml 数据 URI，支持 Base64 和 URL 编码 |
| CSS Transition 生成器 | /tools/css-transition | 可视化配置 CSS transition 属性，支持 cubic-bezier 自定义缓动、多属性叠加，实时预览并生成 CSS |
| JWT 生成器 | /tools/jwt-gen | 生成 JWT Token，支持 HS256/HS384/HS512 签名，自定义 Header/Payload，Web Crypto API 前端签名 |
| JSON 修复器 | /tools/json-fix | 自动修复常见 JSON 错误：尾逗号、单引号、未加引号键名、注释、BOM 字符 |
| IP 子网计算器 | /tools/ip-subnet | 输入 IP 和前缀计算子网详情，支持批量 CIDR 拆分，判断 IP 归属网段 |
| Base85 编解码 | /tools/base85 | Base85 编码和解码，支持 ASCII85（btoa）和 Z85 两种字母表 |
| 占位图片生成器 | /tools/placeholder-img | Canvas API 生成自定义宽高/背景色/文字色/文字的占位图，支持下载 PNG 和复制 Data URL |
| 正则表达式可视化 | /tools/regex-railroad | 输入正则表达式自动生成铁路图（Railroad Diagram）可视化，支持 SVG 导出和常用模板 |
| HTML → JSX 转换器 | /tools/html-jsx | 粘贴 HTML 代码自动转换为 JSX 格式，处理 class→className、style 转对象、自闭合标签修正、事件转换 |
| CSS 优先级计算器 | /tools/css-specificity | 输入 CSS 选择器自动计算特异性分数（a-b-c 格式），支持批量排序和 :not()/:is()/:has() |
| 词频分析器 | /tools/word-freq | 粘贴文本自动统计词频，支持中英文分词、停用词过滤、最小词长筛选，Canvas 柱状图可视化，导出 CSV |
| CSS Variable 提取器 | /tools/css-var-extract | 粘贴 CSS/SCSS 代码自动提取所有 -- 自定义属性，展示变量名、默认值、var() 引用次数与所在选择器，支持搜索筛选与 :root/JSON 导出 |
| .gitignore 生成器 | /tools/gitignore | 选择编程语言、框架、IDE 和操作系统模板，自动组合生成 .gitignore 文件内容，支持多选去重、搜索、一键复制 |
| 图片格式转换器 | /tools/img-format | 上传图片在 PNG/JPEG/WebP 之间互转，支持质量调节滑块，实时预览并显示转换前后文件大小对比，纯前端 Canvas API 实现 |
| Emoji 搜索器 | /tools/emoji-picker | 纯前端 Emoji 搜索浏览，支持中英文关键词搜索和 8 大分类筛选，点击复制，显示 Unicode 码点和编码信息 |
| YAML ↔ TOML 转换器 | /tools/yaml-toml | YAML 和 TOML 双向转换，粘贴任意格式自动识别并转换为另一种格式，支持语法错误提示，一键复制输出 |
| JavaScript 压缩美化 | /tools/js-format | JavaScript 代码格式化和压缩，支持缩进美化、去除注释和多余空白、保留代码结构层级 |
| 单位换算器 | /tools/unit-converter | 长度/重量/温度/面积/体积/时间/速度/数据/角度常见单位互转，实时双向换算 |
| Markdown 转纯文本 | /tools/md-to-text | 去除 Markdown 格式标记输出纯文本，支持保留换行、去除空行、链接附加 URL |
| HTML 转 Markdown | /tools/html-to-md | 粘贴 HTML 代码自动转换为 Markdown 格式，支持标题、列表、表格、链接、图片、代码块、引用等元素 |
| CSS 媒体查询生成器 | /tools/media-query | 可视化生成 CSS @media 响应式查询，预设断点、多条件组合、实时预览并生成 CSS 代码 |
| 颜色混合器 | /tools/color-blend | 混合两种颜色，支持 8 种混合模式和比例调节，实时预览渐变过渡效果，输出 HEX/RGB/HSL 格式 |
| JSON 对比器 | /tools/json-diff | 对比两段 JSON 数据的差异，高亮新增/删除/修改的字段，支持树形视图和平铺视图 |
| 文本差异对比器 | /tools/text-diff | 对比两段文本的差异，逐行高亮新增、删除和修改的内容，支持并排和内联两种视图模式 |
| 时区转换器 | /tools/timezone | 输入日期时间在不同时区之间转换，支持全球 400+ 时区，实时显示各时区当前时间，支持自定义格式输出 |
| Slug 生成器 | /tools/slug | 将文本转为 URL 友好的 slug 格式，支持中英文、多种分隔符、自定义最大长度、保留数字、转小写 |
| SVG 转 PNG | /tools/svg-to-png | 粘贴 SVG 代码或上传 SVG 文件，Canvas 渲染后导出 PNG，支持缩放倍数、自定义宽高和背景色 |
| 字体预览器 | /tools/font-preview | 输入文本实时预览不同字体效果，支持自定义字号、行高、字重、颜色，多字体对比，一键复制 CSS |
| Base45 编解码 | /tools/base45 | Base45 编码和解码（RFC 9285），支持文本和 Hex 输入，双向转换 |
| 随机数生成器 | /tools/random-number | 整数/浮点数、自定义范围、批量生成、去重排序，可选 Web Crypto 加密安全随机 |
| Base62 编解码 | /tools/base62 | Base62 编码和解码，支持文本和数字输入，常用于短链接和 ID 生成 |
| 数字转中文金额 | /tools/number-chinese | 数字转中文大写/小写金额，支持元角分、四舍五入到分、负数 |
| Perlin 噪声可视化 | /tools/perlin-noise | 2D Perlin 噪声 + fBm 分形纹理实时 Canvas 渲染，支持缩放、频率、振幅、八度、种子、分辨率和 4 种配色方案 |
| 粒子系统编辑器 | /tools/particle-system | Canvas 粒子特效编辑器，可调发射器位置、速度、重力、颜色渐变、生命周期，支持预设和导出 PNG |
| L-System 分形生成器 | /tools/l-system | 输入 L-System 规则和公理生成分形图案（雪花、龙曲线、分形树等），SVG 实时渲染，支持导出 |
| 像素画编辑器 | /tools/pixel-art | Canvas 像素画编辑器，8×8–64×64 网格，画笔/橡皮/填充/取色，撤销重做，导出 PNG |
| Emoji 马赛克生成器 | /tools/emoji-mosaic | 上传图片或粘贴 URL，将像素区域替换为颜色最接近的 Emoji 字符，支持网格密度、Emoji 集合和导出 PNG |
| 生命游戏 | /tools/game-of-life | Conway's Game of Life 细胞自动机，点击/拖拽绘制初始状态，支持播放/暂停/单步/清空/随机填充，可调速度和网格大小 |
| 迷宫生成器 | /tools/maze-generator | 随机迷宫生成器，递归回溯和 Prim 两种算法，可调节尺寸与随机种子，高亮 BFS 最短路径，SVG 导出 |
| 网页钢琴键盘 | /tools/piano-keyboard | 鼠标/触摸/电脑键盘演奏，Web Audio API 合成音色，1-3 组八度、4 种波形，录音回放 |
| 文本大小写转换 | /tools/text-case | 文本大小写格式转换，支持全大写/全小写/首字母大写/标题大小写/camelCase/snake_case/kebab-case/PascalCase 等格式互转 |
| JSON 图表可视化 | /tools/json-chart | 粘贴 JSON 数组自动识别字段类型，生成柱状图/折线图/饼图/散点图，Canvas 渲染，支持导出 PNG |
| 词云生成器 | /tools/word-cloud | 粘贴文本自动分词并生成词云图片，支持中英文分词、停用词过滤、字号/形状/方向/配色调节，Canvas 渲染并导出 PNG |
| Hexdump 查看器 | /tools/hexdump | 上传文件或粘贴文本，显示 xxd 风格 hex + ASCII 双栏视图，支持跳转偏移、搜索字节序列、导出 txt |
| Markdown 幻灯片演示 | /tools/md-slides | 将 Markdown 按 --- 分隔符拆分为幻灯片页面，支持代码高亮、Mermaid 图表、全屏演示模式与键盘翻页，可导出独立 HTML 分享 |
| 终端模拟器 | /tools/terminal-sim | 仿真终端界面，内置虚拟文件系统，支持 help/ls/cd/cat/echo/date/cowsay/neofetch 等 16+ 命令，命令历史与 Tab 补全 |
| SVG 涂鸦板 | /tools/svg-doodle | 手绘式 SVG 路径绘制，8 种图元（直线/矩形/圆/椭圆/折线/多边形/贝塞尔），网格吸附、撤销重做、复制代码与导出 SVG |
| Emmet 展开器 | /tools/emmet-expand | 输入 Emmet 缩写语法实时展开为 HTML 代码，支持嵌套、分组、乘法、属性、编号等完整 Emmet 语法 |
| 二维码解码器 | /tools/qr-decode | 上传或粘贴二维码图片，浏览器本地解码内容，支持反色尝试和多倍率搜索，自动识别 WiFi/vCard/URL 等类型 |
| CSS 常用代码片段 | /tools/css-snippets | 32 个常用 CSS 代码片段速查集合，分类筛选+关键词搜索，带实时预览，一键复制 CSS/HTML |
| SSL 证书解码器 | /tools/cert-decoder | 粘贴 PEM/Base64/HEX/DER 证书，解析主体、颁发者、有效期、扩展、公钥、指纹，支持证书链 |
| Cron 可视化解析器 | /tools/cron-visual | 月历/周历双视图可视化 Cron 执行时间点，高亮命中日期并显示次数，点击查看执行时刻，支持 L/L-n/5#2/5L 扩展语法 |
| Lissajous 曲线可视化器 | /tools/lissajous | 调节频率比 a/b、相位差 δ、振幅等参数，Canvas 实时渲染李萨如参数曲线，支持相位动画、发光效果、四种配色、坐标网格、曲线方程与统计信息，可复制图片或导出 PNG |
| Base58 编解码 | /tools/base58 | Base58 和 Base58Check 编码解码，支持文本和 Hex 输入，Base58Check 可选版本字节（Bitcoin P2PKH/P2SH/WIF 等）并校验双 SHA-256 校验和 |
| 曼德博集合可视化器 | /tools/mandelbrot | 曼德博集合分形可视化，滚轮光标锚点缩放、拖拽平移、键盘漫游，可调迭代次数/逃逸半径/配色/分辨率，六种预设视点，支持导出 PNG |
| 代码截图生成器 | /tools/code-to-image | 把代码片段渲染成精美分享截图，内置 18+ 语言语法高亮，5 种配色主题、3 种窗口样式、背景模式与导出倍率可调，支持复制图片与导出 PNG |
| SVG 精灵图生成器 | /tools/svg-sprite | 批量上传/粘贴多个 SVG 图标，自动合并为 symbol 形式的 SVG Sprite，支持 ID 前缀防冲突、currentColor 化、排序去重、网格预览与复制/下载 |
| ASCII 表格生成器 | /tools/ascii-table | 粘贴 CSV/TSV 或自定义分隔符数据，自动生成带边框的纯文本表格，支持六种边框样式、四种对齐方式、CJK/Emoji 双宽字符对齐，一键复制和下载 TXT |
| 图片水印工具 | /tools/img-watermark | 上传/拖拽/粘贴图片添加文字水印，九宫格+拖拽定位、平铺模式、描边/投影/旋转/透明度可调，Canvas 实时预览，导出 PNG |
| 时间线生成器 | /tools/timeline | 粘贴"日期 | 标题 | 说明"事件数据，Canvas 渲染垂直/水平可视化时间线，支持排序、5 套配色主题、4 种节点样式、交替标签与间距/字号调节，可复制图片或导出 2x 高清 PNG |
| 代码行数统计器 | /tools/loc-counter | 粘贴代码或批量上传源码，按 40+ 语言注释语法统计总行数/代码行/注释行/空行并输出分布图表，支持自动语言识别，纯前端实现 |
| 打字速度测试 | /tools/typing-test | 浏览器内打字速度测试，实时显示 WPM/准确率/正确错误字符数，15/30/60/120 秒四档可选，逐字符高亮正确/错误/光标并自动滚动跟随，每秒采样绘制 WPM 曲线，结束生成统计报告并记录历史最佳 |

## 开发

```bash
npm install
npm run dev
```

开发服务器：`http://127.0.0.1:5173/`

### 本地预览（远程部署时）

```bash
ssh -L 5173:localhost:5173 <用户>@<主机>
```

访问 `http://localhost:5173`

## 部署

- **测试版**（私有 `403-li-beta` 仓库）：`npm run build` → rsync 到测试服务器
- **正式版**（公开 `403-li` 仓库）：`scripts/release.sh` 同步主线（自动剔除开发文档）→ Cloudflare Pages 自动部署 → 403.li

## 安全

- 纯前端，无后端
- 不上传用户数据
- 无第三方追踪脚本

## 定制

颜色和动画效果在 `src/assets/styles/index.css` 和 `src/assets/styles/tools.css` 中定义。
