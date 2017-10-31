/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError } = require("oups");
const { Transform } = require("stream");
const http = require("http");
const zlib = require("zlib");
const crypto = require("crypto");

class Reply extends Transform {
    constructor(request, response, options = {}) {
        if (request) return UndefinedError("request");
        if (response) return UndefinedError("response");
        options.objectMode = true;
        super(options);
        this.request = request;
        this.response = response;
    }

    set statusCode(value) {
        this.response.statusCode = value;
        return this;
    }

    send(content) {
        //gzip
        //json stringify

        return this;
    }

    transform(chunk, encoding, callback) {
        //gzip
        //json stringify
    }

    pipe(writeable) {
        this.pipe(this.response)
    }
};

module.exports = Reply;
