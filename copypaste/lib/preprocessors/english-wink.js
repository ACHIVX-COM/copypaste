const defaultStopWords = require("wink-nlp-utils/src/dictionaries/stop_words.json");
const nlpUtils = require("wink-nlp-utils");

/**
 * Create a preprocessor that tokenizes english text.
 *
 * @returns {import('../detector').Preprocessor}
 */
module.exports.tokenize = function tokenize() {
  return async (textParts) => textParts.flatMap(nlpUtils.string.tokenize);
};

/**
 * Create a preprocessor that removes stop-words from the incoming tokenized text.
 * It will use a built-in list of stop-words for the english language by default.
 * The list can be overridden using `stopWords` parameter or augmented using `addStopWords` parameter.
 *
 * @returns {import('../detector').Preprocessor}
 */
module.exports.removeStopWords = function removeStopWords({
  addStopWords = [],
  stopWords = defaultStopWords,
} = {}) {
  const filter = nlpUtils.helper.words([...stopWords, ...addStopWords]);

  return async (textParts) => textParts.filter(filter.exclude);
};

/**
 * Create a preprocessor that stems incoming english text tokens.
 *
 * @returns {import('../detector').Preprocessor}
 */
module.exports.stem = function stem() {
  return async (textParts) => nlpUtils.tokens.stem(textParts);
};
