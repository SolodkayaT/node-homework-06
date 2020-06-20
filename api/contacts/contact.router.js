const { Router } = require("express");
const ContactController = require("./contact.controller");
const contactRouter = Router();

contactRouter.get("/contacts", ContactController.listContacts);
contactRouter.get("/contacts/:id", ContactController.getContact);

contactRouter.post(
  "/contacts/",
  ContactController.validateCreateContact,
  ContactController.addContact
);

contactRouter.patch(
  "/contacts/:id",
  ContactController.validateUpdateContact,
  ContactController.updateContact
);

contactRouter.delete("/contacts/:id", ContactController.removeContact);

module.exports = contactRouter;
