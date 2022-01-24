import { Shader } from './Shader.js';
import { Renderer } from '../Renderer.js';
import { ShaderSource } from './ShaderSources.js';

class CubemapToIrradianceShader extends Shader {
    constructor(gl, vertexSourceCode = ShaderSource.CubemapToIrradiance.vert, fragmentSourceCode = ShaderSource.CubemapToIrradiance.frag) {
        super(gl, vertexSourceCode, fragmentSourceCode);
        this.use();
        this.setUniform("equirectangular_map", 0);
    }
    use() {
        const gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
    }
}

export { CubemapToIrradianceShader };
//# sourceMappingURL=CubemapToIrradianceShader.js.map
