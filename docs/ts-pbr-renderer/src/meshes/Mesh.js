/*
    Base Mesh Class
    A Mesh Contains:
            
 */
import { IndexBuffer } from "src/graphics/IndexBuffer";
import { VertexBuffer } from "src/graphics/VertexBuffer";
import { SubMesh } from "./SubMesh";
export class Mesh {
    constructor(gl, geometry) {
        if (geometry.indices)
            this.index_buffer = new IndexBuffer(gl, geometry);
        this.vertex_buffer = new VertexBuffer(gl, geometry);
        this.sub_meshes = [];
        this.draw_mode = 4 /* TRIANGLES */;
        this.count = 0;
        for (const group of geometry.groups) {
            this.count += group.count;
            this.sub_meshes.push(new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer));
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
//# sourceMappingURL=Mesh.js.map