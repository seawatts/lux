import Database, { createMigrations } from '../../database';
import Logger, { sql } from '../../logger';
import fs from '../../fs';

const { env: { PWD } } = process;

export default async function dbRollback() {
  const { connection, schema } = new Database({
    path: PWD,
    config: external(`${PWD}/dist/config/database`).default,

    logger: await Logger.create({
      appPath: PWD,
      enabled: false
    })
  });

  const migrations = await fs.readdirAsync(`${PWD}/dist/db/migrate`);

  await createMigrations(schema);

  if (migrations.length) {
    let version = await connection('migrations')
      .orderBy('version', 'desc')
      .first();

    if (version && version.version) {
      version = version.version;
    }

    const target = migrations.find(migration => {
      return migration.indexOf(version) === 0;
    });

    if (target) {
      let { down } = external(`${PWD}/dist/db/migrate/${target}`);

      down = down(schema());

      down.on('query', () => console.log(sql`${down.toString()}`));
      await down;

      await connection('migrations').where({ version }).del();
    }
  }
}
