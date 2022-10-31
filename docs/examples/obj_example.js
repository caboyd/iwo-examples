import { mat4, vec3, glMatrix } from 'https://unpkg.com/gl-matrix@3.4.3/esm/index.js';
import { Camera } from '../iwo/src/cameras/Camera.js';
import { OrbitControl } from '../iwo/src/cameras/OrbitControl.js';
import { BoxGeometry } from '../iwo/src/geometry/BoxGeometry.js';
import '../iwo/src/geometry/Geometry.js';
import '../iwo/src/geometry/BufferedGeometry.js';
import { PlaneGeometry } from '../iwo/src/geometry/PlaneGeometry.js';
import '../iwo/src/graphics/WebglHelper.js';
import { Renderer } from '../iwo/src/graphics/Renderer.js';
import '../iwo/src/graphics/Texture2D.js';
import '../iwo/src/loader/FileLoader.js';
import { Mesh } from '../iwo/src/meshes/Mesh.js';
import '../iwo/src/graphics/shader/ShaderSources.js';
import '../iwo/src/graphics/TextureHelper.js';
import '../iwo/src/graphics/WebglConstants.js';
import { PBRMaterial } from '../iwo/src/materials/PBRMaterial.js';
import { ObjLoader } from '../iwo/src/loader/ObjLoader.js';
import { MtlLoader } from '../iwo/src/loader/MtlLoader.js';
import { GridMaterial } from '../iwo/src/materials/GridMaterial.js';
import { MeshInstance } from '../iwo/src/meshes/MeshInstance.js';

let canvas;
let gl;
const view_matrix = mat4.create();
const proj_matrix = mat4.create();
const cPos = vec3.fromValues(2.5, 2, 6.0);
let camera;
let orbit;
let mouse_x_total = 0;
let mouse_y_total = 0;
let renderer;
let grid;
let plane;
let cube;
let cube_loaded = false;
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
await (async function main() {
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
    sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const pbrShader = PBRMaterial.Shader;
    pbrShader.use();
    // pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    // pbrShader.setUniform("u_lights[0].color", sun_color);
    // pbrShader.setUniform("u_light_count", 1);
    pbrShader.setUniform("light_ambient", [1.0, 1.0, 1.0]);
    console.log("before init");
    await initScene();
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
async function initScene() {
    const plane_geom = new PlaneGeometry(100, 100, 1, 1, true).getBufferedGeometry();
    const plane_mesh = new Mesh(gl, plane_geom);
    //GRID
    const grid_mat = new GridMaterial(50);
    grid = new MeshInstance(plane_mesh, grid_mat);
    const m = await MtlLoader.promise("cube.mtl", "../assets/obj/cube");
    //Init Cube
    ObjLoader.promise("cube.obj", "../assets/obj/cube/").then((value) => {
        cube_loaded = true;
        // const { objects, materials } = value;
        // const geom = objects[0].buffered_geometry;
        const geom = new BoxGeometry(1, 1, 1);
        const mesh = new Mesh(gl, geom);
        renderer.resetSaveBindings();
        cube = new MeshInstance(mesh, m.get("cube"));
        //const pbr = (cube.materials as IWO.Material[])[0] as IWO.PBRMaterial;
        // const cube_rot = mat4.fromQuat(mat4.create(), [0.7071068286895752, 0.0, -0.0, 0.7071068286895752]);
        // mat4.multiply(cube.model_matrix, cube.model_matrix, cube_rot);
        // mat4.scale(cube.model_matrix, cube.model_matrix, [4, 4, 4]);
        mat4.translate(cube.model_matrix, cube.model_matrix, [2, 0, 2]);
    });
    const plane_geom2 = new PlaneGeometry(2, 2, 2, 2, false).getBufferedGeometry();
    const plane_mesh2 = new Mesh(gl, plane_geom2);
    plane = new MeshInstance(plane_mesh2, m.get("cube"));
    //mat4.rotateX(plane.model_matrix, plane.model_matrix, Math.PI / 2);
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
    //Draw Cube
    if (cube_loaded)
        cube.render(renderer, view_matrix, proj_matrix);
    plane.render(renderer, view_matrix, proj_matrix);
    gl.enable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    grid.render(renderer, view_matrix, proj_matrix);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    renderer.resetSaveBindings();
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
//# sourceMappingURL=obj_example.js.map
