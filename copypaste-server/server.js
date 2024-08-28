const path = require("node:path");
const grpc = require("@grpc/grpc-js");
const { ReflectionService } = require("@grpc/reflection");
const protoLoader = require("@grpc/proto-loader");

const { makeCopypasteService } = require("./copypasteService");

const packageDefinition = protoLoader.loadSync(
  path.resolve(__dirname, "./protocols/copypaste.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  },
);

const grpcPackage = grpc.loadPackageDefinition(packageDefinition);

/**
 * @typedef {Object} ServerParameters
 * @prop {import('@achivx/copypaste').CopypasteDetector} detector a copypaste detector the server should expose
 * @prop {bool} addReflection if server should support reflection protocol
 */

/**
 * Create a gRPC server exposing the given copypaste detector.
 * 
 * @param {ServerParameters} params 
 * @returns {grpc.Server}
 */
module.exports.createServer = ({ detector, addReflection = true }) => {
  const server = new grpc.Server();

  server.addService(
    grpcPackage.achivx.copypaste.Copypaste.service,
    makeCopypasteService(detector),
  );

  if (addReflection) {
    new ReflectionService(packageDefinition).addToServer(server);
  }

  return server;
};
