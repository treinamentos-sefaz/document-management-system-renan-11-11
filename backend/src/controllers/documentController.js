const path = require('node:path');

function errorResponse(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function safeDownloadName(originalName) {
  const basename = path.posix.basename(originalName.replace(/\\/g, '/'));
  const safeName = basename.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return safeName || 'document';
}

function createDocumentController(documentService) {
  return {
    upload(req, res, next) {
      if (!req.file) {
        return errorResponse(res, 400, 'INVALID_UPLOAD', 'Envie um arquivo no campo "file".');
      }

      try {
        const document = documentService.createDocument(req.file);
        return res.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.status(200).json({ documents: documentService.listDocuments() });
      } catch (error) {
        return next(error);
      }
    },

    download(req, res, next) {
      const document = documentService.findDocumentForDownload(req.params.id);
      if (!document) {
        return errorResponse(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

        res.type('application/octet-stream');
        res.set('X-Content-Type-Options', 'nosniff');

        return res.download(document.filePath, safeDownloadName(document.originalName), (error) => {
        if (!error) {
          return;
        }

        if (res.headersSent) {
          return next(error);
        }

        if (error.code === 'ENOENT') {
          return errorResponse(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
        }

        return next(error);
      });
    },
  };
}

module.exports = { createDocumentController };