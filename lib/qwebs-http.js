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

class HttpServer {
  	constructor($injector, $config, $event) {
		if (!$config) throw new Error(`Qwebs config is not defined.`);
		if (!$config.http && !$config.https) throw new Error(`Qwebs http or https config is not defined.`);

		this.httpServer = null;
		this.httpsServer = null;
		this.injector = $injector;
		this.config = $config;
		this.event = $event;
	};

	async mount() {
		await this.injector.inject("$IsItForMe", "isitforme", { instanciate: false });
		await this.injector.inject("$OptionsLeaf", `${__dirname}/router/options-leaf`, { instanciate: false });
		await this.injector.inject("$CompressedStream", `${__dirname}/services/compressed-stream`, { instanciate: false });
		await this.injector.inject("$Ask", `${__dirname}/services/ask`, { instanciate: false });
		await this.injector.inject("$Reply", `${__dirname}/services/reply`, { instanciate: false });
		await this.injector.inject("$Get", `${__dirname}/routes/get`, { instanciate: false });
        await this.injector.inject("$Post", `${__dirname}/routes/post`, { instanciate: false });
        await this.injector.inject("$Delete", `${__dirname}/routes/delete`, { instanciate: false });
        await this.injector.inject("$Put", `${__dirname}/routes/put`, { instanciate: false });
        await this.injector.inject("$Patch", `${__dirname}/routes/patch`, { instanciate: false });
        await this.injector.inject("$Asset", `${__dirname}/routes/asset`, { instanciate: false });
		await this.injector.inject("$http-router", `${__dirname}/http-router`);
		await this.injector.inject("$http-assets-loader", `${__dirname}/loaders/assets`);
		await this.injector.inject("$http-routes-loader", `${__dirname}/loaders/routes`);

		this.router = await this.injector.resolve("$http-router");
		this.Ask = await this.injector.resolve("$Ask");
		this.Reply = await this.injector.resolve("$Reply");

		await this.injector.resolve("$http-assets-loader"); //mount assets
		await this.injector.resolve("$http-routes-loader"); //mount routes

		if (this.config.http) this.createHttpServer(this.config.http);
		if (this.config.https) this.createHttpsServer(this.config.https);
	}

	async unmount() {
		this.httpServer && this.httpServer.close();
		this.httpsServer && this.httpsServer.close();
	}

	async get(route, service, method, options) {
        const item = await this.router.get(route);
        item.init(service, method, options);
        return item;
    };

    async asset(route, filepath) {
		const item = await this.router.asset(route);
		item.filepath = filepath;
		return item;
    };

    async post(route, service, method, options) {
        const item = await this.router.post(route);
        item.init(service, method, options);
        return item;
    };

    async put(route, service, method, options) {
        const item = await this.router.put(route);
        item.init(service, method, options);
        return item;
    };

    async patch(route, service, method, options) {
        const item = await this.router.patch(route);
        item.init(service, method, options);
        return item;
    };

    async delete(route, service, method, options) {
        const item = await this.router.delete(route);
        item.init(service, method, options);
        return item;
	};

    async invoke(request, response, overriddenUrl) {
		try {
			const { Ask, Reply, injector, router } = this;
			if (overriddenUrl) request.url = overriddenUrl;
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
		this.httpServer.listen(config.port);		
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
		this.httpsServer.listen(config.port);
	}
};

exports = module.exports = HttpServer;