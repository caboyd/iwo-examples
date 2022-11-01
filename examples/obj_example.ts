import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo/src/iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(2.5, 2, 6.0);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let mouse_x_total = 0;
let mouse_y_total = 0;
const keys: Array<boolean> = [];

let renderer: IWO.Renderer;
let grid: IWO.MeshInstance;

let cube: IWO.MeshInstance;
let cube_loaded = false;
let teapot: IWO.MeshInstance;
let teapot_loaded = false;

document.getElementById("loading-text-wrapper")!.remove();

const moveCallback = (e: MouseEvent): void => {
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

const stats = (): void => {
    const script = document.createElement("script");
    script.onload = (): void => {
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

await (async function main(): Promise<void> {
    stats();

    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);

    gl = initGL();

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
            0.25,
            20.0
        );
    }

    resizeCanvas();

    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { minimum_distance: 5.5 });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const sun_intensity = 0;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = IWO.PBRMaterial.Shader;
    pbrShader.use();
    // pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    // pbrShader.setUniform("u_lights[0].color", sun_color);
    // pbrShader.setUniform("u_light_count", 1);
    const light = 1.0 / Math.PI;
    pbrShader.setUniform("light_ambient", [light, light, light]);

    await initScene();

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

async function initScene(): Promise<void> {
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true).getBufferedGeometry();
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial(50);
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    const m = await IWO.MtlLoader.promise("cube.mtl", "../assets/obj/cube");

    //Init Cube
    IWO.ObjLoader.promise("cube.obj", "../assets/obj/cube/", { flip_image_y: true }).then((value: IWO.ObjData) => {
        cube_loaded = true;
        const geom = value.objects[0].buffered_geometry;
        const mesh = new IWO.Mesh(gl, geom);
        renderer.resetSaveBindings();
        cube = new IWO.MeshInstance(mesh, value.materials ? value.materials : new IWO.NormalOnlyMaterial());
        mat4.translate(cube.model_matrix, cube.model_matrix, [-2, 2, -2]);
    });

    //Init Teapot
    IWO.ObjLoader.promise("teapot.obj", "../assets/obj/teapot/").then((value: IWO.ObjData) => {
        teapot_loaded = true;
        const geom = value.objects[0].buffered_geometry;
        const mesh = new IWO.Mesh(gl, geom);
        renderer.resetSaveBindings();
        teapot = new IWO.MeshInstance(mesh, value.materials ? value.materials : new IWO.NormalOnlyMaterial());
        mat4.scale(teapot.model_matrix, teapot.model_matrix, [0.1, 0.1, 0.1]);
        mat4.rotateX(teapot.model_matrix, teapot.model_matrix, -Math.PI / 2);
    });
}

function update(): void {
    if (keys[87]) camera.processKeyboard(IWO.Camera_Movement.FORWARD, 0.001);
    else if (keys[83]) camera.processKeyboard(IWO.Camera_Movement.BACKWARD, 0.001);
    if (keys[65]) camera.processKeyboard(IWO.Camera_Movement.LEFT, 0.001);
    else if (keys[68]) camera.processKeyboard(IWO.Camera_Movement.RIGHT, 0.001);
    if (keys[82]) camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32]) camera.processKeyboard(IWO.Camera_Movement.UP, 0.001);

    orbit.processMouseMovement(-mouse_x_total, -mouse_y_total, true);
    mouse_x_total = 0;
    mouse_y_total = 0;

    drawScene();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    gl.disable(gl.CULL_FACE);
    //Draw Cube
    if (cube_loaded) cube.render(renderer, view_matrix, proj_matrix);
    if (teapot_loaded) teapot.render(renderer, view_matrix, proj_matrix);

    gl.enable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    grid.render(renderer, view_matrix, proj_matrix);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);

    renderer.resetSaveBindings();
}

function sphereUVtoVec3(out: vec3, u: number, v: number): vec3 {
    const theta = (v - 0.5) * Math.PI;
    const phi = u * 2 * Math.PI;

    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.sin(theta);
    const z = Math.sin(phi) * Math.cos(theta);

    vec3.set(out, x, y, z);
    return out;
}
