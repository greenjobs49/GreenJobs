const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const uploadBlogImage = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `blogs/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") &&
      ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed (PNG, JPEG, JPG, WEBP)"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = uploadBlogImage;