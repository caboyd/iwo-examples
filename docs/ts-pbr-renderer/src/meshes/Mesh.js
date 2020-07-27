import { IndexBuffer as IndexBuffer$1 } from '../graphics/IndexBuffer.js';
import { VertexBuffer as VertexBuffer$1 } from '../graphics/VertexBuffer.js';
import { SubMesh as SubMesh$1 } from './SubMesh.js';

/*
    Base Mesh Class
    A Mesh Contains:
            
 */
class Mesh {
    constructor(gl, geometry) {
        if (geometry.indices)
            this.index_buffer = new IndexBuffer$1(gl, geometry);
        this.vertex_buffer = new VertexBuffer$1(gl, geometry);
        this.sub_meshes = [];
        this.draw_mode = 4 /* TRIANGLES */;
        this.count = 0;
        for (const group of geometry.groups) {
            this.count += group.count;
            this.sub_meshes.push(new SubMesh$1(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer));
        }
    }
    setDrawMode(mode) {
        this.draw_mode = mode;
    }
    destroy(gl) {
        for (const sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }
        if (this.index_buffer)
            this.index_buffer.destroy(gl);
        this.vertex_buffer.destroy(gl);
    }
}

export { Mesh };
