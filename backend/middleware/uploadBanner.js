const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const uploadBanner = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `banners/navbar-banner-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
      cb(null, fileName);
    },
  }),

  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed (PNG, JPEG, JPG, WEBP, GIF)"));
    }
  },

  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — banners can be slightly larger
});

module.exports = uploadBanner;