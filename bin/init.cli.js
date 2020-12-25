const
url = require('url'),
path = require('path'),
crypto = require('crypto');

const {
  implementReduce,
} = require('@owo/lib/hook');

const {
  ltrim,
  rtrim,
  trim,
} = require('@owo/lib/string');

const {
  mkdirAsync,
  writeFileAsync,
} = require('@owo/lib/fs');

const {
  execAsync,
} = require('@owo/lib/child_process');

const logger = require('@owo/lib/logger')('@owo/bin/init');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  init: {
    description: [
      'Initialize a new sealion project directory. Installation (setting up)',
      'the database is done with the sealion install command or by passing',
      'the --install flag to sealion init',
    ].join(' '),
    usage: 'sealion init [dir] [--options...]',
    examples: [
      'sealion init',
      'sealion init project',
      'sealion init project --full --sqlite3',
      'sealion init project --basic --mysql',
      'sealion init project --install --db-url mysql://root:1234@localhost:3306/sealion_test',
    ],
  }
}));

implementReduce('initDefineCliArgs', () => [
  { name: 'dir', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'basic', type: Boolean, description: 'just install base schema.', defaultValue: false},
  { name: 'mysql', type: Boolean, description: 'set up to use mysql (default).'},
  { name: 'pgsql', type: Boolean},
  { name: 'sqlite3', type: Boolean},
  { name: 'install', alias: 'i', type: Boolean},
  { name: 'db-url', type: String, description: 'client-type://user:pass@host:port/database' },
  { name: 'db-user', type: String},
  { name: 'db-host', type: String},
  { name: 'db-password', type: String},
  { name: 'db-database', type: String},
  { name: 'db-file', type: String, description: 'only applies to sqlite3 driver'},
  { name: 'owo-port', tpe: String, description: 'sealion port.', defaultValue: '8080' },
  { name: 'owo-iface', tpe: String, description: 'sealion interface.', defaultValue: '127.0.0.1' },
  { name: 'owo-logdir', tpe: String, description: 'sealion log directory.', defaultValue: './log' },
]);

module.exports = async (owo, args = {}) => {

  const {
    dir,
    basic,
    sqlite3,
    pgsql,
    'db-user': dbUser = 'your-database-user',
    'db-host': dbHost = 'localhost',
    'db-password': dbPassword = 'your-password-here',
    'db-database': dbDatabase = 'your-database-here',
    'db-file': dbFile = 'data/db.sql',
    'db-url': dbURL = null,
    install = false,
  } = args;

  const configLines = [];

  if (dir !== '.') {
    logger.debug('initializing sealion in %s', dir);
    configLines.push(`SEALION_PROJECT_DIR=${path.resolve(process.env.PWD, dir)}`);
    await mkdirAsync(dir).catch((error) => {
      if (error.code !== 'EEXISTS') {
        throw error;
      }
    })
  } else {
    logger.debug('initializing sealion in current directory');
    configLines.push(`SEALION_PROJECT_DIR=${process.env.PWD}`);
  }

  configLines.push(...[
    `NODE_PATH=.`,
    `SEALION_PORT=8080`,
    `SEALION_IFACE=127.0.0.1`,
    `SEALION_LOG_DIR=log`,
  ]);

  // set NODE_ENV to dir just for the process duration
  process.env.NODE_PATH = dir;

  if (dbURL) {

    logger.debug('using db-url %s', dbURL);

    const {
      protocol = '',
      auth = '',
      hostname = '',
      port = '',
      path = '',
    } = url.parse(dbURL);

    const
    dbUrlClient = rtrim(protocol, ':'),
    [dbUrlUser, dbUrlPass] = auth.split(':'),
    dbUrlDatabase = trim(path, '/');

    if (!dbUrlClient) {
      throw new Error('Could not read db-client from db-url');
    } else if (!dbUrlUser) {
      throw new Error('Could not read db-user from db-url');
    } else if (!dbUrlPass) {
      throw new Error('Could not read db-user from db-url');
    } else if (!dbUrlDatabase) {
      throw new Error('Could not read db-database from db-url');
    }

    logger.debug('client: %s, user: %s, pass: %s, host: %s, port: %s, database: %s', ...[
      dbUrlClient,
      dbUrlUser,
      dbUrlPass,
      dbUrlDatabase,
      hostname,
      port,
    ]);

    return true;

  // TODO: pass file, username, db password via CLI
  // for now, they have to be edited and the migration run separately
  } else if (sqlite3) {

    configLines.push(...[
      `SEALION_DB_CLIENT=sqlite3`,
      `SEALION_DB_FILE=${dbFile}`,
    ]);

    process.env.SEALION_DB_CLIENT = 'sqlite3';
    process.env.SEALION_DB_FILE = dbFile;

    await mkdirAsync(path.join(dir, 'data'));

  } else {

    if (pgsql) {
      configLines.push(...[
        `SEALION_DB_CLIENT=pg`,
      ]);
      process.env.SEALION_DB_CLIENT = 'pg';
    } else {
      configLines.push(...[
        `SEALION_DB_CLIENT=mysql`,
      ]);
      process.env.SEALION_DB_CLIENT = 'mysql';
    }

    configLines.push(...[
      `SEALION_DB_HOST=${dbHost}`,
      `SEALION_DB_USER=${dbUser}`,
      `SEALION_DB_PASSWORD=${dbPassword}`,
      `SEALION_DB_DATABASE=${dbDatabase}`,
    ]);

    process.env.SEALION_DB_HOST = dbHost;
    process.env.SEALION_DB_USER = dbUser;
    process.env.SEALION_DB_PASSWORD = dbPassword;
    process.env.SEALION_DB_DATABASE= dbDatabase;

  }

  await writeFileAsync(path.join(dir, '.env'), configLines.join('\n'));

  const sealionDirs = ['log', 'migrate', 'plugin'];

  for (let i = 0; i < sealionDirs.length; i++) {
    await mkdirAsync(path.join(dir, sealionDirs[i]));
  }

  await writeFileAsync(path.join(dir, '.gitignore'), [
    '.DS_Store',
    '.env',
    'node_modules',
    'migrate',
    'log',
  ].join('\n'));

  await execAsync(`command -v git && git init ${dir}`);

  // TODO:
  if (install) {
  }

  return [
    `Sealion project initialized at ${dir}!`,
    `get started by changing configuration in the project .env file`,
    `and running "sealion plugin up install" in the project directory`,
  ].join('\n');

};
