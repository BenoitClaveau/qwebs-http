/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const process =  require("process");
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
});

describe("Assets loader", () => {

    it("assets", async done => {
        let qwebs = new Qwebs({ dirname: __dirname });
        await qwebs.load();
        const isitasset = await qwebs.resolve("$isitasset");
        expect(isitasset.routers.length).to.be(2);
    });
})