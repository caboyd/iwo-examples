import { vec3 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';
import { Renderer as Renderer$1 } from '../graphics/Renderer.js';
import { Material as Material$1 } from './Material.js';

class BasicMaterial extends Material$1 {
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
        return Renderer$1.GetShader("BasicShader");
    }
    static get Shader() {
        return Renderer$1.GetShader("BasicShader");
    }
}

export { BasicMaterial };
