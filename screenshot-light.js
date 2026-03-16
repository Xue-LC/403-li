import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

async function screenshotLight() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // 切换到浅色模式
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/root/.openclaw/workspace/403-li/screenshot-light.png' });
  
  await browser.close();
  console.log('✅ 浅色模式截图完成');
}

screenshotLight().catch(console.error);
