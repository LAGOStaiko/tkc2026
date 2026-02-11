const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright')

const BASE_URL = 'http://127.0.0.1:4173'
const PREVIEW_CMD = ['cmd', ['/c', 'pnpm preview --host 127.0.0.1 --port 4173 --strictPort']]

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
]

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const TEMP_DIR = path.join(process.cwd(), 'temp', 'mobile-audit')
const ARTIFACT_DIR = path.join(TEMP_DIR, 'artifacts')
const REPORT_PATH = path.join(TEMP_DIR, 'report.json')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 120_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch (_err) {
      // keep waiting
    }
    await sleep(750)
  }
  throw new Error(`Server did not start within ${timeoutMs}ms: ${url}`)
}

function summarizeIssue(entry) {
  const parts = []
  if (entry.status !== 200) parts.push(`status ${entry.status}`)
  if (entry.horizontalOverflowPx > 1)
    parts.push(`horizontal overflow ${entry.horizontalOverflowPx}px`)
  if (entry.tinyText.length > 0) parts.push(`tiny text ${entry.tinyText.length}`)
  return `${entry.viewport} ${entry.route}: ${parts.join(', ')}`
}

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })

  const preview = spawn(PREVIEW_CMD[0], PREVIEW_CMD[1], {
    cwd: process.cwd(),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const previewLogs = []
  preview.stdout.on('data', (chunk) => previewLogs.push(chunk.toString()))
  preview.stderr.on('data', (chunk) => previewLogs.push(chunk.toString()))

  let browser
  const results = []

  try {
    await waitForServer(BASE_URL)

    browser = await chromium.launch({ headless: true })

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
      })
      const page = await context.newPage()

      for (const route of ROUTES) {
        const url = `${BASE_URL}${route}`
        let status = null

        try {
          const response = await page.goto(url, { waitUntil: 'networkidle' })
          status = response ? response.status() : null
        } catch (err) {
          status = -1
        }

        await page.waitForTimeout(250)

        const audit = await page.evaluate(() => {
          const viewportWidth = window.innerWidth
          const root = document.documentElement
          const body = document.body
          const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0)
          const horizontalOverflowPx = Math.max(
            0,
            Math.round((scrollWidth - viewportWidth) * 100) / 100
          )

          const getSelector = (element) => {
            if (element.id) return `#${element.id}`

            const parts = []
            let node = element
            let depth = 0
            while (node && depth < 4) {
              let part = node.tagName.toLowerCase()
              const classes = Array.from(node.classList || []).slice(0, 2)
              if (classes.length) part += `.${classes.join('.')}`

              const parent = node.parentElement
              if (parent) {
                const sameTag = Array.from(parent.children).filter(
                  (child) => child.tagName === node.tagName
                )
                if (sameTag.length > 1) {
                  part += `:nth-of-type(${sameTag.indexOf(node) + 1})`
                }
              }

              parts.unshift(part)
              node = node.parentElement
              depth += 1
            }

            return parts.join(' > ')
          }

          const isVisible = (style, rect) => {
            if (style.display === 'none') return false
            if (style.visibility === 'hidden') return false
            if (Number(style.opacity) === 0) return false
            if (rect.width <= 0 || rect.height <= 0) return false
            return true
          }

          const overflowOffenders = []
          const tinyText = []

          for (const el of Array.from(document.querySelectorAll('body *'))) {
            const style = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            if (!isVisible(style, rect)) continue

            if (rect.left < -1 || rect.right > viewportWidth + 1) {
              if (overflowOffenders.length < 12) {
                overflowOffenders.push({
                  selector: getSelector(el),
                  left: Math.round(rect.left * 100) / 100,
                  right: Math.round(rect.right * 100) / 100,
                  width: Math.round(rect.width * 100) / 100,
                  text: (el.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 80),
                })
              }
            }

            if (el.children.length > 0) continue
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
            if (!text) continue

            const fontSize = Number.parseFloat(style.fontSize)
            if (Number.isNaN(fontSize)) continue

            if (fontSize < 11) {
              if (tinyText.length < 12) {
                tinyText.push({
                  selector: getSelector(el),
                  fontSize,
                  text: text.slice(0, 80),
                })
              }
            }
          }

          return { horizontalOverflowPx, overflowOffenders, tinyText }
        })

        const entry = {
          viewport: viewport.name,
          route,
          status,
          horizontalOverflowPx: audit.horizontalOverflowPx,
          overflowOffenders: audit.overflowOffenders,
          tinyText: audit.tinyText,
        }

        results.push(entry)

        if (
          entry.status !== 200 ||
          entry.horizontalOverflowPx > 1 ||
          entry.tinyText.length > 0
        ) {
          const safeName = `${viewport.name}${route.replace(/\//g, '_') || '_root'}`
          await page.screenshot({
            path: path.join(ARTIFACT_DIR, `${safeName}.png`),
            fullPage: true,
          })
        }
      }

      await context.close()
    }
  } finally {
    if (browser) await browser.close()
    if (!preview.killed) {
      preview.kill('SIGTERM')
      await sleep(500)
      if (!preview.killed) preview.kill('SIGKILL')
    }
  }

  const issues = results
    .filter(
      (entry) =>
        entry.status !== 200 ||
        entry.horizontalOverflowPx > 1 ||
        entry.tinyText.length > 0
    )
    .map(summarizeIssue)

  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routeCount: ROUTES.length,
    viewportCount: VIEWPORTS.length,
    issueCount: issues.length,
    issues,
    results,
    previewLogs,
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  if (issues.length) {
    console.error(`Mobile audit found ${issues.length} issue(s).`)
    for (const issue of issues) console.error(`- ${issue}`)
    process.exitCode = 1
    return
  }

  console.log('Mobile audit passed with no issues.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
