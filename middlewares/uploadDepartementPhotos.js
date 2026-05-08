// middlewares/uploadDepartementPhotos.js

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadDir = path.join(__dirname, '..', 'uploads', 'departements');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
];

const ALLOWED_EXTENSIONS = [
  '.png',
  '.jpeg',
  '.jpg',
  '.webp',
  '.gif',
  '.bmp',
];

function slugifyFileName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(originalExt) ? originalExt : '.jpg';

    const baseName = path.basename(file.originalname || 'departement', originalExt);
    const safeBaseName = slugifyFileName(baseName) || 'departement';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${safeBaseName}-${uniqueSuffix}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const mimetype = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mimetype);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeAllowed || isExtAllowed) {
    return cb(null, true);
  }

  return cb(
    new AppError(
      'Format de fichier non supporté. Formats autorisés: png, jpeg, jpg, webp, gif, bmp.',
      400
    )
  );
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 10,
  },
});

/**
 * On accepte :
 * - 1 photo du responsable: champ file "responsablePhoto"
 * - plusieurs photos de membres: champ file "membresPhotos"
 *
 * Le corps sera en multipart/form-data avec JSON dans des champs texte.
 */
const uploadDepartementPhotos = (req, res, next) => {
  const handler = upload.fields([
    { name: 'responsablePhoto', maxCount: 1 },
    { name: 'membresPhotos', maxCount: 20 },
  ]);

  handler(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            'Une des photos dépasse la taille maximale de 8 MB.',
            400
          )
        );
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(
            `Champ fichier inattendu : ${err.field || ''}.`,
            400
          )
        );
      }

      return next(
        new AppError(
          err.message || 'Erreur lors du téléversement des photos.',
          400
        )
      );
    }

    return next(
      err instanceof AppError
        ? err
        : new AppError(
            err.message || 'Erreur lors du téléversement des photos.',
            400
          )
    );
  });
};

module.exports = uploadDepartementPhotos;