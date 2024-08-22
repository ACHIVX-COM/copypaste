
/**
 * @typedef {Object} PartialDocument
 * @prop {string[]} textParts
 */

/**
 * @typedef {PartialDocument} Document
 * @prop {string} id
 * @prop {Record<string, string>} meta
 */

/**
 * @typedef {Object} SimilarDocument
 * @prop {number} absSimilarity
 * @prop {number} relSimilarity
 * @prop {string} id
 */

class DocumentNotFoundError extends Error {
  constructor(id) {
    super(`Document "${id}" not found`);
    this.id = id;
  }
}

class CopypasteDetector {

  /**
   * Add document to storage.
   * 
   * @param {Document} doc 
   */
  async rememberDocument(doc) {

  }

  /**
   * Delete document with given id from storage.
   * 
   * @param {string} doc 
   */
  async forgetDocument(doc) {

  }

  /**
   * Get document content from storage.
   * 
   * @param {string} id 
   * @returns {Promise<Document>} the document
   * @throws {DocumentNotFoundError} if the document does not exist
   */
  async fetchDocument(id) {

  }

  /**
   * Search for documents similar to this one
   * 
   * @param {PartialDocument} doc the document to check
   * @param {number} similarLimit max. similar documents to return
   * @returns {AsyncIterable<SimilarDocument>}
   */
  async checkDocument(doc, similarLimit = 1) {

  }
}

