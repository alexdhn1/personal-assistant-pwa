import { test, expect } from '@playwright/test'

test.describe('Inbox Capture Flow', () => {
  test('capture note → inbox/YYYY-MM-DD.md created', async ({ page }) => {
    test.skip(true, 'Requires real GitHub token — run manually or with secrets')
    await page.goto('/inbox')
    await page.getByRole('button', { name: /capture|add|inbox/i }).click()
    await page.getByPlaceholder(/note|thought|capture/i).fill('E2E test note')
    await page.getByRole('button', { name: /save|submit|done/i }).click()
    await page.waitForTimeout(2000)
    // After save modal should close
    await expect(page.getByPlaceholder(/note|thought|capture/i)).not.toBeVisible()
  })
})
