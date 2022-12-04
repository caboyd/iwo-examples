import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as ImGui from "imgui-js/imgui";
import * as ImGui_Impl from "imgui-js/imgui_impl";
import * as IWO from "iwo";

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const root_url = "../iwo-assets/examples/";

const cPos: vec3 = [0, 8, 16];
const vFov = 60;

const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
const sun_intensity = 24;
const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

let camera: IWO.Camera;
let orbit: IWO.OrbitControl;

let lights: IWO.MeshInstance[];
let skybox: IWO.MeshInstance;
let spheres: IWO.MeshInstance[];
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;
let render_queue: IWO.RenderQueue;

let env_texs: IWO.TextureCubeMap[] = [];
let irr_texs: IWO.TextureCubeMap[] = [];
let sky_texs: IWO.Texture2D[] = [];

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
    environments: [
        { name: "Monument Valley", file_name: "cubemap/monvalley/MonValley_A_LookoutPoint", exists: false },
        { name: "Royal Esplanade", file_name: "cubemap/royal_esplanade/royal_esplanade", exists: false },
    ] as Env[],
    sphere_color: new Static<ImGui.ImTuple3<number>>([1, 1, 1]),
    sphere_color2: new Static<vec3>([1, 1, 1]),
    gamma: new Static<number>(2.2),
    exposure: new Static<number>(1.0),
    current_tone: new Static<number>(0),
    tones: IWO.Tonemappings,
    gaussian: new Static<boolean>(false),
    gaussian_blur_factor: new Static<number>(7),
};

type Env = {
    name: string;
    file_name: string;
    exists: boolean;
};

await (async function main() {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");

    gl = IWO.initGL(canvas, { antialias: false });

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

    render_queue = new IWO.RenderQueue(renderer);
    const d_pass = new IWO.RenderPass(renderer, view_matrix, proj_matrix);
    d_pass.setDefaultTonemapping(renderer, false);
    d_pass.onBeforePass = () => {
        gl.clearColor(0.05, 0.05, 0.05, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };
    render_queue.appendRenderPass("default", d_pass);
    render_queue.appendPostProcessPass(
        "tone",
        new IWO.TonemappingPass(renderer, gui.tones[gui.current_tone.value], gui.gamma.value)
    );

    await initScene();

    requestAnimationFrame(update);
})();

async function initScene() {
    camera = new IWO.Camera(cPos);
    orbit = new IWO.OrbitControl(camera, { orbit_point: [0, 8, 0], maximum_distance: 20 } as IWO.OrbitControlOptions);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const tex2D_opts: Partial<IWO.TextureOptions> = {
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        min_filter: gl.LINEAR,
        flip: true,
    };

    for (let i = 0; i < gui.environments.length; i++) {
        sky_texs.push(new IWO.Texture2D(gl));
        irr_texs.push(new IWO.TextureCubeMap(gl));
        env_texs.push(new IWO.TextureCubeMap(gl));

        const file_prefix = root_url + gui.environments[i].file_name;
        await IWO.ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
            sky_texs[i].setImage(gl, image, tex2D_opts);
        });
    }

    const box_geom = new IWO.BoxGeometry({ width: 3.0, height: 3.0, depth: 3.0, stretch_texture: false });
    const sphere_geom = new IWO.SphereGeometry(0.75, 32, 16);
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);

    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SKYBOX
    const sky_geom = new IWO.SphereGeometry(1, 48, 48);
    const sky_mesh = new IWO.Mesh(gl, sky_geom);
    const sky_mat = new IWO.BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_texs[gui.current_environment.value]);
    skybox = new IWO.MeshInstance(sky_mesh, sky_mat);

    //LIGHTS
    const light_mesh = new IWO.Mesh(gl, sphere_geom);
    const light_mat = new IWO.BasicMaterial([100, 100, 100]);
    lights = [];
    for (let i = 0; i < 15; i++) {
        const lb = new IWO.MeshInstance(light_mesh, light_mat);
        lights.push(lb);
    }

    //SPHERES
    spheres = [];
    const num_cols = 4;
    const num_rows = 4;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const mat = new IWO.PBRMaterial({
                albedo_color: [1, 1, 1],
                metallic: k / num_rows,
                roughness: Math.min(1, Math.max(0.025, i / num_cols)),
                irradiance_texture: irr_texs[gui.current_environment.value],
                specular_env_texture: env_texs[gui.current_environment.value],
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
        if (gui.sun_light.value) index += 1;
        renderer.addShaderVariantUniform(IWO.ShaderSource.PBR, `u_lights[${index}].position`, [x, y, z, 1]);
        const atten = gui.point_light_attenuation.value;
        renderer.addShaderVariantUniform(IWO.ShaderSource.PBR, `u_lights[${index}].color`, [atten, atten, atten]);
    }
    if (gui.sun_light.value) {
        //0.5-u because we scaled x by -1 to invert sphere
        //1-v because we flipped the image

        renderer.addShaderVariantUniform(IWO.ShaderSource.PBR, "u_lights[0].position", [
            sun_dir[0],
            sun_dir[1],
            sun_dir[2],
            0,
        ]);
        renderer.addShaderVariantUniform(IWO.ShaderSource.PBR, "u_lights[0].color", sun_color);
    }
    renderer.addShaderVariantUniform(
        IWO.ShaderSource.PBR,
        "u_light_count",
        light_count + (gui.sun_light.value ? 1 : 0)
    );

    buildEnvironment();

    for (const sphere of spheres) {
        const mat = sphere.materials[0] as IWO.PBRMaterial;
        mat.specular_env_texture_active = gui.specular_reflectance.value;
        mat.specular_env_texture = env_texs[gui.current_environment.value];
        mat.irradiance_texture_active = gui.diffuse_irradiance.value;
        mat.irradiance_texture = irr_texs[gui.current_environment.value];
    }

    mat4.identity(skybox.model_matrix);
    mat4.translate(skybox.model_matrix, skybox.model_matrix, camera.position);
    mat4.scale(skybox.model_matrix, skybox.model_matrix, [-1, 1, -1]);
    const sky_mat = skybox.materials[0] as IWO.BasicMaterial;
    sky_mat.setAlbedoTexture(sky_texs[gui.current_environment.value]);

    if (!gui.gaussian.value) render_queue.removePostProcessPass("gauss");
    else {
        const pass = (render_queue.getPostProcessPass("gauss") as IWO.GaussianBlur) ?? new IWO.GaussianBlur(renderer);
        pass.blur_factor = gui.gaussian_blur_factor.value;
        if (!render_queue.getPostProcessPass("gauss")) render_queue.appendPostProcessPass("gauss", pass);
    }

    drawScene();
    renderer.resetSaveBindings();

    drawUI();
    requestAnimationFrame(update);
}

function drawScene(): void {
    camera.getViewMatrix(view_matrix);

    //skybox
    if (gui.sky_box.value) {
        render_queue.addCommandToAllPasses({
            mesh_instance: skybox,
            onBeforeRender: () => {
                gl.disable(gl.DEPTH_TEST);
                gl.disable(gl.CULL_FACE);
            },
            onAfterRender: () => {
                gl.enable(gl.CULL_FACE);
                gl.enable(gl.DEPTH_TEST);
            },
        });
    }

    for (let i = 0; i < gui.point_light_count.value; i++) {
        const lb = lights[i];
        render_queue.addMeshInstanceToAllPasses(lb);
    }

    for (const sphere of spheres) {
        render_queue.addMeshInstanceToAllPasses(sphere);
    }

    if (gui.grid.value)
        render_queue.addCommandToAllPasses({
            mesh_instance: grid,
            onAfterRender: () => {
                renderer.cleanupGLState();
            },
        });

    render_queue.execute();
}

function drawUI(): void {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    //imgui render
    ImGui_Impl.NewFrame(0);
    ImGui.NewFrame();
    const frame_width = 420;
    ImGui.SetNextWindowPos(new ImGui.ImVec2(gl.drawingBufferWidth - frame_width + 1, 0));
    ImGui.SetNextWindowSize(new ImGui.ImVec2(frame_width, gl.drawingBufferHeight - 10), ImGui.Cond.FirstUseEver);
    ImGui.SetNextWindowSizeConstraints(
        new ImGui.ImVec2(frame_width, 0),
        new ImGui.ImVec2(frame_width, gl.drawingBufferHeight - 10)
    );
    {
        ImGui.Begin("Settings");
        ImGui.PushItemWidth(-175);
        if (ImGui.CollapsingHeader("Post Processing Settings", ImGui.TreeNodeFlags.DefaultOpen)) {
            ImGui.Text("Tonemapping");
            const pass = render_queue.getPostProcessPass("tone") as IWO.TonemappingPass;
            if (ImGui.Combo("Algorithm", gui.current_tone.access, gui.tones as unknown as string[], gui.tones.length)) {
                pass.setTonemapping(renderer, gui.tones[gui.current_tone.value] as IWO.Tonemapping);
            }
            if (gui.current_tone.value !== 5) {
                if (ImGui.SliderFloat("Gamma", gui.gamma.access, 0.01, 5.0)) {
                    pass.setGamma(renderer, gui.gamma.value);
                }
            }
            if (gui.current_tone.value === 4) {
                if (ImGui.SliderFloat("Exposure", gui.exposure.access, 0.01, 5.0)) {
                    pass.setExposure(renderer, gui.exposure.value);
                }
            }
            ImGui.Text("Gaussian Blur");
            ImGui.Checkbox("Enabled", gui.gaussian.access);
            if (gui.gaussian.value) {
                ImGui.SliderFloat("Blur Factor", gui.gaussian_blur_factor.access, 0.01, 10);
            }
        }

        if (ImGui.CollapsingHeader("PBR Settings")) {
            ImGui.Text("Lights");
            ImGui.Checkbox("Sun Light", gui.sun_light.access);
            ImGui.SliderInt("Point Light Count", gui.point_light_count.access, 0, 15);
            ImGui.SliderFloat("Point Light Attenuation", gui.point_light_attenuation.access, 0, 128);
            ImGui.Text("Lighting");
            ImGui.Checkbox("Diffuse Irradiance", gui.diffuse_irradiance.access);
            ImGui.Checkbox("Specular Reflectance", gui.specular_reflectance.access);
            const names = gui.environments.map((v) => v.name);
            ImGui.Combo("Environment", gui.current_environment.access, names, gui.environments.length);
            ImGui.Text("Other");
            ImGui.Checkbox("Sky Box", gui.sky_box.access);
            ImGui.Checkbox("Grid", gui.grid.access);
            if (ImGui.BeginTabBar("Textures")) {
                if (ImGui.BeginTabItem("BRDF LUT")) {
                    if (IWO.Renderer.BRDF_LUT_TEXTURE) {
                        const uv_min: ImGui.Vec2 = new ImGui.Vec2(0.0, 1.0); // Top-left
                        const uv_max: ImGui.Vec2 = new ImGui.Vec2(1.0, 0.0); // Lower-right
                        ImGui.Image(IWO.Renderer.BRDF_LUT_TEXTURE, new ImGui.Vec2(250, 250), uv_min, uv_max);
                    }
                    ImGui.EndTabItem();
                }
                // if (ImGui.BeginTabItem("Enviroment Cubemap")) {
                //     const uv_min: ImGui.Vec2 = new ImGui.Vec2(0.0, 1.0); // Top-left
                //     const uv_max: ImGui.Vec2 = new ImGui.Vec2(1.0, 0.0); // Lower-right
                //     ImGui.Image(env_tex.texture_id, new ImGui.Vec2(250, 250), uv_min, uv_max);
                //     ImGui.EndTabItem();
                // }
                // if (ImGui.BeginTabItem("Irriadiance Cubemap")) {
                //     const uv_min: ImGui.Vec2 = new ImGui.Vec2(0.0, 1.0); // Top-left
                //     const uv_max: ImGui.Vec2 = new ImGui.Vec2(1.0, 0.0); // Lower-right
                //     ImGui.Image(irr_tex.texture_id, new ImGui.Vec2(250, 250), uv_min, uv_max);
                //     ImGui.EndTabItem();
                // }
                if (ImGui.BeginTabItem("Skybox")) {
                    const uv_min: ImGui.Vec2 = new ImGui.Vec2(0.0, 1.0); // Top-left
                    const uv_max: ImGui.Vec2 = new ImGui.Vec2(1.0, 0.0); // Lower-right
                    ImGui.Image(
                        sky_texs[gui.current_environment.value].texture_id,
                        new ImGui.Vec2(250, 250),
                        uv_min,
                        uv_max
                    );
                    ImGui.EndTabItem();
                }
                ImGui.EndTabBar();
            }
        }

        ImGui.End();
    }

    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
}

function buildEnvironment() {
    const i = gui.current_environment.value;
    if (gui.environments[i].exists) return;
    gui.environments[i].exists = true;

    const cube_tex = new IWO.TextureCubeMap(gl);
    const tex2D_opts = {
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        min_filter: gl.LINEAR,
        type: gl.FLOAT,
        internal_format: gl.RGB32F,
        format: gl.RGB,
        flip: true,
    };

    const file_prefix = root_url + gui.environments[i].file_name;

    // IWO.ImageLoader.promise(file_prefix + "_8k.jpg").then((image: HTMLImageElement) => {
    //     sky_texs[i].setImage(gl, image, tex2D_opts);
    // });

    IWO.HDRImageLoader.promise(file_prefix + "_Env.hdr").then((data: IWO.HDRBuffer) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        IWO.TextureCubeMap.irradianceFromCubemap(irr_texs[i], renderer, cube_tex);
        IWO.TextureCubeMap.specularFromCubemap(env_texs[i], renderer, cube_tex);
        IWO.HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: IWO.HDRBuffer) => {
            cube_tex.setEquirectangularHDRBuffer(renderer, data);
            sky_texs[i].setImageByBuffer(gl, data.data, { width: data.width, height: data.height, ...tex2D_opts });
            IWO.TextureCubeMap.irradianceFromCubemap(irr_texs[i], renderer, cube_tex);
            IWO.TextureCubeMap.specularFromCubemap(env_texs[i], renderer, cube_tex, data.width);
            cube_tex.destroy(gl);
        });
    });
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
