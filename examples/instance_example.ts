import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";
import * as IWO from "iwo";
import { MeshInstance } from "../iwo/src/meshes/MeshInstance";

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = vec3.fromValues(10, 6, 10);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let renderer: IWO.Renderer;
let grid: IWO.MeshInstance;

let instanced_mesh: IWO.InstancedMesh;

class Static<T> {
    constructor(public value: T) {}
    access: ImGui.Access<T> = (value: T = this.value): T => (this.value = value);
}

const gui = {
    x_instances: new Static<number>(10),
    y_instances: new Static<number>(10),
    z_instances: new Static<number>(10),
    instances_changed: true,
    mesh_map: new Map<string, IWO.Mesh>(),
    meshes: ["teapot_lite", "teapot", "box", "sphere"],
    current_mesh: new Static<number>(0),
};

await (async function main(): Promise<void> {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");

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
            glMatrix.toRadian(45),
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000.0
        );
    }

    resizeCanvas();

    await initScene();

    requestAnimationFrame(update);
})();

async function initScene(): Promise<void> {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { minimum_distance: 0.01, maximum_distance: 30 });

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);

    gl.enable(gl.DEPTH_TEST);

    const light = 1.0 / Math.PI;
    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("light_ambient", [light, light, light]);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //Init Teapot
    let data = await IWO.ObjLoader.promise("teapot.obj", root_url + "/obj/teapot/");
    let geom = data.objects[0].geometry;
    let mesh = new IWO.Mesh(gl, geom);

    gui.mesh_map.set("teapot", mesh);

    data = await IWO.ObjLoader.promise("teapot-lite.obj", root_url + "/obj/teapot/");
    geom = data.objects[0].geometry;
    mesh = new IWO.Mesh(gl, geom);
    gui.mesh_map.set("teapot_lite", mesh);

    geom = new IWO.BoxGeometry({ width: 10, depth: 10, height: 10 });
    mesh = new IWO.Mesh(gl, geom);
    gui.mesh_map.set("box", mesh);

    geom = new IWO.SphereGeometry(10, 32, 16);
    mesh = new IWO.Mesh(gl, geom);
    gui.mesh_map.set("sphere", mesh);

    mesh = gui.mesh_map.get(gui.meshes[gui.current_mesh.value])!;
    instanced_mesh = new IWO.InstancedMesh(mesh, new IWO.NormalOnlyMaterial());

    //reorient it upward
    mat4.scale(instanced_mesh.model_matrix, instanced_mesh.model_matrix, [0.02, 0.02, 0.02]);
    mat4.rotateX(instanced_mesh.model_matrix, instanced_mesh.model_matrix, -Math.PI / 2);
}

function update(): void {
    orbit.update();

    const mesh = gui.mesh_map.get(gui.meshes[gui.current_mesh.value]);
    if (mesh) {
        instanced_mesh.mesh = mesh;
    }

    if (gui.instances_changed) {
        gui.instances_changed = false;
        instanced_mesh.instance_matrix = [];
        const m = mat4.create();
        const size_z = gui.z_instances.value;
        const size_y = gui.y_instances.value;
        const size_x = gui.x_instances.value;
        for (let z = 0; z < size_z; z++) {
            for (let y = 0; y < size_y; y++) {
                for (let x = 0; x < size_x; x++) {
                    mat4.identity(m);
                    const scale = Math.random();
                    mat4.translate(m, m, [-x * 0.5 + size_x / 4, y * 0.5 - size_y / 4, -z * 0.5 + size_z / 4]);
                    mat4.rotate(m, m, Math.random() * Math.PI * 2, [0, 1, 0]);
                    mat4.rotate(m, m, Math.random() * Math.PI * 2, [1, 0, 0]);
                    mat4.rotate(m, m, Math.random() * Math.PI * 2, [0, 0, 1]);
                    mat4.scale(m, m, [scale, scale, scale]);
                    instanced_mesh.addInstance(m);
                }
            }
        }
    }

    drawScene();
    drawUI();
    renderer.resetStats();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);

    camera.getViewMatrix(view_matrix);
    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    instanced_mesh.render(renderer, view_matrix, proj_matrix);

    grid.render(renderer, view_matrix, proj_matrix);

    renderer.resetSaveBindings();
}

function drawUI(): void {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    //imgui render
    ImGui_Impl.NewFrame(0);
    ImGui.NewFrame();
    const frame_width = 300;
    ImGui.SetNextWindowPos(new ImGui.ImVec2(gl.drawingBufferWidth - frame_width + 1, 0));
    ImGui.SetNextWindowSize(new ImGui.ImVec2(frame_width, gl.drawingBufferHeight - 10), ImGui.Cond.FirstUseEver);
    ImGui.SetNextWindowSizeConstraints(
        new ImGui.ImVec2(frame_width, 0),
        new ImGui.ImVec2(frame_width, gl.drawingBufferHeight - 10)
    );
    {
        ImGui.Begin("Settings");
        //ImGui.PushItemWidth(-100);
        gui.instances_changed =
            ImGui.Combo("Mesh", gui.current_mesh.access, gui.meshes, gui.meshes.length) || gui.instances_changed;
        gui.instances_changed = ImGui.SliderInt("X Instances", gui.x_instances.access, 1, 50) || gui.instances_changed;
        gui.instances_changed = ImGui.SliderInt("Y Instances", gui.y_instances.access, 1, 50) || gui.instances_changed;
        gui.instances_changed = ImGui.SliderInt("Z Instances", gui.z_instances.access, 1, 50) || gui.instances_changed;
        ImGui.Text(`Instances: ${gui.x_instances.value * gui.z_instances.value * gui.y_instances.value}`);
        ImGui.Text(`Vertices Rendered: ${renderer.stats.vertex_draw_count}`);
        ImGui.Text(`Indices Rendered: ${renderer.stats.index_draw_count}`);
        ImGui.End();
    }

    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}
