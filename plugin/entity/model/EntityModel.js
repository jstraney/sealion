const Jsum = require('jsum');

const {
  invokeHook,
  invokeReduce,
} = require('@owo/lib/hook');

const {
  decorate,
  curry,
} = require('@owo/lib/func');

const {
  validate,
} = require('@owo/lib/validate');

const {
  camelCase,
  pascalCase,
} = require('@owo/lib/string');

const {
  getIfSet,
} = require('@owo/lib/collection');

const {
  BadRequestError,
} = require('@owo/lib/error');

const logger = require('@owo/lib/logger')('@owo/plugin/entity/model/EntityModel');

// the entity model class is an abstract class which accepts an entity name
// (the same as its table), a collection of functions keyed by name of action,
// an object of entity meta data and a database connection.
class EntityModel {

  constructor (name, options = {}) {

    const {
      entityTypeInfo = {},
      actions = {},
      db,
      cache,
    } = options;

    this.name = camelCase(name);
    this.entityTypeInfo = entityTypeInfo;
    this.db = db;
    this.cache = cache;
    // this.invokeActionHooks = invokeActionHooks.bind(this);

    // the entity model instance can be passed functions
    // which it binds itself to.
    for (const action in actions) {

      /*
      const boundAction = actions[action].bind(this);

      // decorate the action with hook invokations and
      // partially apply the actions name as the first argument
      this[action] = curry(decorate(this.invokeActionHooks, boundAction), action);
      */
      this[action] = actions[action].bind(this);

    }

    this.actions = actions;
    this.actionNames = Object.keys(actions);

  }

  /*
  async invokeActionHooks(actionFn, actionName = actionFn.name, rawArgs = {}) {

    logger.debug(`${actionName}ing ${this.name} entity: rawArgs %o`, rawArgs);

    const pascalAction = pascalCase(actionName);

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const tableArgs = await this.getTableArgs(actionName, rawArgs);

    // example. invokes entityInvalidateCreate and
    // userEntityInvalidateCreate
    await invokeHook([
      `entityInvalidate${pascalAction}`,
      `${this.name}EntityInvalidate${pascalAction}`,
    ], rawArgs, tableArgs, entityTypeInfo, actionName);

    const { name: entityTypeName } = entityTypeInfo;

    const result = await actionMethod(entityTypeName, tableArgs);

    await invokeHook([
      `entity${pascalAction}`,
      `${this.name}Entity${pascalAction}`,
    ], rawArgs, tableArgs, result);

    logger.debug(`${actionName}ed ${this.name} entity: %o`, result);

    return invokeReduce(`entityCreateResult`, result, entityTypeInfo)

  }
  */

  static async getEntityTypeInfos (db) {

    const entityTypes = await db
      .select([
        'et.name AS entityTypeName',
        'et.label AS entityTypeLabel',
        'et.help AS entityTypeHelp',
        'et.canAuthenticate',
        'p.propertyName',
        'p.label AS propertyLabel',
        'p.isRequired',
        'p.isIndexed',
        'p.isUnique',
        'p.isIdKey',
        'p.type',
        'p.help',
      ])
      .from({et: 'entityType'})
      .innerJoin({ p: 'entityTypeProperty'}, 'et.name', '=', 'p.entityTypeName');

    const result = {};

    for (const row of entityTypes) {

      const {
        entityTypeName,
        entityTypeLabel,
        entityTypeHelp,
        canAuthenticate,
        ...property
      } = row;

      const entityType = getIfSet(result, entityTypeName, {});
      const properties = getIfSet(entityType, 'properties', []);
      const propsNoIds = getIfSet(entityType, 'propsNoIds', []);
      const idProperties = getIfSet(entityType, 'idProperties', []);

      if (property.isIdKey) {
        idProperties.push(property);
      } else {
        propsNoIds.push(property);
      }

      properties.push(property);

      Object.assign(entityType, {
        name: entityTypeName,
        label: entityTypeLabel,
        help: entityTypeHelp,
      });

      entityType.properties = properties;
      entityType.propsNoIds = propsNoIds;
      entityType.idProperties = idProperties;
      result[entityTypeName] = entityType;

    }

    return result;

  }

  // unpacks id values from payload so that when something is updated
  // we can retrieve the new record.
  unpackIdKeys (args) {

    const entityTypeInfo = this.entityTypeInfo;
    const idProperties = getIfSet(entityTypeInfo, 'idProperties', []);

    return idProperties.reduce((keys, {propertyName}) => {
      return {...keys, [propertyName]: args[propertyName] };
    }, {});

  }

  static async createCacheKey(idKeys = {}) {
    return Jsum.digest(idKeys, 'SHA1', 'base64');
  }

  async setCacheValue(rawArgs, result) {
    const idKeys = this.unpackIdKeys(rawArgs);

    const key = EntityModel.createCacheKey(idKeys);

    this.cache.setValue(key, result);
  }

  async getCacheValue(rawArgs, result) {

    const idKeys = this.unpackIdKeys(rawArgs);

    const key = EntityModel.createCacheKey(idKeys);

    //this.cache.getValue(key);
    return undefined;

  }

  async invalidateCacheKey(rawArgs) {

    const idKeys = this.unpackIdKeys(rawArgs);

    const key = EntityModel.createCacheKey(idKeys);

    this.cache.invalidate(key);

  }

  getLastInsert(args = {}) {
    const where = this.unpackIdKeys(args);
    return this.read(where);
  }

  async getTableArgs(action, rawArgs = {}) {

    const [ tableArgs1 = {}, tableArgs2 = {} ] = await invokeReduce([
      `entity${pascalCase(action)}TableArgs`,
      `${this.name}Entity${pascalCase(action)}TableArgs`,
    ], {}, rawArgs);

    const tableArgs = {...tableArgs1, ...tableArgs2};

    // the hooks may not be implemented. if the object is empty. just
    // use raw args.
    if (!Object.keys(tableArgs).length) {
      logger.debug('no table args reduced from raw args. just using raw args');
      return Object.assign(tableArgs, rawArgs);
    }

    logger.debug('reduced table args %o', tableArgs);

    return tableArgs;

  }

  static async create( rawArgs = {} ) {

    logger.debug(`creating ${this.name} entity: rawArgs %o`, rawArgs);

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const tableArgs = await this.getTableArgs('create', rawArgs);

    // example. invokes entityInvalidateCreate and
    // userEntityInvalidateCreate
    await invokeHook([
      `entityInvalidateCreate`,
      `${this.name}EntityInvalidateCreate`,
    ], rawArgs, tableArgs, entityTypeInfo, 'create');

    const { name: entityTypeName } = entityTypeInfo;

    const [ id ] = await db(entityTypeName)
      .insert(tableArgs);

    await invokeHook([
      `entityCreate`,
      `${this.name}EntityCreate`,
    ], rawArgs, tableArgs);

    const result = await this.getLastInsert({ id, ...rawArgs});

    logger.debug(`created ${this.name} entity: %o`, result);

    const nextResult = await invokeReduce(`entityCreateResult`, result, entityTypeInfo)

    await this.setCacheValue(rawArgs, nextResult);

    return nextResult;

  }

  static async read( rawArgs = {} ) {

    logger.debug(`reading ${this.name} entity: rawArgs %o`, rawArgs);

    logger.debug(`check ${this.name} cache`);

    const cachedResult = await this.getCacheValue(rawArgs);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const tableArgs = await this.getTableArgs('read', rawArgs);

    await invokeHook([
      `entityInvalidateRead`,
      `${this.name}EntityInvalidateRead`,
    ], rawArgs, tableArgs, entityTypeInfo, 'read');

    const { name: entityTypeName} = entityTypeInfo;

    const [ result = null ] = await db(entityTypeName)
      .where(tableArgs)

    await invokeHook([
      `entityRead`,
      `${this.name}EntityRead`,
    ], rawArgs, tableArgs);

    const nextResult = await invokeReduce(`entityReadResult`, result, entityTypeInfo);

    await this.setCacheValue(rawArgs, nextResult);

    return nextResult;

  }

  static async update( rawArgs = {} ) {

    logger.debug(`updating ${this.name} entity: rawArgs %o`, rawArgs);

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const { fields = {}, ...setProperties} = rawArgs;

    const tableArgs = await this.getTableArgs('update', setProperties);

    await invokeHook([
      `entityInvalidateUpdate`,
      `${this.name}EntityInvalidateUpdate`,
    ], rawArgs, tableArgs, entityTypeInfo, 'update');

    const { name: entityTypeName} = entityTypeInfo;

    // unpack identifiers
    const whereArgs = this.unpackIdKeys(tableArgs);

    logger.debug('whereargs for update %o', whereArgs);
    // delete identifiers from payload (assumed primary keys)
    for (const key in whereArgs) {
      delete tableArgs[key];
    }

    await db(entityTypeName)
      .update(tableArgs)
      .where(whereArgs);

    await invokeHook([
      `entityUpdate`,
      `${this.name}EntityUpdate`,
    ], rawArgs, tableArgs);

    await this.invalidateCacheKey(rawArgs);

    const result = this.getLastInsert(whereArgs);

    const nextResult = await invokeReduce(`entityUpdateResult`, result, entityTypeInfo);

    return nextResult;

  }

  static async remove( rawArgs = {} ) {

    logger.debug(`deleting %s entity: rawArgs %o`, this.name, rawArgs);

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const tableArgs = await this.getTableArgs('remove', rawArgs);

    await invokeHook([
      `entityInvalidateRemove`,
      `${this.name}EntityInvalidateRemove`,
    ], rawArgs, tableArgs, entityTypeInfo, 'remove');

    const { name: entityTypeName} = entityTypeInfo;

    const numRows = await db(entityTypeName)
      .del()
      .where(tableArgs);

    logger.debug(`deleted %s %s entities`, numRows, this.name);

    await invokeHook([
      `entityRemove`,
      `${this.name}EntityRemove`,
    ], rawArgs, tableArgs, numRows);

    await this.invalidateCacheKey(rawArgs);

    return invokeReduce(`entityRemoveResult`, { numRows }, entityTypeInfo);

  }

  static async search( rawArgs = {} ) {

    logger.debug(`searching %s entity: rawArgs %o`, this.name, rawArgs);

    // TODO: search will have its own specification outlined, including
    // 1) how to handle pagination in request payload
    // 2) how to handle facets (filters)
    // 3) how to handle string matching
    // 3) how to provide hooks to integrate services like elasticsearch, solr
    const cachedResult = await this.getCacheValue(rawArgs);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const
    db = this.db,
    entityTypeInfo = this.entityTypeInfo;

    const {
      limit = 10,
      offset = 0,
      ...tableArgs
    } = rawArgs;

    const nextTableArgs = await this.getTableArgs('search', tableArgs);

    await invokeHook([
      `entityInvalidateSearch`,
      `${this.name}EntityInvalidateSearch`,
    ], rawArgs, nextTableArgs, entityTypeInfo, 'search');

    const query = db(this.name)
      .where(nextTableArgs);

    // TODO: implement field queries for fieldable entities
    const result = limit !== null
      ? (await query
          .limit(limit)
          .offset(offset))
      : await query;

    logger.silly(`search results for ${this.name}: %o`, result);

    await invokeHook([
      `entitySearch`,
      `${this.name}Search`,
    ], rawArgs, nextTableArgs, result);

    return invokeReduce(`entitySearchResult`, result, entityTypeInfo);

  }

}

module.exports = EntityModel;
