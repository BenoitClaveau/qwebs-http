/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
`use strict`;

const DataError = require(`qwebs`).DataError;
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);

class HttpServer {
  	constructor($qwebs, $config, $event) {
		if (!$config) throw new DataError({ message: `Qwebs config is not defined.`});
		if (!$config.http && !$config.https) throw new DataError({ message: `Qwebs http or https config is not defined.`});

		this.$qwebs = $qwebs;
		this.$config = $config;
		this.$event = $event;
		this.httpServer = null;
		this.httpsServer = null;
		
		if ($config.http) this.createHttpServer($config.http);
		if ($config.https)this.createHttpsServer($config.https);

		this.$event.on("dispose", () => this.close());
	};

	createHttpServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new DataError({ message: `Http port is not defined in qwebs config.`});

		if (/true/i.test(config[`redirect-to-http`])) {
			if (!config.host) throw new DataError({ message: `Http port is not defined in qwebs config.`});

			this.httpServer = http.createServer((request, response) => {
				return response.redirect({ url: `${config.host}${request.url}` }).catch(response.send.bind(response));
			});
			this.httpServer.listen(config.port);
		}
		else {
			this.httpServer = http.createServer((request, response) => {
				return this.$qwebs.invoke(request, response).catch(response.send.bind(response));
			});
			this.httpServer.listen(config.port);
		}
	}

	createHttpsServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new DataError({ message: `Https port is not defined in qwebs config.`});
		if (!config.key) throw new DataError({ message: `Https key is not defined in qwebs config.`});
		if (!config.cert) throw new DataError({ message: `Https cert is not defined in qwebs config.`});
		if (!config.ca) throw new DataError({ message: `Https ca is not defined in qwebs config.`});
		if (config.ca.length != 2) throw new DataError({ message: `Https ca is not well defined in qwebs config.`});

		let options = {
			key: fs.readFileSync(config.key),
			cert: fs.readFileSync(config.cert),
			ca: [
				fs.readFileSync(config.ca[0]),
				fs.readFileSync(config.ca[1])
			]
		};

		this.httpsServer = https.createServer(options, (request, response) => {
			return this.$qwebs.invoke(request, response).catch(response.send.bind(response));
		});
		this.httpServer.listen(config.port);
	}

	close() {
		this.httpServer && this.httpServer.close();
		this.httpsServer && this.httpsServer.close();
	}
};

exports = module.exports = HttpServer;