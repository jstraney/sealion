
const db = require('../lib/db');

const logger = require('../lib/logger')('ResourceController');

const {
  camelCase,
  pascalCase,
} = require('../lib/util');

const {
  invokeHook,
  invokeReduce,
} = require('../lib/hook');

const {
  ConflictError,
} = require('../lib/error');

// patterns:
//
// hook: <resourceName><action>Invalidate
//   implement this hook to throw an error on invalid args. it is
//   called invalidate because we only throw errors. throw a typed
//   error to control status code in router (BadRequest for 400,
//   UnauthorizedError for 401). Should mostly throw 400s
// reducer: <resourceName><action>TableArgs
//   operations on a table will throw an error if an array is passed
//   as a column name, so each action should return a reduced set of
//   simple properties. raw args are still passed to the following hooks
// hook: <resourceName><action>
//   publishes an event that the action was successful, could be used to
//   relay information to another service, cache data, create related records
// reducer: <resourceName><action>Result
//   this reducer returns a modified result of the action for router/cli
//   consumption. you could for example append hypermedia to the result
//
// few things to point out below:
// a resource controller accepts raw args (such as a nested JSON object)
// in order to prevent "column does not exist errors", tableArgs must be
// derived from the rawArgs, these tableArgs are used for operations on
// the resource table. After a successful insert/select/update/delete
// hooks/reducers are called using the raw args. for example:
//
// see entityType controllers entityTypeCreateTableArgs reducer implementation
//
class ResourceController {

  constructor (name, options = {}) {

    // names are always camel case
    this.name = camelCase(name);

    // somehow allow actions to be extended via reducers.
    // TBH, I am not sure what else you need besides these actions.
    // if what you're trying to do feels more complicated you should
    // be able to achieve it with more entityTypes and hooks.
    const {
      idKey = 'id',
      propKeys = [],
      rels = {},
      actions = ['create', 'read', 'update', 'delete', 'search'],
    } = options;

    this.idKey = idKey;
    this.rels = rels;

    const safeNameMap = {
      delete: 'del',
    };

    // bind actions to the new controller instance
    actions.forEach((action) => {

      const mappedAction = safeNameMap.hasOwnProperty(action)
        ? safeNameMap[action]
        : action;

      this[mappedAction] = this[mappedAction].bind(this);

    })

  }

  unpackIdKeys (args = {}) {

    if (this.idKey instanceof Array) {
      return this.idKey.reduce((obj, key) => {
        return args.hasOwnProperty(key)
          ? {...obj, [key]: args[key]}
          : obj;
      }, {});
    } else {
      return args.hasOwnProperty(this.idKey)
        ? {[this.idKey]: args[this.idKey]}
        : {};
    }

  }

  async getLastInsert(args) {
    // TODO: return null if no idKey supplied (like for create
    // when a type uses autoIncrement). If no key, use a SQL
    // driver specific method to find last insert/key/id
    const where = this.unpackIdKeys(args);
    return this.read(where);
  }

  async create ( rawArgs = {} ) {

    logger.info(`creating ${this.name} resource: %o`, rawArgs);

    await invokeHook(`${this.name}CreateInvalidate`, rawArgs);

    const tableArgs = await invokeReduce(`${this.name}CreateTableArgs`, rawArgs);

    await db(this.name).insert(tableArgs);

    await invokeHook(`${this.name}Create`, rawArgs, tableArgs);

    const result = await this.getLastInsert(tableArgs);

    logger.info(`created ${this.name} resource : %o`, result);

    return result;

  }

  async read ( rawArgs = {} ) {

    logger.info(`reading ${this.name} resource : %o`, rawArgs);

    await invokeHook(`${this.name}ReadInvalidate`, rawArgs);

    const tableArgs = await invokeReduce(`${this.name}ReadTableArgs`, rawArgs);

    const [ result = null ] = await db(this.name).where(tableArgs)

    await invokeHook(`${this.name}Read`, rawArgs, tableArgs);

    return invokeReduce(`${this.name}ReadResult`, result, rawArgs, tableArgs);

  }

  async update ( rawArgs = {} ) {

    logger.info(`updating ${this.name} resource : %o`, rawArgs);

    await invokeHook(`${this.name}UpdateInvalidate`, rawArgs);

    const tableArgs = await invokeReduce(`${this.name}UpdateTableArgs`, rawArgs);

    const where = this.unpackIdKeys(tableArgs);

    delete tableArgs[this.idKey];

    await db(this.name)
      .update(tableArgs)
      .where(where)

    await invokeHook(`${this.name}Update`, rawArgs, tableArgs);

    const result = await this.getLastInsert(tableArgs);

    logger.info(`updated ${this.name} resource : %o`, result);

    return invokeReduce(`${this.name}UpdateResult`, result, rawArgs, tableArgs);

  }

  async del ( rawArgs = {} ) {

    logger.info(`deleting ${this.name} resource : %o`, rawArgs);

    await invokeHook(`${this.name}DeleteInvalidate`, rawArgs);

    const tableArgs = await invokeReduce(`${this.name}PreDeleteArgs`, rawArgs);

    const numRows = await db(this.name)
      .del()
      .where(tableArgs)

    await invokeHook(`${this.name}Delete`, numRows, rawArgs, tableArgs);

    logger.info(`deleted ${numRows} ${this.name} rows`);

    return invokeReduce(`${this.name}DeleteResult`, {numRows});

  }

  async search ( rawArgs = {} ) {

    logger.info(`searching for ${this.name}: %o`, rawArgs);

    const tableArgs = await invokeReduce(`${this.name}PreSearchArgs`, rawArgs);

    const {
      limit = 10,
      offset = 0,
      ...tableArgsSansLimit
    } = tableArgs;

    const query = db(this.name)
      .where(tableArgsSansLimit)

    const result = limit !== null
      ? (await query
          .limit(limit)
          .offset(offset))
      : await query;

    logger.info(`search results for ${this.name}: %o`, result);

    await invokeHook(`${this.name}Search`, result, rawArgs, tableArgs);

    return invokeReduce(`${this.name}SearchResult`, result, rawArgs, tableArgs);

  }

  getLinks(id) {
    // some classes may need to override this... most likely
    return {
      get: `/${this.name}?${this.idKey}=${id}`,
      put: `/${this.name}?${this.idKey}=${id}`,
      post: `/${this.name}?${this.idKey}=${id}`,
      delete: `/${this.name}?${this.idKey}=${id}`,
    };
  }

}

module.exports = ResourceController;
