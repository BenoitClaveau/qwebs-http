/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L186

//EE.listenerCount(dest, 'error')


// const EventEmitter = require('events');
// EventEmitter.usingDomains = true;

const expect = require("expect.js");
const Qwebs = require("qwebs");
const { FromArray } = require("qwebs");
const http = require("http");
const request = require('request');
const fs =  require('fs');
const domain =  require('domain');
const JSONStream = require('JSONStream');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("ask", () => {

    it("post object", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2999 }}});
        await qwebs.inject("$http", "../../index");
        await qwebs.inject("$info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("$http");
        await http.post("/save", "$info", "save");
        const client = await qwebs.resolve("$client");
        await client.post({ url: "http://localhost:2999/save", json: {
            type: "object"
        } }).then(res => {
            expect(res).to.eql({});
        });
    });

});
