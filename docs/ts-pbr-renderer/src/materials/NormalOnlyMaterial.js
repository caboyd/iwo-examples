import { Material } from "./Material";
import { Renderer } from "src/graphics/Renderer";
export class NormalOnlyMaterial extends Material {
    constructor() {
        //TODO: Allows normal in world or view space
        super();
    }
    activate(gl) { }
    get shader() {
        return Renderer.GetShader("NormalOnlyShader");
    }
    static get Shader() {
        return Renderer.GetShader("NormalOnlyShader");
    }
}
//# sourceMappingURL=NormalOnlyMaterial.js.map