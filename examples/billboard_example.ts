import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";
import * as IWO from "iwo";
import { XY } from "../lib/imgui-js/imgui";
import { PBRMaterial } from "../iwo/src/materials/PBRMaterial";

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = vec3.fromValues(10, 6, 10);
let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let renderer: IWO.Renderer;
let grid: IWO.MeshInstance;
let floor: IWO.MeshInstance;

let instanced_mesh: IWO.InstancedMesh;

class Static<T> {
    constructor(public value: T) {}
    access: ImGui.Access<T> = (value: T = this.value): T => (this.value = value);
}

const gui = {
    instances: new Static<number>(1000),
    instances_changed: true,
    mesh_map: new Map<string, IWO.Mesh>(),
    meshes: ["grass quad"],
    current_mesh: new Static<number>(0),
    color: new Static<vec3>([1, 1, 1]),
    current_material: new Static<number>(0),
    mat_map: {
        "PBR Material": new IWO.PBRMaterial({ metallic: 1.0, is_billboard: true, light_factor: [0.1, 0.1, 0.1] }),
        //"Basic Unlit Material": new IWO.BasicUnlitMaterial([1, 1, 1]),
        "Toon Material": new IWO.ToonMaterial({ is_billboard: true }),
        "Normal Only Material": new IWO.NormalOnlyMaterial({ is_billboard: true }),
    } as Record<string, IWO.Material>,
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

    const sun_dir = [-0.3, 4, 1];
    const sun_intensity = 4;
    const sun_color = [sun_intensity, sun_intensity, sun_intensity];

    const uniforms = new Map();
    uniforms.set("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    uniforms.set("u_lights[0].color", sun_color);
    uniforms.set("light_ambient", [0.9, 0.9, 0.9]);
    uniforms.set("u_light_count", 1);

    renderer.addShaderVariantUniforms(IWO.ShaderSource.PBR, uniforms);
    renderer.addShaderVariantUniforms(IWO.ShaderSource.Toon, uniforms);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 25, 25, false);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial({ frequency: 10 });
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);
    const floor_mat = new PBRMaterial({ albedo_color: [0.4, 0.4, 0.4] });
    floor_mat.albedo_image = await IWO.ImageLoader.promise("Grass001_1K_Color.jpg", root_url + "/pbr/grass/");
    floor_mat.normal_texture = await IWO.TextureLoader.load(gl, "Grass001_1K_NormalGL.jpg", root_url + "/pbr/grass/");
    floor_mat.occlusion_texture = await IWO.TextureLoader.load(
        gl,
        "Grass001_1K_AmbientOcclusion.jpg",
        root_url + "/pbr/grass/"
    );
    floor_mat.metal_roughness_texture = await IWO.TextureLoader.load(
        gl,
        "Grass001_1K_Roughness.jpg",
        root_url + "/pbr/grass/"
    );
    floor = new IWO.MeshInstance(plane_mesh, floor_mat);

    mat4.translate(floor.model_matrix, floor.model_matrix, [0, -0.01, 0]);

    let geom = new IWO.QuadGeometry();
    let mesh = new IWO.Mesh(gl, geom);
    gui.mesh_map.set("grass quad", mesh);

    mesh = gui.mesh_map.get(gui.meshes[gui.current_mesh.value])!;
    instanced_mesh = new IWO.InstancedMesh(mesh, gui.mat_map["PBR Material"]);

    const grass_tex = await IWO.TextureLoader.load(gl, "grass.png", root_url + "/images/", {
        flip: true,
        format: gl.RGBA,
        internal_format: gl.SRGB8_ALPHA8,
    });
    for (const mat of Object.values(gui.mat_map)) {
        //@ts-ignore
        mat.albedo_texture = grass_tex;
    }
}

function update(): void {
    let io = ImGui.GetIO();
    orbit.mouse_active = !io.WantCaptureMouse;
    orbit.update();

    const mesh = gui.mesh_map.get(gui.meshes[gui.current_mesh.value]);
    if (mesh) {
        instanced_mesh.mesh = mesh;
    }
    const mat = Object.values(gui.mat_map)[gui.current_material.value];
    instanced_mesh.materials[0] = mat;

    if (gui.instances_changed) {
        gui.instances_changed = false;
        instanced_mesh.instance_matrix = [];
        const m = mat4.create();
        const size_z = 100;
        const size_x = 100;

        for (let i = 0; i < gui.instances.value; i++) {
            mat4.identity(m);
            let rand = superFastHash(i);
            let x = (rand / 0xffffffff) * size_x;
            let z = (superFastHash(rand) / 0xffffffff) * size_z;
            mat4.translate(m, m, [x, 1.0, z]);
            instanced_mesh.addInstance(m);
        }
    }
    instanced_mesh.sortBackToFront(camera.position);

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

    floor.render(renderer, view_matrix, proj_matrix);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
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
        gui.instances_changed = ImGui.SliderInt("Instances", gui.instances.access, 1, 10000) || gui.instances_changed;
        ImGui.Text(`Vertices Rendered: ${renderer.stats.vertex_draw_count}`);
        ImGui.Text(`Indices Rendered: ${renderer.stats.index_draw_count}`);
        ImGui.Text("Material");
        const keys = Object.keys(gui.mat_map);
        ImGui.Combo("Material", gui.current_material.access, keys, keys.length);
        {
            let c: ImGui.ImTuple3<number> = [gui.color.value[0], gui.color.value[1], gui.color.value[2]];
            ImGui.ColorEdit3("Color", c);
            vec3.set(gui.color.value, c[0], c[1], c[2]);
        }
        ImGui.End();
    }

    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}

// SuperFastHash, adapated from http://www.azillionmonkeys.com/qed/hash.html
function superFastHash(num: number) {
    let hash = 4;
    let tmp;

    hash += num & 0xffff;
    tmp = (((num >> 16) & 0xffff) << 11) ^ hash;
    hash = (hash << 16) ^ tmp;
    hash += hash >> 11;

    /* Force "avalanching" of final 127 bits */
    hash ^= hash << 3;
    hash += hash >> 5;
    hash ^= hash << 4;
    hash += hash >> 17;
    hash ^= hash << 25;
    hash += hash >> 6;

    return hash;
}
