const unaryAsyncImpl = require("./utils/unaryAsyncImpl");
const streamAsyncImpl = require("./utils/streamAsyncImpl");
const { InvalidArgument, NotFound } = require("./utils/errors");
const { DocumentNotFoundError } = require("@achivx/copypaste");

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

function metaToResponse(meta) {
  const res = [];

  for (const [name, value] in Object.entries(meta)) {
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

    if (!id) {
      throw new InvalidArgument("Document id is missing");
    }

    validateInboundText(text);
    const parsedMeta = parseInboundMeta(meta);

    await detector.rememberDocument({ id, meta: parsedMeta, textParts: text });

    return { id };
  }),

  ForgetDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id },
    } = call;

    if (!id) {
      throw new InvalidArgument("Document id is missing");
    }

    await detector.forgetDocument(id);

    return {};
  }),

  GetDocument: unaryAsyncImpl(async (call) => {
    const {
      request: { id },
    } = call;

    if (!id) {
      throw new InvalidArgument("Document id is missing");
    }

    try {
      const { id, meta, textParts } = await detector.fetchDocument(id);

      return {
        id,
        textParts,
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
      request: { text, meta },
    } = call;

    validateInboundText(text);
    const parsedMeta = parseInboundMeta(meta);

    for await (const {
      id,
      absSimilarity,
      relSimilarity,
    } of detector.checkDocument({ meta: parsedMeta, textParts: text })) {
      yield { id, absSimilarity, relSimilarity };
    }
  }),
});
