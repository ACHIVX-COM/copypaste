const assert = require("node:assert");

/**
 * From array of elements creates array of n-grams represented as arrays of
 * length n.
 *
 * @param {Array<T>} input
 * @param {number} n
 * @returns {Array<Array<T>>}
 */
function nGrams(input, n) {
  const res = [];

  for (let i = 0; i < input.length + 1 - n; i += 1) {
    res.push(input.slice(i, i + n));
  }

  return res;
}

/**
 * Create a preprocessor that creates shingles from incoming tokens.
 * 
 * For example, tokens sequence
 * 
 * ["this", "is", "a", "test", "sentence"]
 * 
 * will be converted to the following shingles sequence:
 * 
 * ["this_is_a_s3", "is_a_test_s3", "a_test_sentence_s3", "this_is_a_test_sentence_s5"]
 *
 * @param {{sizes: number[]}} settings
 * @returns {import("../detector").Preprocessor}
 */
module.exports.createShingles = function createShingles({ sizes = [3, 5] } = {}) {
  assert.ok(sizes.length > 0);
  assert.ok(sizes.every((size) => size > 0 && Number.isInteger(size)));

  return async (textParts) => {
    const shingles = new Set();

    for (const size of sizes) {
      for (const nGram of nGrams(textParts, size)) {
        shingles.add(`${nGram.join('_')}_s${size}`);
      }
    }

    return [...shingles];
  };
};
