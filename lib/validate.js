const {
  invokeReduce,
} = require('./hook');

const {
  BadRequestError,
} = require('./error');

class Validator {

  constructor(fn) {

    if (typeof fn !== 'function') {
      throw new Error('Validator expects a function in constructor');
    }

    this.fn = fn;

  }

  // implement in other validators to return formatted message
  getError(name, value) {
    return `Issue identified for ${name}. Was not expecting ${value}.`;
  }

  validate(name = 'value', value) {

    if (this.fn(value) !== true) {
      throw new BadRequestError(`${this.getError(name, value)}`);
    }

  }

}

class TypeValidator extends Validator {
  constructor (fn, typeLabel) {
    super(fn);
    this.typeLabel = typeLabel;
  }
  getError(name, value) {
    return `Type of ${this.typeLabel} expected for ${name}. Got ${value}.`;
  }
}


class ExpressionValidator extends Validator {

  constructor (regexp) {

    if (!(regexp instanceof RegExp)) {
      throw new Error('expression validator expects regular expression');
    }

    super(regexp.test);

    this.regexp = regexp;

  }

  getError(name, value) {
    return `${name} expected to be formed as ${this.regexp}`;
  }
}

// extra types that just map to primitive types.
const knexTypeMap = async () => {

  return invokeReduce('knexTypeMap', {
    entityReference: 'integer',
    secret: 'string',
    date: 'string',
    datetime: 'string',
    timestamp: 'integer',
    email: 'string',
    phone: 'string',
  });

};

// there are exactly three types of validators:
// type validators : validate the typeness of a datum
// expression validators : validate the form of the datum
// integrity validators : validates the relation of the datum (keys)

// all types must map to knex types or be knex types themselves
const validate = async (name, value, type) => {

  const expressionValidators = await invokeReduce('expressionValidator', {
    // not strictly speaking accurate but will match most!
    email: [new ExpressionValidator(/^[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]+)?@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]+)*$/)],
    phone: [new ExpressionValidator(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/)],
  });

  // expression validators are always pre-mapped (e.g. before email becomes string)
  if (expressionValidators.hasOwnProperty(type)) {
    for(validator of expressionValidators[type]) {
      validator.validate(name, value);
    }
  }

  // TODO: implement integrity validators
  const integrityValidators = await invokeReduce('integrityValidator', {});

  if (integrityValidators.hasOwnProperty(type)) {
    for(validator of integrityValidators[type]) {
      validator.validate(name, value);
    }
  }

  const typeValidators = await invokeReduce('typeValidator', {
    string: [new TypeValidator((a) => typeof a === 'string', 'String')],
    integer: [new TypeValidator((a) => Number.isInteger(a), 'Integer')],
    boolean: [new TypeValidator((a) => typeof a === 'boolean', 'Boolean')],
    decimal: [new TypeValidator((a) => typeof a === 'number' && !Number.isInteger(a), 'Decimal')],
  });

  const typeMap = await knexTypeMap();

  const mappedType = typeMap.hasOwnProperty(type)
    ? typeMap[type]
    : type;

  // all types must map to a knex type, or be a knex type themselves
  // examples
  // email => string
  // integer => integer
  // foo => BadRequestError, unless you add the type using reducer 'knexTypeMap'
  if (!typeValidators.hasOwnProperty(mappedType)) {
    throw new BadRequestError(`unrecognized type ${type}`);
  }

  for (validator of typeValidators[mappedType]) {
    validator.validate(name, value);
  }

  return true;

};

module.exports = {
  TypeValidator,
  ExpressionValidator,
  knexTypeMap,
  validate,
}
