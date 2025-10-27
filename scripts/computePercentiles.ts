import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

type NumericSummary = {
  count: number;
  values: number[];
};

type Percentiles = Record<string, Record<string, number>>;

function isNumericLike(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  const num = Number(trimmed);
  return Number.isFinite(num);
}

function computeQuantile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return NaN;
  if (p <= 0) return sortedValues[0];
  if (p >= 1) return sortedValues[sortedValues.length - 1];
  const position = (sortedValues.length - 1) * p;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weightUpper = position - lowerIndex;
  if (upperIndex === lowerIndex) return sortedValues[lowerIndex];
  return (
    sortedValues[lowerIndex] * (1 - weightUpper) +
    sortedValues[upperIndex] * weightUpper
  );
}

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  const defaultCsv = path.resolve(publicDir, "hp_obp.csv");
  let inputCsv = defaultCsv;
  if (!fs.existsSync(defaultCsv)) {
    const candidates = fs
      .readdirSync(publicDir)
      .filter((f) => /^hp_obp.*\.csv$/i.test(f))
      .map((f) => path.resolve(publicDir, f));
    if (candidates.length === 0) {
      console.error(
        `Input CSV not found. Looked for ${defaultCsv} or any hp_obp*.csv in ${publicDir}`
      );
      process.exit(1);
    }
    candidates.sort((a, b) => {
      const sa = fs.statSync(a).mtimeMs;
      const sb = fs.statSync(b).mtimeMs;
      return sb - sa; // newest first
    });
    inputCsv = candidates[0];
    console.log(`Using input CSV: ${path.basename(inputCsv)}`);
  }
  const outputJson = path.resolve(publicDir, "hp_obp_percentiles.json");

  const parser = fs
    .createReadStream(inputCsv)
    .pipe(
      parse({
        columns: true,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

  const numericColumns: Record<string, NumericSummary> = {};
  const byLevelNumeric: Record<string, Record<string, NumericSummary>> = {};
  let headerInitialized = false;
  let headerColumns: string[] = [];

  for await (const record of parser) {
    if (!headerInitialized) {
      headerColumns = Object.keys(record);
      headerInitialized = true;
    }

    // Determine playing level grouping key
    const levelRaw = (record as Record<string, string | undefined>)[
      "playing_level"
    ];
    const levelKey = (levelRaw ? String(levelRaw) : "").trim() || "Unknown";

    if (!byLevelNumeric[levelKey]) byLevelNumeric[levelKey] = {};

    for (const column of headerColumns) {
      const raw = (record as Record<string, string | undefined>)[column];

      if (!numericColumns[column]) {
        numericColumns[column] = { count: 0, values: [] };
      }
      if (!byLevelNumeric[levelKey][column]) {
        byLevelNumeric[levelKey][column] = { count: 0, values: [] };
      }

      if (isNumericLike(raw)) {
        const num = Number(String(raw).trim());
        numericColumns[column].values.push(num);
        numericColumns[column].count += 1;
        byLevelNumeric[levelKey][column].values.push(num);
        byLevelNumeric[levelKey][column].count += 1;
      }
    }
  }

  const percentilesToCompute = [
    0.01, 0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9,
    0.95, 0.99,
  ];

  const output: Percentiles = {};

  for (const [column, summary] of Object.entries(numericColumns)) {
    // Skip obviously non-numeric columns
    if (summary.count === 0) continue;

    const sorted = summary.values.slice().sort((a, b) => a - b);
    const series: Record<string, number> = {};
    for (const p of percentilesToCompute) {
      const value = computeQuantile(sorted, p);
      series[Math.round(p * 100).toString()] = Number.isFinite(value)
        ? Number(value.toFixed(4))
        : NaN;
    }
    // Always include min/max/mean for context
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
    series.min = Number(min.toFixed(4)) as unknown as number;
    series.max = Number(max.toFixed(4)) as unknown as number;
    series.mean = Number(mean.toFixed(4)) as unknown as number;

    output[column] = series;
  }

  // Add grouped-by-playing_level section while preserving existing top-level structure
  const byLevelOutput: Record<string, Record<string, number>> = {} as any;
  for (const [level, columns] of Object.entries(byLevelNumeric)) {
    const levelSeries: Record<string, Record<string, number>> = {} as any;
    for (const [column, summary] of Object.entries(columns)) {
      if (summary.count === 0) continue;
      const sorted = summary.values.slice().sort((a, b) => a - b);
      const series: Record<string, number> = {};
      for (const p of percentilesToCompute) {
        const value = computeQuantile(sorted, p);
        series[Math.round(p * 100).toString()] = Number.isFinite(value)
          ? Number(value.toFixed(4))
          : NaN;
      }
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
      series.min = Number(min.toFixed(4)) as unknown as number;
      series.max = Number(max.toFixed(4)) as unknown as number;
      series.mean = Number(mean.toFixed(4)) as unknown as number;
      levelSeries[column] = series;
    }
    (byLevelOutput as any)[level] = levelSeries;
  }

  const finalOutput = {
    ...output,
    __by_playing_level: byLevelOutput,
  } as Record<string, unknown>;

  fs.writeFileSync(outputJson, JSON.stringify(finalOutput, null, 2));
  console.log(`Wrote percentiles to ${outputJson}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


