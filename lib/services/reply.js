/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L182

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
    constructor(request, response, $qwebs) {
        if (!request) return UndefinedError("request");
        if (!response) return UndefinedError("response");
        if (!$qwebs) return UndefinedError("$qwebs");
        super({ objectMode: true });
        this.request = request;
        this.response = response;
        this.$qwebs = $qwebs

        const part = url.parse(decodeURI(request.url));
		this.pathname = part.pathname;
        this.querystring = part.query ? querystring.parse(request.part.query) : {};

        this.on("pipe", (destination, options) => this.onpipe(destination, options));
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
        this.push(JSON.stringify(chunk));
        callback();
    }

    onpipe(destination, options) {
        this.pipe(this.response);
    }
};

module.exports = Reply;
