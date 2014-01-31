var API_VERSION = "0.1";

var clients = require("../models/clients");
var inventory = require("../models/inventory");

module.exports = function(app) {
  app.post("/api/v" + API_VERSION + "/agent/register/:uuid", function(req, res) {
    var data = JSON.parse(JSON.stringify(req.body)).data;
    if (data.hw_type && data.kernel && data.kernel_release && 
        data.kernel_version && data.name && data.os_name && data.os_version ) {
        clients.exists(req.params.uuid, function(exists) {
            if (exists) {
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });

                agent_data = {
                    "uuid": uuid,
                    "hw_type": data.hw_type,
                    "kernel": data.kernel,
                    "kernel_release": data.kernel_release,
                    "kernel_version": data.kernel_version,
                    "name": data.name,
                    "os_name": data.os_name,
                    "os_version": data.os_version
                };
                
                clients.registerAgent(req.params.uuid, agent_data, function(ok) {
                    if (ok) {
                        inventory.register(uuid, agent_data, function(err) {
                            res.json({"result": "ok", "data": {"uuid": uuid}});
                        });
                    }
                    else {
                        res.json({"result": "error", "data": {"error": "Can't register more agents"}});
                    }
                });
            }
            else {
                res.json({"result": "error", "data": {"error": "Invalid client"}});
            }
        });
    }
    else {
        res.json({"result": "error", "data": {"error": "Invalid data"}});
    }
  });
  
  app.post("/api/v" + API_VERSION + "/agent/software/:uuid", function(req, res) {
    var data = req.body.data.software;
    inventory.data(req.params.uuid, "software", JSON.stringify(data), function(err) {
       if (err) {
           res.json({"result": "error", "data": err});
       }
       else {
           res.json({"result": "ok", "data": data});
       }
    });
  });
  
  app.post("/api/v" + API_VERSION + "/agent/hardware/:uuid", function(req, res) {
    var data = [JSON.parse(JSON.stringify(req.body)).data.hardware];
    inventory.data(req.params.uuid, "hardware", JSON.stringify(data), function(err) {
       if (err) {
           res.json({"result": "error", "data": err});
       }
       else {
           res.json({"result": "ok", "data": data});
       }
    });
  });

  app.post("/api/v" + API_VERSION + "/agent/metrics/:uuid", function(req, res) {
    var data = JSON.parse(JSON.stringify(req.body)).data;
    inventory.dataMetrics(req.params.uuid, "metrics", JSON.stringify(data), function(err) {
       if (err) {
           res.json({"result": "error", "data": err});
       }
       else {
           res.json({"result": "ok", "data": data});
       }
    });
  });
}
