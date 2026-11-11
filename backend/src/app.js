const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentController } = require('./controllers/documentController');
const { createDocumentRouter } = require('./routes/documentRoutes');

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_STORAGE_DIRECTORY = path.resolve(__dirname, '../storage');

function resolveMaxFileSize(configuredMaxFileSize) {
  if (configuredMaxFileSize !== undefined) {
    if (!Number.isSafeInteger(configuredMaxFileSize) || configuredMaxFileSize < 1) {
      throw new Error('O limite de upload deve ser um inteiro positivo.');
    }

    return configuredMaxFileSize;
  }

  const environmentValue = process.env.DMS_MAX_FILE_SIZE;
  if (environmentValue === undefined) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  const maxFileSize = Number(environmentValue);
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize < 1) {
    throw new Error('DMS_MAX_FILE_SIZE deve ser um inteiro positivo em bytes.');
  }

  return maxFileSize;
}

function createApp({ storageDirectory = DEFAULT_STORAGE_DIRECTORY, maxFileSize } = {}) {
  const resolvedStorageDirectory = path.resolve(storageDirectory);
  fs.mkdirSync(resolvedStorageDirectory, { recursive: true });

  const documentRepository = createDocumentRepository();
  const documentService = createDocumentService(documentRepository);
  const documentController = createDocumentController(documentService);
  const documentRouter = createDocumentRouter({
    controller: documentController,
    storageDirectory: resolvedStorageDirectory,
    maxFileSize: resolveMaxFileSize(maxFileSize),
  });

  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(documentRouter);

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'O arquivo excede o limite permitido.',
          },
        });
      }

      return res.status(400).json({
        error: {
          code: 'INVALID_UPLOAD',
          message: 'Não foi possível processar o arquivo enviado.',
        },
      });
    }

    if (error.isMultipartParsingError) {
      return res.status(400).json({
        error: {
          code: 'INVALID_UPLOAD',
          message: 'A requisição multipart está malformada.',
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno.',
      },
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
