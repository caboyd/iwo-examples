import { mat4, mat3 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';
import { Shader as Shader$1 } from './shader/Shader.js';
import { Texture2D as Texture2D$1 } from './Texture2D.js';
import { UniformBuffer as UniformBuffer$1 } from './UniformBuffer.js';
import { RendererStats as RendererStats$1 } from './RendererStats.js';
import { ShaderSources as ShaderSources$1, ShaderSource } from './shader/ShaderSources.js';
import { TextureCubeMap as TextureCubeMap$1 } from './TextureCubeMap.js';

const temp = mat4.create();
const modelview_matrix = mat4.create();
let normalview_matrix = mat3.create();
const mvp_matrix = mat4.create();
class ViewportDimensions {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
}
class Renderer {
    constructor(gl) {
        this.PerFrameBinding = 0;
        this.PerModelBinding = 1;
        this.viewport = new ViewportDimensions();
        this.gl = gl;
        this.stats = new RendererStats$1();
        Renderer._EMPTY_TEXTURE = new Texture2D$1(gl).texture_id;
        Renderer._EMPTY_CUBE_TEXTURE = new TextureCubeMap$1(gl).texture_id;
        Renderer._Shaders = new Map();
        for (const shader_source of ShaderSources$1) {
            if (shader_source.subclass !== undefined) {
                Renderer._Shaders.set(shader_source.name, new shader_source.subclass(gl, shader_source.vert, shader_source.frag));
            }
            else {
                Renderer._Shaders.set(shader_source.name, new Shader$1(gl, shader_source.vert, shader_source.frag));
            }
        }
        const shader = Renderer.GetShader(ShaderSource.PBR.name);
        //Requires shader that has these uniform buffers present
        this.uboPerFrameBlock = new UniformBuffer$1(shader, "ubo_per_frame");
        this.uboPerModelBlock = new UniformBuffer$1(shader, "ubo_per_model");
        for (const shader of Renderer._Shaders.values()) {
            this.uboPerFrameBlock.bindShader(shader, this.PerFrameBinding);
            this.uboPerModelBlock.bindShader(shader, this.PerModelBinding);
        }
    }
    setPerFrameUniforms(view, proj) {
        this.uboPerFrameBlock.set("view", view);
        this.uboPerFrameBlock.set("view_inverse", mat4.invert(temp, view));
        this.uboPerFrameBlock.set("projection", proj);
        this.uboPerFrameBlock.set("view_projection", mat4.mul(temp, proj, view));
        this.uboPerFrameBlock.update(this.gl);
        //console.dir(this.stats);
        this.resetStats();
    }
    //Note: Setting Uniform blocks per draw call is not the best way.
    //A single uniform block for all objects to be drawn should be used and set once per frame.
    setPerModelUniforms(model_matrix, view_matrix, proj_matrix) {
        this.uboPerModelBlock.set("model", model_matrix);
        this.uboPerModelBlock.set("model_view", mat4.mul(modelview_matrix, view_matrix, model_matrix));
        //NOTE: Does this bug if normalFromMat4 returns null?
        normalview_matrix = mat3.normalFromMat4(normalview_matrix, modelview_matrix);
        if (normalview_matrix)
            this.uboPerModelBlock.set("normal_view", normalview_matrix);
        else
            throw new Error("Determinant could not be calculated for normalview_matrix");
        this.uboPerModelBlock.set("mvp", mat4.mul(mvp_matrix, proj_matrix, modelview_matrix));
        this.uboPerModelBlock.update(this.gl);
    }
    setViewport(x, y, width, height) {
        this.viewport = { x, y, width, height };
        this.gl.viewport(x, y, width, height);
    }
    resetViewport() {
        this.gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
    }
    resetSaveBindings() {
        this.current_vertex_buffer = undefined;
        this.current_index_buffer = undefined;
        this.current_material = undefined;
        this.current_shader = undefined;
    }
    draw(draw_mode, count, offset, index_buffer, vertex_buffer, mat = undefined) {
        if (mat && mat.shader != this.current_shader) {
            this.current_shader = mat.shader;
            this.current_shader.use();
            this.stats.shader_bind_count++;
        }
        if (mat && mat != this.current_material) {
            this.current_material = mat;
            this.current_material.activate(this.gl);
            this.stats.material_bind_count++;
        }
        if (vertex_buffer != this.current_vertex_buffer) {
            this.current_vertex_buffer = vertex_buffer;
            this.current_vertex_buffer.bindBuffers(this.gl);
            this.stats.vertex_buffer_bind_count++;
        }
        if (index_buffer && index_buffer != this.current_index_buffer) {
            this.current_index_buffer = index_buffer;
            this.current_index_buffer.bind(this.gl);
            this.stats.index_buffer_bind_count++;
        }
        if (index_buffer) {
            if (index_buffer.indices.BYTES_PER_ELEMENT === 2)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_SHORT, offset);
            else if (index_buffer.indices.BYTES_PER_ELEMENT === 4)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_INT, offset);
            else
                throw new Error("Unknown index buffer type");
            this.stats.index_draw_count += count;
        }
        else {
            this.gl.drawArrays(draw_mode, offset, count);
            this.stats.vertex_draw_count += count;
        }
        this.stats.draw_calls++;
    }
    resetStats() {
        //console.dir(this.stats);
        this.stats.reset();
        this.current_shader = undefined;
        this.current_material = undefined;
    }
    static get EMPTY_TEXTURE() {
        return this._EMPTY_TEXTURE;
    }
    static get EMPTY_CUBE_TEXTURE() {
        return this._EMPTY_CUBE_TEXTURE;
    }
    static get BRDF_LUT_TEXTURE() {
        return this._BRDF_LUT_TEXTURE;
    }
    static set BRDF_LUT_TEXTURE(tex) {
        this._BRDF_LUT_TEXTURE = tex;
    }
    static GetShader(name) {
        return this._Shaders.get(name);
    }
}

export { Renderer, ViewportDimensions };
//# sourceMappingURL=Renderer.js.map
