// TODO: see if there is a super automatic way to bootstrap the schema
// the best approach I had was time and love... :D
const {
  camelCase,
  capitalCase,
} = require('@owo/lib/string')

const entityTypeSeedRecords = () => [
  {
    name: 'field',
    label: 'Field',
    help: [
      'A field is put in its own table for many entity type bundles to use.',
      'Unlike properties, fields support multiple values.',
    ].join(' '),
  },
  {
    name: 'bundle',
    label: 'Bundle',
    help: [
      'A bundle is defined as a collection of fields that can be',
      'attached to an entity that implements the bundle.',
    ].join(' '),
  },
  {
    name: 'bundleField',
    label: 'Bundle Field',
    help: [
      'A relation of a bundle to a field table.',
      'The existence of the relation shows that the bundle supports the',
      'use of a field.',
    ].join(' '),
  },
  {
    name: 'entityTypeBundle',
    label: 'Entity Type Bundle',
    help: [
      'A relation of a bundle to an entity type. When an entity type implements',
      'a bundle, the bundle\'s fields may be attached to an instance of the entity',
    ].join(' '),
  },
  {
    name: 'entityType',
    label: 'Entity Type',
    help: 'An entity type is a table, is a table, is a table',
  },
  {
    name: 'entityTypeProperty',
    label: 'Entity Type Property',
    help: 'An entity type property is a column on a table',
  },
  {
    name: 'permission',
    label: 'Permission',
    help: [
      'A permission encapsulates capabilities to perform an action',
      'on a resource within a certain scope',
    ].join(' '),
  },
  {
    name: 'role',
    label: 'Role',
    help: [
      'A role is a namespaced collection of permissions'
    ].join(' '),
  },
  {
    name: 'rolePermission',
    label: 'Role Permission',
    help: 'A relation between a role and a permission',
  },
  {
    name: 'entityRole',
    label: 'Entity Role',
    help: 'A relation between a specific entity and a role',
  }
]

const getBundleProperties = () =>  [
  {
    entityTypeName: 'bundle',
    propertyName: 'name',
    type: 'string',
    label: 'Name',
    help: 'Machine name of the bundle',
    isIdKey: true,
  },
  {
    entityTypeName: 'bundle',
    propertyName: 'label',
    type: 'string',
    label: 'Label',
    isRequired: true,
  },
];

const getFieldProperties = () => [
  {
    entityTypeName: 'field',
    propertyName: 'isRequired',
    label: 'Required',
    help: [
      'If a field is required, an error will be thrown when',
      'attempting to create or update an entity without the',
      'field present so long as the entity is part of the bundle.',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'field',
    propertyName: 'isUnique',
    label: 'Unique',
    help: [
      'Creates a composite unique index on the field table such that',
      'an entity\'s values for the field must be unique',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'field',
    propertyName: 'isIndexed',
    label: 'Indexed',
    help: [
      'Creates a non-unique index on a fields value. Uses default',
      'index type of database (most likely a binary tree)',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'field',
    propertyName: 'name',
    label: 'Field Machine Name',
    help: 'Machine name of the field. Should not be changed once set',
    type: 'string',
    isIdKey: true,
  },
  {
    entityTypeName: 'field',
    propertyName: 'label',
    label: 'Field Label',
    help: 'Natural language label',
    type: 'string',
  },
  {
    entityTypeName: 'field',
    propertyName: 'type',
    label: 'Field Type',
    help: 'Field type',
    type: 'string',
  },
  {
    entityTypeName: 'field',
    propertyName: 'maxInstances',
    label: 'Maximum Values',
    help: 'Maximum number of values storable per fielded entity.',
    type: 'integer',
  },
  {
    entityTypeName: 'field',
    propertyName: 'help',
    label: 'Help',
    help: 'Field help and information. Describe field use.',
    type: 'text',
  },
];

const getEntityTypeBundleProperties = () => [
  {
    entityTypeName: 'entityTypeBundle',
    propertyName: 'entityTypeName',
    label: 'Entity Type',
    help: 'Related entity type',
    isIdKey: true,
    type: 'string',
  },
  {
    entityTypeName: 'entityTypeBundle',
    propertyName: 'bundleName',
    label: 'Bundle',
    help: 'Related bundle name',
    isIdKey: true,
    type: 'string',
  },
];

const getEntityTypePropertyProperties = () => [
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'entityTypeName',
    label: 'Entity Type Name',
    type: 'string',
    help: 'Relative name of the entity type.',
    isIdKey: true,
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'propertyName',
    label: 'Property Name',
    help: 'Relative name of the property. Machine name.',
    type: 'string',
    isIdKey: true,
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'label',
    label: 'Label',
    help: 'Natural language property label',
    type: 'string',
    isRequired: true
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'help',
    label: 'Help',
    help: 'Property help and information. Describe property use',
    type: 'text',
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'type',
    label: 'Type',
    help: [
      'Property\'s type. Types denote an expression and map to a data type',
      'supported by knex framework. Additional mappings can be defined using',
      'reducer "knexTypeMap". For example, "email" is an expression type',
      'that maps to the knex data type of "string".',
    ].join(' '),
    type: 'string',
    isRequired: true
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'isIdKey',
    label: 'Is ID',
    help: [
      'Indicates a property is a record identifier. Creates a primary key',
      'on an entity table. Multiple properties with the isIdKey attribute',
      'set to true will create a composite key',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'isRequired',
    label: 'Required',
    help: [
      'If a property is required, an error will be thrown when',
      'attempting to create or update an entity without the',
      'property present.',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'isUnique',
    label: 'Unique',
    help: [
      'Creates a unique index on entity type property. Takes priority',
      'over the Indexed attribute.',
    ].join(' '),
    type: 'boolean',
  },
  {
    entityTypeName: 'entityTypeProperty',
    propertyName: 'isIndexed',
    label: 'Indexed',
    help: [
      'Creates a non-unique index on an entity type property. Uses default',
      'index type of database (most likely a binary tree)',
    ].join(' '),
    type: 'boolean',
  },

];


const getBundleFieldProperties = () => [
  {
    entityTypeName: 'bundleField',
    propertyName: 'bundleName',
    label: 'Bundle',
    help: 'Related bundle name',
    isIdKey: true,
    type: 'string',
  },
  {
    entityTypeName: 'bundleField',
    propertyName: 'fieldName',
    label: 'Field',
    help: 'Related field name',
    isIdKey: true,
    type: 'string',
  },
  {
    entityTypeName: 'bundleField',
    propertyName: 'label',
    label: 'Label',
    help: 'Natural language field label. Unique per bundle field implementation and overrides field label',
    type: 'string',
    isRequired: true
  },
];

const getEntityTypeProperties = () => [
  {
    entityTypeName: 'entityType',
    propertyName: 'name',
    label: 'Machine Name',
    help: [
      'Machine readable name. For programatic use and should not be changed.',
      'always presumed to be camel case without exception.',
    ].join(' '),
    type: 'string',
    isIdKey: true,
    isRequired: true 
  },
  {
    entityTypeName: 'entityType',
    propertyName: 'label',
    label: 'Label',
    help: 'Natural language label for the entity type',
    type: 'string',
    isRequired: true 
  },
  {
    entityTypeName: 'entityType',
    propertyName: 'help',
    label: 'Help',
    help: 'Help for the entity type. Tell us what its all about.',
    type: 'text'
  },
  {
    entityTypeName: 'entityType',
    propertyName: 'canAuthenticate',
    label: 'Can Authenticate',
    help: [
      'Will automatically create a password property for the entity type.',
      'Allows the entity type to authenticated using the /auth route.',
      'For more information see auth plugin',
    ].join(' '),
    type: 'boolean'
  },
];

const getPermissionProperties = () => [
  {
    entityTypeName: 'permission',
    propertyName: 'name',
    label: 'Name',
    help: 'Machine readable name of the permission',
    type: 'string',
    isIdKey: true,
  },
  {
    entityTypeName: 'permission',
    propertyName: 'label',
    label: 'Label',
    help: 'Natural language name of the permission',
    type: 'string',
  },
  {
    entityTypeName: 'permission',
    propertyName: 'resourceName',
    label: 'Label',
    help: 'Machine readable name of the resource',
    type: 'string',
    isRequired: true,
  },
  {
    entityTypeName: 'permission',
    propertyName: 'action',
    label: 'Action',
    help: 'Entity method being invoked',
    type: 'string',
    isRequired: true,
  },
];

const getRolePermissionProperties = () => [
  {
    entityTypeName: 'rolePermission',
    propertyName: 'roleName',
    label: 'Role Name',
    help: 'Related name of the role',
    isIdKey: true,
    type: 'string',
  },
  {
    entityTypeName: 'rolePermission',
    propertyName: 'permissionName',
    label: 'Permission Name',
    help: 'Related name of the permission',
    isIdKey: true,
    type: 'string',
  },
];

const getRoleProperties = () => [
  {
    entityTypeName: 'role',
    propertyName: 'name',
    label: 'Name',
    help: 'machine readable name of the role',
    isIdKey: true,
    type: 'string',
  },
  {
    entityTypeName: 'role',
    propertyName: 'label',
    label: 'Label',
    help: 'Display label for the role',
    type: 'string',
  },
];

const getEntityTypeRoleProperties = () => [
  {
    entityTypeName: 'entityRole',
    propertyName: 'entityTypeName',
    label: 'Entity Type Name',
    help: 'Describes the type of entity that has the role',
    type: 'string',
    isIdKey: true,
  },
  {
    entityTypeName: 'entityRole',
    propertyName: 'entityId',
    label: 'Entity ID',
    help: 'Unique entity identifier. Unique per entity type.',
    type: 'integer',
    isIdKey: true,
  },
  {
    entityTypeName: 'entityRole',
    propertyName: 'roleName',
    label: 'Role',
    help: 'Related role machine name',
    type: 'string',
    isIdKey: true,
  },
];


module.exports = async (db) => {

  const entityTypeInserts = entityTypeSeedRecords();

  await db('entityType').insert(entityTypeInserts);

  await db('entityTypeProperty').insert([
    ...getEntityTypeProperties(),
    ...getEntityTypePropertyProperties(),
    ...getFieldProperties(),
    ...getBundleProperties(),
    ...getBundleFieldProperties(),
    ...getEntityTypeBundleProperties(),
    ...getPermissionProperties(),
    ...getRolePermissionProperties(),
    ...getRoleProperties(),
    ...getEntityTypeRoleProperties()
  ]);

  // here, we bootstrap the default actions per core entity
  const actionNames = ['create', 'read', 'update', 'remove', 'search'];

  const scopes = ['own', 'any'];

  const permissionInserts = [];

  for (let scope of scopes) {
    for (let action of actionNames) {
      for (let { name: entityTypeName } of entityTypeInserts) {

        const
        label = capitalCase(`${action} ${scope} ${entityTypeName}`),
        name = camelCase(label);

        permissionInserts.push({
          name,
          label,
          resourceName: entityTypeName,
          action,
        });

      }
    }
  }

  await db('permission').insert(permissionInserts);

}
