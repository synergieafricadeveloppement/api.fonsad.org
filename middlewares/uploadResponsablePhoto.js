// backend/middlewares/uploadResponsablePhoto.js

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadDir = path.join(process.cwd(), 'uploads', 'responsables');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const ext = rawExt || '.jpg';
    const safeBase = `responsable-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new AppError('Seules les images sont autorisées pour la photo.', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadResponsablePhoto = (req, res, next) => {
  const handler = upload.single('photo');

  handler(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError('La photo du responsable dépasse la taille maximale de 5 MB.', 400)
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
        new AppError(err.message || 'Erreur lors du téléversement de la photo.', 400)
      );
    }

    return next(
      err instanceof AppError
        ? err
        : new AppError(err.message || 'Erreur lors du téléversement de la photo.', 400)
    );
  });
};

module.exports = uploadResponsablePhoto;