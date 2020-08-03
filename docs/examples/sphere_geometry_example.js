import { mat4, vec3, glMatrix } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';
import { Camera as Camera$1, Camera_Movement } from '../iwo/src/cameras/Camera.js';
import '../iwo/src/geometry/Geometry.js';
import '../iwo/src/geometry/BoxGeometry.js';
import '../iwo/src/graphics/WebglHelper.js';
import { Mesh as Mesh$1 } from '../iwo/src/meshes/Mesh.js';
import { MeshInstance as MeshInstance$1 } from '../iwo/src/meshes/MeshInstance.js';
import '../iwo/src/graphics/TextureHelper.js';
import '../iwo/src/loader/FileLoader.js';
import '../iwo/src/graphics/shader/ShaderSources.js';
import { Renderer as Renderer$1 } from '../iwo/src/graphics/Renderer.js';
import { SphereGeometry as SphereGeometry$1 } from '../iwo/src/geometry/SphereGeometry.js';
import { PlaneGeometry as PlaneGeometry$1 } from '../iwo/src/geometry/PlaneGeometry.js';
import { GridMaterial as GridMaterial$1 } from '../iwo/src/materials/GridMaterial.js';
import { PBRMaterial as PBRMaterial$1 } from '../iwo/src/materials/PBRMaterial.js';

let canvas;
let gl;
const view_matrix = mat4.create();
const proj_matrix = mat4.create();
const cPos = vec3.fromValues(0.5, 8, 9.0);
let camera;
let mouse_x_total = 0;
let mouse_y_total = 0;
const keys = [];
let spheres;
let sphere_mat;
let grid;
let renderer;
document.getElementById("loading-text-wrapper").remove();
const moveCallback = (e) => {
    //@ts-ignore
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    //@ts-ignore
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    if (e.which == 1) {
        mouse_x_total += movementX;
        mouse_y_total += movementY;
    }
};
const stats = () => {
    const script = document.createElement("script");
    script.onload = () => {
        //@ts-ignore
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
    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);
    const sun_dir = [-0.3, 0, 1];
    const sun_intensity = 9;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];
    const pbrShader = PBRMaterial$1.Shader;
    pbrShader.use();
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
    sphere_mat = new PBRMaterial$1(vec3.fromValues(1, 1, 1), 0, 0, 2);
    //GRID
    const grid_mat = new GridMaterial$1(50);
    grid = new MeshInstance$1(plane_mesh, grid_mat);
    //SPHERES
    spheres = [];
    const num_cols = 8;
    const num_rows = 8;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const sphere_geom = new SphereGeometry$1(0.75, 3 + i * 2, 2 + k * 2);
            const sphere_mesh = new Mesh$1(gl, sphere_geom);
            const s = new MeshInstance$1(sphere_mesh, sphere_mat);
            spheres.push(s);
            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, 2 * num_rows - k * 2, 0));
        }
    }
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
    camera.processMouseMovement(-mouse_x_total, -mouse_y_total, true);
    mouse_x_total = 0;
    mouse_y_total = 0;
    drawScene();
    requestAnimationFrame(update);
}
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);
    for (const sphere of spheres) {
        sphere.render(renderer, view_matrix, proj_matrix);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    grid.render(renderer, view_matrix, proj_matrix);
    gl.disable(gl.BLEND);
}
window.onkeydown = function (e) {
    keys[e.keyCode] = true;
};
window.onkeyup = function (e) {
    keys[e.keyCode] = false;
};
//# sourceMappingURL=sphere_geometry_example.js.map
