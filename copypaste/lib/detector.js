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

const TextTooShortError =
  (module.exports.TextTooShortError = class TextTooShortError extends Error {
    constructor() {
      super("Text is too short");
    }
  });

/**
 * @typedef {Object} DetectorParameters
 * @prop {import('./store').CopypasteStore} store
 * @prop {import('./store').SimilarityThresholds} thresholds
 * @prop {Preprocessor} preprocessor
 */

module.exports.CopypasteDetector = class CopypasteDetector {
  #store;
  #thresholds;
  #preprocessor;

  /**
   * @param {DetectorParameters} parameters
   */
  constructor({
    store,
    thresholds = { absSimilarity: -1, relSimilarity: 0.5 },
    preprocessor,
  }) {
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

    if (shingles?.length < 1) {
      throw new TextTooShortError();
    }

    return { id, meta, textParts, shingles };
  }

  /**
   * Add document to storage.
   *
   * @param {Document} doc
   * @throws {TextTooShortError}
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
   * @throws {TextTooShortError} if text of the given document is too short
   */
  async *checkDocument(doc, similarLimit = 1) {
    yield* this.#store.findSimilar(
      await this.#preprocessDocument(doc),
      this.#thresholds,
      similarLimit,
    );
  }
};
