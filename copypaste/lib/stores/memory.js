const assert = require("node:assert");
const { CopypasteStore } = require("../store");

/**
 * A CopypasteStore that stores documents in memory.
 *
 * It is not very efficient and fits mostly for small tasks, like searching for similarities among few dozens of small documents.
 */
module.exports.MemoryCopypasteStore = class MemoryCopypasteStore extends (
  CopypasteStore
) {
  #store;

  constructor() {
    this.#store = new Map();
  }

  /**
   * @inheritdoc
   */
  async storeDocument({ id, textParts, meta, shingles }) {
    this.#store.set(id, { textParts, meta, shingles });
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

        const unionSize = shinglesSet.size();
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
          if (relSimilarity < thresholds.relSimilarity) {
            return false;
          }
        }

        if (thresholds.absSimilarity > 0) {
          if (absSimilarity < thresholds.absSimilarity) {
            return false;
          }
        }
      })
      .sort((a, b) => b.relSimilarity - a.relSimilarity)
      .slice(0, limit);
  }
};
