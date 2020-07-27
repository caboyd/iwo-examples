import { ImageLoader } from "./ImageLoader";
import { Texture2D } from "src/graphics/Texture2D";
export class TextureLoader {
    static load(gl, file_name, base_url = window.location.href.substr(0, window.location.href.lastIndexOf("/")), wrap_S = gl.REPEAT, wrap_T = gl.REPEAT, mag_filter = gl.LINEAR, min_filter = gl.LINEAR_MIPMAP_LINEAR, internal_format = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, flip = true) {
        const tex = new Texture2D(gl, new Image());
        ImageLoader.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, wrap_S, wrap_T, mag_filter, min_filter, internal_format, format, type, flip);
        });
        return tex;
    }
}
//# sourceMappingURL=TextureLoader.js.map