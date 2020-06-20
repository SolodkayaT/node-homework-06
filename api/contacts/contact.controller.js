const contactModel = require("./contact.model");
const Joi = require("joi");
const createControllerProxy = require("../helpers/controllerProxy");

class ContactController {
  async addContact(req, res, next) {
    try {
      const newContact = await contactModel.createContact(req.body);
      return res.status(201).send(newContact);
    } catch (error) {
      next(error);
    }
  }

  async listContacts(req, res, next) {
    const contacts = await contactModel.findAllContacts();
    return res.status(200).json(contacts);
  }

  async getContact(req, res, next) {
    try {
      const targetContact = await this.getContactById(req.params.id);
      if (!targetContact) {
        return res.status(404).send({ message: "Not found" });
      }
      return res.status(200).send(targetContact);
    } catch (error) {
      next(error);
    }
  }

  async updateContact(req, res, next) {
    try {
      const targetContact = await this.getContactById(req.params.id);
      if (!targetContact) {
        return res.status(404).send({ message: "Not found" });
      }
      const updatedContact = await contactModel.updateContactById(
        req.params.id,
        req.body
      );
      return res.status(200).json(updatedContact);
    } catch (error) {
      next(error);
    }
  }

  async removeContact(req, res, next) {
    try {
      const contactFound = await this.getContactById(req.params.id);
      if (!contactFound) {
        return res.status(404).send({ message: "Not found" });
      }
      await contactModel.deleteContactById(req.params.id);
      return res.status(200).send({ message: "Contact deleted" });
    } catch (error) {
      next(error);
    }
  }
  validateCreateContact(req, res, next) {
    const createContactRules = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
    });

    const result = Joi.validate(req.body, createContactRules);

    if (result.error) {
      return res.status(400).send({ message: `${result.error.message}` });
    }
    next();
  }

  validateUpdateContact(req, res, next) {
    const updateContactRules = Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
    });

    const requestBodyLength = Object.keys(req.body).length;
    const result = Joi.validate(req.body, updateContactRules);

    if (requestBodyLength === 0) {
      return res.status(400).send({ message: "missing fields" });
    }
    if (result.error) {
      return res.status(400).send({ message: result.error.message });
    }
    next();
  }

  async getContactById(contactId) {
    const contactFound = await contactModel.findContactById(contactId);

    return contactFound;
  }
}

module.exports = createControllerProxy(new ContactController());
