const unaryAsyncImpl = require("./utils/unaryAsyncImpl");
const { InvalidArgument } = require("./utils/errors");

function validateInboundText(text) {
  if (!text?.length) {
    throw new InvalidArgument("No text provided");
  }
}

function parseInboundMeta(meta) {
  const res = {};

  for (const { name, value } of meta) {
    if (!name) {
      throw new InvalidArgument("Meta name is missing");
    }

    if (value) {
      res[name] = value;
    }
  }

  return res;
}

/**
 * @param {{ detector: import('@achivx/copypaste').CopypasteDetector}}
 */
module.exports.makeCopypasteService = ({ detector }) => ({
  rememberDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id, text, meta },
    } = call;

    if (!id) {
      throw new InvalidArgument("Document id is missing");
    }

    validateInboundText(text);
    const parsedMeta = parseInboundMeta(meta);

    await detector.rememberDocument({ id, meta: parsedMeta, textParts: text });

    return { id };
  }),
});
