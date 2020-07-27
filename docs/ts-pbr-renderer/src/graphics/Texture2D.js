import { TextureHelper as TextureHelper$1 } from './TextureHelper.js';

class Texture2D {
    constructor(gl, source = undefined, width = 0, height = 0, wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        this.texture_id = gl.createTexture();
        if (source instanceof HTMLImageElement && source) {
            if (source.complete && source.src)
                this.setImage(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
            else {
                //prettier-ignore
                source.addEventListener("load", () => {
                    this.setImage(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
                }, { once: true });
            }
        }
        else if (source && TextureHelper$1.isArrayBufferView(source)) {
            //prettier-ignore
            this.setImageByBuffer(gl, source, width, height, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else if (source) {
            //prettier-ignore
            this.setImage(gl, source, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else if (width !== 0 && height !== 0) {
            //prettier-ignore
            //Making empty texture of some width and height because you want to render to it
            this.setImageByBuffer(gl, null, width, height, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        }
        else {
            //No image or buffer sets texture to pink black checkerboard
            //This should probably happen at the material loading level and not during texture setting
            //prettier-ignore
            this.setImageByBuffer(gl, TextureHelper$1.PINK_BLACK_CHECKERBOARD, 8, 8, gl.REPEAT, gl.MIRRORED_REPEAT, gl.NEAREST, gl.NEAREST);
        }
    }
    bind(gl, location) {
        gl.activeTexture(gl.TEXTURE0 + location);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
    }
    setImage(gl, image, wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterImage(gl, gl.TEXTURE_2D, image, wrap_S, wrap_T, undefined, mag_filter, min_filter, internal_format, format, type, flip);
    }
    setImageByBuffer(gl, buffer, width, height, wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        //prettier-ignore
        TextureHelper$1.texParameterBuffer(gl, gl.TEXTURE_2D, buffer, width, height, wrap_S, wrap_T, undefined, mag_filter, min_filter, internal_format, format, type, flip);
    }
    destroy(gl) {
        gl.deleteTexture(this.texture_id);
    }
}

export { Texture2D };
