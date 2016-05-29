export default function* range(
  start: Number = 1,
  end: Number = 1
): Iterable<number> {
  while (start <= end) {
    yield start++;
  }
}
