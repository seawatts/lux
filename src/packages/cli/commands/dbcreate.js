import { EOL } from 'os';

import { CWD, NODE_ENV, DATABASE_URL } from '../../../constants';
import { CONNECTION_STRING_MESSAGE } from '../constants';
import { connect } from '../../database';
import { writeFile } from '../../fs';
import { createLoader } from '../../loader';

/**
 * @private
 */
export async function dbcreate() {
  const load = createLoader(CWD);

  const {
    database: {
      [NODE_ENV]: {
        driver,
        database,
        url,
        ...config
      }
    }
  } = load('config');

  if (driver === 'sqlite3') {
    await writeFile(`${CWD}/db/${database}_${NODE_ENV}.sqlite`, '');
  } else {
    if (DATABASE_URL || url) {
      process.stderr.write(CONNECTION_STRING_MESSAGE);
      process.stderr.write(EOL);
      return;
    }

    const { schema } = connect(CWD, { ...config, driver });
    const query = schema.raw(`CREATE DATABASE ${database}`);

    query.on('query', () => {
      process.stdout.write(query.toString());
      process.stdout.write(EOL);
    });

    await query;
  }
}
