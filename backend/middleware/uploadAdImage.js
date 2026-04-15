// middleware/uploadAdImage.js
const multer    = require("multer");
const multerS3  = require("multer-s3");
const s3        = require("../config/s3");

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const uploadAdImage = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const filename = `ads/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, png, webp) are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = uploadAdImage;