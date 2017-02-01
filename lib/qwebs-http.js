/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau
 * MIT Licensed
 */
"use strict";

const DataError = require("qwebs").DataError;
const http = require("http");

class HttpServer {
  constructor($config, $qwebs) {
		if (!$config) throw new DataError({ message: "[HttpServer] Qwebs config is not defined."});
		this.$config = $config;
		this.$qwebs = $qwebs;
			
		http.createServer((request, response) => {
				return this.$qwebs.invoke(request, response);
		}).listen(this.$config.https.port)
	};
};

exports = module.exports = HttpServer;
