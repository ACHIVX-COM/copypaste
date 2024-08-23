/**
 * @typedef {Object} ShinglesMixin
 * @prop {string[]} shingles
 */

/**
 * @typedef {import('./detector.js').PartialDocument & ShinglesMixin} PartialShingledDocument
 */

/**
 * @typedef {import('./detector.js').Document & ShinglesMixin} ShingledDocument
 */

/**
 * @typedef {Object} SimilarityLimits
 * @prop {number} relSimilarity minimal relative similarity
 * @prop {number} absSimilarity minimal absolute similarity
 */

/**
 * An object that stores a collection of text documents along with their shingled texts.
 * 
 * @abstract
 */
module.exports.CopypasteStore = class CopypasteStore {
  /**
   * Store the document to this storage.
   *
   * @param {ShingledDocument} doc 
   */
  async storeDocument(_doc) {
    throw new Error();
  }

  /**
   * Remove a document with given id from the storage.
   *
   * @param {string} _id document id
   * @returns {Promise<void>}
   */
  async deleteDocument(_id) {
    throw new Error();
  }

  /**
   * Extracts a document from the storage.
   * 
   * @param {string} _id 
   * @returns {import('./detector.js').Document?}
   */
  async getDocument(_id) {
    throw new Error();
  }

  /**
   * Find documents similar to the given document.
   * 
   * Returns similar documents in order of decreasing relative similarity.
   * 
   * @param {PartialShingledDocument} _doc 
   * @param {SimilarityLimits} _thresholds minimal similarity threshold to return documents with
   * @param {number} _limit max. documents to return. Must be > 0
   * @returns {AsyncIterable<import('./detector.js').SimilarDocument>}
   */
  async* findSimilar(_doc, _thresholds, _limit) {
    throw new Error();
  }
}
