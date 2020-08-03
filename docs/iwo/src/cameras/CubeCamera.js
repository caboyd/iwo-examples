import { mat4, glMatrix, vec3 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';

class CubeCamera {
    constructor() {
        this.projection = mat4.perspective(mat4.create(), glMatrix.toRadian(90), 1.0, 0.1, 10);
        this.views = new Array(mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(1, 0, 0), vec3.fromValues(0, -1, 0)), mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(-1, 0, 0), vec3.fromValues(0, -1, 0)), mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1)), mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, -1, 0), vec3.fromValues(0, 0, -1)), mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, 1), vec3.fromValues(0, -1, 0)), mat4.lookAt(mat4.create(), vec3.create(), vec3.fromValues(0, 0, -1), vec3.fromValues(0, -1, 0)));
    }
}

export { CubeCamera };
//# sourceMappingURL=CubeCamera.js.map
