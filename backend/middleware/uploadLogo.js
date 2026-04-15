const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const uploadLogo = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      const fileName = `logos/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    }
  }),

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") &&
      ["image/png","image/jpeg","image/jpg","image/webp"].includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },

  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = uploadLogo;
