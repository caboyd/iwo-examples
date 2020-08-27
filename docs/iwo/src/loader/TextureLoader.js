import { Texture2D as Texture2D$1 } from '../graphics/Texture2D.js';
import { FileLoader as FileLoader$1 } from './FileLoader.js';
import { ImageLoader as ImageLoader$1 } from './ImageLoader.js';

class TextureLoader {
    static load(gl, file_name, base_url = FileLoader$1.Default_Base_URL, options) {
        const tex = new Texture2D$1(gl, new Image());
        ImageLoader$1.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, options);
        });
        return tex;
    }
}

export { TextureLoader };
//# sourceMappingURL=TextureLoader.js.map
