/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Reply extends Throught {
    
    constructor(request, response, $qwebs, $config, options = {}) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");
        const { objectMode } = options;

        super($qwebs, { objectMode });

        this.atime = new Date(Date.now());
        
        this.request = request;
        this.response = response;
        this.config = $config;

        this.pipeStrategies = [this.jsonStrategy, this.htmlStrategy]; /* define strategies */

        this.statusCode = 200;
        this.method = request.method;
        this.outputType = null;             /* object|array => use to configure the stringifier. */
        
        this.headers = {
            "Date": atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'none'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": request.headers["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            "Content-Type": "application/json"
        };

        const acceptEncoding = request.headers["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    async pipeEnd(firstchunk) {
        this.stream = this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy(stream);
        }, this)

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

    async jsonStrategy(stream) {
        if (/application\/json/.test(this.contentType) == false) return stream;

        this.charset();
        this.vary();

        if (typeof firstchunk == "string" || Buffer.isBuffer(firstchunk)) return stream;

        const json = await this.qwebs.resolve("$json-stream");
        const isArray = this.outputType === "object" ? false : true;
        return stream.pipe(json.stringify({ isArray }));
    }

    async htmlStrategy(stream) {
        if (/text\/html/.test(this.contentType) == false) return stream;

        this.charset();
        this.vary();

        return stream;
    }
    
};

module.exports = Reply;
