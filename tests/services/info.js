/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
*/
const { Readable, Writable, Transform } = require('stream');
const fs = require('fs');
const path = require('path');

class InfoService {
	constructor($auth) {	
		this.auth = $auth;
	};
	
	whoiam(ask, reply) {
		reply.contentType = "text/html";
		reply.end("I'm Info service.");
	};

	helloworld(ask, reply) {
		reply.contentType = "text/html";
		reply.end("Hello world.");
	};

	getInfo(ask, reply) {
		reply.end({ text: "I'm Info service." });
	};

	httpAuthInfo(ask, reply) {
		reply.end({ text: "I'm Info service." });
	};

	getFile(ask, reply) {
		reply.contentType = "text/html";
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(reply);
	};

	getArray(ask, reply) {
		reply.contentType = "application/json";
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(reply);
	};

	getStream(ask, reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};
		stream.pipe(reply);
		stream.push({ id: 1 });
    	stream.push({ id: 2 });
        stream.push(null);
	};

	getStreamWithTimeout(ask, reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};
		stream.pipe(reply);
		setTimeout(() => {
			stream.push({ id: 3 });
			stream.push({ id: 4 });
			stream.push(null);
		}, 100);
	};

	saveOne(context, stream, headers) {
		stream.obj.pipe(stream.obj);
	};

	saveMany(ask, reply) {
		ask.pipe(reply);
	};

	saveFile(ask, reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};
		stream.pipe(reply);

		ask.on("file", (fieldname, file, filename, encoding, mimetype) => {
			const filepath = `${__dirname}/../data/output/${filename}`;
			if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

			const output = fs.createWriteStream(filepath);
			file.pipe(output).on("finish", () => {
				stream.push({ filepath: filepath })
				stream.push(null);
			})
		})
	};

	uploadImage(context, stream, headers) {
		stream.on("file", (file, filename, encoding, mimetype) => {
			const parsed = path.parse(filename);
			const filepath = `${__dirname}/../data/output/${parsed.name}.server${parsed.ext}`;
			if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
			file.pipe(fs.createWriteStream(filepath)).on("finish", () => {
				fs.createReadStream(filepath).pipe(stream);
			})
		})
	};

	async connect(ask, reply) {
		const self = this;
        reply.outputType = "object";
        ask.pipe(new Transform({ objectMode: true, async transform(chunk, enc, callback) {
            const token = self.auth.encode(chunk);
            callback(null, {token});
        }})).pipe(reply);
	};
};

exports = module.exports = InfoService;