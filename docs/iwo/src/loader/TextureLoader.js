import { ImageLoader } from './ImageLoader.js';
import { Texture2D } from '../graphics/Texture2D.js';
import { FileLoader } from './FileLoader.js';

class TextureLoader {
    static load(gl, file_name, base_url = FileLoader.Default_Base_URL, options) {
        const tex = new Texture2D(gl, new Image());
        ImageLoader.promise(file_name, base_url).then(image => {
            tex.setImage(gl, image, options);
        });
        return tex;
    }
}

export { TextureLoader };
//# sourceMappingURL=TextureLoader.js.map
