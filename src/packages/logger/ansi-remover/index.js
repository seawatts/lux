// @flow
import ansiregex from 'ansi-regex';
import { Transform } from 'stream';

const pattern = ansiregex();

/**
 * @private
 */
class AnsiRemover extends Transform {
  constructor(options: {} = {}): AnsiRemover {
    super(options);
    return this;
  }

  _transform(
    data: ?Buffer | ?string,
    encoding: string,
    done: () => void
  ): void {
    if (data instanceof Buffer) {
      data = new Buffer(data.toString().replace(pattern, ''), 'utf8');
      this.push(data);
    }

    done(null);
  }
}

export default AnsiRemover;
