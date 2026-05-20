// backend/src/utils/logger.js

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[36m",
  gray: "\x1b[90m",
};

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${COLORS.gray}[${timestamp}]${COLORS.reset} ${level.toUpperCase().padEnd(7)} ${message}${metaStr}`;
}

const logger = {
  info: (message, meta) => {
    console.log(formatMessage("info", message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage("warn", message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage("error", message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatMessage("debug", message, meta));
    }
  },
};

module.exports = logger;