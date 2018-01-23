/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
`use strict`;

const { Error, HttpError } = require("oups");
const fs = require(`fs`);
const path = require(`path`);
const http = require(`http`);
const https = require(`https`);
const http2 = require(`http2`);
const chalk = require(`chalk`);
const { inspect } = require(`util`);

class HttpServer {
  	constructor($injector, $config, $event) {
		if (!$config) throw new Error(`Qwebs config is not defined.`);
		if (!$config.http && !$config.https) throw new Error(`Qwebs http or https config is not defined.`);

		this.httpServer = null;
		this.httpsServer = null;
		this.http2Server = null;
		this.injector = $injector;
		this.config = $config;
		this.event = $event;

		this.injector.inject("$querystring", `${__dirname}/services/querystring`);
		this.injector.inject("$IsItForMe", `${__dirname}/services/isitforme`, { instanciate: false });
		this.injector.inject("$OptionsLeaf", `${__dirname}/router/options-leaf`, { instanciate: false });
		this.injector.inject("$CompressedStream", `${__dirname}/services/compressed-stream`, { instanciate: false });
		this.injector.inject("$Ask", `${__dirname}/services/ask`, { instanciate: false });
		this.injector.inject("$Reply", `${__dirname}/services/reply`, { instanciate: false });
		this.injector.inject("$Get", `${__dirname}/routes/get`, { instanciate: false });
        this.injector.inject("$Post", `${__dirname}/routes/post`, { instanciate: false });
        this.injector.inject("$Delete", `${__dirname}/routes/delete`, { instanciate: false });
        this.injector.inject("$Put", `${__dirname}/routes/put`, { instanciate: false });
        this.injector.inject("$Patch", `${__dirname}/routes/patch`, { instanciate: false });
        this.injector.inject("$Asset", `${__dirname}/routes/asset`, { instanciate: false });
		this.injector.inject("$http-router", `${__dirname}/http-router`);
		this.injector.inject("$http-assets-loader", `${__dirname}/loaders/assets`);
		this.injector.inject("$http-routes-loader", `${__dirname}/loaders/routes`);
		this.injector.inject("$content-type", `${__dirname}/services/content-type`);
		this.injector.inject("$auth", `${__dirname}/services/auth-jwt-token`, { replace: false });
	};

	async mount() {
		const assets = await this.injector.resolve("$http-assets-loader");
		await assets.load();

		const routes = await this.injector.resolve("$http-routes-loader");
		await routes.load();

		if (this.config.http) await this.createHttpServer(this.config.http);
		if (this.config.https) await this.createHttpsServer(this.config.https);
		if (this.config.http2) await this.createHttp2Server(this.config.http2);
	}

	async unmount() {
		if (this.httpServer) {
			await new Promise((resolve, reject) => this.httpServer.close(resolve));
			console.log(chalk.yellow(`Http server on ${this.config.http.port} is closed.`));
		}
		if (this.httpsServer) {
			await new Promise((resolve, reject) => this.httpsServer.close(resolve));
			console.log(chalk.yellow(`Https server on ${this.config.https.port} is closed.`));
		}
		if (this.http2Server) {
			await new Promise((resolve, reject) => this.http2Server.close(resolve));
			console.log(chalk.yellow(`Https server on ${this.config.http2.port} is closed.`));
		}
	}

	async get(route, service, method, options) {
		const router = await this.injector.resolve("$http-router");
        const item = await router.get(route);
		await item.init(service, method, options);
        return item;
    };

    async asset(route, filepath) {
		const router = await this.injector.resolve("$http-router");
		const item = await router.asset(route);
		await item.init(filepath);
		return item;
    };

    async post(route, service, method, options) {
		const router = await this.injector.resolve("$http-router");
        const item = await router.post(route);
		await item.init(service, method, options);
        return item;
    };

    async put(route, service, method, options) {
		const router = await this.injector.resolve("$http-router");
        const item = await router.put(route);
		await item.init(service, method, options);
        return item;
    };

    async patch(route, service, method, options) {
		const router = await this.injector.resolve("$http-router");
        const item = await router.patch(route);
		await item.init(service, method, options);
        return item;
    };

    async delete(route, service, method, options) {
		const router = await this.injector.resolve("$http-router");
        const item = await router.delete(route);
		await item.init(service, method, options);
        return item;
	};

    async invoke(request, response) {
		try {
			const Ask = await this.injector.resolve("$Ask");
			const Reply = await this.injector.resolve("$Reply");
			const qwebs = await this.injector.resolve("$qwebs");
			const httpRouter = await this.injector.resolve("$http-router");

			const ask = new Ask(request, qwebs);
			const reply = new Reply(ask, response);
			ask.on("error", error => {
				reply.emit("error", error);
			});
			return await httpRouter.invoke(ask, reply);
		}
		catch(error) {
			if (!response.headersSent) {
				response.statusCode = 500;
				response.end("Technical error.");
			}
			console.error(inspect(error));
		}
	};

	async createHttpServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new Error(`Http port is not defined in qwebs config.`);

		this.httpServer = http.createServer();

		if (/true/i.test(config[`redirect-to-http`])) {
			if (!config.host) throw new Error(`Http port is not defined in qwebs config.`);
				
			this.httpServer.on("request", async (request, response) => {
			});
		}
		else {
			this.httpServer.on("request", async (request, response) => {
				await this.invoke(request, response);
			});
		}

		await new Promise((resolve, reject) => this.httpServer.listen(config.port, resolve));
		console.log(chalk.green(`Http server listen ${config.port}.`));
	}

	async createHttpsServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new Error(`Https port is not defined in qwebs config.`);
		if (!config.key) throw new Error(`Https key is not defined in qwebs config.`);
		if (!config.cert) throw new Error(`Https cert is not defined in qwebs config.`);
		if (!config.ca) throw new Error(`Https ca is not defined in qwebs config.`);
		if (config.ca.length != 2) throw new Error(`Https ca is not well defined in qwebs config.`);

		let options = {
			key: fs.readFileSync(config.key),
			cert: fs.readFileSync(config.cert),
			ca: [
				fs.readFileSync(config.ca[0]),
				fs.readFileSync(config.ca[1])
			]
		};

		this.httpsServer = https.createServer(options);
		this.httpsServer.on("request", async (request, response) => {
			try {
				await this.invoke(request, response);
			} catch(error) {
				response.statusCode = error.statusCode || 500;
				response.end(error.message);
			}
		});
		await new Promise((resolve, reject) => this.httpsServer.listen(config.port, resolve));
		console.log(chalk.green(`Https server listen ${config.port}.`));
	}

	async createHttp2Server(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new Error(`Https port is not defined in qwebs config.`);
		if (!config.key) throw new Error(`Https key is not defined in qwebs config.`);
		if (!config.cert) throw new Error(`Https cert is not defined in qwebs config.`);

		//openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout private-key.pem -out certificate.pem
		let options = {
			key: fs.readFileSync(config.key),
			cert: fs.readFileSync(config.cert),
		};

		this.http2Server = http2.createSecureServer(options);
		this.http2Server.on("stream", async (stream, headers) => {
			try {
				const method = headers[':method'];
  				const path = headers[':path'];
				//TODO
				stream.respond({
					':status': 200,
					'content-type': 'text/plain'
				});
				stream.write('hello ');
				stream.end('world');

			} catch(error) {
				response.statusCode = error.statusCode || 500;
				response.end(error.message);
			}
		});
		this.http2Server.on('error', (err) => console.error(err));
		this.http2Server.on('socketError', (err) => console.error(err));

		await new Promise((resolve, reject) => this.http2Server.listen(config.port, resolve));
		console.log(chalk.green(`Https server listen ${config.port}.`));
	}
};

exports = module.exports = HttpServer;