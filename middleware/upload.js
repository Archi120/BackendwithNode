const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/profile_pictures',
    'uploads/id_documents',
    'uploads/posts',
    'uploads/id_proofs'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    // Determine upload path based on fieldname
    switch (file.fieldname) {
      case 'profile_picture':
        uploadPath += 'profile_pictures/';
        break;
      case 'id_proof':
        uploadPath += 'id_documents/';
        break;
      case 'image':
        uploadPath += 'posts/';
        break;
      default:
        uploadPath += 'misc/';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'profile_picture': /jpeg|jpg|png/,
    'id_proof': /jpeg|jpg|png|pdf/,
    'media': /jpeg|jpg|png|gif/
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = allowedTypes[file.fieldname] || /jpeg|jpg|png/;

  if (allowedExt.test(ext.substring(1))) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExt.source}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Export configured multer instance
module.exports = upload;