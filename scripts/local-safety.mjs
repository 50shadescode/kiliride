export function assertLocalDatabase(value, testOnly = false) {
  let url;
  try { url = new URL(value); } catch { throw new Error('A local DATABASE_URL is required.'); }
  const names = testOnly ? ['/kiliride_test'] : ['/kiliride_dev', '/kiliride_test'];
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !names.includes(url.pathname) || url.search || url.hash) {
    throw new Error('Refusing database access: only named loopback KiliRide databases are allowed.');
  }
  return value;
}

export function assertLocalHttp(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) {
    throw new Error('Phase 1 services must use local HTTP endpoints.');
  }
  return value;
}
