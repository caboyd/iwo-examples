import { mat4, vec3, glMatrix } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
const FOV = 60 as const;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const light_view_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0, 1, 4);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;
let frustum: IWO.Frustum;

let frustum_line: IWO.MeshInstance;
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

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
            glMatrix.toRadian(FOV),
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

    frustum = new IWO.Frustum(gl, light_view_matrix, camera, { fov: FOV });

    let line_mesh = getFrustumLineMesh();

    const line_mat = new IWO.LineMaterial([gl.drawingBufferWidth, gl.drawingBufferHeight], [0, 0, 0, 1], 8, false);
    frustum_line = new IWO.MeshInstance(line_mesh, line_mat);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);
}

function getFrustumLineMesh() {
    let line_points = [];
    const p = frustum.calculateFrustumVertices();

    //add far plane line segments
    line_points.push(p[0], p[1], p[1], p[3], p[3], p[2], p[2], p[0]);
    //add near plane lines
    line_points.push(p[0 + 4], p[1 + 4], p[1 + 4], p[3 + 4], p[3 + 4], p[2 + 4], p[2 + 4], p[0 + 4]);
    //add near to far top left, top right, bottom left, bottom right
    line_points.push(p[0], p[0 + 4], p[1], p[1 + 4], p[2], p[2 + 4], p[3], p[3 + 4]);
    line_points = line_points.flat(2) as number[];

    let line_geom = new IWO.LineGeometry(line_points, { type: "lines" });
    let line_mesh = new IWO.Mesh(gl, line_geom);
    return line_mesh;
}

function update(): void {
    orbit.update();
    drawScene();

    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    frustum_line.render(renderer, view_matrix, proj_matrix);

    grid.render(renderer, view_matrix, proj_matrix);
}
