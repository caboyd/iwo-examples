import { Geometry, AttributeType } from '../geometry/Geometry.js';
import { IndexBuffer } from '../graphics/IndexBuffer.js';
import { VertexBuffer } from '../graphics/VertexBuffer.js';
import { SubMesh } from './SubMesh.js';
import { BufferedGeometry } from '../geometry/BufferedGeometry.js';

/*
    Base Mesh Class
    A Mesh Contains:
            
 */
class Mesh {
    index_buffer;
    vertex_buffer;
    draw_mode;
    sub_meshes;
    count;
    constructor(gl, geometry) {
        let buf_geom = geometry;
        if (geometry instanceof Geometry) {
            buf_geom =
                geometry.getBufferedGeometry !== undefined
                    ? geometry.getBufferedGeometry()
                    : BufferedGeometry.fromGeometry(geometry);
        }
        if (buf_geom.index_buffer !== undefined)
            this.index_buffer = new IndexBuffer(gl, buf_geom);
        this.vertex_buffer = new VertexBuffer(gl, buf_geom);
        this.sub_meshes = [];
        this.draw_mode = 4 /* TRIANGLES */;
        this.count = 0;
        if (buf_geom.groups === undefined || buf_geom.groups.length == 0) {
            //If a geometry has no groups we can assume:
            //  count is indices count or vertices count /3
            //  material is 0
            //  offset is 0
            this.count =
                buf_geom.index_buffer !== undefined
                    ? buf_geom.index_buffer.buffer.length
                    : buf_geom.buffers[buf_geom.attributes[AttributeType.Vertex].buffer_index].buffer.length / 3;
            this.sub_meshes.push(new SubMesh(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        }
        else {
            for (const group of buf_geom.groups) {
                this.count += group.count;
                this.sub_meshes.push(new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer));
            }
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
//# sourceMappingURL=Mesh.js.map
