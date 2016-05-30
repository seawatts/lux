import Logger from '../../logger';
import Database from '../../database';
import loader from '../../loader';

const { env: { PWD } } = process;

export default async function dbSeed() {
  await new Database({
    path: PWD,
    config: external(`${PWD}/dist/config/database`).default,

    logger: await Logger.create({
      appPath: PWD,
      enabled: false
    })
  }).define(await loader(PWD, 'models'));

  await external(`${PWD}/dist/db/seed`).default();
}
