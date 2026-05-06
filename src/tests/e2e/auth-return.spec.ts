import { test, expect } from '@playwright/test'

test.describe('Auth Return Flow', () => {
  test('return visit: password only → navigates to /todo', async ({ page }) => {
    // This test requires an existing encrypted token in IndexedDB.
    // In CI, this is skipped unless a real GitHub token is available.
    test.skip(true, 'Requires real GitHub token — run manually or with secrets')

    await page.goto('/')
    await page.waitForURL('**/auth')
    const passwordInput = page.getByPlaceholder(/password|passphrase/i).first()
    await passwordInput.fill('testpassword')
    await page.getByRole('button', { name: /unlock|sign in/i }).click()
    await page.waitForURL('**/todo')
    expect(page.url()).toContain('/todo')
  })
})
