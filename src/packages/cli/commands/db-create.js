import fs from '../../fs';
import { connect } from '../../database';

const { env: { PWD, NODE_ENV = 'development' } } = process;

export default async function dbCreate() {
  const {
    default: {
      [NODE_ENV]: {
        driver,
        database,
        ...config
      }
    }
  } = external(`${PWD}/dist/config/database`);

  if (driver === 'sqlite3') {
    await fs.writeFileAsync(`${PWD}/db/${database}_${NODE_ENV}.sqlite`, '');
  } else {
    const { schema } = connect(PWD, { ...config, driver });
    const query = schema.raw(`CREATE DATABASE ${database}`);

    query.on('query', () => console.log(query.toString()));
    await query;
  }
}
