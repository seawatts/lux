import Database, { createMigrations } from '../../database';
import Logger, { sql } from '../../logger';
import fs from '../../fs';
import loader from '../../loader';

const { env: { PWD } } = process;

/**
 * @private
 */
export default async function dbRollback() {
  const { database: config } = loader(PWD, 'config');
  const migrations = loader(PWD, 'migrations');

  const { connection, schema } = new Database({
    config,
    path: PWD,

    logger: await new Logger({
      path: PWD,
      enabled: false
    })
  });

  await createMigrations(schema);

  const migrationFiles = await fs.readdirAsync(`${PWD}/db/migrate`);

  if (migrationFiles.length) {
    let migration;
    let version = await connection('migrations')
      .orderBy('version', 'desc')
      .first();

    if (version && version.version) {
      version = version.version;
    }

    const target = migrationFiles.find(m => m.indexOf(version) === 0);

    if (target) {
      migration = target.replace(new RegExp(`${version}-(.+)\.js`), '$1');
      migration = migrations.get(`${migration}-down`);

      if (migration) {
        const query = migration.run(schema());

        await query.on('query', () => {
          process.stdout.write(sql`${query.toString()}\n`);
        });

        await connection('migrations').where({
          version
        }).del();
      }
    }
  }
}
