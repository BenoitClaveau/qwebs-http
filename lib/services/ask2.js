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

class Ask extends Readable {
    
    constructor(request, $qwebs, options) {
        if (!request) throw new UndefinedError("request");
        if (!$qwebs) throw new UndefinedError("$qwebs");
       
        super(options);
        
        this.atime = new Date(Date.now());
        this.request = request;
        this.qwebs = $qwebs;

        this.params = {};
        this.query = {};
        this.mode = "array";

        this.request.pause();
        this.request.on('data', (chunk) => this.onRequestData(chunk));
        this.request.on('end', () => this.onRequestEnd());
        this.request.on('error', (error) => this.onRequestError(error));
        //this.request.on('close', () => this.onRequestClose());
        //this.request.on('aborted', () => this.onRequestAborted());
        //this.request.on('finish', () => this.onfinish());
        
        this.on('pause', () => this.onPause());
        this.on('resume', () => this.onResume());
        this.on('drain', () => this.onDrain());
    }

    onRequestData(chunk) {
        if (!this.push(chunk)) //TODO
            this.pause();
    }

    onRequestEnd() {
        this.push(null);
    }

    onRequestError(error) {
        this.emit('error', error);
    }

    onPause() {
        this.request.pause();
    }

    onResume() {
        this.request.resume();
    }

    onDrain() {
        if (this.isPaused())
            this.resume();
    }
    

    get url() {
        return this.request.url;
    }

    get method() {
        return this.request.method;
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

    async resolve(service) {
        return await this.qwebs.resolve(service);
    }

    get obj() {
        this.mode = "object";
        return this;
    }

    /* strategies */

    async jsonStrategy(stream, firstchunk) {
        if (/application\/json/.test(this.mime) == false) return stream;
        
        const json = await this.resolve("$json-stream");
        const parser = json.parse();
        parser.on("mode", mode => {
            if (this.mode !== mode) {
                if (this.mode == "array") this.emit("error", new Error("Input stream is not an array."));
                else this.emit("error", new Error("Input stream is not an object."));
            }
            else this.emit("mode", mode);
        })
        return stream.pipe(parser);
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

    //TODO: application/x-www-form-urlencoded
};

module.exports = Ask;
