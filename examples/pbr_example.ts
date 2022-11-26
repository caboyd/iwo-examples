import { glMatrix, mat4, vec3, vec4 } from "gl-matrix";
import * as IWO from "iwo";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";
import { PBRMaterial } from "../iwo/src/materials/PBRMaterial";

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = [0, 8, 16];
const vFov = 60;

const light_color: vec3 = vec3.fromValues(12.47, 12.31, 12.79);

let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let box: IWO.MeshInstance;
let lights: IWO.MeshInstance[];
let skybox: IWO.MeshInstance;
let spheres: IWO.MeshInstance[];
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

class Static<T> {
    constructor(public value: T) {}
    access: ImGui.Access<T> = (value: T = this.value): T => (this.value = value);
}

const gui = {
    point_light_count: new Static<number>(4),
    point_light_attenuation: new Static<number>(16),
    sun_light: new Static<boolean>(true),
    sky_box: new Static<boolean>(true),
    grid: new Static<boolean>(true),
    diffuse_irradiance: new Static<boolean>(true),
    specular_reflectance: new Static<boolean>(true),
    current_environment: new Static<number>(0),
    environments: ["Monument Valley", "Royal Esplanade"],
    sphere_color: new Static<ImGui.ImTuple3<number>>([1, 1, 1]),
    sphere_color2: new Static<vec3>([1, 1, 1]),
};

await (async function main() {
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
            glMatrix.toRadian(vFov),
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            100.0
        );
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { orbit_point: [0, 8, 0], maximum_distance: 20 } as IWO.OrbitControlOptions);

    gl.clearColor(0.05, 0.05, 0.05, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const sky_tex = new IWO.Texture2D(gl);
    let irr_tex = new IWO.TextureCubeMap(gl);
    let env_tex = new IWO.TextureCubeMap(gl);
    const cube_tex = new IWO.TextureCubeMap(gl);

    const tex2D_opts = {
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR,
        flip: true,
    };

    const file_prefix = root_url + "cubemap/monvalley/MonValley_A_LookoutPoint";
    IWO.ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
        sky_tex.setImage(gl, image, tex2D_opts);
        IWO.ImageLoader.promise(file_prefix + "_8k.jpg").then((image: HTMLImageElement) => {
            sky_tex.setImage(gl, image, tex2D_opts);
        });
    });

    IWO.HDRImageLoader.promise(file_prefix + "_Env.hdr").then((data: IWO.HDRBuffer) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = IWO.TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex);
        env_tex = IWO.TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex);
        IWO.HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: IWO.HDRBuffer) => {
            cube_tex.setEquirectangularHDRBuffer(renderer, data);
            env_tex = IWO.TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
            cube_tex.destroy(gl);
        });
    });

    const box_geom = new IWO.BoxGeometry({ width: 3.0, height: 3.0, depth: 3.0, stretch_texture: false });
    const sphere_geom = new IWO.SphereGeometry(0.75, 32, 16);
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);

    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);
    const box_mesh = new IWO.Mesh(gl, box_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SKYBOX
    const sky_geom = new IWO.SphereGeometry(1, 48, 48);
    const sky_mesh = new IWO.Mesh(gl, sky_geom);
    const sky_mat = new IWO.BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new IWO.MeshInstance(sky_mesh, sky_mat);

    //LIGHTS
    const light_mesh = new IWO.Mesh(gl, sphere_geom);
    const light_mat = new IWO.BasicMaterial([1, 1, 1]);
    lights = [];
    for (let i = 0; i < 15; i++) {
        const lb = new IWO.MeshInstance(light_mesh, light_mat);
        lights.push(lb);
    }

    //BOX
    const box_mat = new IWO.BasicMaterial(vec3.fromValues(1, 1, 1));
    box_mat.setAlbedoCubeTexture(cube_tex);
    box = new IWO.MeshInstance(box_mesh, box_mat);
    mat4.translate(box.model_matrix, box.model_matrix, vec3.fromValues(-2, 5, 3));

    //SPHERES

    spheres = [];
    const num_cols = 8;
    const num_rows = 8;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const mat = new IWO.PBRMaterial({
                albedo_color: [1, 1, 1],
                metallic: k / num_rows,
                roughness: Math.min(1, Math.max(0.025, i / num_cols)),
                irradiance_texture: irr_tex,
                specular_env_texture: env_tex,
            });
            const s = new IWO.MeshInstance(sphere_mesh, mat);
            spheres.push(s);
            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, k * 2, 0));
        }
    }
}

let last_now = Date.now();
let light_pi = 0;

function update(): void {
    const now = Date.now();
    const delta = now - last_now;
    last_now = now;

    let io = ImGui.GetIO();
    orbit.mouse_active = !io.WantCaptureMouse;
    orbit.update();

    //update point light positions
    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    light_pi += delta / 500;
    const light_count = gui.point_light_count.value;
    for (let i = 0; i < light_count; i++) {
        const lb = lights[i];
        mat4.identity(lb.model_matrix);
        const c = Math.sin(light_pi / 2);
        const size = 8 * (Math.cos(c) - 0.45);
        const l = (2.3 * light_pi) / light_count + (i * Math.PI * 2) / light_count;
        const x = (Math.cos(l) - Math.sin(l)) * size;
        const y = (Math.sin(l) + Math.cos(l)) * size + 8;

        const d = Math.sin(light_pi / 4);
        const z = 8 * d;
        mat4.translate(lb.model_matrix, lb.model_matrix, [x, y, z]);
        mat4.scale(lb.model_matrix, lb.model_matrix, [0.4, 0.4, 0.4]);

        let index = i;
        const pos = vec3.create();
        if (gui.sun_light.value) index += 1;
        vec3.transformMat4(pos, pos, lb.model_matrix);
        pbrShader.setUniform(`u_lights[${index}].position`, [x, y, z, 1]);
        const a = gui.point_light_attenuation.value;
        pbrShader.setUniform(`u_lights[${index}].color`, [a, a, a]);
    }
    if (gui.sun_light.value) {
        //0.5-u because we scaled x by -1 to invert sphere
        //1-v because we flipped the image
        const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
        const sun_intensity = 24;
        const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];
        pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
        pbrShader.setUniform("u_lights[0].color", sun_color);
    }
    pbrShader.setUniform("u_light_count", light_count + (gui.sun_light.value ? 1 : 0));

    for (const sphere of spheres) {
        const mat = sphere.materials[0] as PBRMaterial;
        mat.specular_env_texture_active = gui.specular_reflectance.value;
        mat.irradiance_texture_active = gui.diffuse_irradiance.value;
    }

    drawScene();
    drawUI();
    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);

    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    //skybox
    if (gui.sky_box.value) {
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        mat4.identity(skybox.model_matrix);
        mat4.translate(skybox.model_matrix, skybox.model_matrix, camera.position);
        mat4.scale(skybox.model_matrix, skybox.model_matrix, [-1, 1, -1]);
        skybox.render(renderer, view_matrix, proj_matrix);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
    }

    for (let i = 0; i < gui.point_light_count.value; i++) {
        const lb = lights[i];
        lb.render(renderer, view_matrix, proj_matrix);
    }

    for (const sphere of spheres) {
        sphere.render(renderer, view_matrix, proj_matrix);
    }

    if (gui.grid.value) grid.render(renderer, view_matrix, proj_matrix);
    renderer.cleanupGLState();
}

function drawUI(): void {
    //imgui render
    ImGui_Impl.NewFrame(0);
    ImGui.NewFrame();
    const frame_width = 420;
    ImGui.SetNextWindowPos(new ImGui.ImVec2(gl.drawingBufferWidth - frame_width + 1, 0));
    ImGui.SetNextWindowSize(new ImGui.ImVec2(frame_width, 280), ImGui.Cond.FirstUseEver);
    ImGui.SetNextWindowSizeConstraints(
        new ImGui.ImVec2(frame_width, 0),
        new ImGui.ImVec2(frame_width, gl.drawingBufferHeight)
    );
    {
        ImGui.Begin("Settings");
        ImGui.PushItemWidth(-175);
        ImGui.Text("Lights");
        ImGui.Checkbox("Sun Light", gui.sun_light.access);
        ImGui.SliderInt("Point Light Count", gui.point_light_count.access, 0, 15);
        ImGui.SliderFloat("Point Light Attenuation", gui.point_light_attenuation.access, 0, 128);
        ImGui.Text("Lighting");
        ImGui.Checkbox("Diffuse Irradiance", gui.diffuse_irradiance.access);
        ImGui.Checkbox("Specular Reflectance", gui.specular_reflectance.access);
        ImGui.Text("Other");
        ImGui.Checkbox("Sky Box", gui.sky_box.access);
        ImGui.Checkbox("Grid", gui.grid.access);
        ImGui.End();
    }
    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}

/*
    Converts UV coords of equirectangular image to the vector direction,
    as if it was projected onto the sphere
     */
function sphereUVtoVec3(out: vec3, u: number, v: number): vec3 {
    const theta = (v - 0.5) * Math.PI;
    const phi = u * 2 * Math.PI;

    const x = Math.cos(phi) * Math.cos(theta);
    const y = Math.sin(theta);
    const z = Math.sin(phi) * Math.cos(theta);

    vec3.set(out, x, y, z);
    return out;
}
