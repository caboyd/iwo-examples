import { Renderer as Renderer$1 } from '../graphics/Renderer.js';
import { Material as Material$1 } from './Material.js';

class GridMaterial extends Material$1 {
    constructor(view_distance, frequency = 1) {
        super();
        this.distance = view_distance;
        this.frequency = frequency;
    }
    activate(gl) {
        let shader = this.shader;
        shader.setUniform("distance", this.distance);
        shader.setUniform("frequency", this.frequency);
    }
    get shader() {
        return Renderer$1.GetShader("GridShader");
    }
    static get Shader() {
        return Renderer$1.GetShader("GridShader");
    }
}

export { GridMaterial };
//# sourceMappingURL=GridMaterial.js.map
