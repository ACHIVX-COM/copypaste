const assert = require("node:assert");
const { CopypasteStore } = require("../store");

/**
 * A CopypasteStore that stores documents in memory.
 *
 * It is not very efficient and fits mostly for small tasks, like searching for similarities among few dozens of small documents.
 * 
 * @augments CopypasteStore
 */
module.exports.MemoryCopypasteStore = class MemoryCopypasteStore extends (
  CopypasteStore
) {
  #store;

  constructor() {
    super();
    this.#store = new Map();
  }

  /**
   * @inheritdoc
   * @param {import("../store").ShingledDocument} doc
   */
  async storeDocument(doc) {
    const { id, textParts, meta, shingles } = doc;
    this.#store.set(id, { id, textParts, meta, shingles });
  }

  /**
   * @inheritdoc
   */
  async deleteDocument(id) {
    this.#store.delete(id);
  }

  /**
   * @inheritdoc
   */
  async getDocument(id) {
    const doc = this.#store.get(id);

    return doc
      ? {
          id: doc.id,
          textParts: doc.textParts,
          meta: doc.meta,
        }
      : null;
  }

  /**
   * @inheritdoc
   */
  findSimilar(doc, thresholds, limit) {
    assert.ok(
      Number.isInteger(limit) && limit > 0,
      "limit must be a positive integer",
    );

    return [...this.#store.values()]
      .map(({ id, textParts, meta, shingles }) => {
        const shinglesSet = new Set(doc.shingles);
        for (const shingle of shingles) {
          shinglesSet.add(shingle);
        }

        const unionSize = shinglesSet.size;
        const intersectionSize =
          doc.shingles.length + shingles.length - unionSize;
        const relSimilarity = intersectionSize / unionSize;

        return {
          id,
          textParts,
          meta,
          relSimilarity,
          absSimilarity: intersectionSize,
        };
      })
      .filter(({ relSimilarity, absSimilarity }) => {
        if (thresholds.relSimilarity > 0.0) {
          if (relSimilarity > thresholds.relSimilarity) {
            return true;
          }
        }

        if (thresholds.absSimilarity > 0) {
          if (absSimilarity > thresholds.absSimilarity) {
            return true;
          }
        }
      })
      .sort((a, b) => b.relSimilarity - a.relSimilarity)
      .slice(0, limit);
  }
};
