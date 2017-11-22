/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

//https://github.com/jsantell/stream-request/blob/master/index.js
//https://github.com/expressjs/body-parser

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Transform } = require("stream");
const Throught = require("../utils/throught");

class Ask extends Throught {
    
    constructor(request, $qwebs, $config) {
        if (!request) throw new UndefinedError("request");
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$config) throw new UndefinedError("$config");
       
        super({});
        
        this.atime = new Date(Date.now());
        this.request = request;
        this.qwebs = $qwebs;
        this.config = $config;

        this.params = {};
        this.query = {};
        this.destination = null;

        this.pipeStrategies = [this.jsonStrategy, this.formDataStrategy]; /* define strategies */
    }
    
    pipe(destination) {
        if (this.destination) return super.pipe(destination);

        this.destination = destination;

        //start reading request stream
        this.request.on("data", (chunk) => {
            this.write(chunk);
        })
        this.request.on("end", () => {
            this.end();
        })
    }

    async pipeEnd(firstchunk) {
        const stream = await this.pipeStrategies.reduce(async (stream, strategy) => {
            return await strategy.call(this, stream, firstchunk);
        }, this);

        stream.pipe(this.destination);
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
        return stream.pipe(json.parse());
    }

    async formDataStrategy(stream, firstchunk) {
        if (/multipart\/form-data/.test(this.mime) == false) return stream;
        
        throw new NotImplementedError("formDataStrategy");
    }

    //
    //application/x-www-form-urlencoded
};

module.exports = Ask;
