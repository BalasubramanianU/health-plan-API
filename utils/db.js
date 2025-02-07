const redis = require("redis");

const redisClient = redis.createClient();

(async () => {
  await redisClient.connect();
})();

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = redisClient;
