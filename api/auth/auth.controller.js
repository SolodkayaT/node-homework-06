const Joi = require("joi");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { promises: fsPromises } = require("fs");
const createControllerProxy = require("../helpers/controllerProxy");
const authModel = require("./auth.model");
const ConflictError = require("../helpers/error.constructor");
const Unauthorized = require("../helpers/error.constructor");
var randomAvatar = require("random-avatar");
const download = require("image-downloader");
const sgMail = require("@sendgrid/mail");

class AuthController {
  constructor() {
    this._saltRounds = 5;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  async registerUser(req, res, next) {
    try {
      const { email, password } = req.body;
      const existingUser = await authModel.findUserByEmail(email);
      if (existingUser) {
        throw new ConflictError("Email in use");
      }
      const hashedPassword = await this.hashPassword(password);

      const avatarImageUrl = await this.createAvatar(email);
      await this.downloadAvatar(avatarImageUrl);
      const stringToReplaceFromImageUrl = "https://www.gravatar.com/avatar/";
      const avatarImageName = avatarImageUrl.replace(
        stringToReplaceFromImageUrl,
        ""
      );

      const avatarURL = `${process.env.SERVER_URL}/${process.env.COMPRESSING_IMAGES_BASE_URL}/${avatarImageName}`;

      const createdUser = await authModel.createUser({
        ...req.body,
        avatarURL,
        password: hashedPassword,
      });
      const token = this.createToken(createdUser._id);
      await authModel.updateUserById(createdUser._id, { token });
      this.sendVerificationEmail(createdUser);
      return res.status(201).json({
        user: this.composeUserForResponse(createdUser),
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;
      const existingUser = await authModel.findUserByEmail(email);
      if (!existingUser) {
        throw new Unauthorized("Email is wrong");
      }
      const isPasswordCorrect = await this.comparePasswordHash(
        password,
        existingUser.password
      );
      if (!isPasswordCorrect) {
        throw new Unauthorized("Password is wrong");
      }
      const token = this.createToken(existingUser._id);

      await authModel.updateUserById(existingUser._id, { token });
      return res.status(200).json({
        user: this.composeUserForResponse(existingUser),
        token,
      });
    } catch (err) {
      next(err);
    }
  }
  async authorize(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer", "").trim();
      console.log(token);
      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        throw new Unauthorized("User is not authorized");
      }

      const user = await authModel.findUserByToken(token);
      if (!user) {
        throw new Unauthorized("Token is not valid");
      }
      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      next(err);
    }
  }

  async logOut(req, res, next) {
    try {
      await authModel.updateUserById(req.user._id, { token: null });
      return res.status(204).json();
    } catch (err) {
      next(err);
    }
  }
  async verifyUser(req, res, next) {
    try {
      const { verificationToken } = req.params;
      const userToVerify = await authModel.findUserByVerificationToken(
        verificationToken
      );
      if (!userToVerify) {
        throw new Unauthorized("Not found");
      }
      await authModel.verifyUser(verificationToken);
      return res.status(200).send("User successfully verified");
    } catch (err) {
      next(err);
    }
  }
  async getCurrentUser(req, res, next) {
    try {
      return res.status(200).json({
        email: req.user.email,
        subscription: req.user.subscription,
        avatar: req.user.avatarURL,
      });
    } catch (err) {
      throw new Unauthorized("Not authorized");
    }
  }
  async changeImage(req, res, next) {
    try {
      await authModel.updateUserById(req.user._id, { avatarURL: req.avatar });
      return res.status(200).json({ avatarURL: req.user.avatarURL });
    } catch (err) {
      next(err);
    }
  }
  async validateUser(req, res, next) {
    const userRules = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    const result = Joi.validate(req.body, userRules);

    if (result.error) {
      return res.status(400).send({ message: `${result.error.message}` });
    }
    next();
  }
  async validataUserAvatar(req, res, next) {
    const hasAvatarFile = req.file && req.file.fieldname === "avatar";
    if (!hasAvatarFile) {
      return res.status(400).send({ message: `Avatar file was not provided` });
    }
    next();
  }

  async createAvatar(email) {
    return randomAvatar({
      extension: "jpg",
      protocol: "https",
      email,
    });
  }
  async downloadAvatar(url) {
    const options = {
      url,
      dest: process.env.COMPRESSING_IMAGES_FOLDER,
    };
    download
      .image(options)
      .then(({ filename }) => {
        console.log("Saved to", filename);
      })
      .catch((err) => console.error(err));
  }

  async hashPassword(password) {
    return bcryptjs.hash(password, this._saltRounds);
  }

  async comparePasswordHash(password, passwordHash) {
    return bcryptjs.compare(password, passwordHash);
  }
  async sendVerificationEmail(user) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const verificationLink = `${process.env.SERVER_URL}/api/auth/verify/${user.verificationToken}`;
      await sgMail.send({
        to: user.email,
        from: process.env.SENDER_EMAIL,
        subject: "Please, verify your email",
        html: `<a href="${verificationLink}">Click to verify your email</a>`,
      });
    } catch (err) {
      console.log(err);
    }
  }
  createToken(uid) {
    return jwt.sign({ uid }, process.env.JWT_SECRET);
  }

  composeUserForResponse(user) {
    return {
      id: user._id,
      email: user.email,
      subscription: user.subscription,
    };
  }
}
module.exports = createControllerProxy(new AuthController());
