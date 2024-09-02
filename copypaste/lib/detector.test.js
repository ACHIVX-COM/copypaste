const { MongoClient } = require("mongodb");
const { CopypasteDetector } = require("./detector");
const { composePreprocessors } = require("./preprocessors/compose");
const { createShingles } = require("./preprocessors/createShingles");
const {
  removeStopWords,
  stem,
  tokenize,
} = require("./preprocessors/english-wink");
const { MemoryCopypasteStore } = require("./stores/memory");
const { MongodbCopypasteStore } = require("./stores/mongodb");

/**
 * @param {AsyncIterable<T>} gen
 * @returns {Array<T>}
 */
const gen2array = async (gen) => {
  const arr = [];

  for await (const el of gen) {
    arr.push(el);
  }

  return arr;
};

const defaultPreprocessor = composePreprocessors(
  tokenize(),
  removeStopWords(),
  stem(),
  createShingles(),
);

/**
 * @param {CopypasteDetector} detector
 */
const addCommonDocs = async (detector) => {
  await detector.rememberDocument({
    id: "1",
    meta: {},
    textParts: [
      "Jest is a delightful JavaScript Testing Framework with a focus on simplicity.",
    ],
  });
};

/**
 * @param {{detector: CopypasteDetector}} scope
 */
const defineCommonTests = (scope) => {
  it("should detect exactly copied texts", async () => {
    const res = await gen2array(
      scope.detector.checkDocument({
        meta: {},
        textParts: [
          "Jest is a delightful JavaScript Testing Framework with a focus on simplicity.",
        ],
      }),
    );

    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: "1", relSimilarity: 1.0 });
  });

  it("should detect slightly modified texts", async () => {
    const res = await gen2array(
      scope.detector.checkDocument({
        meta: {},
        textParts: [
          "Jests are the delightedly javascript test frameworks focused on simplicity!",
        ],
      }),
    );

    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: "1", relSimilarity: 1.0 });
  });

  it("should not find similarities with totally distinct document", async () => {
    const res = await gen2array(
      scope.detector.checkDocument({
        meta: {},
        textParts: [
          "Tests are parallelized by running them in their own processes to maximize performance.",
        ],
      }),
    );

    expect(res).toHaveLength(0);
  });
};

describe("CopypasteDetector", () => {
  describe("when configured with preprocessors and memory storage", () => {
    /** @type {{detector: CopypasteDetector}} */
    const scope = {};

    beforeEach(async () => {
      scope.detector = new CopypasteDetector({
        store: new MemoryCopypasteStore(),
        preprocessor: defaultPreprocessor,
      });

      await addCommonDocs(scope.detector);
    });

    defineCommonTests(scope);
  });

  describe("when configured with preprocessors and mongodb storage", () => {
    let connection;
    const scope = {};

    beforeEach(async () => {
      connection = await MongoClient.connect(global.__MONGO_URI__);
      scope.detector = new CopypasteDetector({
        store: new MongodbCopypasteStore(connection.db()),
        preprocessor: defaultPreprocessor,
      });

      await addCommonDocs(scope.detector);
    });

    afterEach(() => connection.close());

    defineCommonTests(scope);
  });
});
