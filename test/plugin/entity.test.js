const {
  getTrueIfSet,
} = require('@owo/lib/collection');

const {
  test,
} = require('@owo/lib/test');

const EntityModel = require('@owo/plugin/entity/model/EntityModel');

// heads up! this test will only work after a proper install of sealion
module.exports = test('@owo/plugin/entity', async (owo, args, ensure) => {

  const {
    plugin : { entity: entityApi },
    lib : { dbLib },
  } = owo;

  await ensure('getEntityModels', async () => {

    const entityModels = await entityApi.getEntityModels();

    for (name in entityModels) {

      const controller = entityModels[name];

      await ensure(`${name}`, controller instanceof EntityModel);

    }

  });

  const db = await dbLib.loadDB();

  const entityTypeInfos = await EntityModel.getEntityTypeInfos(db);

  const coreTypes = [
    'entityType',
    'entityTypeProperty',
    'bundle',
    'bundleField',
    'field',
  ];

  for (entityTypeName of coreTypes) {
    await ensure(`${entityTypeName} info exists`, getTrueIfSet(entityTypeInfos, entityTypeName));
    const entityType = entityTypeInfos[entityTypeName];
    await ensure(`${entityTypeName} has properties`, getTrueIfSet(entityType, 'properties'));
  }

});
