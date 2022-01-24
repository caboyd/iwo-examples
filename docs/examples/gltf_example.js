import { mat4, vec3, glMatrix } from 'https://unpkg.com/gl-matrix@3.4.3/esm/index.js';
import { Camera } from '../iwo/src/cameras/Camera.js';
import { OrbitControl } from '../iwo/src/cameras/OrbitControl.js';
import '../iwo/src/geometry/BoxGeometry.js';
import '../iwo/src/geometry/Geometry.js';
import '../iwo/src/geometry/BufferedGeometry.js';
import { PlaneGeometry } from '../iwo/src/geometry/PlaneGeometry.js';
import { SphereGeometry } from '../iwo/src/geometry/SphereGeometry.js';
import '../iwo/src/graphics/WebglHelper.js';
import { Renderer } from '../iwo/src/graphics/Renderer.js';
import { Texture2D } from '../iwo/src/graphics/Texture2D.js';
import { TextureCubeMap } from '../iwo/src/graphics/TextureCubeMap.js';
import '../iwo/src/graphics/TextureHelper.js';
import '../iwo/src/graphics/WebglConstants.js';
import '../iwo/src/loader/FileLoader.js';
import { HDRImageLoader } from '../iwo/src/loader/HDRImageLoader.js';
import { glTFLoader } from '../iwo/src/loader/glTFLoader.js';
import { ImageLoader } from '../iwo/src/loader/ImageLoader.js';
import { BasicMaterial } from '../iwo/src/materials/BasicMaterial.js';
import { GridMaterial } from '../iwo/src/materials/GridMaterial.js';
import { PBRMaterial } from '../iwo/src/materials/PBRMaterial.js';
import { Mesh } from '../iwo/src/meshes/Mesh.js';
import { MeshInstance } from '../iwo/src/meshes/MeshInstance.js';

let canvas;
let gl;
const view_matrix = mat4.create();
const proj_matrix = mat4.create();
const cPos = vec3.fromValues(2.5, 0, 6.0);
let camera;
let orbit;
let mouse_x_total = 0;
let mouse_y_total = 0;
let renderer;
let skybox;
let helmet;
let helmet_loaded = false;
document.getElementById("loading-text-wrapper").remove();
const moveCallback = (e) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    if (e.which == 1) {
        mouse_x_total += movementX;
        mouse_y_total += movementY;
    }
};
const stats = () => {
    const script = document.createElement("script");
    script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const stats = new Stats();
        document.body.appendChild(stats.dom);
        requestAnimationFrame(function loop() {
            stats.update();
            requestAnimationFrame(loop);
        });
    };
    script.src = "//rawgit.com/mrdoob/stats.js/master/build/stats.min.js";
    document.head.appendChild(script);
};
(function main() {
    stats();
    canvas = document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);
    gl = initGL();
    renderer = new Renderer(gl);
    window.addEventListener("resize", resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        mat4.perspective(proj_matrix, glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.25, 20.0);
    }
    resizeCanvas();
    camera = new Camera(cPos);
    orbit = new OrbitControl(camera, { minimum_distance: 5.5 });
    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const sun_intensity = 24;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];
    const pbrShader = PBRMaterial.Shader;
    pbrShader.use();
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("u_light_count", 1);
    // pbrShader.setUniform("light_ambient", [1.25, 1.25, 1.25]);
    initScene();
    requestAnimationFrame(update);
})();
function initGL() {
    try {
        gl = canvas.getContext("webgl2");
    }
    catch (e) {
        throw new Error("GL init error:\n" + e);
    }
    if (!gl) {
        alert("WebGL is not available on your browser.");
    }
    return gl;
}
function initScene() {
    const plane_geom = new PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new Mesh(gl, plane_geom);
    const sky_tex = new Texture2D(gl);
    let irr_tex = new TextureCubeMap(gl);
    let env_tex = new TextureCubeMap(gl);
    const cube_tex = new TextureCubeMap(gl);
    //Init Helmet
    glTFLoader.promise("DamagedHelmet.gltf", "../assets/damaged-helmet/").then((value) => {
        helmet_loaded = true;
        const m = new Mesh(gl, value.buffered_geometries[0]);
        renderer.resetSaveBindings();
        helmet = new MeshInstance(m, value.materials);
        const pbr = helmet.materials[0];
        pbr.irradiance_texture = irr_tex;
        pbr.specular_env = env_tex;
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
    // const file_prefix = "../assets/cubemap/monvalley/MonValley_A_LookoutPoint";
    // ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
    //     sky_tex.setImage(gl, image, tex2D_opts);
    //     ImageLoader.promise(file_prefix + "_8k.jpg").then((image: HTMLImageElement) => {
    //         sky_tex.setImage(gl, image, tex2D_opts);
    //     });
    // });
    //
    // HDRImageLoader.promise(file_prefix + "_Env.hdr").then((data: HDRBuffer) => {
    //     cube_tex.setEquirectangularHDRBuffer(renderer, data);
    //     irr_tex = TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex);
    //     env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex);
    //     HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: HDRBuffer) => {
    //         cube_tex.setEquirectangularHDRBuffer(renderer, data);
    //         env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
    //         cube_tex.destroy(gl);
    //     });
    // });
    const file_prefix = "../assets/cubemap/monvalley/MonValley_A_LookoutPoint";
    ImageLoader.promise(file_prefix + "_preview.jpg").then((image) => {
        sky_tex.setImage(gl, image, tex2D_opts);
        ImageLoader.promise(file_prefix + "_8k.jpg").then((image) => {
            sky_tex.setImage(gl, image, tex2D_opts);
        });
    });
    HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex, 16);
        env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, 512);
        // HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: HDRBuffer) => {
        //     cube_tex.setEquirectangularHDRBuffer(renderer, data);
        //     env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
        //     cube_tex.destroy(gl);
        // });
    });
    //GRID
    const grid_mat = new GridMaterial(50);
    new MeshInstance(plane_mesh, grid_mat);
    //SKYBOX
    const sky_geom = new SphereGeometry(1, 48, 48);
    const sky_mesh = new Mesh(gl, sky_geom);
    const sky_mat = new BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new MeshInstance(sky_mesh, sky_mat);
}
function update() {
    orbit.processMouseMovement(-mouse_x_total, -mouse_y_total, true);
    mouse_x_total = 0;
    mouse_y_total = 0;
    drawScene();
    requestAnimationFrame(update);
}
function drawScene() {
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
    if (helmet_loaded)
        helmet.render(renderer, view_matrix, proj_matrix);
    renderer.resetSaveBindings();
    // gl.enable(gl.BLEND);
    // gl.disable(gl.CULL_FACE);
    // //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // grid.render(renderer, view_matrix, proj_matrix);
    // gl.enable(gl.CULL_FACE);
    // gl.disable(gl.BLEND);
}
function sphereUVtoVec3(out, u, v) {
    const theta = (v - 0.5) * Math.PI;
    const phi = u * 2 * Math.PI;
    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.sin(theta);
    const z = Math.sin(phi) * Math.cos(theta);
    vec3.set(out, x, y, z);
    return out;
}
//# sourceMappingURL=gltf_example.js.map
