export default (name, env) => {
  const isProdENV = env === 'production';
  let keyPrefix = `${name}`;

  if (!isProdENV) {
    keyPrefix += `::${env}`;
  }

  return `
export default {
  log: ${!isProdENV},
  domain: 'http://localhost:4000'
};
  `.substr(1).trim();
};
