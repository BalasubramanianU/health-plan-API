const { getClient, config } = require("./elasticSearch");

let MapOfDocuments = {};
let listOfKeys = [];

const convertMapToDocumentIndex = async (
  jsonObject,
  parentId,
  objectName,
  parentObjId
) => {
  const valueMap = {};
  const map = {};

  for (const [key, value] of Object.entries(jsonObject)) {
    const redisKey = `${jsonObject.objectType}:${parentId}`;
    if (Array.isArray(value)) {
      await convertToList(value, jsonObject.objectId, key, parentObjId);
    } else if (typeof value === "object") {
      await convertMapToDocumentIndex(
        value,
        jsonObject.objectId,
        key,
        parentObjId
      );
    } else {
      valueMap[key] = value;
      map[redisKey] = valueMap;
    }
  }

  if (objectName === "plan") {
    valueMap["plan_join"] = {
      parent: "",
      name: objectName,
    };
  } else if (objectName.match(/^-?\d+$/)) {
    parentId = parentObjId;
    valueMap["plan_join"] = {
      parent: parentObjId,
      name: "linkedPlanServices",
    };
  } else {
    valueMap["plan_join"] = {
      name: objectName,
      parent: parentId,
    };
  }

  const id = `${parentId}:${jsonObject.objectId}`;
  if (!!jsonObject?.objectId) MapOfDocuments[id] = valueMap;
  return map;
};

const convertToList = async (jsonArray, parentId, objectName, parentObjId) => {
  const list = [];
  for (let i = 0; i < jsonArray.length; i++) {
    let value = jsonArray[i];
    if (Array.isArray(value)) {
      value = await convertToList(value, parentId, objectName, parentObjId);
    } else if (typeof value === "object") {
      value = await convertMapToDocumentIndex(value, parentId, objectName);
    }
    list.push(value);
  }
  return list;
};

const convertToKeysList = async (jsonArray) => {
  let list = [];
  for (let value of jsonArray) {
    if (Array.isArray(value)) {
      value = await convertToKeysList(value);
    } else if (typeof value === "object") {
      value = await convertToKeys(value);
    }
    list.push(value);
  }
  return list;
};

const convertToKeys = async (jsonObject) => {
  const map = {};
  const valueMap = {};

  for (const [key, value] of Object.entries(jsonObject)) {
    const redisKey = jsonObject["objectId"];
    if (Array.isArray(value)) {
      await convertToKeysList(value);
    } else if (typeof value === "object") {
      await convertToKeys(value);
    } else {
      valueMap[key] = value;
      map[redisKey] = valueMap;
    }
  }

  listOfKeys.push(jsonObject["objectId"]);
  return map;
};

/**
 * Index a health plan with parent-child relationships in Elasticsearch
 * @param {Object} healthPlan - The health plan to index
 * @returns {Promise<Object>} - Result of the indexing operation
 */
async function indexHealthPlan(plan) {
  try {
    const client = getClient();
    MapOfDocuments = {};
    await convertMapToDocumentIndex(plan, "", "plan", plan.objectId);
    for (const [key, value] of Object.entries(MapOfDocuments)) {
      const [parentId, objectId] = key.split(":");
      await client.index({
        index: config.INDEX_NAME,
        id: objectId,
        routing: parentId,
        body: value,
      });
    }
    return new Promise((resolve, reject) => {
      resolve();
    });
  } catch (e) {
    console.log("Error", e);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

/**
 * Update a health plan in Elasticsearch
 * @param {Object} healthPlan - The updated health plan data
 * @returns {Promise<Object>} - Result of the update operation
 */
async function updateHealthPlan(healthPlan) {
  try {
    await deleteHealthPlan(healthPlan);
    await indexHealthPlan(healthPlan);
  } catch (error) {
    console.error("Error updating health plan:", error);
    throw error;
  }
}

/**
 * Delete a health plan and all its related documents from Elasticsearch
 * @param {Object} objectId - The health plan to delete, or an object with the objectId
 * @returns {Promise<Object>} - Result of the delete operation
 */
async function deleteHealthPlan(jsonObject) {
  const client = getClient();
  listOfKeys = [];
  await convertToKeys(jsonObject);
  console.log(listOfKeys);
  for (const key of listOfKeys) {
    client.delete(
      {
        index: config.INDEX_NAME,
        id: key,
      },
      (err, res) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log("Indexes have been deleted!", res);
        }
      }
    );
  }
}

module.exports = {
  indexHealthPlan,
  updateHealthPlan,
  deleteHealthPlan,
};
