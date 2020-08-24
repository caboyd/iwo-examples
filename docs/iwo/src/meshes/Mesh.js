import { Geometry as Geometry$1, AttributeType } from '../geometry/Geometry.js';
import { IndexBuffer as IndexBuffer$1 } from '../graphics/IndexBuffer.js';
import { BufferedGeometry as BufferedGeometry$1 } from '../geometry/BufferedGeometry.js';
import { VertexBuffer as VertexBuffer$1 } from '../graphics/VertexBuffer.js';
import { SubMesh as SubMesh$1 } from './SubMesh.js';

/*
    Base Mesh Class
    A Mesh Contains:
            
 */
class Mesh {
    constructor(gl, geometry) {
        let buf_geom = geometry;
        if (geometry instanceof Geometry$1) {
            buf_geom =
                geometry.getBufferedGeometry !== undefined
                    ? geometry.getBufferedGeometry()
                    : BufferedGeometry$1.fromGeometry(geometry);
        }
        if (buf_geom.index_buffer !== undefined)
            this.index_buffer = new IndexBuffer$1(gl, buf_geom);
        this.vertex_buffer = new VertexBuffer$1(gl, buf_geom);
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
            this.sub_meshes.push(new SubMesh$1(0, 0, this.count, this.vertex_buffer, this.index_buffer));
        }
        else {
            for (const group of buf_geom.groups) {
                this.count += group.count;
                this.sub_meshes.push(new SubMesh$1(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer));
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
