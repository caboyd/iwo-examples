import { Shader as Shader$1 } from './Shader.js';
import { ShaderSource } from './ShaderSources.js';
import { Renderer as Renderer$1 } from '../Renderer.js';

class BasicShader extends Shader$1 {
    constructor(gl, vertexSourceCode = ShaderSource.Basic.vert, fragmentSourceCode = ShaderSource.Basic.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.albedo_cube_sampler", 1);
    }
    use() {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer$1.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer$1.EMPTY_CUBE_TEXTURE);
    }
}

export { BasicShader };
