const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.statusCode).end();
};

module.exports = errorHandler;
