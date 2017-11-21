/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

//https://github.com/jsantell/stream-request/blob/master/index.js
//https://github.com/expressjs/body-parser

const { UndefinedError, Error, HttpError } = require("oups");
const { Duplex } = require("stream");
const Throught = require("../utils/throught");

class Ask extends Throught {
    
    constructor(request, $qwebs, $config, options = {}) {
        if (!request) throw new UndefinedError("request");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");
        const { objectMode } = options;

        super({ objectMode });
        
        this.atime = new Date(Date.now());
        this.request = request;
        this.qwebs = $qwebs;
        this.config = $config;

        this.params = {};
        this.query = {};
        this.inputType = null;             /* object|array => use to configure the stringifier. */

        this.pipeStrategies = [this.jsonStrategy]; /* define strategies */
        
        // const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
        //     return await strategy.call(this, stream);
        // }, this);

        this.request.pipe(this);
    }

    pipe(dest, pipeOpts) {
        dest.ask = this;
        return super.pipe(dest, pipeOpts);
    }

    async pipeEnd(firstchunk) {
        //this.unpipe(this)
        this.request.unpipe(this);
        
        const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy.call(this, stream, firstchunk);
        }, this)

        this.request.pipe(stream);
    }

    // _transform(chunk, encoding, callback) {
    //     this.push(chunk);
    //     callback();
    // }

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
        return stream.pipe(json.stringify({ isArray }));
    }

    //multipart/form-data
    //application/x-www-form-urlencoded
};

module.exports = Ask;
