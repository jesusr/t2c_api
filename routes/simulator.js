var API_VERSION = "0.1";

var inventory = require("../models/inventory");

module.exports = function(app) {
  app.get("/api/v" + API_VERSION + "/simulator/:uuid", function(req, res) {
    inventory.getMetrics(req.params.uuid, function(err, data) {
      if (!err) {
        res.json({"result": "ok", "data": data});
      }
      else {
        res.json({"result": "error", "data": {"error": err}});
      }
    });
  });
}
