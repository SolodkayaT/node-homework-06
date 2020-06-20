const express = require("express");
const cors = require("cors");
var morgan = require("morgan");

const mongoose = require("mongoose");
const contactRouter = require("./contacts/contact.router");
const authRouter = require("./auth/auth.router");
require("dotenv").config();

module.exports = class ContactsServer {
  constructor() {
    this.server = null;
  }
  async start() {
    this.initServer();
    this.initMiddlewares();
    this.initRoutes();
    this.handleErrors();
    await this.initDataBase();
    this.startListening();
  }

  initServer() {
    this.server = express();
  }

  initMiddlewares() {
    this.server.use(express.json());
    this.server.use(cors({ origin: "http://localhost:3000" }));
    this.server.use(morgan("tiny"));
    this.server.use(express.static(process.env.STATIC_FILES_PATH));
  }

  initRoutes() {
    this.server.use("/api", authRouter, contactRouter);
  }
  handleErrors() {
    this.server.use((err, req, res, next) => {
      delete err.stack;
      const statuseCode = err.status || 500;
      next(err);
      return res.status(statuseCode).send(err.message);
    });
  }
  async initDataBase() {
    try {
      await mongoose.connect(process.env.MONGO_DB_URL, {
        useFindAndModify: false,
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });
      console.log("Database connection successful");
    } catch (err) {
      console.log("MongoDB connection error", err);
      process.exit(1);
    }
  }
  startListening() {
    this.server.listen(process.env.PORT, () => {
      console.log("Server start listening on port", process.env.PORT);
    });
  }
};
