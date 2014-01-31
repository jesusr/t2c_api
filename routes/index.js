var API_VERSION = "0.1";

module.exports = function(app) {
  require("./agent")(app);
  require("./cmdb")(app);
  require("./simulator")(app);
};
