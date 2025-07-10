import multer from "multer";

// 1. Define how files should be stored
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname); // Use original file name
  },
});

// 2. Create upload middleware using the storage settings
const upload = multer({ storage });

// 3. Export it so it can be used in routes or controllers
export default upload;
