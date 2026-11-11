const path = require('node:path');

function createDocumentService(documentRepository) {
  function toPublicDocument(document) {
    const { id, originalName, size, uploadedAt, owner } = document;
    return { id, originalName, size, uploadedAt, owner };
  }

  return {
    createDocument(file) {
      const originalName = path.posix.basename(file.originalname.replace(/\\/g, '/')) || 'document';
      const document = {
        id: file.filename,
        originalName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: 'anonymous',
        filePath: file.path,
      };

      documentRepository.save(document);
      return toPublicDocument(document);
    },

    listDocuments() {
      return documentRepository.findAll().map(toPublicDocument);
    },

    findDocumentForDownload(id) {
      const document = documentRepository.findById(id);
      if (!document) {
        return null;
      }

      return {
        ...toPublicDocument(document),
        filePath: document.filePath,
      };
    },
  };
}

module.exports = { createDocumentService };