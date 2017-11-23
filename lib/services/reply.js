/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");
const process = require("process");
const fileType = require("file-type");

class Reply extends Throught {
    
    constructor(ask, response) {
        if (!ask) throw new UndefinedError("ask");
        if (!response) throw new UndefinedError("response");

        super({ objectMode: true });
        this.on("error", error => this.onerror(error));

        this.atime = new Date(Date.now());
        this.ask = ask;
        this.response = response;
        
        this.pipeStrategies = [this.contentTypeStrategy, this.jsonStrategy, this.htmlStrategy]; /* define strategies */

        this.statusCode = 200;
        this.method = this.ask.request.method;
        this.outputType = null;             /* object|array => use to configure the stringifier. */
        
        this.headers = {
            "Date": this.atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": this.atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'none'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": this.requestHeader["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            //"Content-Type": "application/json" //request.headers["accept"] || 
        };

        const acceptEncoding = this.requestHeader["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    onerror(error) {
        if(this.response.headersSent) {
            console.error(error);
            //TODO addTrailer
        }
        else {
            this.statusCode = error.statusCode || 500;
            this.end(error.message)
        }
    }

    get qwebs() {
        return this.ask.qwebs;
    }

    get requestHeader() {
        return this.ask.request.headers;
    }

    async pipeEnd(firstchunk) {
        let stream = this;
        for (let strategy of this.pipeStrategies) {
            stream = await strategy.call(this, stream, firstchunk);
        }

        const CompressedStream = await this.qwebs.resolve("$CompressedStream");

        stream.pipe(new CompressedStream(this.headers))
               .pipe(this.response);

        this.response.writeHeader(this.statusCode, this.headers);
    }

    end(chunk, encoding, callback) {
        if (this.first && chunk) this.outputType = "object";
        super.end(chunk, encoding, callback)
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

    /* strategies */
    async contentTypeStrategy(stream, firstchunk) {
        const filetype = fileType(firstchunk);
        if (!this.contentType && filetype) this.contentType = filetype.mime;
        return stream;
    }

    async jsonStrategy(stream, firstchunk) {
        if (/application\/json/.test(this.contentType) == false) return stream;

        this.charset();
        this.vary();

        if (typeof firstchunk == "string" || Buffer.isBuffer(firstchunk)) return stream;

        const json = await this.qwebs.resolve("$json-stream");
        const isArray = this.outputType === "object" ? false : true;
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
