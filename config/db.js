// File for configuring database connections
const mongoose = require("mongoose");
require("dotenv/config");

mongoose.connect(process.env.DB_CONNECTOR, () => {
  console.log("Connection to database has been established!");
});
