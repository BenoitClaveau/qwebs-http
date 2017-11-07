/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
`use strict`;

const { Error, HttpError } = require("oups");
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);

class HttpServer {
  	constructor($injector, $config, $event) {
		if (!$config) throw new Error(`Qwebs config is not defined.`);
		if (!$config.http && !$config.https) throw new Error(`Qwebs http or https config is not defined.`);

		$injector.inject("IsItForMe", "isitforme", { instanciate: false });
		$injector.inject("Reply", "./services/reply", { local: true, instanciate: false });
		
		// $injector.inject("$response", "./services/response", { local: true });
        // $injector.inject("$bundleLoader", "./loaders/bundle", { local: true });
        // $injector.inject("$assetsLoader", "./loaders/assets", { local: true });
		// $injector.inject("$httpRoutesLoader", "./loaders/http-routes", { local: true });
		// $injector.inject("$httpRouter", "./http-router", { local: true });
		
		$injector.inject("$http", this);

		this.httpServer = null;
		this.httpsServer = null;
		this.$injector = $injector;
		this.$config = $config;
		this.$event = $event;
	};

	async mount() {
		this.router = await this.resolve("$httpRouter");
		if (this.$config.http) this.createHttpServer(this.$config.http);
        if (this.$config.https) this.createHttpsServer(this.$config.https);
	}

	async unmount() {
		this.httpServer && this.httpServer.close();
		this.httpsServer && this.httpsServer.close();
	}

	get(route, service, method, options) {
        let item = this.router.get(route);
        item.register(service, method, options);
        return item;
    };

    asset(route) {
        return this.resolve("$httpRouter").asset(route);
    };

    post(route, service, method, options) {
        let item = this.router.post(route);
        item.register(service, method, options);
        return item;
    };

    put(route, service, method, options) {
        let item = this.router.put(route);
        item.register(service, method, options);
        return item;
    };

    patch(route, service, method, options) {
        let item = this.router.patch(route);
        item.register(service, method, options);
        return item;
    };

    delete(route, service, method, options) {
        let item = this.router.delete(route);
        item.register(service, method, options);
        return item;
    };

    async invoke(request, response, overriddenUrl) {
		if (overriddenUrl) request.url = overriddenUrl;
		return await this.router.invoke(request, response);
	};

	createHttpServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new Error(`Http port is not defined in qwebs config.`);

		this.httpServer = http.createServer();

		if (/true/i.test(config[`redirect-to-http`])) {
			if (!config.host) throw new Error(`Http port is not defined in qwebs config.`);
				
			this.httpServer.on("request", (request, response) => {
				console.warning("TODO")
				//response.redirect({ url: `${config.host}${request.url}` });
			});
		}
		else {
			this.httpServer.on("request", (request, response) => {
				this.invoke(request, response);
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
		this.httpsServer.on("request", (request, response) => {
			this.invoke(request, response);
		});
		this.httpsServer.listen(config.port);
	}
};

exports = module.exports = HttpServer;