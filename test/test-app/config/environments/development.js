export default {
  log: true,
  domain: 'http://localhost:4000',

  /**
   * It is highly reccomended that you use the 'redis' cache store in
   * production.
   */
  cache: {
    type: 'memory',
    prefix: 'test-app-cache::development'
  }
};
