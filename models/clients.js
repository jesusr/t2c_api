var mongoose = require('mongoose');

if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	var mongo = env["mongodb-1.8"][0]["credentials"];
} else {
	var mongo = {
		"hostname": "localhost",
		"port": 27017,
		"username": "",
		"password": "",
		"name": "",
		"db": "db"
	}
}

var generate_mongo_url = function(obj) {
	if(obj.username && obj.password) {
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	} else {
		return "mongodb://" +  obj.hostname + ":" + obj.port + "/" + obj.db;
	}
}

mongoose.connect(generate_mongo_url(mongo));
var db = mongoose.connection;

var clientSchema = mongoose.Schema({
    name: String,
    max_agents: Number,
    agent_ids: [mongoose.Schema.Types.ObjectId]
});

var agentSchema = mongoose.Schema ({
    uuid: String,
    hw_type: String,
    kernel: String,
    kernel_release: String,
    kernel_version: String,
    name: String,
    os_name: String,
    os_version: String
});

var client = mongoose.model("clients", clientSchema);

var agent = mongoose.model("agents", agentSchema);

var Client = {
    registerClient: function(name, callback) {
        var cl = new client({"name": name,
                             "max_agents": 10,
                             "agent_ids": []});
        cl.save(function(err, data) {
            callback(null, data._id);
        });
    },
    list: function(callback) {
        client.find(null, null, {sort: "name"}, function (err, data) {
            callback(null, data);
        })
    },
    exists: function(uuid, callback) {
        if (uuid.length == 24) {
            client.count({"_id": mongoose.Types.ObjectId(uuid)}, function(err, count) {
                if (count === 1) {
                    callback(true);
                }
                else {
                    callback(false);
                }
            });
        }
        else {
            callback(false);
        }
    },
    registerAgent: function(client_uuid, agent_data, callback) {
        var ag = new agent(agent_data);
        ag.save(function(err, ag_data) {
            client.findOne({"_id": mongoose.Types.ObjectId(client_uuid)}, function(err, data) {
                if (data.max_agents > data.agent_ids.length) {
                    client.update({"_id": data._id}, {$push: {"agent_ids": mongoose.Types.ObjectId(ag_data._id.toString())}}, function(err) {
                        callback(true);
                    });
                }
                else {
                    callback(false);
                }
            });
        });
    },
    listAgents: function(uuid, callback) {
        client.findOne({"_id": mongoose.Types.ObjectId(uuid)}, function (err, data) {
            callback(null, data);
        })
    },
    checkAgent: function(uuid, callback) {
        agent.count({"uuid": uuid}, function(err, count) {
            if (count === 1) {
                callback(true);
            }
            else {
                callback(false);
            }
        });
    }
};

module.exports = Client;
