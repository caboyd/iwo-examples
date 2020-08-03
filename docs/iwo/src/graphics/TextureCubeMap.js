import { mat4 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';
import { AttributeType } from '../geometry/Geometry.js';
import { BoxGeometry as BoxGeometry$1 } from '../geometry/BoxGeometry.js';
import { Mesh as Mesh$1 } from '../meshes/Mesh.js';
import { TextureHelper as TextureHelper$1 } from './TextureHelper.js';
import { Texture2D as Texture2D$1 } from './Texture2D.js';
import { instanceOfHDRBuffer } from '../loader/HDRImageLoader.js';
import { ShaderSource } from './shader/ShaderSources.js';
import { CubeCamera as CubeCamera$1 } from '../cameras/CubeCamera.js';
import { Renderer as Renderer$1 } from './Renderer.js';

class TextureCubeMap {
    constructor(gl, source = undefined, width = 0, height = 0, wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, wrap_R = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        this.texture_id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        if (source && source instanceof HTMLImageElement) {
            if (source.complete && source.src)
                //prettier-ignore
                TextureHelper$1.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
            else {
                source.addEventListener("load", () => {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
                    //prettier-ignore
                    TextureHelper$1.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
                }, { once: true });
            }
        }
        else if (source && TextureHelper$1.isArrayBufferView(source)) {
            //prettier-ignore
            TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, source, width, height, wrap_S, wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else if (source) {
            //source is TexImageSource
            //prettier-ignore
            TextureHelper$1.texParameterImage(gl, gl.TEXTURE_CUBE_MAP, source, wrap_S, wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else if (width !== 0 && height !== 0) {
            //I have no idea why this code path exists.
            //prettier-ignore
            TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, width, height, wrap_S, wrap_T, wrap_R, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else {
            //No image or buffer sets texture to pink black checkerboard
            //prettier-ignore
            TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, TextureHelper$1.PINK_BLACK_CHECKERBOARD, 8, 8, wrap_S, wrap_T, wrap_R, gl.NEAREST, gl.NEAREST, internal_format, format, type, flip);
        }
    }
    bind(gl, location) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
    }
    destroy(gl) {
        gl.deleteTexture(this.texture_id);
    }
    static environmentFromEquirectangularHDRBuffer(renderer, buffer, resolution = 512) {
        const tex = new TextureCubeMap(renderer.gl);
        tex.setEquirectangularHDRBuffer(renderer, buffer, resolution);
        return tex;
    }
    static irradianceFromEquirectangularHDRBuffer(renderer, buffer, env_res = 512, irradiance_res = 32) {
        const tex = new TextureCubeMap(renderer.gl);
        tex.setEquirectangularHDRBuffer(renderer, buffer, env_res);
        return tex;
    }
    static specularFromCubemap(dest_cubemap, renderer, env_cubemap, resolution = 128) {
        const gl = renderer.gl;
        const ext = gl.getExtension("EXT_color_buffer_float");
        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);
        const specular_cubemap = dest_cubemap || { texture_id: gl.createTexture() };
        const box_geom = new BoxGeometry$1(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh$1(gl, box_geom);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, specular_cubemap.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, false);
        const captureFBO = gl.createFramebuffer();
        const captureRBO = gl.createRenderbuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);
        const cam = new CubeCamera$1();
        // convert Environment cubemap to irradiance cubemap
        const shader = Renderer$1.GetShader(ShaderSource.CubemapSpecularPrefilter.name);
        shader.use();
        env_cubemap.bind(gl, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face)
            gl.disable(gl.CULL_FACE);
        const max_mip_levels = 5;
        for (let mip = 0; mip < max_mip_levels; mip++) {
            const mip_width = res * Math.pow(0.5, mip);
            const mip_height = res * Math.pow(0.5, mip);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mip_width, mip_height);
            gl.viewport(0, 0, mip_width, mip_height);
            const roughness = mip / (max_mip_levels - 1);
            shader.setUniform("roughness", roughness);
            for (let i = 0; i < 6; i++) {
                renderer.setPerFrameUniforms(cam.views[i], cam.projection);
                renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
                //prettier-ignore
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, specular_cubemap.texture_id, mip);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
            }
        }
        this.genBRDFLut(gl, captureFBO, captureRBO, renderer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face)
            gl.enable(gl.CULL_FACE);
        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);
        return specular_cubemap;
    }
    static irradianceFromCubemap(dest_cubemap, renderer, env_cubemap, resolution = 32) {
        const gl = renderer.gl;
        const ext = gl.getExtension("EXT_color_buffer_float");
        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);
        const box_geom = new BoxGeometry$1(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh$1(gl, box_geom);
        const irr_cubemap = dest_cubemap || { texture_id: gl.createTexture() };
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irr_cubemap.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, false);
        const captureFBO = gl.createFramebuffer();
        const captureRBO = gl.createRenderbuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);
        const cam = new CubeCamera$1();
        // convert Environment cubemap to irradiance cubemap
        const shader = Renderer$1.GetShader(ShaderSource.CubemapToIrradiance.name);
        shader.use();
        env_cubemap.bind(gl, 0);
        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face)
            gl.disable(gl.CULL_FACE);
        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(cam.views[i], cam.projection);
            renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
            //prettier-ignore
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, irr_cubemap.texture_id, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
        }
        this.genBRDFLut(gl, captureFBO, captureRBO, renderer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        renderer.resetViewport();
        if (is_old_cull_face)
            gl.enable(gl.CULL_FACE);
        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        box_mesh.destroy(gl);
        return irr_cubemap;
    }
    setEquirectangularHDRBuffer(renderer, buffer, resolution = buffer.height) {
        this.setEquirectangular(renderer, buffer, resolution);
    }
    setEquirectangularImage(renderer, image, resolution = image.height) {
        this.setEquirectangular(renderer, image, resolution);
    }
    setEquirectangular(renderer, image_source, resolution) {
        const gl = renderer.gl;
        const ext = gl.getExtension("EXT_color_buffer_float");
        const max_res = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        const res = Math.min(resolution, max_res);
        const box_geom = new BoxGeometry$1(2.0, 2.0, 2.0, 1, 1, 1, false);
        const box_mesh = new Mesh$1(gl, box_geom);
        let texture;
        if (instanceOfHDRBuffer(image_source)) {
            //prettier-ignore
            texture = new Texture2D$1(gl, image_source.data, image_source.width, image_source.height, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true);
        }
        else {
            //prettier-ignore
            texture = new Texture2D$1(gl, image_source, 0, 0, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGB32F, gl.RGB, gl.FLOAT, true);
        }
        const captureFBO = gl.createFramebuffer();
        const captureRBO = gl.createRenderbuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, res, res);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_CUBE_MAP, null, res, res, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, false);
        const cam = new CubeCamera$1();
        // convert HDR equirectangular environment map to cubemap equivalent
        const shader = Renderer$1.GetShader("EquiToCubemapShader");
        shader.use();
        texture.bind(gl, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer$1.EMPTY_CUBE_TEXTURE);
        gl.viewport(0, 0, res, res);
        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        const is_old_cull_face = gl.isEnabled(gl.CULL_FACE);
        if (is_old_cull_face)
            gl.disable(gl.CULL_FACE);
        for (let i = 0; i < 6; i++) {
            renderer.setPerFrameUniforms(cam.views[i], cam.projection);
            renderer.setPerModelUniforms(mat4.create(), cam.views[i], cam.projection);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.texture_id, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(box_mesh.draw_mode, box_mesh.count, 0, box_mesh.index_buffer, box_mesh.vertex_buffer);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //let OpenGL generate mipmaps from first mip face (combatting visible dots artifact)
        this.bind(gl, 0);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        renderer.resetViewport();
        if (is_old_cull_face)
            gl.enable(gl.CULL_FACE);
        gl.deleteRenderbuffer(captureRBO);
        gl.deleteFramebuffer(captureFBO);
        texture.destroy(gl);
        box_mesh.destroy(gl);
    }
    static genBRDFLut(gl, captureFBO, captureRBO, renderer) {
        if (Renderer$1.BRDF_LUT_TEXTURE === undefined) {
            //Generate brdf LUT if it doesnt exist as its required for IBL
            const quad_geom = {
                attribute_flags: AttributeType.Vertex | AttributeType.Tex_Coords,
                isInterleaved: true,
                //prettier-ignore
                interleaved_attributes: new Float32Array([
                    // positions        // texture Coords
                    -1.0, 1.0, 0.0, 0.0, 1.0,
                    -1.0, -1.0, 0.0, 0.0, 0.0,
                    1.0, 1.0, 0.0, 1.0, 1.0,
                    1.0, -1.0, 0.0, 1.0, 0.0,
                ]),
                groups: [{ count: 4, offset: 0, material_index: 0 }],
            };
            const quad_mesh = new Mesh$1(gl, quad_geom);
            quad_mesh.draw_mode = gl.TRIANGLE_STRIP;
            //prettier-ignore
            const lut_tex = new Texture2D$1(gl, undefined, 512, 512, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RG16F, gl.RG, gl.HALF_FLOAT, true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
            gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lut_tex.texture_id, 0);
            gl.viewport(0, 0, 512, 512);
            const shader = Renderer$1.GetShader(ShaderSource.BRDF.name);
            shader.use();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderer.draw(quad_mesh.draw_mode, quad_mesh.count, 0, quad_mesh.index_buffer, quad_mesh.vertex_buffer);
            Renderer$1.BRDF_LUT_TEXTURE = lut_tex.texture_id;
            quad_mesh.destroy(gl);
        }
    }
}

export { TextureCubeMap };
//# sourceMappingURL=TextureCubeMap.js.map
