const ApiError = require("../utils/ApiError");

const pageNotFound = (req, res, next) => next(ApiError.notFound());

module.exports = { pageNotFound };
