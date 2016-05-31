import path from 'path';

import Logger from '../src/packages/logger';
import loader from '../src/packages/loader';
import { createCompiler } from '../src/packages/compiler';

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
    const compiler = await createCompiler(appPath, NODE_ENV);

    if (!TRAVIS) {
      // await exec('lux db:reset', options);
    }

    // await exec('lux db:migrate', options);
    // await exec('lux db:seed', options);

    compiler.run(async (err) => {
      const TestApp = loader(appPath, 'application');
      const config = loader(appPath, 'config');

      assign(config, {
        appPath,
        port: 4000,

        logger: await Logger.create({
          appPath,
          enabled: config.log
        })
      });

      await new TestApp(config);
    });
  }, done);
});
