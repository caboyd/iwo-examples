import { mat4 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';

class MeshInstance {
    constructor(mesh, materials) {
        this.mesh = mesh;
        this.materials = materials;
        this.model_matrix = mat4.create();
    }
    render(renderer, view_matrix, proj_matrix) {
        renderer.setPerModelUniforms(this.model_matrix, view_matrix, proj_matrix);
        if (Array.isArray(this.materials)) {
            for (const i of this.materials.keys()) {
                const mat = this.materials[i];
                for (const submesh of this.mesh.sub_meshes) {
                    if (submesh.material_index === i) {
                        renderer.draw(this.mesh.draw_mode, submesh.count, submesh.offset, submesh.index_buffer, submesh.vertex_buffer, mat);
                    }
                }
            }
        }
        else {
            renderer.draw(this.mesh.draw_mode, this.mesh.count, 0, this.mesh.index_buffer, this.mesh.vertex_buffer, this.materials);
        }
    }
}

export { MeshInstance };
//# sourceMappingURL=MeshInstance.js.map
