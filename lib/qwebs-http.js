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
const chalk = require(`chalk`);

class HttpServer {
  	constructor($injector, $config, $event) {
		if (!$config) throw new Error(`Qwebs config is not defined.`);
		if (!$config.http && !$config.https) throw new Error(`Qwebs http or https config is not defined.`);

		this.httpServer = null;
		this.httpsServer = null;
		this.injector = $injector;
		this.config = $config;
		this.event = $event;

		this.injector.inject("$IsItForMe", "isitforme", { instanciate: false });
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
		this.injector.inject("$auth", `${__dirname}/services/auth-jwt-token`);
	};

	async mount() {
		this.router = await this.injector.resolve("$http-router");
		this.Ask = await this.injector.resolve("$Ask");
		this.Reply = await this.injector.resolve("$Reply");

		await this.injector.resolve("$http-assets-loader"); //mount assets
		await this.injector.resolve("$http-routes-loader"); //mount routes

		if (this.config.http) this.createHttpServer(this.config.http);
		if (this.config.https) this.createHttpsServer(this.config.https);
	}

	async unmount() {
		this.httpServer && this.httpServer.close(() => console.log(chalk.yellow(`Http server is closed.`)));
		this.httpsServer && this.httpsServer.close(() => console.log(chalk.yellow(`Https server is closed.`)));
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
			const { Ask, Reply, injector, router } = this;
			const qwebs = await injector.resolve("$qwebs");
			const ask = new Ask(request, qwebs);
			const reply = new Reply(ask, response);
			ask.on("error", error => {
				reply.emit("error", error);
			});
			return await router.invoke(ask, reply);
		}
		catch(error) {
			//this error should never appears
			if (!response.headersSent) {
				console.error(error);
				response.statusCode = 500;
				response.end("Technical error.");
			}
			else {
				console.error(error);
			}
		}
	};

	createHttpServer(config) {
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
		this.httpServer.listen(config.port, () => console.log(chalk.green(`Http server listen ${config.port}.`)));
	}

	createHttpsServer(config) {
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
		this.httpsServer.listen(config.port, () => console.log(chalk.green(`Https server listen ${config.port}.`)));	
	}
};

exports = module.exports = HttpServer;