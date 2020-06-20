const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { ObjectId } = Types;
const { v4: uuidv4 } = require("uuid");

const userShema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarURL: { type: String },
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
  },
  token: { type: String },
  verificationToken: { type: String },
});

userShema.statics.createUser = createUser;
userShema.statics.findAllUsers = findAllUsers;
userShema.statics.findUsertById = findUsertById;
userShema.statics.updateUserById = updateUserById;
userShema.statics.deleteUserById = deleteUserById;
userShema.statics.findUserByEmail = findUserByEmail;
userShema.statics.findUserByToken = findUserByToken;
userShema.statics.findUserByVerificationToken = findUserByVerificationToken;
userShema.statics.verifyUser = verifyUser;

async function createUser(userParams) {
  userParams.verificationToken = uuidv4();
  return this.create(userParams);
}
async function findAllUsers() {
  return this.find();
}
async function findUsertById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findById(id);
}
async function updateUserById(id, userParams) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findOneAndUpdate(
    { _id: id },
    { $set: userParams },
    { new: true }
  );
}
async function deleteUserById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findByIdAndDelete(id);
}

async function findUserByEmail(email) {
  return this.findOne({ email });
}

async function findUserByToken(token) {
  return this.findOne({ token });
}
async function findUserByVerificationToken(verificationToken) {
  return this.findOne({ verificationToken });
}
async function verifyUser(verificationToken) {
  return this.updateOne(
    { verificationToken },
    { $set: { verificationToken: null } }
  );
}
const authModel = mongoose.model("Users", userShema);

module.exports = authModel;
