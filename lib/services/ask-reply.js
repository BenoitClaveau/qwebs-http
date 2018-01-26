/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable } = require("stream");
const Busboy = require('busboy');
const process = require('process');

const kQwebs = Symbol('qwebs');
const kRequest = Symbol('request');
const kResponse = Symbol('response');
const kRequestHeaders = Symbol('requestheaders');
const kResponseHeaders = Symbol('responseheaders');
const kReadableStream = Symbol('readablestream');
const kWriteableStream = Symbol('writeablestream');
const kReadableInit = Symbol('readableinit');
const kWriteableInit = Symbol('writeableinit');
const kReadableMode = Symbol('readablemode');
const kWriteableMode = Symbol('writeablemode');

class AskReply extends Readable {

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
        this[kReadableStream] = null;
        this[kWriteableStream] = null;
        this[kReadableInit] = false;
        this[kWriteableInit] = false;
        this[kReadableMode] = "array";
        this[kWriteableMode] = "array";
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
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            "Content-Type": "application/json"
        };
        const acceptEncoding = this[kRequestHeaders]["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "deflate";

        this.once('readableinit', () => this.onceReadableInit());
        this.once('writeableinit', () => this.onceWriteableInit());
    }

    on(ev, fn) {
        super.on(ev, fn);
        switch(ev) {
            case "data": 
            case "end":
            case "file": this.emit("readableinit"); break;
            case "drain":
            case "finish": this.emit("writeableinit"); break;
        }
    }

    pipe(src, options) {
        super.pipe(src, options);
    }

    async onceReadableInit() {
        const mime = this[kRequestHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const jsonStream = await this[kQwebs].resolve("$json-stream");
            const parser = jsonStream.parse();
            this[kReadableStream] = this[kRequest].pipe(parser);
            this[kRequest].on('error', (error) => this.emit('error', error));
        
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", (...args) => this.emit.apply(this, args));    //re emit
            busboy.on("field", (...args) => this.emit.apply(this, args));
            busboy.on("finish", (...args) => this.emit.apply(this, args));
            this[kReadableStream] = this[kRequest].pipe(busboy); 
            this[kRequest].on('error', (error) => this.emit('error', error));
        }
        else {
            this[kReadableStream] = this[kRequest];
        }

        this[kReadableStream].on('data', (chunk) => this.onReadableData(chunk));
        this[kReadableStream].once('end', () =>  this.onceReadableEnd());
        this[kReadableStream].on('error', (error) => this.emit('error', error));
        this[kReadableInit] = true;
        this.emit("readableinit");
    }

    async onceWriteableInit() {
        const headers = this[kResponseHeaders];
        const contentType = this[kResponseHeaders]["Content-Type"]
        if (!contentType) this[kResponse].emit('error', new UndefinedError("Content-Type"));

        if (/charset/.test(contentType) == false) headers["Content-Type"] += "; charset=utf-8";

        if (/application\/json/.test(contentType)) {
            const json = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kWriteableMode] == "array";

            this[kResponse].on('error', (error) => this.emit('error', error));
            this[kWriteableStream] = this[kResponse].pipe(json.stringify({ isArray }));
        }
        else {
            this[kResponse].on('error', (error) => this.emit('error', error));
            this[kWriteableStream] = this[kResponse];
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            this[kWriteableStream].on('error', (error) => this.emit('error', error));
            this[kWriteableStream] = this[kWriteableStream].pipe(zlib.createGzip());
        }
        if (/deflate/.test(contentEncoding)) {
            this[kWriteableStream].on('error', (error) => this.emit('error', error));
            this[kWriteableStream] = this[kWriteableStream].pipe(zlib.createDeflate());
        }

        this[kResponse].writeHead(200, { headers });
        this[kWriteableInit] = true;
        this.emit("writeableinit");
    }
    
    onReadableData(chunk) {
        // if(!this.push(chunk)) {
        //     this.pause();
        //     this.once('drain', () => this.resume());
        // }
        this.emit("data", chunk);
    }

    onceReadableEnd() {
        this.emit("end");
    }

    read() {
        if (!this[kReadableInit]) {
            this.once('readableinit', this.read.bind(this, read));
            return;
        }

        return this[kRequest].read();
    }

    write(chunk, encoding, callback) {
        if (!this[kWriteableInit]) {
            this.once('writeableinit', this.write.bind(this, chunk, encoding, callback));
            return;
        }

        this[kWriteableStream].write(chunk, encoding, callback);
    }

    end() {
        this[kWriteableStream].end();
    }

    get obj() {
        this[kReadableMode] = this[kWriteableMode] = "object";
        return this;
    }
};

module.exports = AskReply;
