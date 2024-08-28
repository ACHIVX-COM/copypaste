/**
 * @param  {...import('../detector').Preprocessor} preprocessors
 * @returns {import('../detector').Preprocessor}
 */
module.exports.composePreprocessors = function composePreprocessors(
  ...preprocessors
) {
  if (preprocessors.length === 0) {
    return textParts => textParts;
  }

  if (preprocessors.length === 1) {
    return preprocessors[0];
  }

  return async (textParts, meta) => {
    let currentTextParts = textParts;

    for (const preprocessor of preprocessors) {
      currentTextParts = await preprocessor(currentTextParts, meta);
    }

    return currentTextParts;
  };
};
