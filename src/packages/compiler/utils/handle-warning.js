// @flow

/**
 * @private
 */
export default function handleWarnings(...warnings: Array<string>): void {
  warnings
    .filter(warning => warning.indexOf('external dependency') < 0)
    .forEach(warning => process.stderr.write(`${warning}\n`));
}
