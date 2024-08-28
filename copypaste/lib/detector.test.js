const { CopypasteDetector } = require("./detector");
const { composePreprocessors } = require("./preprocessors/compose");
const { createShingles } = require("./preprocessors/createShingles");
const {
  removeStopWords,
  stem,
  tokenize,
} = require("./preprocessors/english-wink");
const { MemoryCopypasteStore } = require("./stores/memory");

/**
 * @param {AsyncIterable<T>} gen
 * @returns {Array<T>}
 */
const gen2array = async (gen) => {
  const arr = [];

  for await (el of gen) {
    arr.push(el);
  }

  return arr;
};

describe("CopypasteDetector", () => {
  describe("when configured with preprocessors and memory storage", () => {
    /** @type {CopypasteDetector} */
    let detector;

    beforeEach(async () => {
      detector = new CopypasteDetector({
        store: new MemoryCopypasteStore(),
        preprocessor: composePreprocessors(
          tokenize(),
          removeStopWords(),
          stem(),
          createShingles(),
        ),
      });
      await detector.rememberDocument({
        id: "1",
        meta: {},
        textParts: [
          "Jest is a delightful JavaScript Testing Framework with a focus on simplicity.",
        ],
      });

    });

    it("should detect exactly copied texts", async () => {
      const res = await gen2array(detector.checkDocument({
        meta: {},
        textParts: [
          "Jest is a delightful JavaScript Testing Framework with a focus on simplicity.",
        ],
      }));

      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: "1", relSimilarity: 1.0 })
    });

    it("should detect slightly modified texts", async () => {
      const res = await gen2array(detector.checkDocument({
        meta: {},
        textParts: [
          "Jests are the delightedly javascript test frameworks focused on simplicity.",
        ],
      }));

      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: "1", relSimilarity: 1.0 })
    });

    it("should not find similarities with totally distinct document", async () => {
      const res = await gen2array(detector.checkDocument({
        meta: {},
        textParts: [
          "Tests are parallelized by running them in their own processes to maximize performance.",
        ],
      }));

      expect(res).toHaveLength(0);
    })
  });
});
