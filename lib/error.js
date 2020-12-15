class BadRequestError extends Error {}
class ConflictError extends Error {}
class UnauthorizedError extends Error {}
class InvalidGrantError extends Error {}
class NotFoundError extends Error {}

const getHttpErrorCode = (error) => {
  if (error instanceof BadRequestError) {
    return 400;
  } else if (error instanceof UnauthorizedError) {
    return 403;
  } else if (error instanceof NotFoundError) {
    return 404;
  } else if (error instanceof ConflictError) {
    return 409;
  } else if (error instanceof InvalidGrantError) {
    return 401;
  } else {
    return 500;
  }
}

module.exports = {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  InvalidGrantError,
  NotFoundError,
  getHttpErrorCode,
};
