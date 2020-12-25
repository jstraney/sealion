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

const {
  lpad,
} = require('@owo/lib/string');

const {
  getIfSet,
} = require('@owo/lib/collection');

const consoleLogFormat = printf(function (info) {

  let { level } = info;

  let sealion;

  if (level === 'info') {

    level = chalk.green(level);
    sealion = chalk.gray('ºωº');

  } else if (level === 'warn') {

    level = chalk.yellow(level);
    sealion = chalk.yellow('0ω0');

  } else if (level === 'error') {

    level = chalk.red(level);
    sealion = chalk.red('xωx');

  } else {
    sealion = '^ω^';
  }

  const message = typeof info.message === 'object'
    ? JSON.stringify(info.message)
    : info.message;

  const out = ['[',sealion,'<',info.label,']',level,':',message].join(' ')

  // no proceeding timestamp or label
  return level === 'debug'
    ? chalk.gray(out)
    : out;

});

// no ANSI colors in logs
const fileLogFormat = printf((info) => {

  const message = typeof info.message === 'object'
    ? JSON.stringify(info.message)
    : info.message;

  const sealion = 'owo';

  return [customTimestamp(),'[',sealion,'<',info.label,']',info.level,':',message].join(' ');

});

const customTimestamp = () => {

  return moment().format('YYYY-DD-MM_hh:mm:ss');

}

const {
  SEALION_LOG_LEVEL = 'development',
  SEALION_LOG_DIR,
  SEALION_LOG_TAB_CHAR = '..',
  SEALION_LOG_MAX_TAB = 4,
} = process.env;

const tabFormat = format((info, opts) => {
  if (opts.indent > 0) {
    info.message = lpad(info.message, SEALION_LOG_TAB_CHAR, opts.indent);
  }
  return info;
});


module.exports = (logLabel) => {

  const tabFormatOptions = {
    indent: 0,
  };

  const logTransports = [
    new transports.Console({
      json: true,
      format: combine(
        label({label: logLabel}),
        splat(),
        tabFormat(tabFormatOptions),
        consoleLogFormat,
      )
    })
  ];

  // write to log dir if it is defined
  if (SEALION_LOG_DIR) {
    logTransports.push(new DailyRotateFile({
      format: combine(
        label({label: logLabel}),
        splat(),
        tabFormat(tabFormatOptions),
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

  const level = getIfSet({
    production: 'warn',
    development: 'info',
    owo: 'debug',
  }, SEALION_LOG_LEVEL, 'info');

  const loggerInstance = createLogger({
    level,
    prettyPrint: JSON.stringify,
    transports: logTransports,
    exitOnError: false
  });

  loggerInstance.tab = () => {
    const { indent } = tabFormatOptions;
    const nextIndent = Math.min(indent + 1, SEALION_LOG_MAX_TAB);
    tabFormatOptions.indent = nextIndent;
  };

  loggerInstance.shiftTab = () => {
    const { indent } = tabFormatOptions;
    const nextIndent = Math.max(0, indent - 1);
    tabFormatOptions.indent = nextIndent;
  };

  return loggerInstance;

};
