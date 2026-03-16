import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import fs from 'fs'

async function screenshot(url, outputPath, width = 1200, height = 800) {
  let browser = null
  
  try {
    // 启动无头浏览器
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
    })

    const page = await browser.newPage()
    
    // 设置视口大小
    await page.setViewport({ width, height })
    
    // 访问页面
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    // 截图
    await page.screenshot({ 
      path: outputPath,
      fullPage: false,
      type: 'png'
    })
    
    console.log(`✅ 截图成功：${outputPath}`)
    console.log(`📐 尺寸：${width}x${height}`)
    
    return outputPath
    
  } catch (error) {
    console.error('❌ 截图失败:', error.message)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 获取命令行参数
const url = process.argv[2] || 'http://127.0.0.1:5173'
const output = process.argv[3] || `/root/.openclaw/workspace/403-li/screenshot-${Date.now()}.png`
const width = parseInt(process.argv[4]) || 1200
const height = parseInt(process.argv[5]) || 800

console.log('📸 开始截图...')
console.log(`URL: ${url}`)
console.log(`输出：${output}`)
console.log(`尺寸：${width}x${height}`)

await screenshot(url, output, width, height)
