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

class Context extends Transform {
    constructor(request, response, $qwebs) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        super({ objectMode: true });
        this.request = request;
        this.response = response;
        this.qwebs = $qwebs;
        this.stream = this;        
        this.method = request.method;
        this.headers = [];
        this.statusCode = 200;
        this.first = true;
        this.piped = 0;
        this.outputType = null; //string|array|buffer|object  //lazy determinated

        const part = url.parse(decodeURI(request.url));
        this.pathname = part.pathname;
        this.query = part.query ? querystring.parse(part.query) : {};

        const acceptEncoding = this.request.headers["accept-encoding"];

        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";

        this.headers["Content-Type"] = "application/json";
        
        this.on("pipe", src => this.onpipe(src));
        this.on("unpipe", src => this.onunpipe(src));
        this.on("error", error => this.onerror(error));      
    }

    getOutputType(contentType) {
        if (this.outputType) return this.outputType;
        if (/application\/json/.test(contentType)) {
            return this.piped > 0 ? "array" : "object";
        }
        throw new Error("Default outputType couldn't be determinated.");
    }

    async mountpipe() {
        this.first = false;
        const contentType = this.headers["Content-Type"];
        this.outputType = this.getOutputType(contentType);
        if (/application\/json/.test(contentType)) {
            const json = await this.qwebs.resolve("$json-stream");
            this.stream = this.pipe(json.stringify({ isArray: this.outputType == "array" }));
        }
        const contentEncoding = this.headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createDeflate());
        
        this.stream = this.stream.pipe(this.response);
        this.response.writeHead(this.statusCode, this.headers);
    }

    onnext() {
        if (this.outputType == "object") throw new Error("Multiple chunk with outputType defined as a object.")
    }

    async _transform(chunk, encoding, callback) {
        try {
            if (this.first) await this.mountpipe()
            else this.onnext()
            this.push(chunk, encoding); //passthrough
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    onpipe(src) {
        this.piped++;
    }

    onunpipe(src) {
        this.piped--;
    }

    onerror(error) {
        if (this.response.headersSent) {
            this.response.addTrailers({ "error": error.message });
            this.end();
        }
        else {
            this.statusCode = error.statusCode || 500;
            this.end();
        }
    }

    end(chunk, encoding, cb) {
        if (!chunk && this.first) this.mountpipe(); //otherwise mountpipe will not be called
        super.end(chunk, encoding, cb);
    }

    //TODO override end if (no args)
};

module.exports = Context;
