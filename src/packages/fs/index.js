import fs from 'fs';
import { promisifyAll } from 'bluebird';

export default promisifyAll(fs);
export { default as rmrf } from './utils/rmrf';
export { default as exists } from './utils/exists';
export { default as isJSFile } from './utils/is-js-file';
