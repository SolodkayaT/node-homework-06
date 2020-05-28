const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const ContactsServer = require("./server");

new ContactsServer().start();
