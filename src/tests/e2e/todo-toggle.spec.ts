import { test, expect } from '@playwright/test'

test.describe('Todo Toggle Flow', () => {
  test('toggle checkbox calls writeFile commit', async ({ page }) => {
    test.skip(true, 'Requires real GitHub token — run manually or with secrets')
    await page.goto('/todo')
    // Wait for checkboxes to appear
    const checkbox = page.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible({ timeout: 10000 })
    const wasChecked = await checkbox.isChecked()
    await checkbox.click()
    // Give time for async writeFile to complete
    await page.waitForTimeout(2000)
    // Reload and verify state persisted
    await page.reload()
    await page.waitForTimeout(3000)
    const reloaded = page.locator('input[type="checkbox"]').first()
    expect(await reloaded.isChecked()).toBe(!wasChecked)
  })
})
