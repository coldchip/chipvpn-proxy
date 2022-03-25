const express = require('express');
const net = require('net');

const app = express()
const port = 80

app.get('/', (req, res) => {
 	res.send('ChipVPN proxy')
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})

var server = net.createServer();

server.on("connection", (client) => {
	console.log("Client connect");
	client.setTimeout(1000);

	var remote = new net.Socket();
	remote.connect(443, '127.0.0.1', () => {
		console.log('Remote Connected');
		remote.setTimeout(1000);

		client.on('data', (data) => {
			remote.write(data);
		});
		client.on('end', function () {
			console.log('Client disconnect.');
			remote.end();
		});
		client.on('timeout', function () {
			remote.end();
		});

		remote.on('data', (data) => {
			client.write(data);
		});
		remote.on('end', function () {
			console.log('Client disconnect.');
			client.end();
		});
		remote.on('timeout', function () {
			client.end();
		});
	});
});

server.listen(8443, function () {
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
