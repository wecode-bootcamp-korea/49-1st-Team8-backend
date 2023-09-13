const bcrypt = require("bcrypt");
const { DataSource } = require("typeorm");
const myDataSource = new DataSource({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const hello = async (req, res) => {
  try {
    return res.status(200).json({ message: "hello" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  hello,
};
