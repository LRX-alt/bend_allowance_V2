// src/utils/logger.js
//
// Wrapper minimale attorno a console per evitare log rumorosi in produzione e
// centralizzare il logging dell'app. I messaggi diagnostici (log/info/debug)
// vengono emessi solo in sviluppo; warning ed errori passano sempre.
/* eslint-disable no-console */

const isDev = !!(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
