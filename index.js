const express = require('express');
const net = require('net');
const fs = require('fs');

var sessions = [];

const app = express();
const port = 8080;

app.get('/', (req, res) => {
	res.set("Content-Type", "application/json");

	res.send(`Session Count: ${sessions.length}`);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
});

try {
	fs.unlinkSync('./chipvpn-auth.sock');
} catch(e) {

}

var buffer = [];

// This server listens on a Unix socket at /var/run/mysocket
var unixServer = net.createServer((client) => {
    // Do something with the client connection
    console.log("ipc connects");

	client.on('data', (data) => {
		for(const bit of data) {
			buffer.push(bit);
			if(buffer.length > 16384) {
				buffer = [];
			}
		}

		if(buffer.includes(0)) {
			var message = "";
			while(true) {
				var bit = buffer.shift();
				if(bit === 0) {
					break;
				}
				message = message.concat(String.fromCharCode(bit));
			}
			console.log(message, buffer);
			var json = JSON.parse(message.toString());
			console.log(json);

			switch(json.type) {
				case "sync": {
					sessions = json.peers;
				}
				break;
				case "login": {
					if(json.token === process.argv.slice(2)[0]) {
						client.write(JSON.stringify({
							type: "login",
							success: true,
							peerid: json.peerid
						}));
					}
				}
				break;
				default: {
					console.log("Unknown type");
				}
				break;
			}
		}
	});
	client.on('error', function() {
		client.end();
	});
	client.on('close', function () {
		console.log('ipc disconnects.');
		client.end();
	});
});

unixServer.listen('./chipvpn-auth.sock');