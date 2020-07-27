import { mat3, mat4 } from "gl-matrix";
import { Uniform } from "../Uniform";
const modelview_matrix = mat4.create();
const normalview_matrix = mat3.create();
const mvp_matrix = mat4.create();
export class Shader {
    constructor(gl, vertexSourceCode, fragmentSourceCode) {
        this.gl = gl;
        const vertexShader = Shader.getCompiledShader(gl, vertexSourceCode, gl.VERTEX_SHADER);
        const fragmentShader = Shader.getCompiledShader(gl, fragmentSourceCode, gl.FRAGMENT_SHADER);
        this.ID = gl.createProgram();
        gl.attachShader(this.ID, vertexShader);
        gl.attachShader(this.ID, fragmentShader);
        gl.linkProgram(this.ID);
        if (!gl.getProgramParameter(this.ID, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }
        //TODO: Copy what twgl does and get the uniform names from the shader, before the user does
        this.uniforms = new Map();
        this.attributes = new Map();
        this.initUniforms();
    }
    initUniforms() {
        const gl = this.gl;
        const num_uniforms = gl.getProgramParameter(this.ID, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < num_uniforms; i++) {
            const info = gl.getActiveUniform(this.ID, i);
            this.uniforms.set(info.name, new Uniform(gl, this.ID, info));
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUniform(name, value) {
        const uniform = this.uniforms.get(name);
        if (uniform)
            uniform.set(value);
    }
    setModelViewBlock(model_matrix, view_matrix, proj_matrix) {
        //Model view matrix
        mat4.mul(modelview_matrix, view_matrix, model_matrix);
        //Normal matrix in view space
        // mat3.normalFromMat4(normalview_matrix,model_matrix);
        // this.setMat3ByName("u_normal_matrix", normalview_matrix);
        mat3.normalFromMat4(normalview_matrix, modelview_matrix);
        //MVP Matrix
        mat4.mul(mvp_matrix, proj_matrix, modelview_matrix);
        //   this.setMat4ByName("u_model_matrix", model_matrix);
        this.setUniform("u_view_matrix", view_matrix);
        this.setUniform("u_modelview_matrix", modelview_matrix);
        this.setUniform("u_normalview_matrix", normalview_matrix);
        this.setUniform("u_mvp_matrix", mvp_matrix);
        console.dir(mvp_matrix);
    }
    setViewProjBlock(view_matrix, proj_matrix) {
        mat4.mul(mvp_matrix, proj_matrix, view_matrix);
        this.setUniform("u_view_matrix", view_matrix);
        this.setUniform("u_proj_matrix", proj_matrix);
        this.setUniform("u_vp_matrix", mvp_matrix);
    }
    delete() {
        this.gl.deleteShader(this.ID);
    }
    use() {
        this.gl.useProgram(this.ID);
    }
    setAttributes(attr) {
        for (let a of attr) {
            this.attributes.set(a, this.gl.getAttribLocation(this.ID, a));
        }
    }
    setUniforms(uniforms) {
        for (let [name, value] of uniforms) {
            if (value)
                this.setUniform(name, value);
        }
    }
    static getCompiledShader(gl, sourceCode, type) {
        let shader;
        shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
        }
        return shader;
    }
}
//# sourceMappingURL=Shader.js.map