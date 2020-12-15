// bootstraping console to use morgan/winston
const util = require('util');

const chalk = require('chalk');

const {
  createLogger,
  format,
  transports
} = require('winston');

const moment = require('moment');

const DailyRotateFile = require('winston-daily-rotate-file');

const {
  combine,
  label,
  prettyPrint,
  printf,
  splat,
  timestamp,
} = format;

const consoleLogFormat = printf((info) => {

  let { level } = info;

  if (level === 'info') {

    level = chalk.green(level);

  } else if (level === 'warn') {

    level = chalk.yellow(level);

  } else if (level === 'error') {

    level = chalk.red(level);

  }

  const message = typeof info.message === 'object'
    ? JSON.stringify(info.message)
    : info.message;

  // no proceeding timestamp or label
  return [
    '[' + info.label + ']',
    level,
    ': ' + message
  ].join(' ');

});

// no ANSI colors in logs
const fileLogFormat = printf((info) => {

  const message = typeof info.message === 'object'
    ? JSON.stringify(info.message)
    : info.message;

  return [
    customTimestamp(),
    '[' + info.label + ']',
    info.level,
    ': ' + message
  ].join(' ');

});

const customTimestamp = () => {

  return moment().format('YYYY-DD-MM_hh:mm:ss');

}

const {
  NODE_ENV = 'production',
  SEALION_LOG_DIR,
} = process.env;

module.exports = (logLabel) => {

  const logTransports = [
    new transports.Console({
      json: true,
      format: combine(
        label({label: `SEALION - ${logLabel}`}),
        splat(),
        consoleLogFormat,
      )
    })
  ];

  // write to log dir if it is defined
  if (SEALION_LOG_DIR) {
    logTransports.push(new DailyRotateFile({
      format: combine(
        label({label: `SEALION - ${logLabel}`}),
        splat(),
        fileLogFormat,
      ),
      json: true,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      dirname: SEALION_LOG_DIR,
    }));
  }

  return createLogger({
    level: NODE_ENV === 'production' ? 'warning' : 'verbose',
    prettyPrint: JSON.stringify,
    transports: logTransports,
    exitOnError: false
  });

};
