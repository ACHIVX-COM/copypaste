# ACHIVX Copypaste

ACHIVX Copypaste is a tool for finding similar texts among collections of documents using a [w-shingling](https://en.wikipedia.org/wiki/W-shingling) algorithm.
It can work either with an in-memory storage to search among smaller collections of documents or with a MongoDB-based storage for larger, persistent collections of documents.
Additional storage types can be added as well.

## How to use

### As JS library

ACHIVX Copypaste is available as a [npm package](https://www.npmjs.com/package/@achivx/copypaste) and can be installed into a Node.js project:

```sh
npm i -S @achivx/copypaste
```

If all you need is just to compare few documents, you can use a copypaste detector with a temporary in-memory storage:

```JavaScript
const { CopypasteDetector, MemoryCopypasteStore, preprocessors } = require("@achivx/copypaste");

// Create a storage and detector objects
const detector = new CopypasteDetector({
  store: new MemoryCopypasteStore(),
  preprocessor: preprocessors.compose(
    preprocessors.tokenize(),
    preprocessors.removeStopWords(),
    preprocessors.stem(),
    preprocessors.createShingles(),
  ),
});

// Add a document to the storage
await detector.rememberDocument({ id: "1", textParts: ["In natural language processing a w-shingling is a set of unique shingles (therefore n-grams) each of which is composed of contiguous subsequences of tokens within a document, which can then be used to ascertain the similarity between documents. The symbol w denotes the quantity of tokens in each shingle selected, or solved for."]})

// Compare a new text to the documents previously added to the storage
const similar = detector.checkDocument({ textParts: ["In NLP a w-shingling is a set of unique shingles each of which is composed of contiguous subsequences of tokens within a document, which can then be used to ascertain the similarity between documents. The symbol w denotes the quantity of tokens in each shingle selected, or solved for."]})
for await (const doc of similar) { console.log(doc); } // { id: '1', relSimilarity: 0.5588235294117647, absSimilarity: 38 }
```

If a persistent storage is needed, use a MongoDB instance along with a `MongodbCopypasteStore`:

```JavaScript
const { MongodbCopypasteStore, CopypasteDetector, ... } = requrie("@achivx/copypaste");
const { MongoClient } = require("mongodb");

// Connect to a database
const connection = await MongoClient.connect("mongodb://hostname/db-name");

// Create a storage object that will use the database and use it when creating the detector
const detector = new CopypasteDetector({
  store: new MongodbCopypasteStore(connection.db()),
  ...
});

// The rest will work the same way as with in-memory storage, except the documents written with
await detector.rememberDocument({ ... })
// will be stored persistently
```

### As gRPC (micro)service

The ACHIVX Copypaste provides a ready-to-use gRPC server.
A protocol used by the server is described [here](./copypaste-server/protocols/copypaste.proto).
The server requires a MongoDB instance to use as storage.
They can be launched together using docker-compose.
The following command will start a server from a pre-built image (a copy of [docker-compose.yaml](./docker-compose.yaml) will be required):

```sh
docker compose --profile prebuilt up
```

Alternatively you can run the server from sources by cloning this repo and running

```sh
docker compose --profile build up --build
```

The server can then be accessed through gRPC, for example, using [grpcurl](https://github.com/fullstorydev/grpcurl):

```sh
# Adding a document to the storage
$ grpcurl --plaintext -d '{"id":"1", "text": ["In natural language processing a w-shingling is a set of unique shingles (therefore n-grams) each of which is composed of contiguous subsequences of tokens within a document, which can then be used to ascertain the similarity between documents. The symbol w denotes the quantity of tokens in each shingle selected, or solved for."]}' localhost:50051 achivx.copypaste.Copypaste/RememberDocument
{
  "id": "1"
}
# Searching for documents similar to the exact copy of the document
$ grpcurl --plaintext -d '{"text": ["In natural language processing a w-shingling is a set of unique shingles (therefore n-grams) each of which is composed of contiguous subsequences of tokens within a document, which can then be used to ascertain the similarity between documents. The symbol w denotes the quantity of tokens in each shingle selected, or solved for."]}' localhost:50051 achivx.copypaste.Copypaste/CheckDocument
{
  "id": "1",
  "relSimilarity": 1,
  "absSimilarity": "58"
}
# Searching for documents similar to slightly modified document
grpcurl --plaintext -d '{"text": ["In NLP a w-shingling is a set of unique shingles each of which is composed of contiguous subsequences of tokens within a document, which can then be used to ascertain the similarity between documents. The symbol w denotes the quantity of tokens in each shingle selected, or solved for."]}' localhost:50051 achivx.copypaste.Copypaste/CheckDocument
{
  "id": "1",
  "relSimilarity": 0.5588235,
  "absSimilarity": "38"
}
```
