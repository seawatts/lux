import Database, { createMigrations, pendingMigrations } from '../../database';
import Logger, { sql } from '../../logger';
import loader from '../../loader';

const { env: { PWD } } = process;

export default async function dbMigrate() {
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

  const pending = await pendingMigrations(PWD, () => connection('migrations'));

  if (pending.length) {
    await Promise.all(
      pending.map(async (migration) => {
        const version = migration.replace(/^(\d{16})-.+$/g, '$1');
        migration = migration.replace(new RegExp(`${version}-(.+)\.js`), '$1');
        migration = migrations.get(`${migration}-up`);

        if (migration) {
          const query = migration.run(schema());

          await query.on('query', () => {
            process.stdout.write(sql`${query.toString()}\n`);
          });

          await connection('migrations').insert({
            version
          });
        }

        return migration;
      })
    );
  }
}
