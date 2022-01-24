import { Material } from './Material.js';
import { Renderer } from '../graphics/Renderer.js';
import { Texture2D } from '../graphics/Texture2D.js';
import { vec3 } from 'https://unpkg.com/gl-matrix@3.4.3/esm/index.js';

class PBRMaterial extends Material {
    albedo;
    metallic;
    roughness;
    ao = 1;
    emissive_factor = [1, 1, 1];
    albedo_texture;
    albedo_image;
    normal_texture;
    normal_image;
    occlusion_texture;
    occlusion_image;
    metal_roughness_texture;
    metal_roughness_image;
    emissive_texture;
    emissive_image;
    irradiance_texture;
    specular_env;
    constructor(color, metallic, roughness, ambient_occlusion, emissive_factor) {
        super();
        this.albedo = vec3.clone(color);
        this.metallic = metallic;
        this.roughness = roughness;
        this.ao = ambient_occlusion || this.ao;
        this.emissive_factor = emissive_factor || this.emissive_factor;
    }
    activate(gl) {
        const shader = this.shader;
        const active_textures = [false, false, false, false, false, false];
        if (this.albedo_texture === undefined && this.albedo_image && this.albedo_image.complete) {
            this.albedo_texture = new Texture2D(gl, this.albedo_image, {
                flip: false,
                internal_format: gl.SRGB8_ALPHA8,
                format: gl.RGBA,
            });
        }
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
        if (this.normal_texture === undefined && this.normal_image?.complete) {
            this.normal_texture = new Texture2D(gl, this.normal_image, {
                flip: false,
            });
        }
        if (this.normal_texture) {
            this.normal_texture.bind(gl, 3);
            active_textures[3] = true;
        }
        if (this.occlusion_texture === undefined && this.occlusion_image?.complete) {
            this.occlusion_texture = new Texture2D(gl, this.occlusion_image, {
                flip: false,
            });
        }
        if (this.occlusion_texture) {
            this.occlusion_texture.bind(gl, 4);
            active_textures[4] = true;
        }
        if (this.metal_roughness_texture === undefined && this.metal_roughness_image?.complete) {
            this.metal_roughness_texture = new Texture2D(gl, this.metal_roughness_image, {
                flip: false,
            });
        }
        if (this.metal_roughness_texture) {
            this.metal_roughness_texture.bind(gl, 5);
            active_textures[5] = true;
        }
        if (this.emissive_texture === undefined && this.emissive_image?.complete) {
            this.emissive_texture = new Texture2D(gl, this.emissive_image, {
                flip: false,
                internal_format: gl.SRGB8_ALPHA8,
                format: gl.RGBA,
            });
        }
        if (this.emissive_texture) {
            this.emissive_texture.bind(gl, 6);
            active_textures[6] = true;
        }
        if (Renderer.BRDF_LUT_TEXTURE) {
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, Renderer.BRDF_LUT_TEXTURE);
        }
        shader.setUniform("u_material.active_textures[0]", active_textures);
        shader.setUniform("u_material.albedo", this.albedo);
        shader.setUniform("u_material.roughness", this.roughness);
        shader.setUniform("u_material.metallic", this.metallic);
        shader.setUniform("u_material.ao", this.ao);
        shader.setUniform("u_material.emissive_factor", this.emissive_factor);
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

export { PBRMaterial };
//# sourceMappingURL=PBRMaterial.js.map
