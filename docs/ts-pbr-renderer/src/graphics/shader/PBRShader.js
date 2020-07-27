import { Shader as Shader$1 } from './Shader.js';
import { ShaderSource } from './ShaderSources.js';
import { Renderer as Renderer$1 } from '../Renderer.js';

class PBRShader extends Shader$1 {
    constructor(gl, vertexSourceCode = ShaderSource.PBR.vert, fragmentSourceCode = ShaderSource.PBR.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.irradiance_sampler", 1);
        this.setUniform("u_material.env_sampler", 2);
        this.setUniform("u_material.brdf_LUT_sampler", 3);
    }
    use() {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer$1.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer$1.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer$1.EMPTY_CUBE_TEXTURE);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, Renderer$1.EMPTY_TEXTURE);
    }
}

export { PBRShader };
