/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

 const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable, PassThrough, Transform } = require("stream");
const Busboy = require('busboy');
const process = require('process');
const fileType = require("file-type");

const kQwebs = Symbol('qwebs');
const kRequest = Symbol('request');
const kResponse = Symbol('response');
const kRequestHeaders = Symbol('requestheaders');
const kResponseHeaders = Symbol('responseheaders');
const kReadableStreamCurrent = Symbol('readablestreamcurrent');
const kReadableStreamEnd = Symbol('readablestreamend');
const kWritableStreamStart = Symbol('writablestreamstart');
const kWritableStreamCurrent = Symbol('writablestreamcurrent');
const kReadableInit = Symbol('readableinit');
const kWritableInit = Symbol('writableinit');
const kReadableMode = Symbol('readablemode');
const kWritableMode = Symbol('writablemode');

class AskReply extends Readable {

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

        this.once('readableinit', this.onceReadableInit.bind(this));
        this.once('writableinit', this.detectContentType.bind(this));
        this.once('writableinit', this.onceWritableInit.bind(this));
    }

    async onceReadableInit() {
        //define objectMode of the first piped stream (may be the last)
        
        const mime = this[kRequestHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const jsonStream = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kReadableMode] == "array";
            const parser = jsonStream.parse({ isArray });
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(parser);        
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", this.emit.bind(this));
            busboy.on("field", this.emit.bind(this));
            busboy.on("finish", this.emit.bind(this)); //TODO should be replace by end
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(busboy); 
        }
        else {
            const objectMode = ["array", "object"].some(e => e == this[kReadableMode]);
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(new PassThrough({ objectMode }));
        }

        this[kReadableStreamEnd] = this[kReadableStreamCurrent];

        this[kReadableStreamEnd].on('data', data => this.emit("data", data ? data : null));
        this[kReadableStreamEnd].once('end', this.emit.bind(this, "end"));
        this[kReadableStreamEnd].once('error', this.emit.bind(this, "error"));
        this[kReadableStreamEnd].once('readable', this.emit.bind(this, "readable"));
        
        this[kReadableInit] = true;
        this.emit('readableready');
    }

    async onceWritableInit(chunk, encoding) {
        //define objectMode of the first piped stream
        const objectMode = ["array", "object"].some(e => e == this[kWritableMode]);
        this[kWritableStreamStart] = this[kWritableStreamCurrent] = new PassThrough({ objectMode });

        const headers = this[kResponseHeaders];
        const contentType = headers["Content-Type"];

        if (!contentType) this[kResponse].emit('error', new UndefinedError("Content-Type"));
        
        if (/application\/json/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
            const json = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kWritableMode] == "array";
            const stringifier = json.stringify({ isArray })
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(stringifier); 
        }
        else if (/text\/html/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(zlib.createGzip());
        }
        if (/deflate/.test(contentEncoding)) {
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(zlib.createDeflate());
        }

        this[kResponse].writeHead(200, { headers });

        this[kResponse].on("close", this.emit.bind(this, "close"));
        this[kResponse].on("drain", this.emit.bind(this, "drain"));
        this[kResponse].on("error", this.emit.bind(this, "error"));
        this[kResponse].on("finish", this.emit.bind(this, "finish"));
        this[kResponse].on("pipe", this.emit.bind(this, "pipe"));
        this[kResponse].on("unpipe", this.emit.bind(this, "unpipe"));

        this[kWritableStreamCurrent].pipe(this[kResponse]);
        this[kWritableInit] = true;
        this.emit('writableready');
    }

    detectContentType(chunk, encodeing) {
        if (this[kResponseHeaders]["Content-Type"]) return;
        
        if (Buffer.isBuffer(chunk) || typeof chunk == "string") {
            const filetype = fileType(chunk);
            if (filetype) this[kResponseHeaders]["Content-Type"] = filetype.mime;
        }
        else if (chunk instanceof Object) {
            this[kResponseHeaders]["Content-Type"] = "application/json";
        }
        if (this[kRequestHeaders]["accept"]) {
            const accepts = this[kRequestHeaders]["accept"].split(",");
            if (accepts.length == 1) this[kResponseHeaders]["Content-Type"] = accepts.shift();
        }
    }
    
    /* Readable & Writable */

    destroy(error) {
        //TODO destroy request & response ?
        return super.destroy(error);
    }

    /* Readable & Writable others */
    on(ev, fn) {
        const res = super.on(ev, fn);
        if (ev == "file") {
            if (this._readableState.flowing !== false) // Start flowing on next tick if stream isn't explicitly paused
                this.resume();
        }
    }

    /* Readable */

    isPaused() {
        if (!this[kReadableInit]) return false;
        return this[kRequest].isPaused();
    }

    pause() {
        if (!this[kReadableInit]) {
            this.once('readableready', this.pause.bind(this));
            this.emit('readableinit');
            return null;
        }
        return this[kRequest].pause();
    }

    pipe(destination, options) {
        return super.pipe(destination, options);
    }

    get readableHighWaterMark() {
        if (!this[kReadableInit]) return null;
        return this[kRequest].readableHighWaterMark;
    }

    read(size) {
        if (!this[kReadableInit]) {
            this.once('readableready', this.read.bind(this, size));
            this.emit('readableinit');
            return null;
        }
        
        console.log("[read][AskReply]", size)
        return this[kRequest].read(size);
    }

    get readableLength() {
        if (!this[kReadableInit]) return null;
        return this[kRequest].readableLength;
    }

    resume() {
        if (!this[kReadableInit]) {
            this.once('readableready', this.resume.bind(this));
            this.emit('readableinit');
            return null;
        }
        return this[kRequest].resume();
    }

    setEncoding(encoding) {
        if (!this[kReadableInit]) {
            this.once('readableready', this.setEncoding.bind(this, encoding));
            return null;
        }
        return this[kRequest].setEncoding(encoding);
    }

    unpipe(destination) {
        return super.unpipe(destination);
    }

    unshift(chunk) {
        if (!this[kReadableInit]) {
            this.once('readableready', this.unshift.bind(this, chunk));
            this.emit('readableinit');
            return null;
        }
        return this[kRequest].unshift(chunk);
    }

    wrap(stream) {
        return super.wrap(stream);
    }

    /* Readable others */

    push(data) {
        return super.push(data);
    }

    /* Writable */

    cork() {
        if (!this[kWritableInit]) {
            this.once('writableready', this.cork.bind(this));
            return null;
        }
        return this[kWritableStreamStart].cork();
    }

    end(chunk, encoding, callback) {
        if (!this[kWritableInit]) {
            this.once('writableready', this.end.bind(this, chunk, encoding, callback));
            this.emit('writableinit', chunk, encoding);
            return null;
        }
        return this[kWritableStreamStart].end(chunk, encoding, callback);
    }

    setDefaultEncoding(encoding) {
        if (!this[kWritableInit]) {
            this.once('writableready', this.setDefaultEncoding.bind(this, encoding));
            return null;
        }
        return this[kWritableStreamStart].setDefaultEncoding(encoding);
    }

    uncork() {
        if (!this[kWritableInit]) {
            this.once('writableready', this.uncork.bind(this));
            return null;
        }
        return this[kWritableStreamStart].uncork();
    }
    
    get writableHighWaterMark() {
        return this[kWritableStreamStart].writableHighWaterMark;
    }

    get writableLength() {
        return this[kWritableStreamStart].writableLength;
    }

    write(chunk, encoding, callback) {
        if (!this[kWritableInit]) {
            this.once('writableready', this.write.bind(this, chunk, encoding, callback));
            this.emit('writableinit', chunk, encoding);
            return null;
        }
        
        console.log("[write][AskReply]", chunk.length)
        return this[kWritableStreamStart].write(chunk, encoding, callback);
    }

    /* extenstion*/

    contentType(contentType) {
        this[kResponseHeaders]["Content-Type"] = contentType;
        return this;
    }

    /* mode */

    get obj() {
        return this.inObj.outObj;
    }

    get inObj() {
        this[kReadableMode] ="object";
        return this;
    }

    get outObj() {
        this[kWritableMode] = "object";
        return this;
    }

    get buffer() {
        return this.inBuffer.outBuffer;
    }

    get inBuffer() {
        this[kReadableMode] ="buffer";
        return this;
    }

    get outBuffer() {
        this[kWritableMode] = "buffer";
        return this;
    }

    get array() {
        return this.inArray.outArray;
    }

    get inArray() {
        this[kReadableMode] ="array";
        return this;
    }

    get outArray() {
        this[kWritableMode] = "array";
        return this;
    }
};

module.exports = AskReply;
