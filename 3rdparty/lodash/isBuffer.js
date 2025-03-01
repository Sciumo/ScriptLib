Object.defineProperty(exports, "__esModule", { value: true });
var root_js_1 = require("./internal/root.js");
var freeExports = typeof exports === 'object' && exports !== null && !exports.nodeType && exports;
var freeModule = freeExports && typeof module === 'object' && module !== null && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer = moduleExports ? root_js_1.default.Buffer : undefined;
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
var isBuffer = nativeIsBuffer || (function () { return false; });
exports.default = isBuffer;
