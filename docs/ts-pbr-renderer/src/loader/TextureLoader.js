import { Texture2D as Texture2D$1 } from '../graphics/Texture2D.js';
import { ImageLoader as ImageLoader$1 } from './ImageLoader.js';

class TextureLoader {
    static load(gl, file_name, base_url = window.location.href.substr(0, window.location.href.lastIndexOf("/")), wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        const tex = new Texture2D$1(gl, new Image());
        ImageLoader$1.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        });
        return tex;
    }
}

export { TextureLoader };
