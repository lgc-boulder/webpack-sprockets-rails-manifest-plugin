var fs = require("fs");
var fse = require("fs-extra");

var DEFAULT_PARAMS = {
  manifestFile: "../../config/sprockets-manifest.json",
  statsFile: "webpack-stats.json"
};

function WebpackSprocketsRailsManifestPlugin(options) {
  var params = options || {};

  this._manifestFile = params.manifestFile || DEFAULT_PARAMS.manifestFile;
  this._statsFile = params.statsFile || DEFAULT_PARAMS.statsFile;
}

WebpackSprocketsRailsManifestPlugin.prototype.apply = function(compiler) {
  var manifestFile = this._manifestFile;
  var statsFile = this._statsFile;
  var sprockets = {
    files: {},
    assets: {}
  };

  compiler.plugin("done", function(stats) {
    var statsJson = stats.toJson();
    var chunks = statsJson.chunks;
    var devServer = compiler.options.devServer;
    var outputPath;

    if (devServer && devServer.contentBase) {
      outputPath = devServer.contentBase;
    } else {
      outputPath = compiler.options.output.path;
    }

    var outputDest = outputPath;
    var manifestPath = outputDest + "/" + manifestFile;

    chunks.forEach(function(chunk) {
      var chunkFilename = chunk.files[0];
      var chunkPath = outputDest + "/" + chunkFilename;
      var chunkExtension = chunkFilename.split(".").pop();
      var logicalPath = chunk.names[0] + "." + chunkExtension;

      if (fs.existsSync(chunkPath)) {
        var mtime = fs.statSync(chunkPath).mtime.toISOString();

        sprockets.files[chunkFilename] = {
          "logical_path": logicalPath,
          "mtime": mtime,
          "size": chunk.size,
          "digest": chunk.hash,
          // TODO
          // "integrity": "sha256-Zk2O+Q1SFSuzslxNc6LuqFrAN5PlRHlbKeGzXfN4Xmc="
        };
        sprockets.assets[logicalPath] = chunkFilename;
      } else {
        console.warn("[webpack-sprockets-rails-manifest-plugin] file does not exist: %o", chunkPath);
      }
    });

    fse.outputFileSync(manifestPath, JSON.stringify(sprockets, null, "  "));
  });
};

module.exports = WebpackSprocketsRailsManifestPlugin;
