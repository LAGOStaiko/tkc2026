import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'playwright/test'

type ViewportCase = {
  name: string
  width: number
  height: number
}

type AuditEntry = {
  viewport: string
  route: string
  status: number | null
  horizontalOverflowPx: number
  overflowOffenders: Array<{
    selector: string
    left: number
    right: number
    width: number
    text: string
  }>
  tinyText: Array<{
    selector: string
    fontSize: number
    text: string
  }>
}

const ROUTES = [
  '/',
  '/apply',
  '/archive',
  '/contact',
  '/results',
  '/schedule',
  '/song-pool',
  '/songs',
  '/console',
  '/console/finals',
  '/arcade',
  '/arcade/finals',
  '/arcade/swiss',
  '/arcade-results/2026',
  '/arcade-results/2026/finals',
] as const

const VIEWPORTS: ViewportCase[] = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const ARTIFACT_DIR = path.join(process.cwd(), 'temp', 'mobile-audit', 'artifacts')
const REPORT_PATH = path.join(process.cwd(), 'temp', 'mobile-audit', 'report.json')

test('mobile readability audit on public site routes', async ({ browser }) => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

  const issues: string[] = []
  const results: AuditEntry[] = []

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()

    for (const route of ROUTES) {
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(250)

      const audit = await page.evaluate(() => {
        const viewportWidth = window.innerWidth
        const root = document.documentElement
        const body = document.body
        const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0)
        const horizontalOverflowPx = Math.max(0, Math.round((scrollWidth - viewportWidth) * 100) / 100)

        const getSelector = (element: Element): string => {
          const el = element as HTMLElement
          if (el.id) return `#${el.id}`

          const parts: string[] = []
          let node: HTMLElement | null = el
          let depth = 0

          while (node && depth < 4) {
            let part = node.tagName.toLowerCase()
            const classes = Array.from(node.classList).slice(0, 2)
            if (classes.length) {
              part += `.${classes.join('.')}`
            }
            const parent = node.parentElement
            if (parent) {
              const sameTagSiblings = Array.from(parent.children).filter(
                (child) => child.tagName === node!.tagName
              )
              if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(node) + 1
                part += `:nth-of-type(${index})`
              }
            }

            parts.unshift(part)
            node = node.parentElement
            depth += 1
          }

          return parts.join(' > ')
        }

        const isVisible = (el: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean => {
          if (style.display === 'none') return false
          if (style.visibility === 'hidden') return false
          if (Number(style.opacity) === 0) return false
          if (rect.width <= 0 || rect.height <= 0) return false
          return true
        }

        const overflowOffenders: Array<{
          selector: string
          left: number
          right: number
          width: number
          text: string
        }> = []

        const tinyText: Array<{
          selector: string
          fontSize: number
          text: string
        }> = []

        for (const el of Array.from(document.querySelectorAll('body *'))) {
          const style = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          if (!isVisible(el, style, rect)) continue

          if (rect.left < -1 || rect.right > viewportWidth + 1) {
            if (overflowOffenders.length < 12) {
              overflowOffenders.push({
                selector: getSelector(el),
                left: Math.round(rect.left * 100) / 100,
                right: Math.round(rect.right * 100) / 100,
                width: Math.round(rect.width * 100) / 100,
                text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 70),
              })
            }
          }

          if ((el as HTMLElement).children.length > 0) continue
          const rawText = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
          if (!rawText) continue

          const fontSize = Number.parseFloat(style.fontSize)
          if (Number.isNaN(fontSize)) continue

          if (fontSize < 11) {
            if (tinyText.length < 12) {
              tinyText.push({
                selector: getSelector(el),
                fontSize,
                text: rawText.slice(0, 70),
              })
            }
          }
        }

        return {
          horizontalOverflowPx,
          overflowOffenders,
          tinyText,
        }
      })

      const entry: AuditEntry = {
        viewport: viewport.name,
        route,
        status: response?.status() ?? null,
        horizontalOverflowPx: audit.horizontalOverflowPx,
        overflowOffenders: audit.overflowOffenders,
        tinyText: audit.tinyText,
      }

      results.push(entry)

      const hasOverflow = entry.horizontalOverflowPx > 1
      const hasTinyText = entry.tinyText.length > 0
      const hasBadStatus = entry.status !== 200

      if (hasOverflow || hasTinyText || hasBadStatus) {
        const safeName = `${viewport.name}${route.replace(/\//g, '_') || '_root'}`
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, `${safeName}.png`),
          fullPage: true,
        })

        if (hasBadStatus) {
          issues.push(`${viewport.name} ${route}: status ${entry.status}`)
        }
        if (hasOverflow) {
          issues.push(`${viewport.name} ${route}: horizontal overflow ${entry.horizontalOverflowPx}px`)
        }
        if (hasTinyText) {
          issues.push(`${viewport.name} ${route}: tiny text (${entry.tinyText.length})`)
        }
      }
    }

    await context.close()
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify({ checkedAt: new Date().toISOString(), results, issues }, null, 2))

  expect(issues, `Mobile QA issues found. See ${REPORT_PATH}`).toEqual([])
})
