import { ReferenceCounter } from '../helpers/ReferenceCounter.js';
import { WebGL } from './WebglHelper.js';

class IndexBuffer {
    EBO;
    indices;
    references;
    constructor(gl, geometry, stop) {
        if (geometry.index_buffer === undefined)
            throw new Error("Cannot create IndexBuffer. Geometry.index_buffer is undefined.");
        const b = geometry.index_buffer.buffer;
        this.indices = b.BYTES_PER_ELEMENT == 2 ? b : b;
        this.EBO = stop ? gl.createBuffer() : WebGL.buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, b);
        this.references = new ReferenceCounter();
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
