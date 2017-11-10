/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const Writable = require('stream').Writable;
const Readable = require('stream').Readable;

class InfoService {
	constructor() {	
	};
	
	whoiam() {
		return "I'm Info service.";
	};

	helloworld() {
		return "Hello world.";
	};

	getInfo(context) {
		let content = {
			text: "I'm Info service."
		};
		context.end(content);
	};

	getMessage(context) {
		let content = {
			text: "hello world"
		};
		context.end(content);
	};

	getStream(context) {

		const stream = Readable({objectMode: true}); 
		stream.pipe(context);

		stream._read = () => {};                     
		stream.push({ id: 1 });
    	stream.push({ id: 2 });
        stream.push(null);
	};

	getStreamWithTimeout(context) {
		const stream = Readable({objectMode: true}); 
		stream.pipe(context);

		stream._read = () => {};                     
		setTimeout(() => {
			stream.push({ id: 1 });
			stream.push({ id: 2 });
			stream.push(null);
		}, 4000);
	};

	getStreamWithString(context) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push("{ id: 1 }");
    	stream.push("{ id: 2 }");
        stream.push(null);

		return response.send({ request: request, stream: stream });
	};

	getStreamMultipleTypes(context) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push("{ id: 1 }");
    	stream.push({ id: 2, name: "myname" });
		stream.push(33);
        stream.push(null);

		return response.send({ request: request, stream: stream });
	};

	getStreamError(context) {
		const stream = Readable({objectMode: true}); 
		stream._read = () => {};                     
		stream.push({ id: 1 });
		stream.emit("error", new Error("Error in stream."));
    	stream.push({ id: 2 });
        stream.push(null);

		return response.send({ request: request, stream: stream });
	};

	getStreamErrorAfterSending(context) {
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

		return response.send({ request: request, stream: stream });
	};
	
	save(context) {
		let content = {
			status: "saved"
		};
		return response.send({ request: request, content: content });
	};
	
	update(context) {
		let content = {
			status: "updated"
		};
		return response.send({ request: request, content: content });
	};
	
	delete(context) {
		let content = {
			status: "deleted"
		};
		return response.send({ request: request, content: content });
	};
};

class MyReadable extends Readable {
  constructor(options) {
    super(options);
  }
}

exports = module.exports = InfoService;