// const { Db } = require("mongodb");
const { CopypasteStore } = require("../store");

/**
 * A CopypasteStore that uses a Mongodb collection to store the documents.
 *
 * It also uses a fulltext search index to efficiently find potentially similar documents.
 */
module.exports.MongodbCopypasteStore = class MongodbCopypasteStore extends (
  CopypasteStore
) {
  // TODO.
};
