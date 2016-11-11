//Note that right now if you send this bot a bash command that won't end, it will never cancel.
var request = require('request');
var exec = require('child_process').exec;
var kill = require('tree-kill');

//Windows or linux?
var windows = true;
var linux = false;

var me = {
	status: "Ready",
	lastOut: ""
};
setInterval(function() {
	request.post(
	    'http://localhost:3000/heartbeat',
	    { json: { status: me.status, lastOut: me.lastOut } },
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            console.log(body);
	            if (body == "workavailable") {
	            	getCommand();
	            }
	        }
	    }
	);
}, 5000);

function getCommand() {
	request('http://localhost:3000/command', function(err, res, body) {
		if (body != "kill") {
			me.status = "Busy";
			runCommand(body);
		} else {
			killProcess();
		}
	});
}

function runCommand(cmd) {
	console.log("Running: " + cmd);
	running = exec(cmd);
	running.stdout.on('data', function(data) {
		console.log(data);
		me.lastOut = data;
	});

}

function killProcess() {
	console.log("Received kill command");
	kill(running.pid); //We need to kill the whole process tree
	me.status = "Ready";
}