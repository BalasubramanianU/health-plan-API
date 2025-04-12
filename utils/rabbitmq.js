const amqp = require("amqplib");
const config = {
  RABBITMQ_URL: "amqp://localhost",
  QUEUE_NAME: "JSON_OPERATIONS_QUEUE",
};

let channel = null;
let connection = null;

// Connect to RabbitMQ and create a channel
async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Make sure the queue exists
    await channel.assertQueue(config.QUEUE_NAME, {
      durable: true, // queue will survive broker restarts
    });

    console.log("Successfully connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
}

// Get the channel (create one if it doesn't exist)
async function getChannel() {
  if (!channel) {
    await connectRabbitMQ();
  }
  return channel;
}

// Close the connection
async function closeConnection() {
  if (connection) {
    await connection.close();
    channel = null;
    connection = null;
  }
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  closeConnection,
  config,
};
