const express = require("express");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

require("./utils/db");
require("./routes/index")(app);

app.use(errorHandler);

const port = process.env.PORT || 3000;
var server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = server;
