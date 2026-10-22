const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const cli = path.resolve(__dirname, '../node_modules/prisma/build/index.js');
const cwd = path.resolve(__dirname, '..');
const migration = '20261013165000_restore_missing_schema';
function run(args, acceptable = [0]) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, env: process.env, encoding: 'utf8' });
  if (!acceptable.includes(result.status)) throw new Error('Команда Prisma не выполнена; проверьте схему и журнал локально.');
  return result;
}
(async () => {
  if (!process.env.DATABASE_URL?.startsWith('file:')) throw new Error('Укажите SQLite DATABASE_URL');
  // SQLite file: paths are relative to prisma/schema.prisma, not the CLI cwd.
  const databasePath = process.env.DATABASE_URL.slice(5);
  if (databasePath.includes('?')) throw new Error('Используйте SQLite URL без query-параметров для обновления');
  process.env.DATABASE_URL = `file:${path.resolve(cwd, 'prisma', databasePath)}`;
  const prisma = new PrismaClient();
  try {
    const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("Project")');
    if (columns.length && !process.argv.includes('--backup-confirmed'))
      throw new Error('Остановите API и сделайте резервную копию SQLite. Затем повторите с --backup-confirmed.');
    const applied = columns.length ? await prisma.$queryRawUnsafe('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL') : [];
    if (!applied.some(row => row.migration_name === migration) && columns.some(row => row.name === 'dna')) {
      const result = run(['migrate', 'diff', '--from-url', process.env.DATABASE_URL, '--to-schema-datamodel', 'prisma/legacy-schema-check.prisma', '--exit-code'], [0, 2]);
      if (result.status !== 0) throw new Error('Старая БД отличается от проверенной схемы. Автоматическое обновление остановлено; не используйте reset.');
      await prisma.$disconnect();
      run(['migrate', 'resolve', '--applied', migration]);
    }
    await prisma.$disconnect();
    run(['migrate', 'deploy']);
    console.log('Миграции применены. Данные не сбрасывались.');
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
