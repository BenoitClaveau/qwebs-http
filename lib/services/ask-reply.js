/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable, PassThrough, Transform } = require("stream");
const pump = require('pump')
const Busboy = require("busboy");
const process = require("process");
const fileType = require("file-type");

const kQwebs = Symbol("qwebs");
const kRequest = Symbol("request");
const kResponse = Symbol("response");
const kRequestHeaders = Symbol("requestheaders");
const kResponseHeaders = Symbol("responseheaders");
const kReadableStreamCurrent = Symbol("readablestreamcurrent");
const kReadableStreamEnd = Symbol("readablestreamend");
const kWritableStreamStart = Symbol("writablestreamstart");
const kWritableStreamCurrent = Symbol("writablestreamcurrent");
const kReadableInit = Symbol("readableinit");
const kWritableInit = Symbol("writableinit");
const kReadableMode = Symbol("readablemode");
const kWritableMode = Symbol("writablemode");
const kStatusCode = Symbol("statusCode");
const kHeadersSent = Symbol("headersSent");
const kErrors = Symbol("errors");

class AskReply extends PassThrough {

    /**
     * KRequest, ..., kReadableStream.
     * kWritableStream, ..., kRequest
     */
    constructor($qwebs, request, response, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });
        const atime = new Date(Date.now());   
        request.pause();
        this[kQwebs] = $qwebs;
        this[kRequest] = request;
        this[kResponse] = response;
        this[kRequestHeaders] = headers;

        this[kReadableStreamCurrent] = this[kRequest];
        this[kReadableStreamEnd] = null;
        this[kWritableStreamStart] = null;
        this[kWritableStreamCurrent] = null;

        this[kReadableInit] = false;
        this[kWritableInit] = false;
        this[kReadableMode] = "array";
        this[kWritableMode] = "array";
        this[kStatusCode] = 200;
        this[kHeadersSent] = false;
        this[kErrors] = [];
        
        this[kResponseHeaders] = {
            "Date": atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": headers["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
        };
        const acceptEncoding = this[kRequestHeaders]["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "deflate";

        this.once("readableinit", this.onceReadableInit.bind(this));
        this.once("writableinit", this.detectContentType.bind(this));
        this.once("writableinit", this.onceWritableInit.bind(this));
        this.on("error", this.onError.bind(this));
    }

    pipe(src) {
        src.on("error", error => this.emit("error", error));
        return super.pipe(src);
    }

    async onceReadableInit() {
        //define objectMode of the first piped stream (may be the last)
        
        const mime = this[kRequestHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const jsonStream = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kReadableMode] == "array";
            const parser = jsonStream.parse({ isArray });
            const next = parser;
            this[kReadableStreamCurrent].on("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = pump(this[kReadableStreamCurrent], next);   
        }
        else if (/multipart\/form-data/.test(mime)) {
            //TODO Refacto needed
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", this.emit.bind(this));
            busboy.on("field", this.emit.bind(this));
            const next = busboy;
            this[kReadableStreamCurrent].on("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = pump(this[kReadableStreamCurrent], next);
        }
        else {
            const objectMode = ["array", "object"].some(e => e == this[kReadableMode]);
            const next = new PassThrough({ objectMode });
            this[kReadableStreamCurrent].on("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = pump(this[kReadableStreamCurrent], next);
        }

        this[kReadableStreamEnd] = this[kReadableStreamCurrent];

        this[kReadableStreamEnd].on("data", data => {
            this.push(data);
            super.read(this._readableState.highWaterMark);
        })
        this[kReadableStreamEnd].on("end", () => {
            this.push(null);
            super.read(0);
        })
        
        this[kReadableInit] = true;
        this.emit("readableready");
    }

    detectContentType(chunk, encodeing) {
        if (this[kResponseHeaders]["Content-Type"]) return;
        
        if (Buffer.isBuffer(chunk) || typeof chunk == "string") {
            const filetype = fileType(chunk);
            if (filetype) this[kResponseHeaders]["Content-Type"] = filetype.mime;
        }
        else if (chunk instanceof Object || chunk instanceof Array) {
            this[kResponseHeaders]["Content-Type"] = "application/json";
        }
        else if (this[kRequestHeaders]["accept"]) {
            const accepts = this[kRequestHeaders]["accept"].split(",");
            if (accepts.length == 1) this[kResponseHeaders]["Content-Type"] = accepts.shift();
        }
    }

    async onceWritableInit(chunk, encoding) {
        //define objectMode of the first piped stream
        const objectMode = ["array", "object"].some(e => e == this[kWritableMode]);
        this[kWritableStreamStart] = this[kWritableStreamCurrent] = new PassThrough({ objectMode });

        const headers = this[kResponseHeaders];
        const contentType = headers["Content-Type"];

        if (!contentType) this[kResponse].emit("error", new UndefinedError("Content-Type"));
        
        if (/application\/json/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
            const json = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kWritableMode] == "array";
            const next = json.stringify({ isArray });
            this[kWritableStreamCurrent].on("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }
        else if (/text\/html/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            const next = zlib.createGzip();
            this[kWritableStreamCurrent].on("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }
        if (/deflate/.test(contentEncoding)) {
            const next = zlib.createDeflate();
            this[kWritableStreamCurrent].on("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }

        this[kResponse].on("close", this.emit.bind(this, "close"));
        this[kResponse].on("drain", this.emit.bind(this, "drain"));
        this[kResponse].on("error", this.emit.bind(this, "error"));
        this[kResponse].on("finish", this.emit.bind(this, "finish"));
        this[kResponse].on("pipe", this.emit.bind(this, "pipe"));
        this[kResponse].on("unpipe", this.emit.bind(this, "unpipe"));

        //Write header just after processing first chunk, but before send it.
        this[kWritableStreamCurrent].once("data", data => {
            if (this[kHeadersSent]) return;
            this[kHeadersSent] = true;
            this[kResponse].writeHead(this[kStatusCode], headers);
        });

        this[kWritableStreamCurrent].once("end", data => {
            if (this[kHeadersSent]) return;
            this[kHeadersSent] = true;
            this[kResponse].writeHead(this[kStatusCode], headers);
        });

        this[kWritableStreamCurrent].once("error", error => {
            if (this[kHeadersSent]) return;
            this[kHeadersSent] = true;
            this[kStatusCode] = error.statusCode || 500;
            this[kResponse].writeHead(this[kStatusCode], headers);
            this[kResponse].end(); //error during internal response piping, just close the stream
            console.error(error); 
        });
        
        pump(this[kWritableStreamCurrent], this[kResponse]);
        
        this[kWritableInit] = true;
        this.emit("writableready");
    }

    onError(error) {
        if (!this[kWritableInit]) {
            this[kStatusCode] = error.statusCode || 500;
            this.emit("writableinit");  //init the response stream
            return this.end(error);     //close the response
        }
        console.error(error);
        this["kErrors"].push(error);    //append errors to calculate a trailer
    }
    
    /* Readable & Writable */

    destroy(error) {
        return super.destroy(error);
    }

    /* Readable & Writable others */
    on(ev, fn) {
        const res = super.on(ev, fn);
        if (ev == "file") {
            if (this._readableState.flowing !== false) // Start flowing on next tick if stream isn"t explicitly paused
                this.resume();
        }
    }

    /* Readable */

    read(size) {
        if (!this[kReadableInit]) {
            this.once("readableready", this.read.bind(this, size));
            this.emit("readableinit");
            return null;
        }
        return this[kRequest].read(size);
    }

    end(chunk, encoding, callback) {
        if (!this[kWritableInit]) {
            this.once("writableready", this.end.bind(this, chunk, encoding, callback));
            this.emit("writableinit", chunk, encoding);
            return null;
        }
        return this[kWritableStreamStart].end(chunk, encoding, callback);
    }

    write(chunk, encoding, callback) {
        if (!this[kWritableInit]) {
            this.once("writableready", this.write.bind(this, chunk, encoding, callback));
            this.emit("writableinit", chunk, encoding);
            return null;
        }
        return this[kWritableStreamStart].write(chunk, encoding, callback);
    }

    /* extenstion*/

    contentType(contentType) {
        this[kResponseHeaders]["Content-Type"] = contentType;
        return this;
    }

    /* mode */

    mode(mode) {
        return this.in(mode).out(mode);
    }

    in(mode) {
        this[kReadableMode] = mode;
        return this;
    }

    out(mode) {
        this[kWritableMode] = mode;
        return this;
    }
};

module.exports = AskReply;
