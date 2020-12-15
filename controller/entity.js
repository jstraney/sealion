const {
  implementHook,
  implementReduce,
  invokeHook,
  invokeReduce,
} = require('../lib/hook');

const {
  validate,
} = require('../lib/validate');

/*
const {
  mapAttribute,
} = require('../lib/mapAttribute');
*/

const {
  BadRequestError,
} = require('../lib/error');

const db = require('../lib/db');

const logger = require('../lib/logger')('EntityController');

const
entityTypeController = require('./entityType'),
bundleFieldController = require('./bundleField');

// TODO: implement caching much like other frameworks. we would
// allow a command to flush the cache and re-trigger hooks that
// build it.
//
// HOW? we may create a class of CacheController that does something like this.
// anticipate a variety of caches though
const entityTypeInfoCache = {};

// works a little differently from a conventional ResourceController
class EntityController {

  // cannot use a traditional constructor because they are not allowed
  // to be async. The entity controller pulls its data from db on
  // initialization
  constructor (name) {

    this.name = name;

    // implement cacheRebuild or something.
    ['create', 'read', 'update', 'del', 'search'].forEach((action) => {
      this[action] = this[action].bind(this);
    });

  }

  async create( args = {} ) {

    const {
      fields = {},
      ...properties
    } = args;

    const entityTypeInfo = await EntityController.getEntityTypeInfo(this.name);

    // example. invokes entityInvalidateCreate and
    // userEntityInvalidateCreate
    await invokeHook([
      `entityInvalidateCreate`,
      `${this.name}EntityInvalidateCreate`,
    ], args, entityTypeInfo);

    const { name: entityTypeName } = entityTypeInfo;

    const [ tableArgs = {}, tableArgs2 = {} ] = await invokeReduce([
      `entityCreateTableArgs`,
      `${this.name}EntityCreateTableArgs`,
    ], properties);

    const [ id ] = await db(entityTypeName)
      .returning('id')
      .insert({
        ...tableArgs,
        ...tableArgs2,
      });

    const result = await this.read({id});

    // TODO: implement fields
    // fieldController.create();
    return invokeReduce(`entityCreateResult`, result, entityTypeInfo);

  }

  async read( args = {} ) {

    const entityTypeInfo = await EntityController.getEntityTypeInfo(this.name);

    await invokeHook([
      `entityInvalidateRead`,
      `${this.name}EntityInvalidateRead`,
    ], args, entityTypeInfo);

    const { name: entityTypeName} = entityTypeInfo;

    const [ tableArgs = {}, tableArgs2 = {} ] = await invokeReduce([
      `entityReadTableArgs`,
      `${this.name}EntityReadTableArgs`,
    ], args);

    const result = await db(entityTypeName)
      .where({
        ...tableArgs,
        ...tableArgs2,
      });

    return invokeReduce(`entityReadResult`, result, entityTypeInfo);

  }

  async update( args = {} ) {

    const entityTypeInfo = await EntityController.getEntityTypeInfo(this.name);

    await invokeHook([
      `entityInvalidateUpdate`,
      `${this.name}EntityInvalidateUpdate`,
    ], args, entityTypeInfo);

    const { name: entityTypeName} = entityTypeInfo;

    const { id, fields = {}, ...setProperties} = args;

    const [ tableArgs = {}, tableArgs2 = {} ] = await invokeReduce([
      `entityUpdateTableArgs`,
      `${this.name}EntityUpdateTableArgs`,
    ], setProperties);

    const result = await db(entityTypeName)
      .update({
        ...tableArgs,
        ...tableArgs2,
      })
      .where({id});

    return invokeReduce(`entityUpdateResult`, result, entityTypeInfo);

  }

  async del( args = {} ) {

    const entityTypeInfo = await EntityController.getEntityTypeInfo(this.name);

    await invokeHook([
      `entityInvalidateDelete`,
      `${this.name}EntityInvalidateDelete`,
    ], args, entityTypeInfo);

    const { name: entityTypeName} = entityTypeInfo;

    const [ tableArgs = {}, tableArgs2 = {} ] = await invokeReduce([
      `entityDeleteTableArgs`,
      `${this.name}EntityDeleteTableArgs`,
    ], args);

    const numRows = await db(entityTypeName)
      .del()
      .where({
        ...tableArgs,
        ...tableArgs2,
      });

    return invokeReduce(`entityDeleteResult`, { numRows }, entityTypeInfo);

  }

  async search( args = {} ) {

    const entityTypeInfo = await EntityController.getEntityTypeInfo(this.name);

    await invokeHook([
      `entityInvalidateSearch`
      `${this.name}EntityInvalidateSearch`
    ], args, entityTypeInfo);

    const [ tableArgs = {}, tableArgs2 = {}] = await invokeReduce([
      `entitySearchTableArgs`,
      `${this.name}SearchTableArgs`,
    ], args);

    // TODO: implement field queries
    /* const result = await fieldController.search({
     *   entityTypeName,
     *   bundle,
     *   fields,
     * });
     */

    const result = []

    return invokeReduce(`entitySearchResult`, result, entityTypeInfo);

  }

  // read/search/delete only uses entity properties (direct table columns)
  // so this will only check if the properties are valid; otherwise sql
  // will give us a fatal error.
  static async validatePropertyKeys(args = {}, entityTypeInfo) {

    const {
      properties: authorizedProperties = [],
    } = entityTypeInfo;

    const {
      fields = {},
      ...entityProperties
    } = args;

    const authorizedPropNames = {};

    for (let propertyAttributes of authorizedProperties) {

      const { propertyName } = propertyAttributes;

      authorizedPropNames[propertyName] = true;

    }

    for (let propertyName in entityProperties) {

      if (propertyName === 'id') {
        continue;
      }

      if (!authorizedPropNames.hasOwnProperty(propertyName)) {
        throw new BadRequestError(`unrecognized entity property ${propertyName}`);
      }

    }

  };

  // TODO: cache! this is probably going to add a bit of overhead
  // the goal long term is to have sealion use a write-thru approach
  // to caching in which updates/deletes invalidate the read/search
  // cache. caching will deserve its own API though
  static async getEntityTypeInfo(name) {
    return entityTypeController.read({name});
  }

  // this is used for post/put, create/update because those
  // values actually get stored into the database. read/search/delete
  // will instead validatePayloadKeys
  static async validatePayloadValues(args = {}, entityTypeInfo = {}) {

    const {
      properties: authorizedProperties = [],
      bundles: authorizedBundles = [],
    } = entityTypeInfo;

    const {
      fields: entityFields = {},
      ...entityProperties
    } = args;

    const {
      bundleName: entityBundleName = null,
    } = entityProperties;

    const { name: entityTypeName } = entityTypeInfo;

    const [ entityBundle ] = authorizedBundles
      .filter((bundle) => bundle.bundleName === entityBundleName);

    if (entityBundleName && !entityBundle) {
      throw new BadRequestError(`${entityBundleName} is not an authorized bundle for ${entityTypeName}`);
    }

    const authorizedPropNames = {};

    // go through canonical properties (stored in entityTypeProperty table)
    for (let propertyAttributes of authorizedProperties) {

      const {
        propertyName,
        isRequired = false,
        type,
      } = propertyAttributes;

      // put name in lookup table for fast lookup later
      authorizedPropNames[propertyName] = true;

      if (isRequired && !entityProperties.hasOwnProperty(propertyName)) {
        throw new BadRequestError(`${propertyName} is required`);
      }

      if (entityProperties.hasOwnProperty(propertyName)) {
        const value = entityProperties[propertyName];
        validate(propertyName, value, type);
      }

    }

    // go through delivered properties (in request payload)
    for (let propertyName in entityProperties) {
      // if the property delievered is not a known, canonical property
      // throw a BadRequestError
      if (!authorizedPropNames.hasOwnProperty(propertyName)) {
        throw new BadRequestError(`unrecognized entity property ${propertyName}`);
      }
    }

    const authorizedFieldNames = {};

    const bundleFields = await bundleFieldController.search({
      bundleName: entityBundleName,
    });

    // throw error if bundle was passed but bundle has no fields.
    if (entityBundleName && !bundleFields.length) {
      throw new BadRequestError(`bundle ${bundleName} does not implement any fields`);
    }

    // throw error if no bundleName was provided, but fields were
    if (!entityBundleName && Object.keys(entityFields).length) {
      throw new BadRequestError(`no bundleName provided but fields were provided`);
    }

    // do similar treatment for fields. Here, however, each field
    // has values in an array because entities to fields are one to many.
    for (let fieldAttributes of bundleFields) {

      const {
        fieldName,
        type,
        isRequired = false,
      } = fieldAttributes;

      authorizedFieldNames[fieldName] = true;

      if (!entityFields.hasOwnProperty(fieldName)) {
        if (isRequired) {
          throw new BadRequestError(`field ${fieldName} is required`);
        } else {
          continue;
        }
      }

      // field values are always delievered in an array, and the
      // indicies indicate the field instance identifier
      const fieldValues = entityFields[fieldName];

      if (!Array.isArray(fieldValues)) {
        throw new BadRequestError(`${fieldName} are not in an array`);
      }

      for (fieldValue of fieldValues) {
        validate(fieldName, fieldValue, type);
      }

    }

  }

}

// below is where the standard 400 errors are thrown. you can however
// use your own implmentation to throw additional errors
implementHook(`entityInvalidateCreate`, EntityController.validatePayloadValues);
implementHook(`entityInvalidateRead`, EntityController.validatePropertyKeys);
implementHook(`entityInvalidateUpdate`, EntityController.validatePayloadValues);
implementHook(`entityInvalidateDelete`, EntityController.validatePropertyKeys);
implementHook(`entityInvalidateSearch`, EntityController.validatePropertyKeys);

const buildEntityControllers = async (controllers = {}) => {

  // TODO: somehow use caching in entityTypeInfoCache to skip DB reads
  const entityTypeInfos = await db('entityType');

  const entityControllers = entityTypeInfos.reduce((obj, row = {}) => {

    const {
      name,
      ...entityTypeInfo
    } = row;

    return {
      ...obj,
      [name]: new EntityController(name, entityTypeInfo),
    };

  }, {});

  return {...controllers, ...entityControllers};

};

implementReduce(`resourceControllers`, buildEntityControllers);

module.exports = EntityController;

