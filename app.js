const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
require("dotenv").config();
const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());
const userService = require("./src/services/userService.js");

app.get("/", userService.hello);
app.get("/ping", async (req, res) => {
  try {
    return res.status(200).json({ message: "pong" });
  } catch (error) {
    console.log(error);
  }
});

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8000, () => console.log(`Server is listening on 8000`));
  } catch (err) {
    console.error(err);
  }
};

start();
