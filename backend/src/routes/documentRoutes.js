const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');

function createDocumentRouter({ controller, storageDirectory, maxFileSize }) {
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, storageDirectory);
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
  });

  function uploadSingleFile(req, res, next) {
    upload.single('file')(req, res, (error) => {
      const multipartParseErrors = [
        'Multipart: Boundary not found',
        'Unexpected end of form',
        'Unexpected end of file',
      ];

      if (
        error
        && !(error instanceof multer.MulterError)
        && multipartParseErrors.includes(error.message)
      ) {
        error.isMultipartParsingError = true;
      }

      next(error);
    });
  }

  const router = express.Router();
  router.post('/upload', uploadSingleFile, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };