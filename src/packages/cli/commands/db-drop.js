import { connect } from '../../database';
import { rmrf } from '../../fs';

const { env: { PWD, NODE_ENV = 'development' } } = process;

export default async function dbDrop() {
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
    await rmrf(`${PWD}/db/${database}_${NODE_ENV}.sqlite`);
  } else {
    const { schema } = connect(PWD, { ...config, driver });
    const query = schema.raw(`DROP DATABASE IF EXISTS ${database}`);

    query.on('query', () => console.log(query.toString()));
    await query;
  }
}
