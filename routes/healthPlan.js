const express = require("express");
const AJV = require("ajv");

const ApiError = require("../utils/ApiError");
const redisClient = require("../utils/db");
const etagCreater = require("../utils/eTagCreater");
const { postSchema, patchSchema } = require("../models/schema");

const router = express.Router();
const ajv = new AJV();

router.post("/", async (req, res, next) => {
  if (!req.is("application/json")) {
    return next(ApiError.unsupportedMediaType());
  }

  if (
    !req.body ||
    Object.keys(req.body).length === 0 ||
    !ajv.validate(postSchema, req.body)
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

router.get("/", async (req, res, next) => {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      return next(ApiError.badRequest());
    }
    const keys = await redisClient.keys("*");
    let result = [];
    for (let key of keys) {
      const value = await redisClient.get(key);
      result.push(JSON.parse(value));
    }
    const etag = etagCreater(JSON.stringify(result));
    if (req.get("If-None-Match") && etag == req.get("If-None-Match")) {
      return res.status(304).end();
    }
    res.set("Etag", etag);
    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return next(ApiError.serviceUnavailable());
  }
});

router.get("/:planId", async (req, res, next) => {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      return next(ApiError.badRequest());
    }
    const response = await redisClient.get(req.params.planId);
    if (response == null) {
      return next(ApiError.notFound());
    }
    const etag = etagCreater(JSON.stringify(response));
    if (req.get("If-None-Match") && etag == req.get("If-None-Match")) {
      return res.status(304).end();
    }
    res.set("Etag", etag);
    return res.status(200).send(JSON.parse(response));
  } catch (err) {
    console.log(err);
    return next(ApiError.serviceUnavailable());
  }
});

router.patch("/:planId", async (req, res, next) => {
  try {
    if (!req.is("application/json")) {
      return next(ApiError.unsupportedMediaType());
    }

    if (
      !req.body ||
      Object.keys(req.body).length === 0 ||
      !ajv.validate(patchSchema, req.body)
    ) {
      return next(ApiError.badRequest());
    }

    // Ensure the objectId in the URL matches the one in the payload
    if (req?.body.objectId !== req?.params?.planId) {
      return next(ApiError.badRequest());
    }

    // Fetch the existing plan data from Redis
    const existingData = await redisClient.get(req.params.planId);
    if (!existingData) {
      return next(ApiError.notFound());
    }

    let planData = JSON.parse(existingData);

    // Check ETag for concurrency control
    const existingEtag = etagCreater(JSON.stringify(existingData));
    // const existingEtag = crypto.createHash('md5').update(existingData).digest('hex');
    if (req.get("If-Match") && req.get("If-Match") !== existingEtag) {
      return next(ApiError.preConditionFailed());
    }

    // Merge updates while handling linkedPlanServices array
    if (req.body.linkedPlanServices) {
      const existingServices = planData.linkedPlanServices || [];
      const newServices = req.body.linkedPlanServices;

      newServices.forEach((newService) => {
        const index = existingServices.findIndex(
          (s) => s.objectId === newService.objectId
        );
        if (index !== -1) {
          existingServices[index] = newService; // Update existing service
        } else {
          existingServices.push(newService); // Add new service
        }
      });

      planData.linkedPlanServices = existingServices;
    }

    // Merge other properties
    Object.keys(req.body).forEach((key) => {
      if (key !== "linkedPlanServices" && key !== "objectId") {
        planData[key] = req.body[key];
      }
    });

    // Save updated data to Redis
    const updatedData = JSON.stringify(planData);
    await redisClient.set(req.body["objectId"], updatedData);

    // Generate new ETag
    const newEtag = etagCreater(JSON.stringify(updatedData));
    res.set("ETag", newEtag);

    return res.status(200).json(planData);
  } catch (error) {
    console.error("Error updating plan:", error);
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
