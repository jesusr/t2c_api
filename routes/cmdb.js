var API_VERSION = "0.1";

var inventory = require("../models/inventory");

var getSoftware = function(uuid, limit, page, res) {
  inventory.getSoftware(uuid, function(err, data) {
      if (!err) {
        limit = limit ? limit : data.length;
        var begin = parseInt(limit) * (parseInt(page) - 1);
        var numPages = Math.floor(data.length / parseInt(limit)) + ((data.length / parseInt(limit)) > Math.floor(data.length / parseInt(limit)) ? 1 : 0);
        var pageInfo = page + "/" + numPages;
        if (parseInt(page) > numPages || parseInt(page) == 0) {
            res.json({"result": "error", "data": {"error": "Page doesn't exist"}});
        }
        else {
            res.json({"result": "ok", "data": data.slice(begin, begin + parseInt(limit)), "page": pageInfo});
        }
      }
      else {
        res.json({"result": "error", "data": {"error": err}});
      }
    });
};

module.exports = function(app) {
  app.get("/api/v" + API_VERSION + "/cmdb/software/:agent_uuid", function(req, res) {
    getSoftware(req.params.agent_uuid, null, 1, res);
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/software/:agent_uuid/:limit", function(req, res) {
    getSoftware(req.params.agent_uuid, req.params.limit, 1, res);
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/software/:agent_uuid/:limit/:page", function(req, res) {
    getSoftware(req.params.agent_uuid, req.params.limit, req.params.page, res);
  });

  app.get("/api/v" + API_VERSION + "/cmdb/hardware/:agent_uuid", function(req, res) {
    inventory.getHardware(req.params.agent_uuid, function(err, data) {
      if (!err) {
        res.json({"result": "ok", "data": data});
      }
      else {
        res.json({"result": "error", "data": {"error": err}});
      }
    });
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/info/:agent_uuid", function(req, res) {
    inventory.getMachineInfo(req.params.agent_uuid, function(err, data) {
      if (!err) {
        res.json({"result": "ok", "data": data});
      }
      else {
        res.json({"result": "error", "data": {"error": err}});
      }
    });
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/resume/:agent_uuid", function(req, res) {
    inventory.getResume(req.params.agent_uuid, function(err, data) {
      if (!err) {
        res.json({"result": "ok", "data": data});
      }
      else {
        res.json({"result": "error", "data": {"error": err}});
      }
    });
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/:company", function(req, res) {
    res.json(require("../data/comp.json"));
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/:company/:unit", function(req, res) {
    res.json(require("../data/unit.json"));
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/:company/:unit/:department", function(req, res) {
    res.json(require("../data/dept.json"));
  });
  
  app.get("/api/v" + API_VERSION + "/cmdb/:company/:unit/:department/:machine", function(req, res) {
    res.json(require("../data/mach.json"));
  });

}
