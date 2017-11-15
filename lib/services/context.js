/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L182
//https://community.risingstack.com/the-definitive-guide-to-object-streams-in-node-js/
//https://javascriptexamples.info/

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const zlib = require("zlib");
const crypto = require("crypto");

class ResponseStream extends Transform {
    
    constructor(context, options = {}) {
        if (!context) throw new UndefinedError("context");
        super(options);
        this.stream = this;
        
        const contentEncoding = context.headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createDeflate());

        this.stream = this.stream.pipe(context.response);
        this.response.writeHead(context.statusCode, context.headers);
    }

    _transform(chunk, encoding, callback) {
        try {
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }
}

class JsonStream extends Transform {
    constructor($json, context, jsonOptions = {}, streamOptions = {}) {
        if (!context) throw new UndefinedError("context");
        super({ ...streamOptions, objectMode: true });
        this.context = context;
        this.jsonOptions = jsonOptions;
        this.first = true;
    }

    _transform(chunk, encoding, callback) {
        try {
            if (this.first) {
                this.first = false;
                this.pipe($json.stringify(this.jsonOptions)).pipe(new ResponseStream(this.context))
            }
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    end(chunk, encoding, callback) {
        if (this.first && !this.jsonOptions.outputType) this.jsonOptions.outputType == "object";
        super.end(chunk, encoding, callback);
    }
}

class Context {
    
    constructor(request, response, $qwebs) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");

        this.request = request;
        this.response = response;
        this.qwebs = $qwebs;
        this.headers = [];
        this.statusCode = 200;
        
        this.method = request.method;
        const part = url.parse(decodeURI(request.url));
        this.pathname = part.pathname;
        this.query = part.query ? querystring.parse(part.query) : {};

        const acceptEncoding = this.request.headers["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    async get json() {
        this.headers["Content-Type"] = "application/json";
        const json = await this.qwebs.resolve("$json");
        return new JsonStream(json, this);
    } 
};

module.exports = Context;
