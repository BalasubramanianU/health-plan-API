const express = require("express");
const errorHandler = require("./middlewares/errorHandler");
const { connectRabbitMQ } = require("./utils/rabbitmq");
const { startConsumer } = require("./utils/consumer");
const { connectElasticsearch } = require("./utils/elasticSearch");

const app = express();

// Initialize redis database connection
require("./utils/db");

// Initialize RabbitMQ connection
connectRabbitMQ()
  .then(() => {
    console.log("RabbitMQ connection established");
    startConsumer();
  })
  .catch((err) => {
    console.error("Failed to connect to RabbitMQ:", err);
    // process.exit(1);
  });

connectElasticsearch()
  .then(() => {
    console.log("Elasticsearch connection established");
  })
  .catch((err) => {
    console.error("Failed to connect to Elasticsearch:", err);
    // process.exit(1);
  });

// Set up routes for listening to JSON operations
require("./routes/index")(app);

app.use(errorHandler);

const port = process.env.PORT || 3000;
var server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = server;
