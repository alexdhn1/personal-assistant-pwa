import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, approximateTokenCount } from '../../lib/context-builder'

describe('approximateTokenCount', () => {
  it('estimates tokens as chars / 4', () => {
    expect(approximateTokenCount('Hello World')).toBe(Math.floor(11 / 4))
    expect(approximateTokenCount('a'.repeat(400))).toBe(100)
    expect(approximateTokenCount('')).toBe(0)
  })
})

describe('buildSystemPrompt', () => {
  const files = [
    { name: 'todo.md', type: 'file' as const },
    { name: 'gifts.md', type: 'file' as const },
    { name: 'inbox', type: 'dir' as const },
  ]

  it('includes role definition', () => {
    const prompt = buildSystemPrompt(files)
    expect(prompt).toContain('assistant personnel')
  })

  it('includes available file structure', () => {
    const prompt = buildSystemPrompt(files)
    expect(prompt).toContain('todo.md')
    expect(prompt).toContain('gifts.md')
    expect(prompt).toContain('inbox')
  })

  it('includes behavioral instructions', () => {
    const prompt = buildSystemPrompt(files)
    expect(prompt).toContain('lire')
    expect(prompt).toContain('modifier')
  })

  it('includes max tool calls constraint', () => {
    const prompt = buildSystemPrompt(files)
    expect(prompt).toContain('10')
  })

  it('includes file headings when provided', () => {
    const headings: Record<string, string> = {
      'todo.md': 'Liste de tâches',
      'gifts.md': 'Idées cadeaux',
    }
    const prompt = buildSystemPrompt(files, headings)
    expect(prompt).toContain('Liste de tâches')
    expect(prompt).toContain('Idées cadeaux')
  })

  it('truncates arborescence when token budget exceeded', () => {
    // Create 300 files to exceed 8000 token budget
    const manyFiles = Array.from({ length: 300 }, (_, i) => ({
      name: `file-${i}.md`,
      type: 'file' as const,
    }))
    const prompt = buildSystemPrompt(manyFiles)
    // Prompt should still be generated but within reasonable length
    expect(approximateTokenCount(prompt)).toBeLessThanOrEqual(10000)
  })

  it('returns string with system role content', () => {
    const prompt = buildSystemPrompt(files)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })
})
