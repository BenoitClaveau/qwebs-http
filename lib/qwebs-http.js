/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const DataError = require("qwebs").DataError;
const fs = require("fs");
const http = require("http");
const https = require("https");

class HttpServer {
  	constructor($config, $qwebs) {
		if (!$config) throw new DataError({ message: "Qwebs config is not defined."});
		if ($config.http && !config) throw new DataError({ message: "Qwebs http or https config is not defined."});

		this.$config = $config;
		this.$qwebs = $qwebs;
		
		if ($config.http); this.createHttpServer($config.http);
		if (config); this.createHttpsServer(config);
	};

	createHttpServer(config) {
		if (config.start === false) return;
		if (!config.port) throw new DataError({ message: "Http port is not defined in qwebs config."});

		if (/true/i.test(config["redirect-to-http"])) {
			http.createServer((request, response) => {
				return response.redirect({ url: this.$config.host + request.url });
			}).listen(config.port);
		}
		else {
			http.createServer((request, response) => {
				return this.$qwebs.invoke(request, response).catch(response.send.bind(response));
			}).listen(config.port);
		}
	}

	createHttpsServer(config) {
		if (config.start === false) return;
		if (!config.port) throw new DataError({ message: "Https port is not defined in qwebs config."});
		if (!config.key) throw new DataError({ message: "Https key is not defined in qwebs config."});
		if (!config.cert) throw new DataError({ message: "Https cert is not defined in qwebs config."});
		if (!config.ca) throw new DataError({ message: "Https ca is not defined in qwebs config."});
		if (config.ca.length != 2) throw new DataError({ message: "Https ca is not well defined in qwebs config."});

		let options = {
			key: fs.readFileSync(config.key),
			cert: fs.readFileSync(config.cert),
			ca: [
				fs.readFileSync(config.ca[0]),
				fs.readFileSync(config.ca[1])
			]
		};

		https.createServer(options, (request, response) => {
			return this.$qwebs.invoke(request, response).catch(response.send.bind(response));
		}).listen(config.port);
	}
};

exports = module.exports = HttpServer;
