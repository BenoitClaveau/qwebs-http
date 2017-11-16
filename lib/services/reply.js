/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Reply extends Throught {
    
    constructor(ask, response, options = {}) {
        if (!ask) throw new UndefinedError("ask");
        if (!response) throw new UndefinedError("response");
        const { objectMode } = options;

        super(ask.qwebs, { objectMode });

        this.atime = new Date(Date.now());
        this.ask = ask;
        this.response = response;
        
        this.pipeStrategies = [this.jsonStrategy, this.htmlStrategy]; /* define strategies */

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
            "Content-Type": "application/json" //request.headers["accept"] || 
        };

        const acceptEncoding = this.requestHeader["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    get requestHeader() {
        return this.ask.request.headers;
    }

    async pipeEnd(firstchunk) {
        const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy.call(this, stream, firstchunk);
        }, this)

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
