import { Material } from "./Material";
import { Renderer } from "src/graphics/Renderer";
import { vec3 } from "gl-matrix";
export class PBRMaterial extends Material {
    constructor(color, metallic, roughness, ambient_occlusion = 1.0) {
        super();
        this.albedo = vec3.clone(color);
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion;
    }
    activate(gl) {
        const shader = this.shader;
        const active_textures = [false, false, false];
        if (this.albedo_texture) {
            this.albedo_texture.bind(gl, 0);
            active_textures[0] = true;
        }
        if (this.irradiance_texture) {
            this.irradiance_texture.bind(gl, 1);
            active_textures[1] = true;
        }
        if (this.specular_env) {
            this.specular_env.bind(gl, 2);
            active_textures[2] = true;
        }
        if (Renderer.BRDF_LUT_TEXTURE) {
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.BRDF_LUT_TEXTURE);
        }
        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
    }
    get shader() {
        return Renderer.GetShader("PBRShader");
    }
    static get Shader() {
        return Renderer.GetShader("PBRShader");
    }
    static generateBRDFLUT(gl) {
        const tex = {};
        tex.texture_id = gl.createTexture();
        return tex;
    }
}
//# sourceMappingURL=PBRMaterial.js.map