import { Shader } from './Shader.js';
import { Renderer } from '../Renderer.js';
import { ShaderSource } from './ShaderSources.js';

class EquiToCubemapShader extends Shader {
    constructor(gl, vertexSourceCode = ShaderSource.EquiToCubemap.vert, fragmentSourceCode = ShaderSource.EquiToCubemap.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }
    use() {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
    }
}

export { EquiToCubemapShader };
//# sourceMappingURL=EquiToCubemapShader.js.map
