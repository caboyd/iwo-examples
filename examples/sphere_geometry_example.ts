import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0.5, 8, 9.0);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let spheres: IWO.MeshInstance[];
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

document.getElementById("loading-text-wrapper")!.remove();

await (async function main(): Promise<void> {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    gl = IWO.initGL(canvas);

    renderer = new IWO.Renderer(gl);

    await ImGui.default();
    ImGui.IMGUI_CHECKVERSION();
    ImGui.CreateContext();
    // // Setup style
    ImGui.StyleColorsDark();
    ImGui_Impl.Init(gl);

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
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { maximum_distance: 16, orbit_point: [0, 8, 0] });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

    const sun_dir = [-0.3, 0, 1];
    const sun_intensity = 20;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("light_ambient", [0.01, 0.01, 0.01]);
    pbrShader.setUniform("u_light_count", 1);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true).getBufferedGeometry();
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    const sphere_mat = new IWO.PBRMaterial({ albedo_color: [1, 1, 1] });

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SPHERES
    spheres = [];
    const num_cols = 8;
    const num_rows = 8;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const sphere_geom = IWO.BufferedGeometry.fromGeometry(new IWO.SphereGeometry(0.75, 3 + i * 2, 2 + k * 2));
            const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
            const s = new IWO.MeshInstance(sphere_mesh, sphere_mat);
            spheres.push(s);
            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, 2 * num_rows - k * 2, 0));
        }
    }
}

function update(): void {
    let io = ImGui.GetIO();
    orbit.mouse_active = !io.WantCaptureMouse;
    orbit.update();
    drawScene();
    drawUI();
    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    for (const sphere of spheres) {
        sphere.render(renderer, view_matrix, proj_matrix);
    }

    grid.render(renderer, view_matrix, proj_matrix);

    //after last object rendered
    renderer.cleanupGLState();
}

function drawUI(): void {
    //imgui render
    ImGui_Impl.NewFrame(0);
    ImGui.NewFrame();
    ImGui.SetNextWindowPos(new ImGui.ImVec2(gl.drawingBufferWidth - 300 + 1, 0));
    ImGui.SetNextWindowSize(new ImGui.ImVec2(300, 340), ImGui.Cond.FirstUseEver);
    ImGui.SetNextWindowSizeConstraints(new ImGui.ImVec2(300, 0), new ImGui.ImVec2(300, gl.drawingBufferHeight));
    {
        ImGui.Begin("Settings");

        ImGui.Text(`Test`);
        ImGui.End();
    }
    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}
