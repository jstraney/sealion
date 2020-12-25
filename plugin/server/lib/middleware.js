const {
  getHttpErrorCode,
} = require('@owo/lib/error');


// TODO: implement. just passes through at the moment
const useAuthorization = (action, resourceName) => {

  return async (req, res, next) => {

    // load the user/session/token from request

    // determine ownership of the resource (defines scope (e.g. own, any)

    // check if the token satisfies action on resource in the context of scope

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

// reduces args from parts of the request packet into
// arguments for a model to consume
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

// accepts a function that returns a result or throws an error
// this is usually a method on a model
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

// checks the response locals for a result
// or an error (assigned in the consumeArgs
// middleware)
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

// logs http request packets.
const httpLogger = (logger) => {

  return async (req, res, next) => {

    const {
      method,
      originalUrl,
      httpVersion,
    } = req;

    // TODO: check trust-proxy settings and make
    // a common sense way to adjust the setting
    const [...ip] = req.ips.concat([req.ip]);

    logger.info('%s HTTP %s %s', method, httpVersion, originalUrl);

    next();

  };

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
  httpLogger,
};
