# 403.li 部署指南

---

## 📋 创建 GitHub 仓库

### 1️⃣ 创建两个仓库

**访问 GitHub**：https://github.com/new

**正式版仓库**：
- 仓库名：`403-li`
- 描述：Terminal-style tools website
- 可见性：Public
- ❌ 不要勾选 "Add README"
- ❌ 不要勾选 ".gitignore"
- ❌ 不要勾选 "Choose a license"

**测试版仓库**：
- 仓库名：`403-li-beta`
- 描述：Beta version for testing
- 可见性：Public
- ❌ 不要初始化

---

### 2️⃣ 推送代码到 GitHub

```bash
cd /root/.openclaw/workspace/403-li

# 添加正式版远程仓库
git remote add origin https://github.com/你的用户名/403-li.git

# 添加测试版远程仓库
git remote add beta https://github.com/你的用户名/403-li-beta.git

# 推送到正式版
git push -u origin main

# 推送到测试版
git push -u beta main
```

**验证**：
```bash
git remote -v
# 应该看到 origin 和 beta 两个远程仓库
```

---

## 🚀 部署到 Vercel

### 3️⃣ 连接 Vercel

1. **登录 Vercel**：https://vercel.com/login
2. **点击** "Add New Project"
3. **选择** "Import Git Repository"
4. **选择** GitHub 账号授权

### 4️⃣ 导入正式版

1. 选择 `403-li` 仓库
2. 点击 "Import"
3. 配置保持不变（Vite 自动识别）
4. 点击 "Deploy"

**等待部署完成**（约 1-2 分钟）

### 5️⃣ 绑定域名

1. 进入项目 → Settings → Domains
2. 添加：`403.li`
3. 等待 DNS 验证（可能需要几分钟）

**DNS 配置**（在你的域名服务商）：
```
类型：CNAME
主机：@ 或 www
值：cname.vercel.com
TTL：自动
```

### 6️⃣ 部署测试版

重复步骤 3-5，导入 `403-li-beta` 仓库

**测试版域名**（可选）：
- `beta.403.li`
- 或直接用 Vercel 提供的 `xxx.vercel.app`

---

## 🔍 SEO 提交

### 7️⃣ Google Search Console

1. 访问：https://search.google.com/search-console
2. 添加财产：`https://403.li`
3. 验证所有权（DNS 或 HTML 文件）
4. 提交 Sitemap：`https://403.li/sitemap.xml`

### 8️⃣ Bing Webmaster Tools

1. 访问：https://www.bing.com/webmasters
2. 添加网站
3. 验证所有权
4. 提交 Sitemap

---

## 📊 自动部署流程

### 正式版
```
本地开发 → git push origin main → Vercel 自动部署 → 403.li
```

### 测试版
```
本地开发 → git push beta main → Vercel 自动部署 → beta.403.li
```

### 工作流示例

```bash
# 日常开发
git checkout -b feature/new-tool
# ... 开发 ...
git add .
git commit -m "Add new tool: XXX"

# 推送到测试版验证
git push beta feature/new-tool

# 测试通过后合并到正式版
git checkout main
git merge feature/new-tool
git push origin main
```

---

## ✅ 验证清单

部署完成后检查：

- [ ] GitHub 仓库可访问
- [ ] Vercel 部署成功
- [ ] 域名解析正确
- [ ] HTTPS 正常工作
- [ ] 移动端适配正常
- [ ] Google Search Console 已提交
- [ ] Sitemap 可访问（https://403.li/sitemap.xml）
- [ ] robots.txt 可访问（https://403.li/robots.txt）

---

## 🎯 快速命令

```bash
# 查看远程仓库
git remote -v

# 推送到正式版
git push origin main

# 推送到测试版
git push beta main

# 查看部署状态
vercel status  # 需要安装 Vercel CLI
```

---

## 📝 注意事项

1. **Vercel 免费额度**：
   - 带宽：100GB/月
   - 构建：6000 分钟/月
   - 对于工具站完全够用

2. **SEO 关键**：
   - ✅ 内容质量（最重要）
   - ✅ 页面加载速度
   - ✅ 移动端友好
   - ✅ HTTPS
   - ✅ Sitemap

3. **Vercel SEO**：
   - ✅ 静态站点完全没问题
   - ✅ 很多大站都用 Vercel
   - ✅ CDN 全球加速（加分项）

---

**开始部署吧！** 🚀
