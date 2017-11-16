/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Ask extends Throught {
    
    constructor(request, $qwebs, $config, options = {}) {
        if (!request) throw new UndefinedError("request");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");
        const { objectMode } = options;

        super($qwebs, { objectMode });

        this.atime = new Date(Date.now());
        
        this.request = request;
        this.config = $config;

        this.pipeStrategies = [this.jsonStrategy, this.htmlStrategy]; /* define strategies */

        this.on("pipe", (stream) => this.onpipe(stream));
    }

    async onpipe(stream) {
        const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy.call(this, stream, firstchunk);
        }, this)

        stream.pipe(new CompressedStream(this.headers))
              .pipe(this.response);

        this.response.writeHeader(this.statusCode, this.headers);
    }

    get contentType() {
        return this.headers["Content-Type"];
    }

    set contentType(value) {
        this.headers["Content-Type"] = value;
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

module.exports = Ask;
