/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const http = require("http");
const zlib = require("zlib");
const crypto = require('crypto');

class Response {
    get status() {
        return this.statusCode;
    }
};

module.exports = Object.Assign(http.ServerResponse.prototype, Response.prototype)
