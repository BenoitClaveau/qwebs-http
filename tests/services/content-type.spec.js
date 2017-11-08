/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const ContentType = new require('../../lib/services/content-type');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("ContentType", () => {

    it("get", () => {
        const contentType = new ContentType();
        contentType.get(".json").expect("application/json");
        contentType.get(".png").expect("image/png");
        contentType.get(".jpg").expect("image/jpg");
        contentType.get(".gif").expect("image/gif");
        contentType.get(".svg").expect("image/svg+xml");
        contentType.get(".js").expect("application/javascript");
        contentType.get(".html").expect("text/html");
        contentType.get(".css").expect("text/css");
        contentType.get(".ico").expect("image/x-icon");
        contentType.get(".ttf").expect("application/x-font-ttf");
        contentType.get(".eot").expect("application/vnd.ms-fontobject");
        contentType.get(".woff").expect("application/font-woff");
        contentType.get(".appcache").expect("text/cache-manifest");
        contentType.get(".txt").expect("text/plain");
        contentType.get(".xml").expect("application/xml");
        contentType.get(".map").expect("application/json");
        contentType.get(".md").expect("text/x-markdown");
        contentType.get(".apk").expect("application/vnd.android.package-archive");
    });
});
