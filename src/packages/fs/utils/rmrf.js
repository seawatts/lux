import exec from '../../../utils/exec';

export default function rmrf(path) {
  return exec(`rm -rf ${path}`);
}
