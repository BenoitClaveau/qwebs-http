/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Reply extends Throught {
    
    constructor(request, response, $qwebs, $config, options = {}) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");

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

        this.headers["Content-type"] = "application/json" //defaut
    }

    async pipeEnd() {
        //en fonction du contentType faire des operations
        const CompressedStream = await this.qwebs.resolve("$CompressedStream");
        const json = await this.qwebs.resolve("$json");
        this.pipe(json.stringify())
            .pipe(new CompressedStream(this.headers))
            .pipe(this.response);

        this.response.writeHeader(this.statusCode, this.writeableHeaders);
    }

    charset(headers) {
        if (/charset/.test(headers["Content-Type"] == false)) 
            headers["Content-Type"] += "; charset=utf-8";
    }

    vary(headers) {
        headers["Vary"] = "Accept-Encoding";
    }

    get writeableHeaders() {
        const contentType = this.headers["Content-Type"];
        if (/application\/json/.test(contentType)) {
            this.charset(this.headers);
            this.vary(this.headers);
        }
        else if (/text\/html/.test(contentType)) {
            this.charset(this.headers);
            this.vary(this.headers);
        }
        else throw new HttpError(406)
        
        const atime = new Date(Date.now());
        this.headers["Date"] = this.headers["Date"] || atime.toUTCString();
        this.headers["Cache-Control"] = this.headers["Cache-Control"] || "no-cache";
        this.headers["Expires"] = this.headers["Expires"] || atime.toUTCString();

        this.headers["X-Content-Type-Options"] = "nosniff";
        this.headers["X-Frame-Options"] = "deny";
        this.headers["Content-Security-Policy"] = "default-src 'none'";
        
        //TODO use this.config
        this.headers["Access-Control-Allow-Origin"] = this.headers["Access-Control-Allow-Origin"] || "*";
        this.headers["Access-Control-Allow-Methods"] = this.headers["Access-Control-Allow-Methods"] || this.headers["Allow"] || this.request.headers["access-control-request-method"] || "*";
        this.headers["Access-Control-Max-Age"] = this.headers["Access-Control-Max-Age"] || "3600";
        this.headers["Access-Control-Allow-Headers"] = this.headers["Access-Control-Allow-Headers"] || "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With";

        return this.headers;
    }
};

module.exports = Reply;
