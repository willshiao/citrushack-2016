'use strict';

const logger = require('winston');

logger.setLevels({
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trivial: 4,
});
logger.addColors({
  debug: 'green',
  info:  'cyan',
  trivial: 'magenta',
  warn:  'yellow',
  error: 'red'
});

// logger.add(logger.transports.File, {filename: config.get('logDirectory')+'/site.log', level: 'trivial'});
// logger.add(logger.transports.Console, { level: config.get('consoleLogLevel'), colorize: true });

logger.loggers.add('socket', {
  console: {
    level: 'debug',
    colorize: true,
    label: 'Socket.IO',
  },
});


module.exports = logger;
