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

    it("assets", async () => {
        let qwebs = new Qwebs({ dirname: __dirname });
        await qwebs.load();
        const isitasset = await qwebs.resolve("$isitasset");
        expect(isitasset.nodes.length).to.be(2);
        expect(isitasset.nodes[0].token).to.be("main.html");
        expect(isitasset.nodes[1].token).to.be("assets");
        expect(isitasset.nodes[1].nodes[0].token).to.be("user.svg");
        await qwebs.unload();
    });
})