import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0, 3, 8);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let color: vec3 = [0.54, 0.81, 0.94];
let mat_map = {
    "PBR Material": new IWO.PBRMaterial({ albedo_color: color }),
    "Basic Material": new IWO.BasicMaterial(color),
    "Normal Only Material": new IWO.NormalOnlyMaterial(),
};

let radius = 3;
let horizontal_segments = 32;
let vertical_segments = 16;
let phi_start = 0;
let phi_length = Math.PI * 2;
let theta_start = 0;
let theta_length = Math.PI;
let current_material = 0;

let sphere: IWO.MeshInstance;
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
    orbit = new IWO.OrbitControl(camera, { maximum_distance: 16, orbit_point: [0, 3, 0] });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

    const sun_dir = [-0.3, 0, 1];
    const sun_intensity = 3.14;
    const sun_color = [sun_intensity, sun_intensity, sun_intensity];

    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("light_ambient", [0.01, 0.01, 0.01]);
    pbrShader.setUniform("u_light_count", 1);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true).getBufferedGeometry();
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SPHERE
    buildSphere();
}

function update(): void {
    let io = ImGui.GetIO();
    orbit.mouse_active = !io.WantCaptureMouse;
    orbit.update();

    //rebuild sphere
    buildSphere();

    drawScene();
    drawUI();
    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function buildSphere() {
    if (sphere) sphere.mesh.destroy(gl);

    const sphere_mat = Object.values(mat_map)[current_material];
    //@ts-ignore
    if (sphere_mat.albedo_color) sphere_mat.albedo_color = color;

    const sphere_geom = new IWO.SphereGeometry(
        radius,
        horizontal_segments,
        vertical_segments,
        phi_start,
        phi_length,
        theta_start,
        theta_length
    );
    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    sphere = new IWO.MeshInstance(sphere_mesh, sphere_mat);
    mat4.translate(sphere.model_matrix, sphere.model_matrix, [0, 3, 0]);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    sphere.render(renderer, view_matrix, proj_matrix);

    grid.render(renderer, view_matrix, proj_matrix);

    //after last object rendered
    renderer.cleanupGLState();
}

function drawUI(): void {
    //imgui render
    ImGui_Impl.NewFrame(0);
    ImGui.NewFrame();
    const frame_width = 420;
    ImGui.SetNextWindowPos(new ImGui.ImVec2(gl.drawingBufferWidth - frame_width + 1, 0));
    ImGui.SetNextWindowSize(new ImGui.ImVec2(frame_width, 250), ImGui.Cond.FirstUseEver);
    ImGui.SetNextWindowSizeConstraints(
        new ImGui.ImVec2(frame_width, 0),
        new ImGui.ImVec2(frame_width, gl.drawingBufferHeight)
    );
    {
        ImGui.Begin("Settings");
        ImGui.PushItemWidth(-150);
        ImGui.SliderFloat("radius", (v = radius) => (radius = v), 1, 5);
        ImGui.SliderInt("horizontal_segments", (v = horizontal_segments) => (horizontal_segments = v), 1, 64);
        ImGui.SliderInt("vertical_segments", (v = vertical_segments) => (vertical_segments = v), 1, 32);
        ImGui.SliderAngle("phi_start", (v = phi_start) => (phi_start = v), 0, 2 * 180);
        ImGui.SliderAngle("phi_length", (v = phi_length) => (phi_length = v), 0, 2 * 180);
        ImGui.SliderAngle("theta_start", (v = theta_start) => (theta_start = v), 0, 180);
        ImGui.SliderAngle("theta_length", (v = theta_length) => (theta_length = v), 0, 180);
        const keys = Object.keys(mat_map);
        ImGui.Text("Material");
        ImGui.Combo("Material", (v = current_material) => (current_material = v), keys, keys.length);
        let c: ImGui.ImTuple3<number> = [color[0], color[1], color[2]];
        ImGui.ColorEdit3("Color", c);
        vec3.set(color, c[0], c[1], c[2]);
        ImGui.End();
    }
    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}
