const { getChannel, config } = require("./rabbitmq");
const {
  indexHealthPlan,
  updateHealthPlan,
  deleteHealthPlan,
} = require("./elasticProcessor");

/**
 * Process a message based on operation type
 * @param {Object} message - The message object
 * @param {string} message.operation - The operation type (POST, PATCH, DELETE)
 * @param {Object} message.payload - The data payload
 * @param {string} message.timestamp - ISO timestamp of when message was created
 */
async function processMessage(message) {
  console.log(
    `Processing ${message.operation} operation`,
    message.payload.objectId || message.payload
  );

  try {
    switch (message.operation) {
      case "POST":
        await indexDocument(message.payload);
        break;
      case "PATCH":
        await updateDocument(message.payload);
        break;
      case "DELETE":
        await deleteDocument(message.payload);
        break;
      default:
        console.warn(`Unknown operation type: ${message.operation}`);
    }
  } catch (error) {
    console.error(`Error processing ${message.operation} message:`, error);
  }
}

/**
 * Index a new document in Elasticsearch
 * @param {Object} payload - The document data to index
 */
async function indexDocument(payload) {
  try {
    // Process the health plan document with parent-child relationships
    const result = await indexHealthPlan(payload);
    console.log(`Document indexed successfully with ID: ${payload.objectId}`);
    return result;
  } catch (error) {
    console.error("Error indexing document:", error);
    throw error;
  }
}

/**
 * Update an existing document in Elasticsearch
 * @param {Object} payload - The document data to update
 */
async function updateDocument(payload) {
  try {
    // Update the health plan with all its relationships
    const result = await updateHealthPlan(payload);
    console.log(`Document updated successfully with ID: ${payload.objectId}`);
    return result;
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
}

/**
 * Delete a document from Elasticsearch
 * @param {Object} payload - The document data containing objectId to delete
 */
async function deleteDocument(payload) {
  try {
    const result = await deleteHealthPlan(payload);
    console.log(`Document deleted successfully with ID: ${payload?.objectId}`);
    return result;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

/**
 * Start consuming messages from RabbitMQ queue
 */
async function startConsumer() {
  try {
    console.log("Starting RabbitMQ consumer...");
    const channel = await getChannel();

    // Set prefetch to process one message at a time
    channel.prefetch(1);

    await channel.consume(
      config.QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          try {
            const messageContent = msg.content.toString();
            const message = JSON.parse(messageContent);

            console.log(`Received message: ${message.operation}`);

            // Process the message
            await processMessage(message);

            // Acknowledge the message has been processed to the rabbitmq
            channel.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
            // Negative acknowledgment - message will be requeued
            channel.nack(msg, false, false);
          }
        }
      },
      {
        noAck: false, // Explicit acknowledgment mode
      }
    );

    console.log("RabbitMQ consumer started successfully");
  } catch (error) {
    console.error("Failed to start RabbitMQ consumer:", error);
    throw error;
  }
}

module.exports = {
  startConsumer,
  processMessage,
};
