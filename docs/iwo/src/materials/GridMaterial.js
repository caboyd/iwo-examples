import { Material } from './Material.js';
import { Renderer } from '../graphics/Renderer.js';

class GridMaterial extends Material {
    distance;
    //Units between grey lines
    frequency;
    //Unit between colored highlight lines
    highlight_frequency;
    constructor(view_distance, frequency = 1, highlight_frequency = 10) {
        super();
        this.distance = view_distance;
        this.frequency = frequency;
        this.highlight_frequency = highlight_frequency;
    }
    activate(gl) {
        const shader = this.shader;
        shader.setUniform("distance", this.distance);
        shader.setUniform("frequency", this.frequency);
        shader.setUniform("highlight_frequency", this.highlight_frequency);
    }
    get shader() {
        return Renderer.GetShader("GridShader");
    }
    static get Shader() {
        return Renderer.GetShader("GridShader");
    }
}

export { GridMaterial };
//# sourceMappingURL=GridMaterial.js.map
