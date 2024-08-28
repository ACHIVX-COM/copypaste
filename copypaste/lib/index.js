const { CopypasteDetector, DocumentNotFoundError } = require("./detector");
const { CopypasteStore } = require("./store");
const { MemoryCopypasteStore } = require("./stores/memory");
const { MongodbCopypasteStore } = require("./stores/mongodb");
const { composePreprocessors } = require("./preprocessors/compose");
const { createShingles } = require("./preprocessors/createShingles");
const {
  removeStopWords,
  stem,
  tokenize,
} = require("./preprocessors/english-wink");

module.exports.CopypasteDetector = CopypasteDetector;
module.exports.DocumentNotFoundError = DocumentNotFoundError;

module.exports.CopypasteStore = CopypasteStore;
module.exports.MemoryCopypasteStore = MemoryCopypasteStore;

module.exports.MongodbCopypasteStore = MongodbCopypasteStore;

module.exports.preprocessors = {};
module.exports.preprocessors.composePreprocessors = composePreprocessors;
module.exports.preprocessors.compose = composePreprocessors;
module.exports.preprocessors.createShingles = createShingles;
module.exports.preprocessors.removeStopWords = removeStopWords;
module.exports.preprocessors.stem = stem;
module.exports.preprocessors.tokenize = tokenize;
