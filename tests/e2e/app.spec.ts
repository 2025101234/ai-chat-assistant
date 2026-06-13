import { test, expect } from '@playwright/test'

test.describe('AI聊天助手', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应该显示主界面', async ({ page }) => {
    await expect(page).toHaveTitle('AI聊天助手')
    await expect(page.locator('text=控制面板')).toBeVisible()
  })

  test('应该能够导航到不同页面', async ({ page }) => {
    await page.click('text=聊天监控')
    await expect(page.locator('text=选择一个聊天')).toBeVisible()

    await page.click('text=审核队列')
    await expect(page.locator('text=审核队列')).toBeVisible()

    await page.click('text=模型配置')
    await expect(page.locator('text=添加模型')).toBeVisible()

    await page.click('text=风格学习')
    await expect(page.locator('text=聊天记录导入')).toBeVisible()

    await page.click('text=系统设置')
    await expect(page.locator('text=基本设置')).toBeVisible()

    await page.click('text=数据管理')
    await expect(page.locator('text=数据管理')).toBeVisible()
  })

  test('应该显示统计信息', async ({ page }) => {
    await expect(page.locator('text=总消息数')).toBeVisible()
    await expect(page.locator('text=AI回复数')).toBeVisible()
    await expect(page.locator('text=人工回复数')).toBeVisible()
    await expect(page.locator('text=AI回复率')).toBeVisible()
  })

  test('应该能够切换主题', async ({ page }) => {
    await page.click('text=系统设置')
    await page.click('[data-testid="theme-select"]')
    await page.click('text=深色')
    
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'dark')
  })
})
