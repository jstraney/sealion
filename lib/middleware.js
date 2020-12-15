const {
  getHttpErrorCode,
} = require('./error')

const useAuthorization = async (claims = {}) => {

  // TODO: implement.
  return async (req, res, next) => {

    // TODO: replace with checking Authorization header
    // invokeReducers (or invokeMap? not implemented)
    // to check if authorized.
    const authorized = true;

    if (!authorized) {
      return res.status(401).json({
        success: false,
        message: 'unauthorized access',
      });
    }

    next();

  };

};

const useArgs = (config = {}) => {

  const {
    body: bodyFields = [],
    query: queryFields = [],
    params: paramFields = [],
    all = false,
  } = config;

  // you can, optionally just grab anything that comes in
  // and put it into args. This assumes you are validating
  // the fields down-stream from this handler such as the
  // entity router does
  if (all) {
    return async (req, res, next) => {

      const {
        body = {},
        query = {},
        params = {},
      } = req;

      req.args = {
        ...query,
        ...body,
        ...params,
      };

      next();

    }
  }

  const grabFromObj = (fields = [], from = {}, to = {}) => {
    fields.forEach((fieldName) => {
      if (from.hasOwnProperty(fieldName)) {
        to[fieldName] = from[fieldName];
      }
    });
  };

  return async (req, res, next) => {

    const {
      body = {},
      query = {},
      params = {},
    } = req;

    const args = {};

    grabFromObj(bodyFields, body, args);
    grabFromObj(queryFields, query, args);
    grabFromObj(paramFields, params, args);

    req.args = args;

    next();

  };

};

const consumeArgs = (fn = null) => {

  if (!fn || typeof fn !== 'function') {
    throw new Error('consumeArgs requires a function')
  }

  return async (req, res, next) => {

    const { args = {} } = req;

    try {

      const response = await fn(args)

      res.locals.response = response;

      return next();


    } catch(error) {

      res.locals.error = error;

      return next();

    }

    return res.end();

  };

}

const viewJSON = () => {

  return async (req, res) => {

    const { error, response } = res.locals;

    if (response) {
      res.json(response);
    } else if (error) {
      const statusCode = getHttpErrorCode(error);
      res.status(statusCode).json({
        success: false,
        error: statusCode >= 500 ? 'An unexpected error has occured' : error.message,
      });
    }

    res.end();

  }

};

const defaultError = async (req, res, next, error) => {
  res.json(error);
}

module.exports = {
  useAuthorization,
  useArgs,
  consumeArgs,
  viewJSON,
  defaultError,
};
