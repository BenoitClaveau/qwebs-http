/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError } = require("oups");
const { Transform } = require("stream");
const url = require("url");
const querystring = require('querystring');
const http = require("http");
const zlib = require("zlib");
const crypto = require("crypto");

/**
 * 
 * new Response(stream, {
 *   headers: {'Content-Type': 'text/html'}
 * })
 * 
 * stream.pipe(reply)
 */

class Reply extends Transform {
    constructor(request, response) {
        if (!request) return UndefinedError("request");
        if (!response) return UndefinedError("response");
        super({ objectMode: true });
        this.request = request;
        this.response = response;

        const part = url.parse(decodeURI(request.url));
		this.pathname = part.pathname;
        this.querystring = part.query ? querystring.parse(request.part.query) : {};
    }

    invoke() {
        
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

    _transform(chunk, encoding, callback) {
        //gzip
        //json stringify
    }

    pipe(writeable) {
        this.pipe(this.response)
    }
};

module.exports = Reply;
