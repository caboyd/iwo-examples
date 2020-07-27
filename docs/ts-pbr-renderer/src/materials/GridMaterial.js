import { Material } from "./Material";
import { Renderer } from "src/graphics/Renderer";
export class GridMaterial extends Material {
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
        return Renderer.GetShader("GridShader");
    }
    static get Shader() {
        return Renderer.GetShader("GridShader");
    }
}
//# sourceMappingURL=GridMaterial.js.map