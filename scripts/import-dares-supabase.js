const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const EXPECTED_COLUMNS = [
  'id',
  'level',
  'stage',
  'day_number',
  'life_category',
  'title',
  'description',
  'easier_title',
  'easier_description',
  'safety_tip',
  'difficulty',
  'points',
  'mascot_type',
  'created_at'
];

const EXPECTED_CATEGORIES = ['Student', 'Employee / Worker', 'Homemaker', 'Retired'];
const args = process.argv.slice(2);
const validateOnly = args.includes('--validate-only');
const csvArg = args.find((arg) => arg !== '--validate-only');
const CSV_PATH = csvArg || 'C:\\Users\\Cyril\\Downloads\\introvee_dares_rows_format.csv';

loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
validateRows(rows);

if (validateOnly) {
  console.log(`CSV validation passed: ${rows.length} rows.`);
  process.exit(0);
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this import.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const ids = rows.map((row) => row.id);

  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    const { error } = await supabase.from('dares').upsert(chunk, { onConflict: 'id' });
    if (error) throw error;
  }

  if (process.env.PRUNE_DARES_NOT_IN_CSV === 'true') {
    const { error } = await supabase.from('dares').delete().not('id', 'in', `(${ids.map(quotePostgrestValue).join(',')})`);
    if (error) throw error;
  }

  const { count: totalRows, error: totalError } = await supabase
    .from('dares')
    .select('id', { count: 'exact', head: true });
  if (totalError) throw totalError;

  const { data: allDares, error: countError } = await supabase
    .from('dares')
    .select('life_category')
    .in('life_category', EXPECTED_CATEGORIES);
  if (countError) throw countError;

  const categoryCounts = countBy(allDares, 'life_category');
  console.log(`Total rows: ${totalRows}`);
  for (const category of EXPECTED_CATEGORIES.slice().sort()) {
    console.log(`${category}: ${categoryCounts[category] || 0}`);
  }

  const allCategoryCountsMatch = EXPECTED_CATEGORIES.every((category) => categoryCounts[category] === 100);
  if (totalRows !== 400 || !allCategoryCountsMatch) {
    throw new Error('Verification failed. Expected total rows = 400 and 100 rows for each life category.');
  }
}

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

function parseCsv(content) {
  const records = [];
  let field = '';
  let record = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      record.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      record.push(field);
      field = '';
      if (record.some((value) => value !== '')) records.push(record);
      record = [];
    } else {
      field += char;
    }
  }

  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const [headers, ...dataRows] = records;
  return dataRows.map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return coerceRow(row);
  });
}

function coerceRow(row) {
  return {
    ...row,
    level: toInteger(row.level, 'level'),
    stage: toInteger(row.stage, 'stage'),
    day_number: toInteger(row.day_number, 'day_number'),
    points: toInteger(row.points, 'points'),
    mascot_type: row.mascot_type || null
  };
}

function validateRows(parsedRows) {
  if (parsedRows.length !== 400) throw new Error(`Expected 400 CSV rows, found ${parsedRows.length}.`);

  const headers = Object.keys(parsedRows[0] || {});
  if (headers.join('|') !== EXPECTED_COLUMNS.join('|')) {
    throw new Error(`CSV columns must be exactly: ${EXPECTED_COLUMNS.join(', ')}`);
  }

  const ids = new Set();
  const counts = {};
  for (const row of parsedRows) {
    if (ids.has(row.id)) throw new Error(`Duplicate id in CSV: ${row.id}`);
    ids.add(row.id);

    if (!EXPECTED_CATEGORIES.includes(row.life_category)) {
      throw new Error(`Unexpected life_category "${row.life_category}" for id ${row.id}.`);
    }
    if (row.level < 1 || row.level > 20) throw new Error(`Invalid level for id ${row.id}.`);
    if (row.stage < 1 || row.stage > 5) throw new Error(`Invalid stage for id ${row.id}.`);
    if (row.day_number < 1 || row.day_number > 100) throw new Error(`Invalid day_number for id ${row.id}.`);
    if (!['easy', 'medium', 'hard'].includes(row.difficulty)) throw new Error(`Invalid difficulty for id ${row.id}.`);

    counts[row.life_category] = counts[row.life_category] || { rows: 0, days: new Set(), levels: new Set(), stages: new Set() };
    counts[row.life_category].rows += 1;
    counts[row.life_category].days.add(row.day_number);
    counts[row.life_category].levels.add(row.level);
    counts[row.life_category].stages.add(row.stage);
  }

  for (const category of EXPECTED_CATEGORIES) {
    const count = counts[category];
    if (!count || count.rows !== 100 || count.days.size !== 100 || count.levels.size !== 20 || count.stages.size !== 5) {
      throw new Error(`${category} must have 100 rows, 100 days, 20 levels, and 5 stages.`);
    }
  }
}

function toInteger(value, column) {
  if (!/^-?\d+$/.test(value)) throw new Error(`${column} must be an integer. Received "${value}".`);
  return Number.parseInt(value, 10);
}

function countBy(values, key) {
  return values.reduce((counts, value) => {
    counts[value[key]] = (counts[value[key]] || 0) + 1;
    return counts;
  }, {});
}

function quotePostgrestValue(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}
