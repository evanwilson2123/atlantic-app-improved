import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isNumericLike(value) {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (trimmed === "") return false;
  const num = Number(trimmed);
  return Number.isFinite(num);
}

function computeQuantile(sortedValues, p) {
  if (!sortedValues.length) return NaN;
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
  const rootDir = process.cwd();
  const publicDir = path.resolve(rootDir, "public");
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
  const outputJson = path.resolve(rootDir, "public", "hp_obp_percentiles.json");

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

  const numericColumns = {};
  const byLevelNumeric = {};
  let headerColumns = [];
  let headerInitialized = false;

  for await (const record of parser) {
    if (!headerInitialized) {
      headerColumns = Object.keys(record);
      headerInitialized = true;
    }
    const levelRaw = record["playing_level"];
    const levelKey = (levelRaw ? String(levelRaw) : "").trim() || "Unknown";
    if (!byLevelNumeric[levelKey]) byLevelNumeric[levelKey] = {};

    for (const column of headerColumns) {
      const raw = record[column];
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

  const output = {};
  for (const [column, summary] of Object.entries(numericColumns)) {
    if (summary.count === 0) continue;
    const sorted = summary.values.slice().sort((a, b) => a - b);
    const series = {};
    for (const p of percentilesToCompute) {
      const value = computeQuantile(sorted, p);
      series[Math.round(p * 100).toString()] = Number.isFinite(value)
        ? Number(value.toFixed(4))
        : NaN;
    }
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
    series.min = Number(min.toFixed(4));
    series.max = Number(max.toFixed(4));
    series.mean = Number(mean.toFixed(4));
    output[column] = series;
  }

  // Build grouped-by-playing_level section
  const byLevelOutput = {};
  for (const [level, columns] of Object.entries(byLevelNumeric)) {
    const levelSeries = {};
    for (const [column, summary] of Object.entries(columns)) {
      if (summary.count === 0) continue;
      const sorted = summary.values.slice().sort((a, b) => a - b);
      const series = {};
      for (const p of percentilesToCompute) {
        const value = computeQuantile(sorted, p);
        series[Math.round(p * 100).toString()] = Number.isFinite(value)
          ? Number(value.toFixed(4))
          : NaN;
      }
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
      series.min = Number(min.toFixed(4));
      series.max = Number(max.toFixed(4));
      series.mean = Number(mean.toFixed(4));
      levelSeries[column] = series;
    }
    byLevelOutput[level] = levelSeries;
  }

  const finalOutput = {
    ...output,
    __by_playing_level: byLevelOutput,
  };

  fs.writeFileSync(outputJson, JSON.stringify(finalOutput, null, 2));
  console.log(`Wrote percentiles to ${outputJson}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


