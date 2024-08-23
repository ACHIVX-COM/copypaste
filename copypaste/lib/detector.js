const assert = require("node:assert");

/**
 * @typedef {object} IdMixin
 * @prop {string} id
 */

/**
 * @typedef {object} PartialDocument
 * @prop {Record<string, string>} meta
 * @prop {string[]} textParts
 */

/**
 * @typedef {PartialDocument & IdMixin} Document
 */

/**
 * @typedef {Object} SimilarDocument
 * @prop {number} absSimilarity
 * @prop {number} relSimilarity
 * @prop {string} id
 */

/**
 * @callback Preprocessor
 * @param {string[]} textParts
 * @param {Record<string, string>} meta
 * @returns {Promise<string[]>} processed text
 */

const DocumentNotFoundError =
  (module.exports.DocumentNotFoundError = class DocumentNotFoundError extends (
    Error
  ) {
    /**
     * @param {string} id
     */
    constructor(id) {
      super(`Document "${id}" not found`);
      this.id = id;
    }
  });

module.exports.CopypasteDetector = class CopypasteDetector {
  #store;
  #thresholds;
  #preprocessor;

  /**
   * @param {import('./store').CopypasteStore} store
   * @param {import('./store').SimilarityLimits} thresholds
   * @param {Preprocessor} preprocessor
   */
  constructor(store, thresholds, preprocessor) {
    assert.ok(
      thresholds.absSimilarity > 0 ||
        (thresholds.relSimilarity > 0.0 && thresholds.relSimilarity < 1.0),
    );

    this.#store = store;
    this.#thresholds = thresholds;
    this.#preprocessor = preprocessor;
  }

  /**
   * @param {Document | PartialDocument} doc
   * @returns {import('./store').ShingledDocument | import('./store').PartialShingledDocument}
   */
  async #preprocessDocument(doc) {
    const { id, meta, textParts } = doc;
    const shingles = await this.#preprocessor(textParts, meta);

    return { id, meta, textParts, shingles };
  }

  /**
   * Add document to storage.
   *
   * @param {Document} doc
   */
  async rememberDocument(doc) {
    await this.#store.storeDocument(await this.#preprocessDocument(doc));
  }

  /**
   * Delete document with given id from storage.
   *
   * @param {string} id
   */
  async forgetDocument(id) {
    await this.#store.deleteDocument(id);
  }

  /**
   * Get document content from storage.
   *
   * @param {string} id
   * @returns {Promise<Document>} the document
   * @throws {DocumentNotFoundError} if the document does not exist
   */
  async fetchDocument(id) {
    const doc = await this.#store.getDocument(id);

    if (!doc) {
      throw new DocumentNotFoundError(id);
    }

    return doc;
  }

  /**
   * Search for documents similar to this one
   *
   * @param {PartialDocument} doc the document to check
   * @param {number} similarLimit max. similar documents to return
   * @returns {AsyncIterable<SimilarDocument>}
   */
  async *checkDocument(doc, similarLimit = 1) {
    yield* this.#store.findSimilar(
      await this.#preprocessDocument(doc),
      this.#thresholds,
      similarLimit,
    );
  }
};
