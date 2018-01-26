/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict"

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");
const process = require("process");
const fileType = require("file-type");
const util = require("util");

class Reply extends Throught {
    
    constructor($qwebs, response, requestHeader) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!response) throw new UndefinedError("response");
        if (!requestHeader) throw new UndefinedError("requestHeader");
        super({ objectMode: true });

        this.atime = new Date(Date.now());
        this.qwebs = $qwebs;
        this.response = response;
        this.requestHeader = requestHeader;
        this.mode = "array";             /* object|array => use to configure the stringifier. */
        
        this.statusCode = 200;
        this.headers = {
            "Date": this.atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": this.atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": this.requestHeader["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            //"Content-Type": "application/json" //request.headers["accept"] || 
        };

        const acceptEncoding = this.requestHeader["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";

        this.pipeStrategies = [this.contentTypeStrategy, this.jsonStrategy, this.htmlStrategy]; /* define strategies */

        this.on("error", error => this.onerror(error));
        this.on("pipe", src => this.onpipe(src));
    }

    onpipe(src) {
        src.on("error", error => this.emit("error", error));
    }

    onerror(error) {
        console.error(util.inspect(error));
        if(this.response.headersSent) {
            //TODO addTrailer
        }
        else {
            this.statusCode = error.statusCode || 500;
            const { message } = error;
            //TODO check accept
            this.end({ message })
        }
    }

    async pipeEnd(firstchunk) {
        
        let stream = this;
        for (let strategy of this.pipeStrategies) {
            stream = await strategy.call(this, stream, firstchunk);
        }

        const CompressedStream = await this.qwebs.resolve("$CompressedStream");
        const compressor = new CompressedStream(this)
        
        this.response.writeHead(this.statusCode, this.headers);

        stream.pipe(compressor.stream)
              .pipe(this.response);
    }

    get obj() {
        this.mode = "object";
        return this;
    }

    get contentType() {
        return this.headers["Content-Type"];
    }
    
    set contentType(value) {
        this.headers["Content-Type"] = value;
    }

    charset() {
        if (/charset/.test(this.headers["Content-Type"] == false)) 
            this.headers["Content-Type"] += "; charset=utf-8";
    }

    vary() {
        this.headers["Vary"] = "Accept-Encoding";
    }

    /* extensions */
    async forward(url) {
        const { ask, qwebs } = this;
        const router = await qwebs.resolve("$http-router");
        return await router.invoke(ask, this, url);
    }

    /* strategies */
    async contentTypeStrategy(stream, firstchunk) {
        if (this.contentType) return stream;

        if (Buffer.isBuffer(firstchunk) || typeof firstchunk == "string") {
            const filetype = fileType(firstchunk);
            if (filetype) {
                this.contentType = filetype.mime;
                return stream;
            }
        }
        else if (firstchunk instanceof Object) {
            this.contentType = "application/json";
            return stream;
        }

        if (this.requestHeader["accept"]) {
            const accepts = this.requestHeader["accept"].split(",");
            if (accepts.length == 1) {
                this.contentType = accepts.shift();
                return stream;
            }
        }
        throw new Error("Content-Type couldn't be determinate for ${ask.request.url}", { ask: this.ask })
    }

    async jsonStrategy(stream, firstchunk) {
        if (/application\/json/.test(this.contentType) == false) return stream;

        this.charset();
        this.vary();

        if (typeof firstchunk == "string" || Buffer.isBuffer(firstchunk)) return stream;

        const json = await this.qwebs.resolve("$json-stream");
        const isArray = this.mode == "array";
        return stream.pipe(json.stringify({ isArray }));
    }

    async htmlStrategy(stream, firstchunk) {
        if (/text\/html/.test(this.contentType) == false) return stream;

        this.charset();
        this.vary();

        return stream;
    }
    
};

module.exports = Reply;
