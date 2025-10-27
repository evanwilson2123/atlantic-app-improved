import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isNumericLike(value) {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (trimmed === "") return false;
  const num = Number(trimmed);
  return Number.isFinite(num);
}

function toNumberOrNull(value) {
  return isNumericLike(value) ? Number(String(value).trim()) : null;
}

function toDateOrNull(value) {
  const s = value == null ? "" : String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Map CSV header -> Prisma model field
const fieldMap = {
  "test_date": "testDate",
  "playing_level": "playingLevel",
  "bat_speed_mph_group": "batSpeedMphGroup",
  "pitch_speed_mph_group": "pitchSpeedMphGroup",
  "jump_height_(imp-mom)_[cm]_mean_cmj": "jumpHeightImpMomCmMeanCmj",
  "lower-limb_stiffness_[n/m]_mean_cmj": "lowerLimbStiffnessNmMeanCmj",
  "peak_power_[w]_mean_cmj": "peakPowerWMeanCmj",
  "peak_power_/_bm_[w/kg]_mean_cmj": "peakPowerPerBmWkgMeanCmj",
  "eccentric_braking_rfd_[n/s]_mean_cmj": "eccentricBrakingRfdNsMeanCmj",
  "eccentric_duration_[ms]_mean_cmj": "eccentricDurationMsMeanCmj",
  "concentric_duration_[ms]_mean_cmj": "concentricDurationMsMeanCmj",
  "rsi-modified_[m/s]_mean_cmj": "rsiModifiedMSMeanCmj",
  "countermovement_depth_[cm]_mean_cmj": "countermovementDepthCmMeanCmj",
  "cmj_stiffness_asymmetry_[%_l,r]_mean_cmj": "cmjStiffnessAsymmetryPctLRMeanCmj",
  "eccentric_deceleration_impulse_(asymmetry)_[%_l,r]_mean_cmj": "eccentricDecelImpulseAsymPctLRMeanCmj",
  "p1_concentric_impulse_asymmetry_[%_l,r]_mean_cmj": "p1ConcentricImpulseAsymPctLRMeanCmj",
  "p2_concentric_impulse_asymmetry_[%_l,r]_mean_cmj": "p2ConcentricImpulseAsymPctLRMeanCmj",
  "concentric_peak_force_[n]_mean_cmj": "concentricPeakForceNMeanCmj",
  "eccentric_peak_force_[n]_mean_cmj": "eccentricPeakForceNMeanCmj",
  "minimum_eccentric_force_[n]_mean_cmj": "minimumEccentricForceNMeanCmj",
  "jump_height_(imp-mom)_[cm]_mean_sj": "jumpHeightImpMomCmMeanSj",
  "peak_power_[w]_mean_sj": "peakPowerWMeanSj",
  "peak_power_/_bm_[w/kg]_mean_sj": "peakPowerPerBmWkgMeanSj",
  "p1_concentric_impulse_asymmetry_[%_l,r]_mean_sj": "p1ConcentricImpulseAsymPctLRMeanSj",
  "p2_concentric_impulse_asymmetry_[%_l,r]_mean_sj": "p2ConcentricImpulseAsymPctLRMeanSj",
  "peak_vertical_force_[n]_max_imtp": "peakVerticalForceNMaxImtp",
  "net_peak_vertical_force_[n]_max_imtp": "netPeakVerticalForceNMaxImtp",
  "force_at_100ms_[n]_max_imtp": "forceAt100msNMaxImtp",
  "force_at_150ms_[n]_max_imtp": "forceAt150msNMaxImtp",
  "force_at_200ms_[n]_max_imtp": "forceAt200msNMaxImtp",
  "best_active_stiffness_[n/m]_mean_ht": "bestActiveStiffnessNmMeanHt",
  "best_jump_height_(flight_time)_[cm]_mean_ht": "bestJumpHeightFlightTimeCmMeanHt",
  "best_rsi_(flight/contact_time)_mean_ht": "bestRsiFlightContactTimeMeanHt",
  "best_rsi_(jump_height/contact_time)_[m/s]_mean_ht": "bestRsiJumpHeightContactTimeMSMeanHt",
  "peak_takeoff_force_[n]_mean_pp": "peakTakeoffForceNMeanPp",
  "peak_eccentric_force_[n]_mean_pp": "peakEccentricForceNMeanPp",
  "peak_takeoff_force_asymmetry_[%_l,r]_mean_pp": "peakTakeoffForceAsymPctLRMeanPp",
  "peak_eccentric_force_asymmetry_[%_l,r]_mean_pp": "peakEccentricForceAsymPctLRMeanPp",
  "TSpineRomR": "tSpineRomR",
  "TSpineRomL": "tSpineRomL",
  "ShoulderERL": "shoulderERL",
  "ShoulderERR": "shoulderERR",
  "ShoulderIRL": "shoulderIRL",
  "ShoulderIRR": "shoulderIRR",
  "pitching_session_date": "pitchingSessionDate",
  "pitch_speed_mph": "pitchSpeedMph",
  "pitching_max_hss": "pitchingMaxHss",
  "hitting_session_date": "hittingSessionDate",
  "bat_speed_mph": "batSpeedMph",
  "hitting_max_hss": "hittingMaxHss",
  "relative_strength": "relativeStrength",
  "body_weight_[lbs]": "bodyWeightLbs",
  "athlete_uid": "athleteUid",
};

function transformRecord(record) {
  const out = {};
  for (const [csvKey, prismaKey] of Object.entries(fieldMap)) {
    const raw = record[csvKey];
    if (raw == null || String(raw).trim() === "") {
      out[prismaKey] = null;
      continue;
    }
    if (
      csvKey === "test_date" ||
      csvKey === "pitching_session_date" ||
      csvKey === "hitting_session_date"
    ) {
      out[prismaKey] = toDateOrNull(raw);
    } else if (
      csvKey === "playing_level" ||
      csvKey === "bat_speed_mph_group" ||
      csvKey === "pitch_speed_mph_group" ||
      csvKey === "athlete_uid"
    ) {
      out[prismaKey] = String(raw).trim();
    } else {
      out[prismaKey] = toNumberOrNull(raw);
    }
  }
  return out;
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
    candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    inputCsv = candidates[0];
  }

  console.log(`Loading CSV: ${path.basename(inputCsv)}`);

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

  const batch = [];
  let processed = 0;
  let inserted = 0;
  const BATCH_SIZE = 500;

  async function flush() {
    if (batch.length === 0) return;
    const payload = batch.splice(0, batch.length);
    const res = await prisma.hpObp.createMany({ data: payload });
    inserted += res.count || 0;
  }

  for await (const record of parser) {
    const transformed = transformRecord(record);
    batch.push(transformed);
    processed += 1;
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }

  await flush();
  console.log(`Processed rows: ${processed}`);
  console.log(`Inserted rows: ${inserted}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


