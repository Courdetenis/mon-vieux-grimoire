const multer = require("multer");
const sharp = require('sharp');
const fs = require('fs');

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_");
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + "." + extension);
  },
});

const upload = multer({ storage: storage }).single('image');

const resizeImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  const fileName = req.file.filename;

  sharp(filePath)
    .resize(800, 600, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer()
    .then(buffer => {
      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error('Error resizing image:', err);
        }
        next();
      });
    })
    .catch(error => {
      console.error('Error processing image:', error);
      next();
    });
};

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      resizeImage(req, res, next);
    }
  });
};
