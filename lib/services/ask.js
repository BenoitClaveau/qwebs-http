/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

//https://github.com/jsantell/stream-request/blob/master/index.js
//https://github.com/expressjs/body-parser

const { UndefinedError, Error, HttpError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Ask extends Throught {
    
    constructor(request, $qwebs, $config) {
        if (!request) throw new UndefinedError("request");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");
       
        super({ objectMode: true });
        
        this.atime = new Date(Date.now());
        this.request = request;
        this.qwebs = $qwebs;
        this.config = $config;

        this.params = {};
        this.query = {};
        this.inputType = null;             /* object|array => use to configure the stringifier. */
        this.destinations = [];

        this.pipeStrategies = [this.jsonStrategy]; /* define strategies */

        this.request.pipe(this);
        this.on("pipe", this.onpipe.bind(this))
    }

    onpipe(src, opts, e1, e2) {
        this.pipeDest.push(src);
    }

    pipe(destination, options = {}) {
        if (!options.locked) this.destinations.push(destination);
        return super.pipe(destination)
    }

    unpipe(destination, options = {}) {
        if (!options.locked) {
            const index = this.destinations.indexOf(destination);
            if (index !== -1) this.destinations.splice(index, 1);
        }
        return super.unpipe(destination)
    }

    async pipeEnd(firstchunk) {
        this.destinations.map(p => this.unpipe(p, { locked: true }));
        
        const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy.call(this, stream, firstchunk);
        }, this)

        if (stream != this) this.pipe(stream);

        this.destinations.map(p => stream.pipe(p, { locked: true }));
    }

    get contentType() {
        return this.request.headers["content-type"];
    }

    get mime() {
        const contentType = this.contentType;
        return contentType ? contentType.split(":").shift() : null;
    }

    /* strategies */

    async jsonStrategy(stream, firstchunk) {
        if (/application\/json/.test(this.mime) == false) return stream;
        
        const json = await this.qwebs.resolve("$json-stream");
        const isArray = this.inputType === "object" ? false : true;
        return stream.pipe(json.parse({ isArray }));
    }

    //multipart/form-data
    //application/x-www-form-urlencoded
};

module.exports = Ask;
