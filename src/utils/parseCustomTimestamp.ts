function parseCustomTimestamp(timestamp: string): Date {
  const year = parseInt(timestamp.slice(0, 4), 10);
  const month = parseInt(timestamp.slice(4, 6), 10) - 1; // Months are 0-based in JS
  const day = parseInt(timestamp.slice(6, 8), 10);
  const hour = parseInt(timestamp.slice(9, 11), 10);
  const minute = parseInt(timestamp.slice(11, 13), 10);
  const second = parseInt(timestamp.slice(13, 15), 10);

  // Optional: Parse fractional seconds (if required for additional precision)
  // const fractionalSeconds = parseInt(timestamp.slice(16), 10) || 0;

  // If fractional seconds are required, you can adjust here.
  // This example ignores them since JavaScript Date doesn't support sub-second precision directly.

  return new Date(year, month, day, hour, minute, second);
}

export { parseCustomTimestamp };
