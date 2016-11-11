var request = require('request');

var me = {
	status: "Ready"
};
setInterval(function() {
	request.post(
	    'http://localhost:3000/heartbeat',
	    { json: { status: me.status } },
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
		me.status = "Busy";
		console.log(body);
	});
}