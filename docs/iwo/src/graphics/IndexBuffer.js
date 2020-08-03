import { ReferenceCounter as ReferenceCounter$1 } from '../helpers/ReferenceCounter.js';
import { WebGL } from './WebglHelper.js';

class IndexBuffer {
    constructor(gl, geometry) {
        if (geometry.indices === undefined)
            throw new Error("Geometry has no indices.");
        this.EBO = WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        this.indices = geometry.indices;
        this.references = new ReferenceCounter$1();
    }
    bind(gl) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    }
    destroy(gl) {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        }
        else {
            gl.deleteBuffer(this.EBO);
        }
    }
}

export { IndexBuffer };
//# sourceMappingURL=IndexBuffer.js.map
