const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10);

/**
 * Allowed MIME types by upload type
 */
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  any: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

/**
 * Create storage engine for a specific folder
 */
const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(UPLOAD_DIR, folder);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const randomName = crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}-${randomName}${ext}`);
    },
  });

/**
 * File filter factory
 */
const createFileFilter = (types = 'any') =>
  (req, file, cb) => {
    const allowed = ALLOWED_TYPES[types] || ALLOWED_TYPES.any;
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
  };

// Profile image upload
const uploadProfile = multer({
  storage: createStorage('profiles'),
  fileFilter: createFileFilter('image'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Company documents upload
const uploadCompanyDocs = multer({
  storage: createStorage('company-docs'),
  fileFilter: createFileFilter('document'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// Moving request photos
const uploadRequestPhotos = multer({
  storage: createStorage('request-photos'),
  fileFilter: createFileFilter('image'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// Quote attachments
const uploadQuoteAttachments = multer({
  storage: createStorage('quote-attachments'),
  fileFilter: createFileFilter('document'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// Message attachments
const uploadMessageAttachments = multer({
  storage: createStorage('messages'),
  fileFilter: createFileFilter('any'),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

module.exports = {
  uploadProfile,
  uploadCompanyDocs,
  uploadRequestPhotos,
  uploadQuoteAttachments,
  uploadMessageAttachments,
};

