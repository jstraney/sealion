/* 
 * Hook entityInvalidate${Action}
 * Hook ${entityTypeName}EntityInvalidate${Action}
 *
 * Invalidate arguments supplied to the EntityModel
 * instance. Throwing an error will stop the action
 * It is recommended to use an error from @owo/lib/error
 * as they will work with core plugins (such as
 * server plugin which will return 500 status if caught
 * error is untyped)
 *
 * Object rawArgs : arguments as they were passed to the models method
 * Object tableArgs: reduced rawArgs with the purposes of being used directly on
 *   the entity's table directly
 * Object entityTypeInfo : entityType record which describes models entityType
 *
 * The two examples below are equivalent (though second one may be more succinct)
 */
implementHook('entityInvalidateCreate', function (rawArgs = {}, tableArgs = {}, entityTypeInfo = {}) {

  if (entityTypeInfo.name === 'person') {

    const { phoneNumber } = rawArgs;

    // A better way to do something like this is use hooks in @owo/lib/validate
    // and @owo/plugin/entityTypeProperty
    if (phoneNumber.indexOf('.')) {
      throw new BadRequestError('Do not ever put dots in a phone number');
    }

  }

});

implementHook('personEntityInvalidateCreate', function (rawArgs = {}, tableArgs = {}, entityTypeInfo = {}) {

  const { phoneNumber } = rawArgs;

  // A better way to do something like this is use hooks in @owo/lib/validate
  // and @owo/plugin/entityTypeProperty
  if (phoneNumber.indexOf('.')) {
    throw new BadRequestError('Do not ever put dots in a phone number');
  }

});

/*
 * Hook entity${action}
 * Hook ${entityTypeName}Entity${action}
 *
 * these hooks are always performed after a models action has been successfully
 * performed (record inserted, modified, retrieved) without issue
 *
 * Object rawArgs: see above
 * Object tableArgs: see above
 * optional: (depending on action, additional options may be passed)
 */
implementHook('entityRemove', function (rawArgs = {}, tableArgs = {}, numRows = 0) {

});

implementHook('personEntityRemove', function (rawArgs = {}, tableArgs = {}, numRows = 0) {

  const { email } = rawArgs;

  // notify a service of removal
  notifyEmailService(email, 'personRemoved');

});
