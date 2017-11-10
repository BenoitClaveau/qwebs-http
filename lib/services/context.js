/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L182
//https://community.risingstack.com/the-definitive-guide-to-object-streams-in-node-js/
//https://javascriptexamples.info/

const { UndefinedError } = require("oups");
const { Transform } = require("stream");
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const zlib = require("zlib");
const crypto = require("crypto");

/**
 * 
 * new Response(stream, {
 *   headers: {'Content-Type': 'text/html'}
 * })
 * 
 * stream.pipe(context)
 */

class Context extends Transform {
    constructor(request, response, $qwebs) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        super({ objectMode: true });
        this.request = request;
        this.response = response;
        this.qwebs = $qwebs;
        
        this.method = request.method;
        this.headers = [];
        this.statusCode = 200;

        this.on("pipe", (destination, options) => this.onpipe(destination, options));

        const part = url.parse(decodeURI(request.url));
        this.pathname = part.pathname;
        this.query = part.query ? querystring.parse(part.query) : {};

        this.header("Content-Type", "application/json");
    }

    async mount() {
        this.json = await this.qwebs.resolve("$json-stream");
        const { headers } = this.request;
        const acceptEncoding = headers["accept-encoding"];

        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    _transform(chunk, encoding, callback) {
        try {
            this.push(chunk, encoding); //passthrough
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    header(key, value) {
        this.headers[key] = value;
        return this;
    }

    _pipeToResponse(options = {}) {
        let stream = this;
        const contentType = this.headers["Content-Type"];
        const contentEncoding = this.headers["Content-Encoding"];

        if (/application\/json/.test(contentType)) {
            const { array, objectMode } = options;
            stream = stream.pipe(this.json.stringify({ objectMode, array }));
        }
        if (/gzip/.test(contentEncoding)) stream = stream.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) stream = stream.pipe(zlib.createDeflate());
        
        this.response.writeHead(this.statusCode, this.headers);
        stream.pipe(this.response);
    }

    /**
     * reply.send(Object) 
     * reply.send(Array) 
     * stream.pipe(reply)
     */
    onpipe() {
        this._pipeToResponse();
    }

    send(content, options = {}) {
        if (!content) throw new UndefinedError("content");

        let { objectMode, array } = options;
        array = array || Array.isArray(content);
        this._pipeToResponse({ objectMode, array });
        if (array) content.map(item => this.push(item));
        else this.push(content);
        this.push(null);
    }
};

module.exports = Context;
