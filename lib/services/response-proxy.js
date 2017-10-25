/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const http = require("http");

class ResponseProxy {
    constructor($response) {
        http.ServerResponse.prototype.redirect = function(data) {
            return $response.redirect(this, data);
        };

        http.ServerResponse.prototype.send = function(data) {
            return $response.send(this, data);
        };

        http.ServerResponse.prototype.stream = function(stream) {
            return $response.stream(this, data);
        };
    };
};

/**
 * response.send(200, "beurk", "application/json");
 * response.pipe(200, stream, "application/json")
 */

exports = module.exports = ResponseProxy;