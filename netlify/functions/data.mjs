import pg from 'pg';
const { Pool } = pg;

const rawConn = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '';
const connStr = rawConn.replace('channel_binding=require', 'channel_binding=disable');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

const num = v => (v == null ? null : Number(v));
// ── XLSX export helpers ──
const fmtVal = v => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string' && v !== '' && !isNaN(Number(v))) return Number(v);
  return v;
};
// Keep only columns that exist in the table, in the given order
const exportRows = (rows, cols) => {
  const have = rows.length ? cols.filter(c => c in rows[0]) : cols;
  return { cols: have, rows: rows.map(r => Object.fromEntries(have.map(c => [c, fmtVal(r[c])]))) };
};

const pick = (r, ...keys) => { for (const k of keys) if (r[k] != null) return r[k]; return null; };

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  try {
    const { start, end, battery } = event.queryStringParameters || {};
    const params = [start || null, end || null];
    let batClause = '';
    if (battery === 'F' || battery === 'L') { params.push(battery); batClause = ` AND battery = $3`; }

    // SELECT * so a renamed/missing column (e.g. gas_produced_mcf vs gas_sales_mcf) can never break the query
    const prod = await pool.query(
      `SELECT * FROM markham.production
       WHERE ($1::date IS NULL OR report_date >= $1::date)
         AND ($2::date IS NULL OR report_date <= $2::date)${batClause}
       ORDER BY report_date ASC, battery ASC`, params);

    const tests = await pool.query(
      `SELECT * FROM markham.well_tests
       WHERE ($1::date IS NULL OR test_date >= $1::date)
         AND ($2::date IS NULL OR test_date <= $2::date)${batClause}
       ORDER BY test_date DESC, well_name ASC`, params);

    const production = prod.rows.map(r => ({
      report_date:   r.report_date,
      battery:       r.battery,
      oil_bbls:      num(r.oil_produced_bbls),
      water_bbls:    num(r.water_produced_bbls),
      gas_sales_mcf: num(pick(r, 'gas_sales_mcf', 'gas_produced_mcf')),
    }));

    const wellTests = tests.rows.map(r => ({
      test_date:  r.test_date,
      well_name:  r.well_name,
      oil_bbls:   num(pick(r, 'oil_bopd', 'oil_bbls')),
      water_bbls: num(pick(r, 'water_bwpd', 'water_bbls')),
      tubing_psi: num(r.tubing_psi),
      casing_psi: num(r.casing_psi),
    }));

    const pe = exportRows(prod.rows, ['report_date','battery','tank1_ft','tank1_in','tank1_bbls','tank2_ft','tank2_in','tank2_bbls','oil_produced_bbls','oil_hauled_bbls','swd_18f_bbls','swd_12k_bbls','swd_14k_bbls','water_produced_bbls','swd_discharge_psi','gas_sales_mcf','gas_produced_mcf']);
    const we = exportRows(tests.rows, ['test_date','well_name','battery','well_type','oil_bopd','water_bwpd','gas_in_mcfd','gas_out_mcfd','tubing_psi','casing_psi']);

    return { statusCode: 200, headers, body: JSON.stringify({
      production, wellTests,
      productionExport: pe.rows, productionExportCols: pe.cols,
      wellTestsExport: we.rows, wellTestsExportCols: we.cols,
      range: { start: start || null, end: end || null },
    }) };
  } catch (err) {
    console.error('DB error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
