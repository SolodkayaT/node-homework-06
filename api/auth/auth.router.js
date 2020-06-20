const { Router } = require("express");
const router = Router();
const { upload, compressImage, createAvatar } = require("./upload.middlewares");
const authController = require("./auth.controller");

router.post(
  "/auth/register",
  authController.validateUser,
  authController.registerUser
);
router.post(
  "/auth/login",
  authController.validateUser,
  authController.loginUser
);

router.patch("/auth/logout", authController.authorize, authController.logOut);

router.get(
  "/users/current",
  authController.authorize,
  authController.getCurrentUser
);
router.patch(
  "/users/avatars",
  authController.authorize,
  upload.single("avatar"),
  compressImage,
  authController.validataUserAvatar,
  authController.changeImage
);

router.get("/auth/verify/:verificationToken", authController.verifyUser);

const authRouter = router;
module.exports = authRouter;
