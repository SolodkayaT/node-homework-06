const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { ObjectId } = Types;

const contactShema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
});

contactShema.statics.createContact = createContact;
contactShema.statics.findAllContacts = findAllContacts;
contactShema.statics.findContactById = findContactById;
contactShema.statics.updateContactById = updateContactById;
contactShema.statics.deleteContactById = deleteContactById;

async function createContact(contactParams) {
  return this.create(contactParams);
}
async function findAllContacts() {
  return this.find();
}
async function findContactById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findById(id);
}
async function updateContactById(id, contactParams) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findOneAndUpdate(id, { $set: contactParams }, { new: true });
}
async function deleteContactById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return this.findByIdAndDelete(id);
}

const contactModel = mongoose.model("Contact", contactShema);

module.exports = contactModel;
