/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L182
//https://community.risingstack.com/the-definitive-guide-to-object-streams-in-node-js/

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
        this.$qwebs = $qwebs;
        
        this.headers = [];

        const part = url.parse(decodeURI(request.url));
		this.pathname = part.pathname;
        this.querystring = part.query ? querystring.parse(request.part.query) : {};

        this.on("pipe", (destination, options) => this.onpipe(destination, options));
    }

    async mount() {
        this.json = await this.$qwebs.resolve("$json-stream");
        const { headers } = this.request;
        const acceptEncoding = headers["accept-encoding"];

        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    statusCode(value) {
        this.response.statusCode = value;
        return this;
    }

    _transform(chunk, encoding, callback) {
        this.push(chunk); //passthrough
        callback();
    }

    onpipe(destination, options) {
        let stream = this;
        const contentType = this.headers["Content-Type"];
        const contentEncoding = this.headers["Content-Encoding"];

        this.response.writeHead(this.statusCode, this.headers);

        if (/application\/json/.test(contentType)) stream = stream.pipe(json);
        if (/gzip/.test(contentEncoding)) stream = stream.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) stream = stream.pipe(zlib.createDeflate());
        
        stream.pipe(this.response);
    }

    get json() {
        this.headers["Content-Type"] = "application/json";
        return this;
    }
};

module.exports = Reply;
