const unaryAsyncImpl = require("./utils/unaryAsyncImpl");
const streamAsyncImpl = require("./utils/streamAsyncImpl");
const { InvalidArgument, NotFound } = require("./utils/errors");
const { DocumentNotFoundError } = require("@achivx/copypaste");
const { TextTooShortError } = require("@achivx/copypaste/lib/detector");

function validateInboundText(text) {
  if (!text?.length) {
    throw new InvalidArgument("No text provided");
  }
}

function validateInboundId(id) {
  if (!id) {
    throw new InvalidArgument("Document id is missing");
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

function metaToResponse(meta) {
  const res = [];

  for (const [name, value] of Object.entries(meta)) {
    res.push({ name, value });
  }

  return res;
}

/**
 * @param {{ detector: import('@achivx/copypaste').CopypasteDetector}}
 */
module.exports.makeCopypasteService = ({ detector }) => ({
  RememberDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id, text, meta },
    } = call;

    validateInboundId(id);

    validateInboundText(text);
    const parsedMeta = parseInboundMeta(meta);

    try {
      await detector.rememberDocument({
        id,
        meta: parsedMeta,
        textParts: text,
      });
    } catch (err) {
      if (err instanceof TextTooShortError) {
        throw new InvalidArgument("The text is too short");
      }
      throw err;
    }

    return { id };
  }),

  ForgetDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id },
    } = call;

    validateInboundId(id);

    await detector.forgetDocument(id);

    return {};
  }),

  GetDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id },
    } = call;

    validateInboundId(id);

    try {
      const { meta, textParts } = await detector.fetchDocument(id);

      return {
        id,
        text: textParts,
        meta: metaToResponse(meta),
      };
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        throw new NotFound("Document not found");
      }

      throw err;
    }
  }),

  CheckDocument: streamAsyncImpl(async function* (call) {
    const {
      request: { text, meta, maxSimilar },
    } = call;

    validateInboundText(text);
    const parsedMeta = parseInboundMeta(meta);
    const similarLimit = Math.max(1, parseInt(maxSimilar) || 1);

    try {
      for await (const {
        id,
        absSimilarity,
        relSimilarity,
      } of detector.checkDocument(
        { meta: parsedMeta, textParts: text },
        similarLimit,
      )) {
        yield { id, absSimilarity, relSimilarity };
      }
    } catch (err) {
      if (err instanceof TextTooShortError) {
        throw new InvalidArgument("The text is too short");
      }

      throw err;
    }
  }),
});
