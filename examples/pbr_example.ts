import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0.5, 8, 9.0);
const cUp: vec3 = vec3.fromValues(0, 1, 0);
const cFront: vec3 = vec3.fromValues(0, 0, -1);

const light_color: vec3 = vec3.fromValues(12.47, 12.31, 12.79);
const light_positions: [number, number, number, number][] = [
    [10, 15, 10, 1],
    [-10, 5, 10, 1],
    [0, 5, -10, 1],
];

let camera: IWO.Camera;
let fps_control: IWO.FPSControl;

let box: IWO.MeshInstance;
let light_boxes: IWO.MeshInstance[];
let skybox: IWO.MeshInstance;
let spheres: IWO.MeshInstance[];
let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;

document.getElementById("loading-text-wrapper")!.remove();

(function main(): void {
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
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    camera = new IWO.Camera(cPos, cFront);
    fps_control = new IWO.FPSControl(camera);

    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

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
    //0.5-u because we scaled x by -1 to invert sphere
    //1-v because we flipped the image
    const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const sun_intensity = 24;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);

    pbrShader.setUniform("u_lights[1].position", light_positions[0]);
    pbrShader.setUniform("u_lights[1].color", light_color);

    pbrShader.setUniform("u_lights[2].position", light_positions[1]);
    pbrShader.setUniform("u_lights[2].color", light_color);

    pbrShader.setUniform("u_lights[3].position", light_positions[2]);
    pbrShader.setUniform("u_lights[3].color", light_color);

    pbrShader.setUniform("u_light_count", 4);

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

    const file_prefix = "../assets/cubemap/monvalley/MonValley_A_LookoutPoint";
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

    const earth_tex = IWO.TextureLoader.load(gl, "../assets/earth.jpg");

    const box_geom = new IWO.BoxGeometry(3.0, 3.0, 3.0, 1, 1, 1, false);
    const sphere_geom = new IWO.SphereGeometry(0.75, 16, 16);
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);

    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);
    const box_mesh = new IWO.Mesh(gl, box_geom);

    const sphere_mat = new IWO.PBRMaterial(vec3.fromValues(1, 0, 0), 0.0, 0.0);
    sphere_mat.albedo_texture = earth_tex;

    //GRID
    const grid_mat = new IWO.GridMaterial(50);
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SKYBOX
    const sky_geom = new IWO.SphereGeometry(1, 48, 48);
    const sky_mesh = new IWO.Mesh(gl, sky_geom);
    const sky_mat = new IWO.BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new IWO.MeshInstance(sky_mesh, sky_mat);

    //LIGHTS
    const light_geom = new IWO.BoxGeometry(1.0, 1.0, 1.0);
    const light_mesh = new IWO.Mesh(gl, light_geom);
    const light_mat = new IWO.PBRMaterial(vec3.fromValues(1000, 1000, 1000), 0.0, 1.0);
    light_boxes = [];
    for (const pos of light_positions) {
        const lb = new IWO.MeshInstance(light_mesh, light_mat);
        mat4.translate(lb.model_matrix, lb.model_matrix, [pos[0], pos[1], pos[2]]);
        light_boxes.push(lb);
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
            const mat = new IWO.PBRMaterial([1, 1, 1], k / num_rows, Math.min(1, Math.max(0.025, i / num_cols)), 1);
            mat.irradiance_texture = irr_tex;
            mat.specular_env = env_tex;
            const s = new IWO.MeshInstance(sphere_mesh, mat);
            spheres.push(s);
            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, k * 2, 0));
        }
    }
}

function update(): void {
    fps_control.update();
    drawScene();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camera.getViewMatrix(view_matrix);

    renderer.setPerFrameUniforms(view_matrix, proj_matrix);

    //skybox
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    mat4.identity(skybox.model_matrix);
    mat4.translate(skybox.model_matrix, skybox.model_matrix, camera.position);
    mat4.scale(skybox.model_matrix, skybox.model_matrix, [-1, 1, -1]);

    skybox.render(renderer, view_matrix, proj_matrix);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    //mat4.rotateY(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.7));
    //mat4.rotateZ(box.model_matrix, box.model_matrix, glMatrix.toRadian(0.5));

    //  box.render(renderer, view_matrix, proj_matrix);

    for (const lb of light_boxes) lb.render(renderer, view_matrix, proj_matrix);

    for (const sphere of spheres) {
        sphere.render(renderer, view_matrix, proj_matrix);
    }

    grid.render(renderer, view_matrix, proj_matrix);
}
