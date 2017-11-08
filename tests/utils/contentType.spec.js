/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const contentTypeExtractor = require('../../lib/utils/contentType');

describe("contentType", () => {

    it("get", done => {
        
        return Promise.resolve().then(() => {     
            expect(contentTypeExtractor.get(".json")).toEqual("application/json");
            expect(contentTypeExtractor.get(".png")).toEqual("image/png");
            expect(contentTypeExtractor.get(".jpg")).toEqual("image/jpg");
            expect(contentTypeExtractor.get(".gif")).toEqual("image/gif");
            expect(contentTypeExtractor.get(".svg")).toEqual("image/svg+xml");
            expect(contentTypeExtractor.get(".js")).toEqual("application/javascript");
            expect(contentTypeExtractor.get(".html")).toEqual("text/html");
            expect(contentTypeExtractor.get(".css")).toEqual("text/css");
            expect(contentTypeExtractor.get(".ico")).toEqual("image/x-icon");
            expect(contentTypeExtractor.get(".ttf")).toEqual("application/x-font-ttf");
            expect(contentTypeExtractor.get(".eot")).toEqual("application/vnd.ms-fontobject");
            expect(contentTypeExtractor.get(".woff")).toEqual("application/font-woff");
            expect(contentTypeExtractor.get(".appcache")).toEqual("text/cache-manifest");
            expect(contentTypeExtractor.get(".map")).toEqual("application/json");
            expect(contentTypeExtractor.get(".md")).toEqual("text/x-markdown");
        }).catch(fail).then(done);
    });
    
    it("get exception", done => {
        
        return Promise.resolve().then(() => {            
            expect(contentTypeExtractor.get(".mp3")).toEqual("audio/mpeg");
            fail();
        }).catch(fail).then(done);
    });
});