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
  	constructor($qwebs, $config, $event) {
		if (!$config) throw new Error(`Qwebs config is not defined.`);
		if (!$config.http && !$config.https) throw new Error(`Qwebs http or https config is not defined.`);

		$qwebs.inject("$response", "./services/response", { local: true });
        $qwebs.inject("$bundleLoader", "./loaders/bundle", { local: true });
        $qwebs.inject("$assetsLoader", "./loaders/assets", { local: true });
		$qwebs.inject("$httpRoutesLoader", "./loaders/http-routes", { local: true });
		$qwebs.inject("$httpRouter", "./http-router", { local: true });
		$qwebs.inject("$http", this);

		this.httpServer = null;
		this.httpsServer = null;
		this.$qwebs = $qwebs;
		this.$config = $config;
		this.$event = $event;
		
		this.$event.on("dispose", () => this.close());
	};
	load() {
		if (this.$config.http) this.createHttpServer(this.$config.http);
        if (this.$config.https) this.createHttpsServer(this.$config.https);
	}

	get(route, service, method, options) {
        let item = this.resolve("$httpRouter").get(route);
        item.register(service, method, options);
        return item;
    };

    asset(route) {
        return this.resolve("$httpRouter").asset(route);
    };

    post(route, service, method, options) {
        let item = this.resolve("$httpRouter").post(route);
        item.register(service, method, options);
        return item;
    };

    put(route, service, method, options) {
        let item = this.resolve("$httpRouter").put(route);
        item.register(service, method, options);
        return item;
    };

    patch(route, service, method, options) {
        let item = this.resolve("$httpRouter").patch(route);
        item.register(service, method, options);
        return item;
    };

    delete(route, service, method, options) {
        let item = this.resolve("$httpRouter").delete(route);
        item.register(service, method, options);
        return item;
    };

    invoke(request, response, overriddenUrl) {
        return Promise.resolve().then(() => {
            if (overriddenUrl) request.url = overriddenUrl;
            request.part = url.parse(decodeURI(request.url));
            request.pathname = request.part.pathname;
            request.query = request.part.query ? qs.parse(request.part.query) : {};
            return this.resolve("$httpRouter").invoke(request, response);
        }).catch(error => {
            if (!(error instanceof HttpError)) throw new HttpError(500, error);
            throw error;
        });
    };

    onInjectorChanged(current, previous) {
        if (current.name === "$response") { //need to rebind wrapper
            this.resolve("$responseProxy", { reload: true }); //force to reload;
        }
    }

	createHttpServer(config) {
		if (/false/i.test(config.start)) return;
		if (!config.port) throw new Error(`Http port is not defined in qwebs config.`);

		if (/true/i.test(config[`redirect-to-http`])) {
			if (!config.host) throw new Error(`Http port is not defined in qwebs config.`);

			this.httpServer = http.createServer((request, response) => {
				return response.redirect({ url: `${config.host}${request.url}` }).catch(response.send.bind(response));
			});
			this.httpServer.listen(config.port);
		}
		else {
			this.httpServer = http.createServer((request, response) => {
				return this.invoke(request, response).catch(response.send.bind(response));
			});
			this.httpServer.listen(config.port);
		}
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

		this.httpsServer = https.createServer(options, (request, response) => {
			return this.invoke(request, response).catch(response.send.bind(response));
		});
		this.httpServer.listen(config.port);
	}

	close() {
		this.httpServer && this.httpServer.close();
		this.httpsServer && this.httpsServer.close();
	}
};

exports = module.exports = HttpServer;