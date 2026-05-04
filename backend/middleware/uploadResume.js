const multer    = require("multer");
const multerS3  = require("multer-s3");
const s3        = require("../config/s3");
const path      = require("path");
const { v4: uuidv4 } = require("uuid");

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MIME_TO_EXT = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const CONTENT_DISPOSITION = {
  "application/pdf":   "inline",   
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "attachment", 
};

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,

    contentType: (_req, file, cb) => cb(null, file.mimetype),

    key: (_req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] || path.extname(file.originalname).toLowerCase();
      cb(null, `resumes/${Date.now()}-${uuidv4()}${ext}`);
    },
    //    Content-Disposition:inline makes PDFs open in-tab instead of downloading
    metadata: (_req, file, cb) => {
      cb(null, {
        "Content-Disposition": CONTENT_DISPOSITION[file.mimetype] || "attachment",
        "Content-Type":        file.mimetype,
        fieldName:             file.fieldname,
      });
    },
  }),

  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF and DOCX files are accepted"));
  },

  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;