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

    xit("post object", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2998 }}});
        await qwebs.inject("$http", "../../index");
        await qwebs.inject("$info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("$http");
        await http.post("/save", "$info", "save");
        const client = await qwebs.resolve("$client");
        await client.post({ url: "http://localhost:2998/save", json: {
            name: "ben",
            value: 0,
            test: "454566"
        } }).then(res => {
            expect(res.body.name).to.be("ben");
            expect(res.body.value).to.be(0);
            expect(res.body.test).to.be(454566);
        });
    });

    it("post array", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2999 }}});
        await qwebs.inject("$http", "../../index");
        await qwebs.inject("$info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("$http");
        await http.post("/save", "$info", "save");
        const client = await qwebs.resolve("$client");
        await client.post({ url: "http://localhost:2999/save", json: [
            {
                name: "ben",
                value: 0,
                test: "454566"
            },
            {
                name: "toto",
                value: 32,
                test: "zz"
            }
        ]}).then(res => {
            expect(res.body.name).to.be("ben");
            expect(res.body.value).to.be(0);
            expect(res.body.test).to.be(454566);
        });
    });

});
