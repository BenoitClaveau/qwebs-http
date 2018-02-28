/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable, PassThrough, Transform } = require("stream");
const zlib = require("zlib");
const pump = require('pump');
const Busboy = require("busboy");
const process = require("process");
const { EventEmitter} = require('events');
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

EventEmitter.defaultMaxListeners = 20; //increase default max listeners

class AskReply extends PassThrough {

    /**
     * KRequest, ..., kReadableStream.
     * kWritableStream, ..., kRequest
     */
    constructor($qwebs, $jsonStream, request, response, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });
        const atime = new Date(Date.now());   
        request.pause();
        this[kQwebs] = $qwebs;
        this.jsonStream = $jsonStream;

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

        this.once("error", this.onceError.bind(this));
    }

    pipe(src) {
        src.once("error", error => this.emit("error", error));
        return super.pipe(src);
    }

    readableInit() {
        //define objectMode of the first piped stream (may be the last)
        const mime = this[kRequestHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const isArray = this[kReadableMode] == "array";
            const parser = this.jsonStream.parse({ isArray });
            const next = parser;
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = pump(this[kReadableStreamCurrent], next);   
        }
        else if (/multipart\/form-data/.test(mime)) {
            //TODO Refacto needed
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", this.emit.bind(this));
            busboy.on("field", this.emit.bind(this));
            const next = busboy;
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = pump(this[kReadableStreamCurrent], next);
        }
        else {
            const objectMode = ["array", "object"].some(e => e == this[kReadableMode]);
            const next = new PassThrough({ objectMode });
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
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

    writableInit(chunk, encoding) {
        //define objectMode of the first piped stream
        const objectMode = ["array", "object"].some(e => e == this[kWritableMode]);
        this[kWritableStreamStart] = this[kWritableStreamCurrent] = new PassThrough({ objectMode });

        this.detectContentType(chunk, encoding);
        
        const headers = this[kResponseHeaders];
        const contentType = headers["Content-Type"];

        if (!contentType) this[kResponse].emit("error", new UndefinedError("Content-Type"));
        
        if (/application\/json/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
            const isArray = this[kWritableMode] == "array";
            const next = this.jsonStream.stringify({ isArray });
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }
        else if (/text\/html/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            const next = zlib.createGzip();
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }
        if (/deflate/.test(contentEncoding)) {
            const next = zlib.createDeflate();
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = pump(this[kWritableStreamCurrent], next);
        }

        this[kResponse].on("close", this.emit.bind(this, "close"));
        this[kResponse].on("drain", this.emit.bind(this, "drain"));
        this[kResponse].once("error", this.emit.bind(this, "error"));
        this[kResponse].on("finish", this.emit.bind(this, "finish"));
        this[kResponse].on("pipe", this.emit.bind(this, "pipe"));
        this[kResponse].on("unpipe", this.emit.bind(this, "unpipe"));

        this[kWritableStreamCurrent].once("data", data => { 
            if (!this[kResponse].headersSent)
                this[kResponse].writeHead(this[kStatusCode], headers);
        });

        this[kWritableStreamCurrent].once("end", data => { 
            if (!this[kResponse].headersSent)
                this[kResponse].writeHead(this[kStatusCode], headers);
        });

        //Error shouldn't append, functionnal error should be managed by your self!
        this[kWritableStreamCurrent].once("error", error => {
            console.error(error);
            if (!this[kResponse].headersSent) {
                this[kResponse].writeHead(error.statusCode || 500, headers);
                return this[kResponse].end();
            }
        });

        const next = this[kResponse];
        this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
        pump(this[kWritableStreamCurrent], next);
        
        this[kWritableInit] = true;
        this.emit("writableready");
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
        if (!this[kWritableInit]) this.readableInit();
        return this[kRequest].read(size);
    }

    end(chunk, encoding, callback) {
        if (!this[kWritableInit]) this.writableInit(chunk, encoding);
        return this[kWritableStreamStart].end(chunk, encoding, callback);
    }

    write(chunk, encoding, callback) {
        if (!this[kWritableInit]) this.writableInit(chunk, encoding);
        return this[kWritableStreamStart].write(chunk, encoding, callback);
    }

    /* error handling */

    onceError(error) {
        if (!this[kWritableInit]) this.writableInit();
        this[kWritableStreamStart].emit("error", error);
    }

    /* extenstion*/

    contentType(contentType) {
        this[kResponseHeaders]["Content-Type"] = contentType;
        return this;
    }

    respond(value) {
        const {statusCode, ...headers} = value;
        if (statusCode) this[kStatusCode] = statusCode;
        if (headers) this[kResponseHeaders] = headers;
        return this;
    }

    statusCode(code) {
        this[kStatusCode] = code;
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

    redirect(url) {
        if (!this[kWritableInit]) {
            this[kStatusCode] = 307;
            this[kResponseHeaders]["Location"] = url;
            this[kResponseHeaders]["Content-Type"] = "text/html";
            this.emit("writableinit");
            return this[kWritableStreamStart].end();
        }

        console.error(`Failed to redirect to ${url}, beacause headers has already been sent.`);
    };

    async forward(method, url, headers) {
        const httpRouter = await this[kQwebs].resolve("$http-router");
        const contextFactory = await this[kQwebs].resolve("$context-factory");
        const forwardContext = contextFactory.getContext(method, url);
        return await httpRouter.invoke(forwardContext, this, headers)
    }
};

module.exports = AskReply;
