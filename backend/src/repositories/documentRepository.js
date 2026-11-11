function createDocumentRepository() {
  const documents = new Map();

  return {
    save(document) {
      documents.set(document.id, document);
      return document;
    },

    findAll() {
      return Array.from(documents.values());
    },

    findById(id) {
      return documents.get(id) || null;
    },
  };
}

module.exports = { createDocumentRepository };