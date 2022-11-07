import { mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";
import { LineGeometry } from "geometry/LineGeometry";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0.5, 4, 4);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let line: IWO.MeshInstance;
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

document.getElementById("loading-text-wrapper")!.remove();

await (async function main(): Promise<void> {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    gl = IWO.initGL(canvas);

    renderer = new IWO.Renderer(gl);

    window.addEventListener("resize", resizeCanvas, false);

    function resizeCanvas(): void {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        // mat4.perspective(
        //     proj_matrix,
        //     glMatrix.toRadian(90),
        //     gl.drawingBufferWidth / gl.drawingBufferHeight,
        //     0.1,
        //     1000.0
        // );
        mat4.ortho(
            proj_matrix,
            -gl.drawingBufferWidth / 2,
            gl.drawingBufferWidth / 2,
            -gl.drawingBufferHeight / 2,
            gl.drawingBufferHeight / 2,
            0,
            -1
        );
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { maximum_distance: 16, orbit_point: [0, 0, 0] });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    const points: vec3[] = [
        [-233.85453851692355, -50, 0],
        [-167.0389560835168, 50, 0],
        [-100.22337365011009, -50, 0],
        [-33.407791216703366, 50, 0],
        [33.407791216703366, -50, 0],
        [100.22337365011009, 50, 0],
        [167.0389560835168, -50, 0],
        [233.85453851692355, 50, 0],
        [0, 1, 0],
        [1, 1, 0],
    ];

    const line_geom = new IWO.LineGeometry(generatePoints(gl, 1));
    const line_mesh = new IWO.Mesh(gl, line_geom);

    //GRID
    const line_mat = new IWO.LineMaterial([0, 0, 0, 1]);
    line = new IWO.MeshInstance(line_mesh, line_mat);

    // const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    // const plane_mesh = new IWO.Mesh(gl, plane_geom);

    // //GRID
    // const grid_mat = new IWO.GridMaterial(50);
    // grid = new IWO.MeshInstance(plane_mesh, grid_mat);
}

let delta = 0;
let last_now = Date.now();
let loop = 1000;
let direction = 1;

function update(): void {
    const new_now = Date.now();
    delta = new_now - last_now;
    last_now = new_now;

    orbit.update();
    drawScene();

    if (loop > 2000) {
        direction = -1;
    } else if (loop <= 1000) {
        direction = 1;
    }

    loop += delta * direction;
    const mod = loop / 2000;

    const line_geom = new IWO.LineGeometry(generatePoints(gl, mod)).getBufferedGeometry();

    line.mesh.updateGeometryBuffer(gl, line_geom);

    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    line.render(renderer, view_matrix, proj_matrix);
    //grid.render(renderer, view_matrix, proj_matrix);
}

function generatePoints(gl: WebGL2RenderingContext, scale: number): number[] {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const stepx = width / 9;
    const stepy = height / 3;
    const points = [];
    for (let x = 1; x < 9; x += 2) {
        points.push(((x + 0) * stepx - width / 2) * scale, 1 * stepy - height / 2, 0);
        points.push(((x + 1) * stepx - width / 2) * scale, 2 * stepy - height / 2, 0);
    }
    return points;
}
