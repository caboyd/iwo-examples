import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = vec3.fromValues(2.5, 0, 6.0);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let renderer: IWO.Renderer;
let skybox: IWO.MeshInstance;
let helmet: IWO.MeshInstance;
let helmet_loaded = false;

(function main(): void {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");

    gl = IWO.initGL(canvas);

    renderer = new IWO.Renderer(gl);

    window.addEventListener("resize", resizeCanvas, false);

    function resizeCanvas(): void {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        mat4.perspective(
            proj_matrix,
            glMatrix.toRadian(45),
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000.0
        );
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initGL(): WebGL2RenderingContext {
    try {
        gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
    } catch (e) {
        throw new Error("GL init error:\n" + e);
    }

    if (!gl) {
        alert("WebGL is not available on your browser.");
    }
    return gl;
}

function initScene(): void {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { minimum_distance: 5.5, maximum_distance: 14 });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    function sphereUVtoVec3(out: vec3, u: number, v: number): vec3 {
        const theta = (v - 0.5) * Math.PI;
        const phi = u * 2 * Math.PI;

        const x = Math.cos(phi) * Math.cos(theta);
        const y = Math.sin(theta);
        const z = Math.sin(phi) * Math.cos(theta);

        vec3.set(out, x, y, z);
        return out;
    }

    const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const sun_intensity = 24;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("u_light_count", 1);
    // pbrShader.setUniform("light_ambient", [1.25, 1.25, 1.25]);

    const sky_tex = new IWO.Texture2D(gl);
    let irr_tex = new IWO.TextureCubeMap(gl);
    let env_tex = new IWO.TextureCubeMap(gl);
    const cube_tex = new IWO.TextureCubeMap(gl);

    //Init Helmet
    IWO.glTFLoader.promise("DamagedHelmet.gltf", root_url + "damaged-helmet").then((value: IWO.glTFData) => {
        helmet_loaded = true;
        const m = new IWO.Mesh(gl, value.buffered_geometries[0]);
        renderer.resetSaveBindings();
        helmet = new IWO.MeshInstance(m, value.materials);
        const pbr = (helmet.materials as IWO.Material[])[0] as IWO.PBRMaterial;
        pbr.irradiance_texture = irr_tex;
        pbr.specular_env_texture = env_tex;

        const helmet_rot = mat4.fromQuat(mat4.create(), [0.7071068286895752, 0.0, -0.0, 0.7071068286895752]);
        //const boom_rot = mat4.fromRotation(mat4.create(), Math.PI/2 , [0, 1, 0]);
        //mat4.translate(helmet.model_matrix, helmet.model_matrix, [0, 5, 0]);
        mat4.multiply(helmet.model_matrix, helmet.model_matrix, helmet_rot);
        mat4.scale(helmet.model_matrix, helmet.model_matrix, [4, 4, 4]);
    });

    const tex2D_opts = {
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR,
        flip: true,
    };

    const file_prefix = root_url + "cubemap/monvalley/MonValley_A_LookoutPoint";
    IWO.ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
        sky_tex.setImage(gl, image, tex2D_opts);
        IWO.ImageLoader.promise(file_prefix + "_8k.jpg").then((image: HTMLImageElement) => {
            sky_tex.setImage(gl, image, tex2D_opts);
        });
    });

    IWO.HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: IWO.HDRBuffer) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = IWO.TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex, 16);
        env_tex = IWO.TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, 512);
        // HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: HDRBuffer) => {
        //     cube_tex.setEquirectangularHDRBuffer(renderer, data);
        //     env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
        //     cube_tex.destroy(gl);
        // });
    });

    //SKYBOX
    const sky_geom = new IWO.SphereGeometry(1, 48, 48);
    const sky_mesh = new IWO.Mesh(gl, sky_geom);
    const sky_mat = new IWO.BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new IWO.MeshInstance(sky_mesh, sky_mat);
}

function update(): void {
    orbit.update();
    drawScene();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    //skybox
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    mat4.identity(skybox.model_matrix);
    mat4.translate(skybox.model_matrix, skybox.model_matrix, camera.position);
    mat4.scale(skybox.model_matrix, skybox.model_matrix, [-1, 1, -1]);

    skybox.render(renderer, view_matrix, proj_matrix);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    //Draw Helmet
    if (helmet_loaded) helmet.render(renderer, view_matrix, proj_matrix);
    renderer.resetSaveBindings();
}
