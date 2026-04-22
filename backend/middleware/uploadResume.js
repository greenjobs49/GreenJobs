const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      //Sanitize filename with UUID to prevent traversal/character bugs
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `resumes/${Date.now()}-${uuidv4()}${ext}`;
      cb(null, safeName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF/DOC/DOCX allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;