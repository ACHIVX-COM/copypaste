const dotenvLoad = require("dotenv-load");

const assert = require("node:assert");
const {
  CopypasteDetector,
  MongodbCopypasteStore,
  preprocessors: {
    composePreprocessors,
    tokenize,
    stem,
    removeStopWords,
    createShingles,
  },
} = require("@achivx/copypaste");
const { createServer, runServer } = require("./server");
const { MongoClient } = require("mongodb");

const main = (module.exports.main = async () => {
  dotenvLoad();

  const mongodbUri = process.env.MONGODB_URI;
  const address = process.env.BIND_ADDRESS ?? "0.0.0.0:50051";
  const collectionPrefix =
    process.env.COPYPASTE_COLLECTION_PREFIX || "copypaste";
  const absSimilarityThreshold = parseInt(
    process.env.COPYPASTE_ABS_SIMILARITY_THRESHOLD ?? "-1",
  );
  const relSimilarityThreshold = parseFloat(
    process.env.COPYPASTE_REL_SIMILARITY_THRESHOLD ?? "0.5",
  );

  assert.ok(mongodbUri, "MONGODB_URI environment variable must be set");

  const connection = await MongoClient.connect(mongodbUri);

  try {
    await runServer(
      createServer({
        detector: new CopypasteDetector({
          store: new MongodbCopypasteStore(connection.db(), collectionPrefix),
          thresholds: {
            absSimilarity: absSimilarityThreshold,
            relSimilarity: relSimilarityThreshold,
          },
          preprocessor: composePreprocessors(
            tokenize(),
            removeStopWords(),
            stem(),
            createShingles(),
          ),
        }),
      }),
      address,
    );
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error("Error closing mongodb connection:", err);
      process.exitCode = 1;
    }
  }
});

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
