import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = vec3.fromValues(2.5, 2, 6.0);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let renderer: IWO.Renderer;
let grid: IWO.MeshInstance;

let cube: IWO.MeshInstance;
let cube_loaded = false;
let teapot: IWO.MeshInstance;
let teapot_loaded = false;

await (async function main(): Promise<void> {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");

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

    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { minimum_distance: 5.5 });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);

    gl.enable(gl.DEPTH_TEST);

    const sun_dir = [-0.3, 0, 1];
    const sun_intensity = 1;
    const sun_color = [sun_intensity, sun_intensity, sun_intensity];
    const uniforms = new Map();
    uniforms.set("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    uniforms.set("u_lights[0].color", sun_color);
    uniforms.set("light_ambient", [0.02, 0.02, 0.02]);
    uniforms.set("u_light_count", 1);

    renderer.addShaderVariantUniforms(IWO.ShaderSource.PBR, uniforms);
    renderer.addShaderVariantUniforms(IWO.ShaderSource.Toon, uniforms);

    await initScene();

    requestAnimationFrame(update);
})();

async function initScene(): Promise<void> {
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //Init Cube
    IWO.ObjLoader.promise("cube.obj", root_url + "obj/cube", { flip_image_y: true }).then((value: IWO.ObjData) => {
        cube_loaded = true;
        const geom = value.objects[0].geometry;
        const mesh = new IWO.Mesh(gl, geom);
        renderer.resetSaveBindings();
        cube = new IWO.MeshInstance(mesh, value.materials.length > 0 ? value.materials : new IWO.NormalOnlyMaterial());
        mat4.translate(cube.model_matrix, cube.model_matrix, [-2, 2, -2]);
    });

    //Init Teapot
    IWO.ObjLoader.promise("teapot.obj", root_url + "/obj/teapot/").then((value: IWO.ObjData) => {
        teapot_loaded = true;
        const geom = value.objects[0].geometry;
        const mesh = new IWO.Mesh(gl, geom);
        renderer.resetSaveBindings();
        teapot = new IWO.MeshInstance(
            mesh,
            value.materials.length > 0 ? value.materials : new IWO.ToonMaterial({ albedo_color: [0.4, 0.4, 0.8] })
        );
        mat4.scale(teapot.model_matrix, teapot.model_matrix, [0.1, 0.1, 0.1]);
        mat4.rotateX(teapot.model_matrix, teapot.model_matrix, -Math.PI / 2);
    });
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

    gl.disable(gl.CULL_FACE);
    //Draw Cube
    if (cube_loaded) cube.render(renderer, view_matrix, proj_matrix);
    if (teapot_loaded) teapot.render(renderer, view_matrix, proj_matrix);

    grid.render(renderer, view_matrix, proj_matrix);

    renderer.resetSaveBindings();
}
