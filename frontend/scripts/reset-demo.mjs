import mysql from 'mysql2/promise';

const schema = process.env.E2E_DB_NAME || 'zenda';
if (!['zenda', 'zenda_e2e'].includes(schema))
  throw new Error('Reset is restricted to documented synthetic demo schemas.');
const database = await mysql.createConnection({
  host: process.env.E2E_DB_HOST || '127.0.0.1',
  port: Number(process.env.E2E_DB_PORT || 3307),
  user: process.env.E2E_DB_USER || 'zenda',
  password: process.env.E2E_DB_PASSWORD || 'zenda_local_only',
  database: schema,
});
try {
  const [rows] = await database.query('SELECT name FROM students WHERE id = 1');
  if (rows[0]?.name !== 'Jessica John Jones')
    throw new Error('Refusing to reset a database without the synthetic demo student.');
  await database.execute('DELETE FROM activations WHERE student_id = 1');
  console.log('Synthetic demo activation reset. Reload the dashboard to start again.');
} finally {
  await database.end();
}
