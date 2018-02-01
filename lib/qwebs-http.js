/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
`use strict`;

const { Error, UndefinedError, HttpError } = require("oups");
const fs = require(`fs`);
const path = require(`path`);
const http = require(`http`);
const https = require(`https`);
const http2 = require(`http2`);
const chalk = require(`chalk`);
const { inspect } = require(`util`);

class HttpServer {
  	constructor($injector, $config, $event) {
		if (!$config) throw new UndefinedError(`Qwebs config`);
		if (!$config.http && !$config.https && !$config.http2) throw new UndefinedError(`Qwebs http, https or http2 config`);

		this.httpServer = null;
		this.httpsServer = null;
		this.http2SecureServer = null;
		this.http2Server = null;
		this.injector = $injector;
		this.config = $config;
		this.event = $event;

		this.injector.inject("$querystring", `${__dirname}/services/querystring`);
		this.injector.inject("$IsItForMe", `${__dirname}/services/isitforme`, { instanciate: false });
		this.injector.inject("$OptionsLeaf", `${__dirname}/router/options-leaf`, { instanciate: false });
		this.injector.inject("$CompressedStream", `${__dirname}/services/compressed-stream`, { instanciate: false });
		this.injector.inject("$context-factory", `${__dirname}/services/context-factory`);
		this.injector.inject("$Get", `${__dirname}/routes/get`, { instanciate: false });
        this.injector.inject("$Post", `${__dirname}/routes/post`, { instanciate: false });
        this.injector.inject("$Delete", `${__dirname}/routes/delete`, { instanciate: false });
        this.injector.inject("$Put", `${__dirname}/routes/put`, { instanciate: false });
        this.injector.inject("$Patch", `${__dirname}/routes/patch`, { instanciate: false });
        this.injector.inject("$Asset", `${__dirname}/routes/asset`, { instanciate: false });
        this.injector.inject("$AskReply", `${__dirname}/services/ask-reply`, { instanciate: false });
		this.injector.inject("$http-router", `${__dirname}/http-router`);
		this.injector.inject("$http-assets-loader", `${__dirname}/loaders/assets`);
		this.injector.inject("$http-routes-loader", `${__dirname}/loaders/routes`);
		this.injector.inject("$content-type", `${__dirname}/services/content-type`);
		this.injector.inject("$auth", `${__dirname}/services/auth-jwt-token`, { replace: false });
	};

	async mount() {
		const assets = await this.injector.resolve("$http-assets-loader");
		const routes = await this.injector.resolve("$http-routes-loader");
		this.router = await this.injector.resolve("$http-router");
		
		await assets.load();
		await routes.load();

		if (this.config.http) await this.createHttpServer(this.config.http);
		if (this.config.https) await this.createHttpsServer(this.config.https);
		if (this.config.http2) await this.createHttp2SecureServer(this.config.http2);
		if (this.config["http2-unsecure"]) await this.createHttp2Server(this.config["http2-unsecure"]);
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
		if (this.http2SecureServer) {
			await new Promise((resolve, reject) => this.http2SecureServer.close(resolve));
			console.log(chalk.yellow(`Https server on ${this.config.http2.port} is closed.`));
		}
		if (this.http2Server) {
			await new Promise((resolve, reject) => this.http2Server.close(resolve));
			console.log(chalk.yellow(`Https server on ${this.config["http2-unsecure"].port} is closed.`));
		}
	}

	async get(route, service, method, options) {
		const item = await this.router.get(route);
		await item.init(service, method, options);
        return item;
    };

    async asset(route, filepath) {
		const item = await this.router.asset(route);
		await item.init(filepath);
		return item;
    };

    async post(route, service, method, options) {
        const item = await this.router.post(route);
		await item.init(service, method, options);
        return item;
    };

    async put(route, service, method, options) {
        const item = await this.router.put(route);
		await item.init(service, method, options);
        return item;
    };

    async patch(route, service, method, options) {
        const item = await this.router.patch(route);
		await item.init(service, method, options);
        return item;
    };

    async delete(route, service, method, options) {
        const item = await this.router.delete(route);
		await item.init(service, method, options);
        return item;
	};

    async invoke(request, response) {
		try {
			const factory = await this.injector.resolve("$context-factory");
			
			const headers = factory.getHeaders(request);
			const context = factory.getContext(request);

			const stream = await factory.getStream(request, response, headers);

			return await this.router.invoke(context, stream, headers);
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
		if (!config.port) throw new UndefinedError(`Http port`);

		this.httpServer = http.createServer();

		if (/true/i.test(config[`redirect-to-http`])) {
			if (!config.host) throw new UndefinedError(`Http host`);
				
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
		if (!config.port) throw new UndefinedError(`Https port`);
		if (!config.key) throw new UndefinedError(`Https key`);
		if (!config.cert) throw new UndefinedError(`Https cert`);
		if (!config.ca) throw new UndefinedError(`Https ca`);
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
			await this.invoke(request, response);
		});
		
		await new Promise((resolve, reject) => this.httpsServer.listen(config.port, resolve));
		console.log(chalk.green(`Https server listen ${config.port}.`));
	}

	async createHttp2SecureServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new UndefinedError(`Http2 port`);
		if (!config.key) throw new UndefinedError(`Https key`);
		if (!config.cert) throw new UndefinedError(`Https cert`);

		//openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout private-key.pem -out certificate.pem
		const options = {
			key: fs.readFileSync(config.key),
			cert: fs.readFileSync(config.cert),
			allowHTTP1: true
		};
		this.http2SecureServer = http2.createSecureServer(options);
		this.http2SecureServer.on("request", async (request, response) => {
			await this.invoke(request, response);
		});

		// this.http2Server.on("stream", async (stream, headers, flags) => {
		// 	await this.invoke2(stream, headers, flags);
		// });

		this.http2SecureServer.on('error', (err) => {
			console.error(err)
		});
		this.http2SecureServer.on('socketError', (err) => {
			console.error(err)
		});

		await new Promise((resolve, reject) => this.http2SecureServer.listen(config.port, resolve));
		console.log(chalk.green(`Http2 server listen ${config.port}.`));
	}

	async createHttp2Server(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new UndefinedError(`http2-unsecure port`);

		const options = {
			allowHTTP1: true
		};
		this.http2Server = http2.createServer(options);
		this.http2Server.on("request", async (request, response) => {
			await this.invoke(request, response);
		});

		this.http2Server.on("stream", async (stream, headers, flags) => {
			await this.invoke2(stream, headers, flags);
		});

		this.http2Server.on('error', (err) => {
			console.error(err)
		});
		this.http2Server.on('socketError', (err) => {
			console.error(err)
		});

		await new Promise((resolve, reject) => this.http2Server.listen(config.port, resolve));
		console.log(chalk.green(`Http2 unsecure server listen ${config.port}.`));
	}
};

exports = module.exports = HttpServer;