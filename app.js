const express = require("express");

// Database connection
require("./config/db");

// Express app config
const app = express();
const port = process.env.PORT;

// npm packages
const parser = require("body-parser");

// Middlewares and routes
const { authenticate } = require("./middleware/auth");
const usersRoute = require("./routes/usersRoute");
const postsRoute = require("./routes/postsRoute");

app.use(parser.json());
app.use("/api/user", usersRoute);
app.use("/api/post", postsRoute);

// Home page redirects to the wall feed if user is loggedin
app.get("/api", (req, res) => {
  res.json({ message: "Server is listening!" });
});

// Running app
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
