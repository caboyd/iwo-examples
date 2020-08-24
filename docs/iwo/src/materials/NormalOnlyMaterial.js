import { Renderer as Renderer$1 } from '../graphics/Renderer.js';
import { Material as Material$1 } from './Material.js';

class NormalOnlyMaterial extends Material$1 {
    constructor() {
        //TODO: Allows normal in world or view space
        super();
    }
    activate(gl) { }
    get shader() {
        return Renderer$1.GetShader("NormalOnlyShader");
    }
    static get Shader() {
        return Renderer$1.GetShader("NormalOnlyShader");
    }
}

export { NormalOnlyMaterial };
//# sourceMappingURL=NormalOnlyMaterial.js.map
