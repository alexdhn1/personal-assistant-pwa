import { test, expect } from '@playwright/test'

test.describe('Editor Save Flow', () => {
  test('edit file and save → commit created', async ({ page }) => {
    test.skip(true, 'Requires real GitHub token — run manually or with secrets')
    await page.goto('/editor')
    const fileItem = page.locator('button').filter({ hasText: /\.md$/ }).first()
    await expect(fileItem).toBeVisible({ timeout: 10000 })
    await fileItem.click()
    const textarea = page.getByRole('textbox')
    await expect(textarea).toBeVisible()
    const original = await textarea.inputValue()
    await textarea.fill(original + '\n<!-- E2E edit -->')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByRole('button', { name: /saved/i })).toBeVisible({ timeout: 5000 })
  })
})
