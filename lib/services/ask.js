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
const Busboy = require('busboy');

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
        this.flowing = false;

        this.pipeStrategies = [this.jsonStrategy, this.formDataStrategy]; /* define strategies */

        this.on('newListener', (event, listener) => {
            if (["data", "file"].some(e => e == event)) {
                this.flow();
            }
        })
    }
    
    pipe(destination) {
        if (this.destination) return super.pipe(destination);

        this.destination = destination;

        //start reading request stream
        this.flow();
    }

    flow() {
        if (this.flowing) return;
        this.flowing = true;
        this.request.on("data", (chunk) => {
            this.write(chunk);
        })
        this.request.on("end", () => {
            this.end();
        })
    }

    async pipeEnd(firstchunk) {
        let stream = this;
        for (let strategy of this.pipeStrategies) {
            stream = await strategy.call(this, stream, firstchunk);
        }
        stream.pipe(this.destination);
    }

    get headers() {
        return this.request.headers;
    }

    get contentType() {
        return this.headers["content-type"];
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
        
        const busboy = new Busboy({ headers: this.headers });
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            this.emit("file", fieldname, file, filename, encoding, mimetype);
        })
        .on("field", (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            this.emit("field", fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype);
        })
        .on("finish", () => {
            this.emit("finish");
        })
        
        stream.pipe(busboy);
        return stream;

    }

    //
    //application/x-www-form-urlencoded
};

module.exports = Ask;
