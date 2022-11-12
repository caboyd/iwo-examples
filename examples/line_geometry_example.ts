import { mat4, vec3, glMatrix } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0.5, 4, 4);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let line: IWO.MeshInstance;
let line2: IWO.MeshInstance;
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
        mat4.perspective(
            proj_matrix,
            glMatrix.toRadian(90),
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000.0
        );
        // mat4.ortho(
        //     proj_matrix,
        //     -gl.drawingBufferWidth / 2,
        //     gl.drawingBufferWidth / 2,
        //     -gl.drawingBufferHeight / 2,
        //     gl.drawingBufferHeight / 2,
        //     0.1,
        //     -1
        // );
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { maximum_distance: 30, orbit_point: [0, 0, 0] });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);

    let line_geom = new IWO.LineGeometry(generatePoints(gl, 1, -2), { type: "line strip" });
    let line_mesh = new IWO.Mesh(gl, line_geom);

    const line_mat = new IWO.LineMaterial([gl.drawingBufferWidth, gl.drawingBufferHeight], [0, 0, 0, 1], 50, true);
    line = new IWO.MeshInstance(line_mesh, line_mat);

    line_geom = new IWO.LineGeometry(generatePoints(gl, 1, 2), { type: "line strip" });
    line_mesh = new IWO.Mesh(gl, line_geom);

    const line_mat2 = new IWO.LineMaterial([gl.drawingBufferWidth, gl.drawingBufferHeight], [1, 1, 1, 1], 15, false);
    line2 = new IWO.MeshInstance(line_mesh, line_mat2);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial(50);
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);
}

let delta = 0;
let last_now = Date.now();
let loop = 1000;
let direction = 1;

function update(): void {
    const new_now = Date.now();
    delta = new_now - last_now;
    last_now = new_now;

    delta = Math.min(delta, 20);

    orbit.update();
    drawScene();

    if (loop > 2000) {
        direction = -1;
    } else if (loop <= 1000) {
        direction = 1;
    }

    loop += delta * direction;
    const mod = loop / 2000;

    let line_geom = new IWO.LineGeometry(generatePoints(gl, mod, -2)).getBufferedGeometry();
    line.mesh.updateGeometryBuffer(gl, line_geom);

    line_geom = new IWO.LineGeometry(generatePoints(gl, mod, 2)).getBufferedGeometry();
    line2.mesh.updateGeometryBuffer(gl, line_geom);

    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    line.render(renderer, view_matrix, proj_matrix);
    line2.render(renderer, view_matrix, proj_matrix);

    grid.render(renderer, view_matrix, proj_matrix);
}

function generatePoints(gl: WebGL2RenderingContext, scale: number, zoffset: number): number[] {
    const width = 20;
    const height = 20;
    const stepx = width / 9;
    const stepy = height / 3;
    const points = [];
    for (let x = 1; x < 9; x += 2) {
        points.push(((x + 0) * stepx - width / 2) * scale, 0.1, 1 * stepy - height / 2 + zoffset);
        points.push(((x + 1) * stepx - width / 2) * scale, 0.1, 2 * stepy - height / 2 + zoffset);
    }
    return points;
}
