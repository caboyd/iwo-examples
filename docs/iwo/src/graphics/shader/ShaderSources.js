import { BasicShader } from './BasicShader.js';
import { PBRShader } from './PBRShader.js';
import { EquiToCubemapShader } from './EquiToCubemapShader.js';
import { CubemapToIrradianceShader } from './CubemapToIrradianceShader.js';
import { CubemapSpecularPrefilterShader } from './CubemapSpecularPrefilterShader.js';
import standardVert from '../../shaders/standard.vert.js';
import basicFrag from '../../shaders/basic.frag.js';
import pbrFrag from '../../shaders/pbr.frag.js';
import normalOnlyFrag from '../../shaders/normals.frag.js';
import equiToCubemapFrag from '../../shaders/equirectangularToCubemap.frag.js';
import cubemapToIrradianceFrag from '../../shaders/irradiance.frag.js';
import cubemapSpecularPrefilterFrag from '../../shaders/specularPrefilter.frag.js';
import gridVert from '../../shaders/grid.vert.js';
import gridFrag from '../../shaders/grid.frag.js';
import brdfVert from '../../shaders/brdf.vert.js';
import brdfFrag from '../../shaders/brdf.frag.js';

/**
 * Created by Chris on Apr, 2019
 *
 * Shader Source Files
 */
var ShaderSource;
(function (ShaderSource) {
    ShaderSource.Basic = {
        name: "BasicShader",
        vert: standardVert,
        frag: basicFrag,
        subclass: BasicShader,
    };
    ShaderSource.PBR = {
        name: "PBRShader",
        vert: standardVert,
        frag: pbrFrag,
        subclass: PBRShader,
    };
    ShaderSource.NormalOnly = {
        name: "NormalOnlyShader",
        vert: standardVert,
        frag: normalOnlyFrag,
        subclass: undefined,
    };
    ShaderSource.EquiToCubemap = {
        name: "EquiToCubemapShader",
        vert: standardVert,
        frag: equiToCubemapFrag,
        subclass: EquiToCubemapShader,
    };
    ShaderSource.CubemapToIrradiance = {
        name: "CubemapToIrradianceShader",
        vert: standardVert,
        frag: cubemapToIrradianceFrag,
        subclass: CubemapToIrradianceShader,
    };
    ShaderSource.CubemapSpecularPrefilter = {
        name: "CubemapSpecularPrefilter",
        vert: standardVert,
        frag: cubemapSpecularPrefilterFrag,
        subclass: CubemapSpecularPrefilterShader,
    };
    ShaderSource.Grid = {
        name: "GridShader",
        vert: gridVert,
        frag: gridFrag,
        subclass: undefined,
    };
    ShaderSource.BRDF = {
        name: "BRDFShader",
        vert: brdfVert,
        frag: brdfFrag,
        subclass: undefined,
    };
})(ShaderSource || (ShaderSource = {}));
const ShaderSources = Object.values(ShaderSource);

export { ShaderSource, ShaderSources };
//# sourceMappingURL=ShaderSources.js.map
