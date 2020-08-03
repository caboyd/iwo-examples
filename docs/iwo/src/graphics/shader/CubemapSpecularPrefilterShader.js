import { Shader as Shader$1 } from './Shader.js';
import { ShaderSource } from './ShaderSources.js';
import { Renderer as Renderer$1 } from '../Renderer.js';

class CubemapSpecularPrefilterShader extends Shader$1 {
    constructor(gl, vertexSourceCode = ShaderSource.CubemapSpecularPrefilter.vert, fragmentSourceCode = ShaderSource.CubemapSpecularPrefilter.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }
    use() {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer$1.EMPTY_CUBE_TEXTURE);
    }
}

export { CubemapSpecularPrefilterShader };
//# sourceMappingURL=CubemapSpecularPrefilterShader.js.map
