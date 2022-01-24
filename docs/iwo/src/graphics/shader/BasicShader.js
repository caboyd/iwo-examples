import { Shader } from './Shader.js';
import { Renderer } from '../Renderer.js';
import { ShaderSource } from './ShaderSources.js';

class BasicShader extends Shader {
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
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
    }
}

export { BasicShader };
//# sourceMappingURL=BasicShader.js.map
