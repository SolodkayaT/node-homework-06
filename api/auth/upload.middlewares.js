const multer = require("multer");
const path = require("path");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const { promises: fsPromises } = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UNCOMPRESSED_IMAGES_FOLDER);
  },
  filename: function (req, file, cb) {
    const { ext } = path.parse(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
async function compressImage(req, res, next) {
  const { path: uncompressedFilePath, filename } = req.file || {};
  if (!uncompressedFilePath) {
    next();
  }
  const COMPRESSING_DESTINATION = process.env.COMPRESSING_IMAGES_FOLDER;
  const files = await imagemin([uncompressedFilePath], {
    destination: COMPRESSING_DESTINATION,
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
    ],
  });
  req.file.path = path.join(COMPRESSING_DESTINATION, filename);
  await fsPromises.unlink(uncompressedFilePath);
  next();
}

const upload = multer({ storage });
module.exports = { upload, compressImage };
