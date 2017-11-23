/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
*/
const Writable = require('stream').Writable;
const Readable = require('stream').Readable;
const fs =  require('fs');
const JSONStream = require("JSONStream");

class InfoService {
	constructor() {	
	};
	
	whoiam() {
		return "I'm Info service.";
	};

	helloworld() {
		return "Hello world.";
	};

	getInfo(ask, reply) {
		let content = {
			text: "I'm Info service."
		};
		reply.end(content);
	};

	getFile(ask, reply) {
		reply.contentType = "text/plain";
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

	saveOne(ask, reply) {
		reply.outputType = "object";
		ask.pipe(reply);
	};

	saveMany(ask, reply) {
		ask.pipe(reply);
	};

	uploadFile(ask, reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};
		ask.on("file", (filename, file) => {
			setTimeout(() => {
				//simulate save file
				reply.write({ file: filename, status: "saved" })
				reply.write({ file: filename, status: "saved2" })
				reply.end();
			}, 1);
		})

		//stream.pipe(reply);
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

	/*
	getStreamWithString(reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push("{ id: 1 }");
    	stream.push("{ id: 2 }");
        stream.push(null);

		return response.end({ request: request, stream: stream });
	};

	getStreamMultipleTypes(reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push("{ id: 1 }");
    	stream.push({ id: 2, name: "myname" });
		stream.push(33);
        stream.push(null);

		return response.end({ request: request, stream: stream });
	};

	getStreamError(reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push({ id: 1 });
		stream.emit("error", new Error("Error in stream."));
    	stream.push({ id: 2 });
        stream.push(null);

		return response.end({ request: request, stream: stream });
	};

	getStreamErrorAfterSending(reply) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		
		setTimeout(() => {
			stream.push({ id: 1 });
			setTimeout(() => {
				stream.push({ id: 2 });
				setTimeout(() => {
					stream.emit("error", new Error("Error in stream."));
					//stream.push(null);
				}, 500);
			}, 500);
		}, 100)

		return response.end({ request: request, stream: stream });
	};
	
	
	
	update(reply) {
		let content = {
			status: "updated"
		};
		reply.end(content);
	};
	
	delete(reply) {
		let content = {
			status: "deleted"
		};
		reply.end(content);
	};
	*/
};

class MyReadable extends Readable {
  constructor(options) {
    super(options);
  }
}

exports = module.exports = InfoService;