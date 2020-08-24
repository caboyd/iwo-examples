var WebGL;
(function (WebGL) {
    function buildBuffer(gl, type, data, offset = 0, length) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW, offset, length);
        return buffer;
    }
    WebGL.buildBuffer = buildBuffer;
})(WebGL || (WebGL = {}));

export { WebGL };
//# sourceMappingURL=WebglHelper.js.map
