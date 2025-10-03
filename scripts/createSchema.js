// scripts/generate-prisma-fields.mjs
import fs from 'node:fs/promises'
import path from 'node:path'

const INPUT = process.argv[2] // URL or local file
const OUT = process.argv[3] || 'prisma-fields.txt'

// Load JSON from URL or file
async function loadJson(src) {
  if (!src) throw new Error('Usage: node scripts/generate-prisma-fields.mjs <url|file> [out]')
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.json()
  }
  const data = await fs.readFile(path.resolve(src), 'utf8')
  return JSON.parse(data)
}

// Sanitize for Prisma field names (keep your casing, replace non word chars with _)
function sanitizeName(name) {
  return String(name).replace(/[^\w]/g, '_')
}
function limbKey(limb) {
  if (!limb) return 'trial'
  const lower = String(limb).toLowerCase()
  return lower === 'asym' ? 'asymm' : lower // match your DB columns
}

function genFieldLines(entries) {
  // entries: Array<{ result: string, asymmetry: boolean }>
  const seen = new Set()
  const lines = []

  const limbsFor = (isAsym) => (isAsym ? ['trial','left','right','asymm'] : ['trial'])

  for (const { result, asymmetry } of entries) {
    const base = sanitizeName(result)
    const limbs = limbsFor(!!asymmetry)
    for (const l of limbs) {
      const valueField = `${base}_${l}_value`
      const unitField = `${base}_${l}_unit`
      const key = `${valueField}|${unitField}`
      if (seen.has(key)) continue
      seen.add(key)
      lines.push(`  ${valueField} Float?`)
      lines.push(`  ${unitField} String?`)
    }
  }
  // Optional: stable sort for diffs
  return lines.sort((a,b) => a.localeCompare(b))
}

async function main() {
  const data = await loadJson(INPUT)

  // Accept either: { test: Trial[] } or a single Trial or array of Trials
  const trials =
    Array.isArray(data?.test) ? data.test
    : Array.isArray(data) ? data
    : data?.results ? [data] // single trial shape
    : []

  if (!Array.isArray(trials) || trials.length === 0) {
    console.error('No trials found in input.')
    process.exit(1)
  }

  // Collect unique definition.result + asymmetry
  const defsMap = new Map()
  for (const t of trials) {
    for (const r of t.results || []) {
      const def = r.definition || {}
      const key = def.result
      if (!key) continue
      // Keep asymmetry if any instance says true
      const prev = defsMap.get(key)
      defsMap.set(key, { result: key, asymmetry: prev?.asymmetry || !!def.asymmetry })
    }
  }

  const lines = genFieldLines(Array.from(defsMap.values()))
  await fs.writeFile(OUT, lines.join('\n') + '\n', 'utf8')
  console.log(`Wrote ${lines.length} lines to ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})