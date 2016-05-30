import path from 'path';
import Logger from '../src/packages/logger';

import exec from '../src/packages/cli/utils/exec';
import tryCatch from '../src/utils/try-catch';

const { assign } = Object;

const {
  env: {
    PWD,
    TRAVIS = false,
    NODE_ENV = 'development'
  }
} = process;

before(done => {
  process.once('ready', done);

  tryCatch(async () => {
    const appPath = path.join(PWD, 'test/test-app');
    const options = { cwd: appPath };

    if (!TRAVIS) {
      await exec('lux db:reset', options);
    }

    await exec('lux db:migrate', options);
    await exec('lux db:seed', options);

    const {
      default: TestApp
    } = require('./test-app/app/index');

    const {
      default: config
    } = require('./test-app/config/environments/test');

    assign(config, {
      appPath,
      port: 4000,

      logger: await Logger.create({
        appPath,
        enabled: config.log
      })
    });

    await new TestApp(config).boot();
  }, done);
});
