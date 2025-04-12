const { getChannel, config } = require("./rabbitmq");

/**
 * Publishes a message to the RabbitMQ queue
 * @param {string} operation - The operation type (POST, PUT, PATCH, DELETE)
 * @param {object} payload - The JSON payload to be sent
 * @returns {Promise<boolean>} - Success status
 */
async function publishMessage(operation, payload) {
  try {
    const channel = await getChannel();

    const message = {
      operation,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Convert message to Buffer, since RabbitMQ expects messages to be sent as Buffer objects
    const messageBuffer = Buffer.from(JSON.stringify(message));

    // Send directly to queue
    const success = channel.sendToQueue(config.QUEUE_NAME, messageBuffer, {
      persistent: true, // message will survive broker restarts
    });

    console.log(`Message published to queue: ${operation}`);
    return success;
  } catch (error) {
    console.error("Error publishing message to RabbitMQ:", error);
    throw error;
  }
}

module.exports = {
  publishMessage,
};
