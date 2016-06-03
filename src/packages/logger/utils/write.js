// @flow
import ansiRegex from 'ansi-regex';

import fs from '../../fs';

import tryCatch from '../../../utils/try-catch';

/**
 * @private
 */
export default function write(path: string, message: string): void {
  tryCatch(async () => {
    message = message.replace(ansiRegex(), '');
    await fs.appendFileAsync(path, message, 'utf8');
  }, err => {
    console.error(err);
  });
}
