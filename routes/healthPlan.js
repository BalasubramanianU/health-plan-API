const express = require("express");
const AJV = require("ajv");

const ApiError = require("../utils/ApiError");
const redisClient = require("../utils/db");
const etagCreater = require("../utils/eTagCreater");
const jsonSchema = require("../models/schema");

const router = express.Router();
const ajv = new AJV();

router.post("/", async (req, res, next) => {
  if (!req.is("application/json")) {
    return next(ApiError.unsupportedMediaType());
  }

  if (
    !req.body ||
    Object.keys(req.body).length === 0 ||
    !ajv.validate(jsonSchema, req.body)
  ) {
    return next(ApiError.badRequest());
  }

  redisClient.set(req.body["objectId"], JSON.stringify(req.body), (err) => {
    if (err) {
      return next(ApiError.serviceUnavailable());
    }
  });
  const response = await redisClient.get(req.body["objectId"]);
  res.set("Etag", etagCreater(JSON.stringify(response)));
  return res.status(201).send(req.body);
});

router.get("/:planId", async (req, res, next) => {
  try {
    const reponse = await redisClient.get(req.params.planId);
    if (reponse == null) {
      return next(ApiError.notFound());
    }
    const etag = etagCreater(JSON.stringify(reponse));
    if (req.get("If-None-Match") && etag == req.get("If-None-Match")) {
      return res.status(304).end();
    }
    res.set("Etag", etag);
    return res.status(200).send(JSON.parse(reponse));
  } catch (err) {
    console.log(err);
    return next(ApiError.serviceUnavailable());
  }
});

router.delete("/:planId", async (req, res, next) => {
  try {
    const response = await redisClient.del(req.params.planId);
    if (response == 0) {
      return next(ApiError.notFound());
    }
    return res.status(204).end();
  } catch (err) {
    console.log(err);
    return next(ApiError.serviceUnavailable());
  }
});

router.all("/", async (req, res, next) => {
  next(ApiError.methodNotAllowed());
});

router.all("/:planId", async (req, res, next) => {
  next(ApiError.methodNotAllowed());
});

module.exports = router;
