const { Client } = require("@elastic/elasticsearch");

const config = {
  ELASTICSEARCH_NODE: "http://localhost:9200",
  INDEX_NAME: "planindex",
};

let client = null;

/**
 * Initializes and connects to Elasticsearch
 * @returns {Promise<Client>} Elasticsearch client instance
 */
async function connectElasticsearch() {
  try {
    client = new Client({
      node: config.ELASTICSEARCH_NODE,
    });
    await client.ping();
    console.log("Successfully connected to Elasticsearch");

    const indexExists = await client.indices.exists({
      index: config.INDEX_NAME,
    });
    if (!indexExists.body) {
      await createIndex();
    }

    return client;
  } catch (error) {
    console.error("Failed to connect to Elasticsearch:", error);
    throw error;
  }
}

/**
 * Creates the health_plans index with appropriate mappings
 */
async function createIndex() {
  try {
    await client.indices.create({
      index: config.INDEX_NAME,
      body: {
        settings: {
          index: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
        },
        mappings: {
          properties: {
            _org: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            copay: {
              type: "integer",
            },
            creationDate: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            deductible: {
              type: "integer",
            },
            linkedPlanServices: {
              properties: {
                _org: {
                  type: "text",
                },
                objectId: {
                  type: "keyword",
                },
                objectType: {
                  type: "text",
                },
              },
            },
            linkedService: {
              properties: {
                _org: {
                  type: "text",
                },
                name: {
                  type: "text",
                },
                objectId: {
                  type: "keyword",
                },
                objectType: {
                  type: "text",
                },
              },
            },
            name: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            objectId: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            objectType: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            plan: {
              properties: {
                _org: {
                  type: "text",
                },
                creationDate: {
                  type: "date",
                  format: "MM-dd-yyyy",
                },
                objectId: {
                  type: "keyword",
                },
                objectType: {
                  type: "text",
                },
                planType: {
                  type: "text",
                },
              },
            },
            planCostShares: {
              properties: {
                _org: {
                  type: "text",
                },
                copay: {
                  type: "integer",
                },
                deductible: {
                  type: "integer",
                },
                objectId: {
                  type: "keyword",
                },
                objectType: {
                  type: "text",
                },
              },
            },
            planType: {
              type: "text",
              fields: {
                keyword: {
                  type: "keyword",
                  ignore_above: 256,
                },
              },
            },
            plan_join: {
              type: "join",
              eager_global_ordinals: true,
              relations: {
                linkedPlanServices: ["linkedService", "planserviceCostShares"],
                plan: ["planCostShares", "linkedPlanServices"],
              },
            },
            planserviceCostShares: {
              properties: {
                _org: {
                  type: "text",
                },
                copay: {
                  type: "integer",
                },
                deductible: {
                  type: "integer",
                },
                objectId: {
                  type: "keyword",
                },
                objectType: {
                  type: "text",
                },
              },
            },
          },
        },
      },
    });

    console.log(`Index ${config.INDEX_NAME} created successfully`);
  } catch (error) {
    console.error("Error creating Elasticsearch index:", error);
    throw error;
  }
}

/**
 * Returns the Elasticsearch client instance
 * @returns {Client} Elasticsearch client
 */
function getClient() {
  if (!client) {
    throw new Error(
      "Elasticsearch client not initialized. Call connectElasticsearch() first."
    );
  }
  return client;
}

/**
 * Closes the Elasticsearch connection
 */
async function closeConnection() {
  if (client) {
    try {
      await client.close();
      client = null;
      console.log("Elasticsearch connection closed");
    } catch (error) {
      console.error("Error closing Elasticsearch connection:", error);
      throw error;
    }
  }
}

module.exports = {
  connectElasticsearch,
  getClient,
  closeConnection,
  config,
};
