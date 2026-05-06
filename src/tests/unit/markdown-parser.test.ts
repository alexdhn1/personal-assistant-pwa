import { describe, it, expect } from 'vitest'
import {
  parseTodoFile,
  serializeTodoFile,
  type TodoItem,
} from '../../lib/markdown-parser'

const SAMPLE_TODO = `# Todo

## Cette semaine

- [ ] Buy groceries #urgent
- [x] Call dentist #admin
- [ ] Prepare presentation

## Ce mois-ci

- [ ] Book flight to Paris
- [X] Pay rent

## Someday

- [ ] Learn guitar
`

describe('markdown-parser', () => {
  it('parses sections from todo markdown', () => {
    const result = parseTodoFile(SAMPLE_TODO)
    expect(result).toHaveLength(3)
    expect(result[0].title).toBe('Cette semaine')
    expect(result[1].title).toBe('Ce mois-ci')
    expect(result[2].title).toBe('Someday')
  })

  it('parses checkboxes correctly ([ ] and [x]/[X])', () => {
    const result = parseTodoFile(SAMPLE_TODO)
    const week = result[0]
    expect(week.items).toHaveLength(3)
    expect(week.items[0].checked).toBe(false)
    expect(week.items[0].text).toBe('Buy groceries')
    expect(week.items[1].checked).toBe(true)
    expect(week.items[2].checked).toBe(false)
  })

  it('extracts tags from task text', () => {
    const result = parseTodoFile(SAMPLE_TODO)
    expect(result[0].items[0].tags).toContain('urgent')
    expect(result[0].items[1].tags).toContain('admin')
    expect(result[0].items[2].tags).toHaveLength(0)
  })

  it('handles [X] as checked (capital X)', () => {
    const result = parseTodoFile(SAMPLE_TODO)
    const month = result[1]
    expect(month.items[1].checked).toBe(true) // "- [X] Pay rent"
  })

  it('round-trips: parse → toggle → serialize → parse', () => {
    const sections = parseTodoFile(SAMPLE_TODO)
    // Toggle first item
    sections[0].items[0].checked = true
    const serialized = serializeTodoFile(sections)
    const reparsed = parseTodoFile(serialized)
    expect(reparsed[0].items[0].checked).toBe(true)
    expect(reparsed[0].items[0].text).toBe('Buy groceries')
  })

  it('adds new task to a section', () => {
    const sections = parseTodoFile(SAMPLE_TODO)
    const newItem: TodoItem = { id: 'new', text: 'New task', checked: false, tags: [] }
    sections[0].items.push(newItem)
    const serialized = serializeTodoFile(sections)
    expect(serialized).toContain('- [ ] New task')
  })
})
