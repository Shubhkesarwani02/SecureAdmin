const chalk = require('chalk');

/**
 * Custom Logger Utility
 * Provides colored, structured logging for better readability
 */

const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

const LogColors = {
  ERROR: chalk.red,
  WARN: chalk.yellow,
  INFO: chalk.blue,
  DEBUG: chalk.gray,
  SUCCESS: chalk.green,
  timestamp: chalk.cyan,
  method: chalk.magenta,
  url: chalk.white,
  status: {
    success: chalk.green,
    redirect: chalk.yellow,
    clientError: chalk.red,
    serverError: chalk.red.bold
  }
};

/**
 * Get timestamp in readable format
 */
function getTimestamp() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Get color for HTTP status code
 */
function getStatusColor(status) {
  if (status >= 200 && status < 300) return LogColors.status.success;
  if (status >= 300 && status < 400) return LogColors.status.redirect;
  if (status >= 400 && status < 500) return LogColors.status.clientError;
  return LogColors.status.serverError;
}

/**
 * Format file size in readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get user agent info in readable format
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return 'Unknown';
  
  // Extract browser info
  const browserPatterns = [
    { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
    { name: 'Safari', pattern: /Safari\/(\d+)/ },
    { name: 'Edge', pattern: /Edge\/(\d+)/ },
    { name: 'VS Code', pattern: /Code\/(\d+)/ }
  ];

  for (const browser of browserPatterns) {
    const match = userAgent.match(browser.pattern);
    if (match) {
      return `${browser.name} ${match[1]}`;
    }
  }

  return 'Unknown Browser';
}

/**
 * Custom Morgan format for HTTP requests
 */
function createMorganFormat() {
  return (tokens, req, res) => {
    const timestamp = LogColors.timestamp(`[${getTimestamp()}]`);
    const method = LogColors.method(tokens.method(req, res).padEnd(6));
    const url = LogColors.url(tokens.url(req, res));
    const status = getStatusColor(res.statusCode)(tokens.status(req, res));
    const responseTime = chalk.cyan(`${tokens['response-time'](req, res)}ms`);
    const contentLength = tokens.res(req, res, 'content-length') || '0';
    const size = chalk.gray(`${formatBytes(parseInt(contentLength))}`);
    const userAgent = parseUserAgent(tokens['user-agent'](req, res));
    const ip = tokens['remote-addr'](req, res);

    // Different format for health checks to reduce noise
    if (url.includes('/health') || url.includes('/favicon.ico')) {
      return `${timestamp} ${method} ${url} ${status} ${responseTime}`;
    }

    return [
      timestamp,
      method,
      url,
      status,
      responseTime,
      size,
      chalk.gray(`${userAgent}`),
      chalk.dim(`(${ip})`)
    ].join(' ');
  };
}

/**
 * Log functions for different levels
 */
const logger = {
  error: (message, ...args) => {
    console.log(LogColors.ERROR(`[${getTimestamp()}] ERROR:`), message, ...args);
  },

  warn: (message, ...args) => {
    console.log(LogColors.WARN(`[${getTimestamp()}] WARN:`), message, ...args);
  },

  info: (message, ...args) => {
    console.log(LogColors.INFO(`[${getTimestamp()}] INFO:`), message, ...args);
  },

  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(LogColors.DEBUG(`[${getTimestamp()}] DEBUG:`), message, ...args);
    }
  },

  success: (message, ...args) => {
    console.log(LogColors.SUCCESS(`[${getTimestamp()}] SUCCESS:`), message, ...args);
  },

  server: {
    start: (port, env) => {
      console.log('\n' + '='.repeat(60));
      console.log(LogColors.SUCCESS('🚀 Framtt Superadmin API Server Started'));
      console.log('='.repeat(60));
      console.log(LogColors.INFO(`📡 Port: ${port}`));
      console.log(LogColors.INFO(`🌍 Environment: ${env}`));
      console.log(LogColors.INFO(`🔗 Health Check: http://localhost:${port}/health`));
      console.log(LogColors.timestamp(`⏰ Started at: ${getTimestamp()}`));
      console.log('='.repeat(60) + '\n');
    },

    shutdown: () => {
      console.log('\n' + LogColors.WARN('🛑 Server shutting down...'));
    }
  }
};

module.exports = {
  logger,
  createMorganFormat,
  LogLevel,
  LogColors
};
