import { Material } from "./Material";
import { Renderer } from "src/graphics/Renderer";
import { vec3 } from "gl-matrix";
export class BasicMaterial extends Material {
    constructor(color) {
        super();
        this.equirectangular_albedo = false;
        this.albedo = vec3.clone(color);
    }
    activate(gl) {
        const shader = this.shader;
        const active_textures = [false, false];
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
            if (this.equirectangular_albedo)
                shader.setUniform("u_material.equirectangular_texture", true);
        }
        if (this.albedo_cube_texture) {
            this.albedo_cube_texture.bind(gl, 1);
            active_textures[1] = true;
        }
        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
    }
    setAlbedoTexture(tex, equirectangular = false) {
        this.equirectangular_albedo = equirectangular;
        this.albedo_texture = tex;
    }
    setAlbedoCubeTexture(tex) {
        this.albedo_cube_texture = tex;
    }
    get shader() {
        return Renderer.GetShader("BasicShader");
    }
    static get Shader() {
        return Renderer.GetShader("BasicShader");
    }
}
//# sourceMappingURL=BasicMaterial.js.map