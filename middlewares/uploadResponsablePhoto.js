const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

// Dossier uploads/responsables à la racine backend
const uploadDir = path.join(__dirname, '..', 'uploads', 'responsables');

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
    const safeExt = ALLOWED_EXTENSIONS.includes(originalExt)
      ? originalExt
      : '.jpg';

    const baseName = path.basename(
      file.originalname || 'responsable',
      originalExt
    );
    const safeBaseName = slugifyFileName(baseName) || 'responsable';
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
    files: 1,
  },
});

const uploadResponsablePhoto = (req, res, next) => {
  const handler = upload.single('photo');

  handler(req, res, (err) => {
    if (!err) return next();

    // Erreurs Multer
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            'La photo du responsable dépasse la taille maximale de 8 MB.',
            400
          )
        );
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(
            `Champ fichier inattendu : ${err.field || 'photo'}. Utilisez le champ "photo".`,
            400
          )
        );
      }

      return next(
        new AppError(
          err.message || 'Erreur lors du téléversement de la photo.',
          400
        )
      );
    }

    // Autre erreur
    return next(
      err instanceof AppError
        ? err
        : new AppError(
            err.message || 'Erreur lors du téléversement de la photo.',
            400
          )
    );
  });
};

module.exports = uploadResponsablePhoto;