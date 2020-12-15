const
path = require('path'),
crypto = require('crypto');

const {
  implementReduce,
} = require('../lib/hook');

const {
  mkdirAsync,
  writeFileAsync,
} = require('../lib/fs');

const {
  execAsync,
} = require('../lib/child_process');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  init: {
    description: 'Initialize a new sealion instance',
    usage: 'sealion init [dir] [--options...]',
    examples: [
      'sealion init',
      'sealion init project',
      'sealion init project --full --sqlite3',
      'sealion init project --basic --mysql',
    ],
  }
}));

implementReduce('initDefineCliArgs', (allHelp) => [
  { name: 'dir', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'basic', type: Boolean, description: 'just install base schema. Full schema installed by default'},
  { name: 'mysql', type: Boolean, description: 'set up to use mysql (default)'},
  { name: 'pgsql', type: Boolean},
  { name: 'sqlite3', type: Boolean},
  { name: 'db-user', type: String},
  { name: 'db-host', type: String},
  { name: 'db-password', type: String},
  { name: 'db-database', type: String},
  { name: 'db-file', type: String, description: 'only applies to sqlite3 driver'},
  // TODO: support other knex drivers
]);

module.exports = async (args = {}) => {

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
  } = args;

  const configLines = [];

  if (dir !== '.') {
    configLines.push(`SEALION_PROJECT_DIR=${path.join(process.env.PWD, dir)}`);
    await mkdirAsync(dir).catch((error) => {
      if (error.code !== 'EEXISTS') {
        throw error;
      }
    })
  } else {
    configLines.push(`SEALION_PROJECT_DIR=${process.env.PWD}`);
  }

  configLines.push(...[
    `SEALION_PORT=8080`,
    `SEALION_IFACE=127.0.0.1`,
    `SEALION_LOG_DIR=log`,
  ]);

  // TODO: pass file, username, db password via CLI
  // for now, they have to be edited and the migration run separately
  if (sqlite3) {

    configLines.push(...[
      `SEALION_DB_CLIENT=sqlite3`,
      `SEALION_DB_FILE=${dbFile}`,
    ]);

    await mkdirAsync(path.join(dir, 'data'));

  } else {

    if (pgsql) {
      configLines.push(...[
        `SEALION_DB_CLIENT=pg`,
      ]);

    } else {
      configLines.push(...[
        `SEALION_DB_CLIENT=mysql`,
      ]);
    }

    configLines.push(...[
      `SEALION_DB_HOST=${dbHost}`,
      `SEALION_DB_USER=${dbUser}`,
      `SEALION_DB_PASSWORD=${dbPassword}`,
      `SEALION_DB_DATABASE=${dbDatabase}`,
    ]);

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

  return [
    `sealion project initialized at ${dir}.`,
    `get started by changing configuration in the project .env file`,
    `and running "sealion migrate install" in the project directory`,
  ].join('\n');

};
