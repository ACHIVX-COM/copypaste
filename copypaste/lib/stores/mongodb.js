const assert = require("node:assert");
const { Db, Collection } = require("mongodb");
const { CopypasteStore } = require("../store");

/**
 * A CopypasteStore that uses a Mongodb collection to store the documents.
 *
 * It also uses a fulltext search index to efficiently find potentially similar documents.
 */
module.exports.MongodbCopypasteStore = class MongodbCopypasteStore extends (
  CopypasteStore
) {
  #db;
  #collectionsPrefix;
  #collectionsPromise;

  constructor(db, collectionsPrefix = "copypaste") {
    assert.ok(db instanceof Db, "db must be a mongodb database");

    this.#db = db;
    this.#collectionsPrefix = collectionsPrefix;

    this.#collectionsPromise = this.#createCollections();
    this.#collectionsPromise.then((err) =>
      console.error(
        `Error creating collections for copypaste storage with prefix ${collectionsPrefix}:`,
        err,
      ),
    );
  }

  async #createCollections() {
    const docs = await this.#db.createCollection(
      `${this.#collectionsPrefix}.documents`,
    );
    docs.createIndex(
      { shingles: "text" },
      { background: true, name: "shingles_text" },
    );
    docs.createIndex({ id: 1 }, { unique: true, background: true, name: "id" });

    return { docs };
  }

  /**
   * @inheritdoc
   */
  async storeDocument(doc) {
    const { docs } = await this.#collectionsPromise;

    const { id, meta, textParts, shingles } = doc;

    await docs.updateOne(
      { id },
      { $set: { id, meta, textParts, shingles } },
      { upsert: true },
    );
  }

  /**
   * @inheritdoc
   */
  async deleteDocument(id) {
    const { docs } = await this.#collectionsPromise;

    await docs.deleteOne({ id });
  }

  /**
   * @inheritdoc
   */
  async getDocument(id) {
    const { docs } = await this.#collectionsPromise;

    const doc = await docs.findOne(
      { id },
      { projection: { meta: 1, textParts: 1 } },
    );

    return doc ? { id, ...doc } : null;
  }

  /**
   * @inheritdoc
   */
  async *findSimilar(doc, thresholds, limit) {
    const { docs } = await this.#collectionsPromise;

    const c = docs.aggregate([
      // First just roughly drop all documents that have no intersecting shingles
      // with the tested one
      {
        $match: {
          $text: { $search: doc.shingles.join(" ") },
          id: { $ne: doc.id },
        },
      },
      // Then compute | T & S | / | T u S | (where T is set of shingles of tested
      // text, S - set of shingles of a text stored in DB, X & Y is intersection
      // of sets X and Y, X u Y is union of sets X and Y, | X | is size of finite
      // set X)
      {
        $addFields: {
          // intersectionSize = | T & S |
          intersectionSize: {
            $size: {
              $setIntersection: ["$shingles", doc.shingles],
            },
          },
          // storedSize = | S |
          storedSize: {
            $size: "$shingles",
          },
        },
      },
      {
        $addFields: {
          // unionSize = | T u S | = | T | + | S | - | T & S |
          unionSize: {
            $subtract: [
              {
                $add: ["$storedSize", doc.shingles.length],
              },
              "$intersectionSize",
            ],
          },
        },
      },
      {
        $addFields: {
          similarity: {
            $divide: ["$intersectionSize", "$unionSize"],
          },
        },
      },
      {
        $match: {
          $or: [
            ...(thresholds.relSimilarity > 0.0
              ? [
                  {
                    similarity: {
                      $gt: thresholds.relSimilarity,
                    },
                  },
                ]
              : []),
            ...(thresholds.absSimilarity > 0
              ? [
                  {
                    intersectionSize: {
                      $gt: thresholds.absSimilarity,
                    },
                  },
                ]
              : []),
          ],
        },
      },
      {
        $sort: {
          similarity: -1,
        },
      },
      { $limit: limit },
      {
        $project: {
          similarity: 1,
          intersectionSize: 1,
          id: 1,
        },
      },
    ]);

    for await (const {
      id,
      similarity: relSimilarity,
      intersectionSize: absSimilarity,
    } of c) {
      yield { id, relSimilarity, absSimilarity };
    }
  }
};
