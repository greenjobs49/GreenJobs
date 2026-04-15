const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];

const uploadImage = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req,file,cb)=>{
      const folder =
        req.path.includes("logo") ? "logos" : "business";

      cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    }
  }),

  fileFilter:(req,file,cb)=>{
    if(allowedTypes.includes(file.mimetype)){
      cb(null,true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },

  limits:{ fileSize:5*1024*1024 }
});

module.exports = uploadImage;
