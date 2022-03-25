const express = require('express');
const net = require('net');

var sessions = [];

const app = express();
const port = 80;

app.get('/', (req, res) => {
	res.set("Content-Type", "application/json");

	var filtered = [];
	for(const session of sessions) {
		var s = session;
		s.ip = "[REDACTED]";
		filtered.push(s);
	}

	res.send(filtered);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})

var server = net.createServer((client) => {
	console.log("Client connect", client.remoteAddress, client.remotePort);

	sessions.push({
		ip: client.remoteAddress,
		port: client.remotePort,
		tx: 0,
		rx: 0
	});

	var remote = new net.Socket();
	remote.connect(443, 'vpn.coldchip.ru');

	client.on('data', (data) => {
		for(const session of sessions) {
			if(session.ip === client.remoteAddress && session.port === client.remotePort) {
				console.log("client -> remote", data);

				session.tx += data.length;

				var w = remote.write(data);
				if(!w) {
					client.pause();
				}
			}
		}
	});
	remote.on('data', (data) => {
		for(const session of sessions) {
			if(session.ip === client.remoteAddress && session.port === client.remotePort) {
				console.log("remote -> client", data);
				session.rx += data.length;
				
				var w = client.write(data);
				if(!w) {
					remote.pause();
				}
			}
		}
	});

	client.on('drain', (data) => {
		remote.resume();
	});
	remote.on('drain', (data) => {
		client.resume();
	});

	client.on('error', function() {
		remote.end();
	});
	remote.on('error', function() {
		client.end();
	});

	client.on('close', function () {
		console.log('Client disconnect.');
		sessions = sessions.filter(session => session.ip !== client.remoteAddress && session.port !== client.remotePort)
		remote.end();
	});
	remote.on('close', function () {
		console.log('Client disconnect.');
		client.end();
	});
});

server.listen(443, function () {
	// Get server address info.
	var serverInfo = server.address();
	var serverInfoJson = JSON.stringify(serverInfo);
	console.log('TCP server listen on address : ' + serverInfoJson);
	server.on('close', function () {
	    console.log('TCP server socket is closed.');
	});
	server.on('error', function (error) {
	    console.error(JSON.stringify(error));
	});
});
