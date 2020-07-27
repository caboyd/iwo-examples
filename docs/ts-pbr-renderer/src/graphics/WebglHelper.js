export var WebGL;
(function (WebGL) {
    function buildBuffer(gl, type, data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        return buffer;
    }
    WebGL.buildBuffer = buildBuffer;
})(WebGL || (WebGL = {}));
//# sourceMappingURL=WebglHelper.js.map