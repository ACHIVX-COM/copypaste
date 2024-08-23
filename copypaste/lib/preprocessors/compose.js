/**
 * @param  {...import('../detector').Preprocessor} preprocessors
 * @returns {import('../detector').Preprocessor}
 */
module.exports.composePreprocessors = function composePreprocessors(
  ...preprocessors
) {
  return async (textParts, meta) => {
    let currentTextParts = textParts;

    for (const preprocessor of preprocessors) {
      currentTextParts = await preprocessor(currentTextParts, meta);
    }

    return currentTextParts;
  };
};
