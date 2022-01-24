import { TextureHelper as TextureHelper$1 } from './TextureHelper.js';
import { GL } from './WebglConstants.js';

const DefaultTextureOptions = {
    width: 0,
    height: 0,
    wrap_S: GL.REPEAT,
    wrap_T: GL.REPEAT,
    wrap_R: GL.REPEAT,
    mag_filter: GL.LINEAR,
    min_filter: GL.LINEAR_MIPMAP_LINEAR,
    internal_format: GL.RGBA,
    format: GL.RGBA,
    type: GL.UNSIGNED_BYTE,
    flip: false,
};
class Texture2D {
    constructor(gl, source = undefined, options) {
        const o = { ...DefaultTextureOptions, ...options };
        this.texture_id = gl.createTexture();
        if (source instanceof HTMLImageElement && source) {
            if (source.complete && source.src)
                this.setImage(gl, source, o);
            else {
                //prettier-ignore
                source.addEventListener("load", () => {
                    this.setImage(gl, source, o);
                }, { once: true });
            }
        }
        else if (source && TextureHelper$1.isArrayBufferView(source)) {
            //prettier-ignore
            this.setImageByBuffer(gl, source, o);
        }
        else if (source) {
            //prettier-ignore
            this.setImage(gl, source, o);
        }
        else if (o.width !== 0 && o.height !== 0) {
            //prettier-ignore
            //Making empty texture of some width and height because you want to render to it
            this.setImageByBuffer(gl, null, o);
        }
        else {
            //No image or buffer exists. so we set texture to pink black checkerboard
            //This should probably happen at the material loading level and not during texture setting
            const o2 = {
                ...DefaultTextureOptions,
                ...{
                    width: 8,
                    height: 8,
                    wrap_S: gl.REPEAT,
                    wrap_T: gl.MIRRORED_REPEAT,
                    mag_filter: gl.NEAREST,
                    min_filter: gl.NEAREST,
                },
            };
            this.setImageByBuffer(gl, TextureHelper$1.PINK_BLACK_CHECKERBOARD, o2);
        }
    }
    bind(gl, location) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
    }
    setImage(gl, image, options) {
        const o = { ...DefaultTextureOptions, ...options };
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterImage(gl, gl.TEXTURE_2D, image, o);
    }
    setImageByBuffer(gl, buffer, options) {
        const o = { ...DefaultTextureOptions, ...options };
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_2D, buffer, o);
    }
    destroy(gl) {
        gl.deleteTexture(this.texture_id);
    }
}

export { DefaultTextureOptions, Texture2D };
//# sourceMappingURL=Texture2D.js.map
