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
        if ("objectMode" in options == false) options.objectMode = true;
        super($qwebs, options);

        this.request = request;
        this.response = response;
        this.config = $config;
        
        this.headers = [];
        this.statusCode = 200;
        
        this.method = request.method;

        const acceptEncoding = this.request.headers["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";

        this.headers["Content-Type"] = "application/json" //defaut
    }

    async pipeEnd() {
        //en fonction du contentType faire des operations
        const CompressedStream = await this.qwebs.resolve("$CompressedStream");
        const json = await this.qwebs.resolve("$json-stream");
        const isArray = this.outputType === "object" ? false : true;
        this.pipe(json.stringify({ isArray }))
            .pipe(new CompressedStream(this.headers))
            .pipe(this.response);

        this.response.writeHeader(this.statusCode, this.writeableHeaders);
    }

    send(content) {
        this.outputType = "object";
        return this.end(content);
    }

    charset(headers) {
        if (/charset/.test(headers["Content-Type"] == false)) 
            headers["Content-Type"] += "; charset=utf-8";
    }

    vary(headers) {
        headers["Vary"] = "Accept-Encoding";
    }

    get writeableHeaders() {
        let headers = { ...this.headers };

        const contentType = headers["Content-Type"];
        if (/application\/json/.test(contentType)) {
            this.charset(headers);
            this.vary(headers);
        }
        else if (/text\/html/.test(contentType)) {
            this.charset(headers);
            this.vary(headers);
        }
        else throw new HttpError(406)
        
        const atime = new Date(Date.now());
        headers["Date"] = headers["Date"] || atime.toUTCString();
        headers["Cache-Control"] = headers["Cache-Control"] || "no-cache";
        headers["Expires"] = headers["Expires"] || atime.toUTCString();

        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "deny";
        headers["Content-Security-Policy"] = "default-src 'none'";
        
        //TODO use this.config
        headers["Access-Control-Allow-Origin"] = headers["Access-Control-Allow-Origin"] || "*";
        headers["Access-Control-Allow-Methods"] = headers["Access-Control-Allow-Methods"] || headers["Allow"] || this.request.headers["access-control-request-method"] || "*";
        headers["Access-Control-Max-Age"] = headers["Access-Control-Max-Age"] || "3600";
        headers["Access-Control-Allow-Headers"] = headers["Access-Control-Allow-Headers"] || "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With";

        return headers;
    }
};

module.exports = Reply;
