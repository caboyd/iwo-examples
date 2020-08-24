import { ReferenceCounter as ReferenceCounter$1 } from '../helpers/ReferenceCounter.js';
import { WebGL } from './WebglHelper.js';
import { AttributeComponentCountMap } from '../geometry/BufferedGeometry.js';

class VertexBuffer {
    constructor(gl, geometry) {
        this.stride = 0;
        this.attributes = geometry.attributes;
        this.references = new ReferenceCounter$1();
        this.buffers = [];
        this.constructFromBufferedGeometry(gl, geometry);
    }
    constructFromBufferedGeometry(gl, geometry) {
        this.VAO = gl.createVertexArray();
        gl.bindVertexArray(this.VAO);
        //Turn the geometry buffer into WebGLBuffers
        for (const buffer of geometry.buffers) {
            //Need to add buffer for index_buffer to not mess up indexing
            if (buffer.target === gl.ELEMENT_ARRAY_BUFFER && geometry.index_buffer !== undefined) {
                this.buffers.push(gl.createBuffer());
                continue;
            }
            const b = WebGL.buildBuffer(gl, buffer.target, buffer.buffer);
            this.buffers.push(b);
        }
        this.setupVAOBuffers(gl);
        gl.bindVertexArray(null);
    }
    setupVAOBuffers(gl) {
        let bound_buffer = undefined;
        for (const attrib of this.attributes) {
            if (!attrib.enabled)
                continue;
            //Bind correct buffer
            if (this.buffers[attrib.buffer_index] !== bound_buffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[attrib.buffer_index]);
                bound_buffer = this.buffers[attrib.buffer_index];
            }
            gl.enableVertexAttribArray(attrib.type);
            gl.vertexAttribPointer(attrib.type, AttributeComponentCountMap[attrib.type], attrib.component_type, attrib.normalized ?? false, attrib.byte_stride ?? 0, attrib.byte_offset ?? 0);
        }
    }
    bindBuffers(gl) {
        gl.bindVertexArray(this.VAO);
    }
    destroy(gl) {
        if (this.references.count !== 0) {
            console.warn(this);
            console.warn("Can't destroy while still being referenced");
        }
        else {
            if (this.VAO)
                gl.deleteVertexArray(this.VAO);
            for (const buffer of this.buffers)
                gl.deleteBuffer(buffer);
        }
    }
}

export { VertexBuffer };
//# sourceMappingURL=VertexBuffer.js.map
