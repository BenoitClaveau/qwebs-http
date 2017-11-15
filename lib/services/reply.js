/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const CompressedStream = require("./streams/compressed");
const DynamicStream = require("./streams/dynamic");

class Reply extends DynamicStream {
    
    constructor(request, response, $qwebs, options) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");

        super(options);

        this.request = request;
        this.response = response;
        this.qwebs = $qwebs;
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
        const json = await this.qwebs.resolve("$json");
        const stream = this.pipe(json.stringify());
        super.pipeEnd(stream);
    }
};

module.exports = Reply;
