const express = require("express");
const healthPlan = require("./healthPlan");
const { pageNotFound } = require("../middlewares/utils");
const ApiError = require("../utils/ApiError");
const verifyToken = require("../middlewares/auth");

module.exports = (app) => {
  app.use(express.json(), (err, req, res, next) => {
    if (err) {
      return next(ApiError.badRequest());
    }
  });

  const version = process.env.API_VERSION || "v1";

  app.use(`/${version}/plan`, verifyToken, healthPlan);

  app.use("*", pageNotFound);
};
