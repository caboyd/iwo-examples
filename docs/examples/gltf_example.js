import { mat4, vec3, glMatrix } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';
import { Camera as Camera$1, Camera_Movement } from '../iwo/src/cameras/Camera.js';
import '../iwo/src/geometry/Geometry.js';
import '../iwo/src/geometry/BoxGeometry.js';
import '../iwo/src/graphics/WebglHelper.js';
import '../iwo/src/geometry/BufferedGeometry.js';
import { Mesh as Mesh$1 } from '../iwo/src/meshes/Mesh.js';
import { MeshInstance as MeshInstance$1 } from '../iwo/src/meshes/MeshInstance.js';
import '../iwo/src/graphics/TextureHelper.js';
import { Texture2D as Texture2D$1 } from '../iwo/src/graphics/Texture2D.js';
import '../iwo/src/loader/FileLoader.js';
import { HDRImageLoader as HDRImageLoader$1 } from '../iwo/src/loader/HDRImageLoader.js';
import { TextureCubeMap as TextureCubeMap$1 } from '../iwo/src/graphics/TextureCubeMap.js';
import { Renderer as Renderer$1 } from '../iwo/src/graphics/Renderer.js';
import { SphereGeometry as SphereGeometry$1 } from '../iwo/src/geometry/SphereGeometry.js';
import { PlaneGeometry as PlaneGeometry$1 } from '../iwo/src/geometry/PlaneGeometry.js';
import { GridMaterial as GridMaterial$1 } from '../iwo/src/materials/GridMaterial.js';
import { PBRMaterial as PBRMaterial$1 } from '../iwo/src/materials/PBRMaterial.js';
import { BasicMaterial as BasicMaterial$1 } from '../iwo/src/materials/BasicMaterial.js';
import { ImageLoader as ImageLoader$1 } from '../iwo/src/loader/ImageLoader.js';
import { OrbitControl as OrbitControl$1 } from '../iwo/src/cameras/OrbitControl.js';
import { glTFLoader as glTFLoader$1 } from '../iwo/src/loader/glTFLoader.js';

let canvas;
let gl;
const view_matrix = mat4.create();
const proj_matrix = mat4.create();
const cPos = vec3.fromValues(2.5, 0, 6.0);
let camera;
let orbit;
let mouse_x_total = 0;
let mouse_y_total = 0;
const keys = [];
let grid;
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
    renderer = new Renderer$1(gl);
    window.addEventListener("resize", resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);
    }
    resizeCanvas();
    camera = new Camera$1(cPos);
    orbit = new OrbitControl$1(camera, { minimum_distance: 5.5 });
    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);
    const sun_dir = [1, 1, 1];
    //const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];
    const sun_color = [1, 1, 1];
    const pbrShader = PBRMaterial$1.Shader;
    pbrShader.use();
    pbrShader.setUniform("gamma", 1.0);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("u_light_count", 1);
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
    const plane_geom = new PlaneGeometry$1(100, 100, 1, 1, true);
    const plane_mesh = new Mesh$1(gl, plane_geom);
    const sky_tex = new Texture2D$1(gl);
    let irr_tex = new TextureCubeMap$1(gl);
    let env_tex = new TextureCubeMap$1(gl);
    const cube_tex = new TextureCubeMap$1(gl);
    //Init Helmet
    glTFLoader$1.promise("DamagedHelmet.gltf", "../assets/damaged-helmet/").then((value) => {
        helmet_loaded = true;
        const m = new Mesh$1(gl, value.buffered_geometries[0]);
        renderer.resetSaveBindings();
        helmet = new MeshInstance$1(m, value.materials);
        const pbr = helmet.materials[0];
        pbr.irradiance_texture = irr_tex;
        pbr.specular_env = env_tex;
        const rot = mat4.fromQuat(mat4.create(), [0.7071068286895752, 0.0, -0.0, 0.7071068286895752]);
        //mat4.translate(helmet.model_matrix, helmet.model_matrix, [0, 5, 0]);
        mat4.multiply(helmet.model_matrix, helmet.model_matrix, rot);
        mat4.scale(helmet.model_matrix, helmet.model_matrix, [4, 4, 4]);
    });
    const file_prefix = "../assets/cubemap/royal_esplanade/royal_esplanade";
    ImageLoader$1.promise(file_prefix + "_preview.jpg").then((image) => {
        sky_tex.setImage(gl, image, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR);
        ImageLoader$1.promise(file_prefix + ".jpg").then((image) => {
            sky_tex.setImage(gl, image, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR);
        });
    });
    HDRImageLoader$1.promise(file_prefix + "_1k.hdr").then((data) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = TextureCubeMap$1.irradianceFromCubemap(irr_tex, renderer, cube_tex);
        env_tex = TextureCubeMap$1.specularFromCubemap(env_tex, renderer, cube_tex);
        HDRImageLoader$1.promise(file_prefix + "_2k.hdr").then((data) => {
            cube_tex.setEquirectangularHDRBuffer(renderer, data);
            env_tex = TextureCubeMap$1.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
            cube_tex.destroy(gl);
        });
    });
    //GRID
    const grid_mat = new GridMaterial$1(50);
    grid = new MeshInstance$1(plane_mesh, grid_mat);
    //SKYBOX
    const sky_geom = new SphereGeometry$1(1, 48, 48);
    const sky_mesh = new Mesh$1(gl, sky_geom);
    const sky_mat = new BasicMaterial$1([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new MeshInstance$1(sky_mesh, sky_mat);
}
function update() {
    if (keys[87])
        camera.processKeyboard(Camera_Movement.FORWARD, 0.001);
    else if (keys[83])
        camera.processKeyboard(Camera_Movement.BACKWARD, 0.001);
    if (keys[65])
        camera.processKeyboard(Camera_Movement.LEFT, 0.001);
    else if (keys[68])
        camera.processKeyboard(Camera_Movement.RIGHT, 0.001);
    if (keys[82])
        camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32])
        camera.processKeyboard(Camera_Movement.UP, 0.001);
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
window.onkeydown = function (e) {
    keys[e.keyCode] = true;
};
window.onkeyup = function (e) {
    keys[e.keyCode] = false;
};
window.addEventListener("wheel", function (e) {
    e.stopPropagation();
    orbit.scroll(e.deltaY > 0);
});
//# sourceMappingURL=gltf_example.js.map
