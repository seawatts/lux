import fs from '../../fs';
import loader from '../../loader';
import { connect } from '../../database';

const { env: { PWD, NODE_ENV = 'development' } } = process;

export default async function dbCreate() {
  const {
    database: {
      [NODE_ENV]: {
        driver,
        database,
        ...config
      }
    }
  } = loader(PWD, 'config');

  if (driver === 'sqlite3') {
    await fs.writeFileAsync(`${PWD}/db/${database}_${NODE_ENV}.sqlite`, '');
  } else {
    const { schema } = connect(PWD, { ...config, driver });
    const query = schema.raw(`CREATE DATABASE ${database}`);

    query.on('query', () => console.log(query.toString()));
    await query;
  }
}
