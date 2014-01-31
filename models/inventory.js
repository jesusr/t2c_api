var redis = require('redis');

var clients = require('./clients');

if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	var credentials = env["redis-2.6"][0]["credentials"];
} else {
	var credentials = {
		"hostname": "localhost",
		"port": 6379,
		"username": "",
		"password": "",
		"name": "",
		"db": "0"
	}
}

var data = new Array();
var keyLength = 0;

var pushData = function(value) {
	data.push(value);
};

var sendData = function(callback) {
	if (data.length > 0) {
		callback(null, data); 
	}
	else {
		callback("No data", null);
	}
};

if (credentials.password) {
    var client = redis.createClient(credentials.port, credentials.host, {auth_pass: true});
    client.auth(credentials.password, function(err) {
        console.log(err);
    });
}
else {
    var client = redis.createClient(credentials.port, credentials.host);
}

var Inventory = {
    data: function(uuid, type, data, callback) {
        clients.checkAgent(uuid, function(ok) {
            if (ok) {
                var d = new Date();
                var now = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) +
                          ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2);
                var base = uuid + ":" + type;
                var items = JSON.parse(data);
                for (i = 0; i < items.length; i++) {
                    client.sadd(base + ":new", JSON.stringify(items[i]));
                }
                client.sdiff(base, base + ":new", function(err, data) {
                    if (data.length > 0) {
                        client.sadd(base + ":" + now + ":removed", data);
                    }
                });
                client.sdiff(base + ":new", base, function(err, data) {
                    if (data.length > 0) {
                        client.sadd(base + ":" + now + ":added", data);
                    }
                });
                client.del(base);
                client.sunionstore(base, base + ":new");
                client.del(base + ":new");
                
                callback(null);
            }
            else {
                callback("Agent not authorized");
            }
        });
    },
    dataMetrics: function(uuid, type, data, callback) {
        clients.checkAgent(uuid, function(ok) {
            if (ok) {
                var d = new Date();
                var now = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) +
                          ("0" + d.getHours()).slice(-2) + ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2);
                var base = uuid + ":" + type;
                client.sadd(base + ":" + now, data);
                
                callback(null);
            }
            else {
                callback("Agent not authorized");
            }
        });
    },
    register: function(uuid, agent_data, callback) {
        client.sadd(uuid, JSON.stringify(agent_data));
        callback(null);
    },
    getSoftware: function(uuid, callback) {
        client.sdiff(uuid + ":software", function(err, data) {
           if (data.length > 0) {
             callback(err, data); 
           }
           else {
             callback("No data", null);
           }
        });
    },
    getHardware: function(uuid, callback) {
        client.sdiff(uuid + ":hardware", function(err, data) {
           if (data.length > 0) {
             callback(err, data); 
           }
           else {
             callback("No data", null);
           }
        });
    },
    getMetrics: function(uuid, callback) {
		data.length = 0;
		
        client.keys(uuid + ":metrics:*", function(err, keys) {
            if (err) {
                error = err;
            }
            else {
				keyLength = keys.length;
                for(i = 0; i < keys.length; i++) {
                    client.sdiff(keys[i], function(err, value) {
                        if (err) {
                            error = err;
                        }
                        else {
                            //pushData({"date": key.slice(key.length-14, key.length), "data": value});
                            pushData(value);
                            keyLength--;
                            if (keyLength == 0) {
								sendData(callback);
							}
                        }
                    });
                }
            } 
        });
    },
    getMachineInfo: function(uuid, callback) {
        client.sdiff(uuid, function(err, data) {
           if (data.length > 0) {
             callback(err, data); 
           }
           else {
             callback("No data", null);
           }
        });
    },
    getResume: function(uuid, callback) {
        client.scard(uuid + ":software", function(err, pkgCount) {
            client.sdiff(uuid + ":hardware", function(err, hardData) {
                var hdMemory = 0;
                hardData = JSON.parse(hardData);
                for (i = 0; i < hardData.storages.length; i++) {
                    for (j = 0; j < hardData.storages[i].volumes.length; j++) {
                        hdMemory += parseInt(hardData.storages[i].volumes[j].size);
                    }
                }
                var resume = {"cpu": {"vendor": hardData.cpu[0].vendor_id,
                                      "model" : hardData.cpu[0].model_name,
                                      "cores": hardData.cpu[0].cpu_cores,
                                      "mhz": hardData.cpu[0].cpu_mhz},
                              "ram": hardData.memory.total,
                              "hd": hdMemory,
                              "packages": pkgCount}
                callback(null, JSON.stringify(resume));
            });
        });
    }
};

module.exports = Inventory;
