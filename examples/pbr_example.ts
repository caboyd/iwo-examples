import { glMatrix, mat4, vec3 } from "gl-matrix";
import { Camera, Camera_Movement } from "cameras/Camera";
import { BoxGeometry } from "geometry/BoxGeometry";
import { Mesh } from "meshes/Mesh";
import { MeshInstance } from "meshes/MeshInstance";
import { Renderer } from "graphics/Renderer";
import { FileLoader } from "loader/FileLoader";
import { SphereGeometry } from "geometry/SphereGeometry";
import { PlaneGeometry } from "geometry/PlaneGeometry";
import { GridMaterial } from "materials/GridMaterial";
import { PBRMaterial } from "materials/PBRMaterial";
import { BasicMaterial } from "materials/BasicMaterial";
import { ImageLoader } from "loader/ImageLoader";
import { Texture2D } from "graphics/Texture2D";
import { HDRBuffer, HDRImageLoader } from "loader/HDRImageLoader";
import { TextureCubeMap } from "graphics/TextureCubeMap";
import { TextureLoader } from "loader/TextureLoader";

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

let camera: Camera;

let mouse_x_total = 0;
let mouse_y_total = 0;
const keys: Array<boolean> = [];

let box: MeshInstance;
let light_boxes: MeshInstance[];
let skybox: MeshInstance;
let spheres: MeshInstance[];
let sphere_mat: PBRMaterial;
let grid: MeshInstance;
let renderer: Renderer;

//document.getElementById("loading-text-wrapper")!.remove();

const moveCallback = (e: MouseEvent): void => {
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;
    if (e.which == 1) {
        mouse_x_total += movementX;
        mouse_y_total += movementY;
    }
};

const stats = (): void => {
    const script = document.createElement("script");
    script.onload = (): void => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const stats = new Stats();
        document.body.appendChild(stats.dom);
        requestAnimationFrame(function loop() {
            stats.update();
            requestAnimationFrame(loop);
        });
    };
    script.src = "//rawgit.com/mrdoob/stats.js/master/build/stats.min.js";
    document.head.appendChild(script);
};

(function main(): void {
    stats();

    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    document.addEventListener("mousemove", moveCallback, false);

    gl = initGL();

    renderer = new Renderer(gl);

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

    camera = new Camera(cPos, cFront, cUp);

    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

    //0.5-u because we scaled x by -1 to invert sphere
    //1-v because we flipped the image
    const sun_dir = sphereUVtoVec3(vec3.create(), 0.5 + 0.872, 1 - 0.456);
    const sun_intensity = 24;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = PBRMaterial.Shader;
    pbrShader.use();
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);

    pbrShader.setUniform("u_lights[1].position", light_positions[0]);
    pbrShader.setUniform("u_lights[1].color", light_color);

    pbrShader.setUniform("u_lights[2].position", light_positions[1]);
    pbrShader.setUniform("u_lights[2].color", light_color);

    pbrShader.setUniform("u_lights[3].position", light_positions[2]);
    pbrShader.setUniform("u_lights[3].color", light_color);

    pbrShader.setUniform("u_light_count", 4);

    initScene();

    requestAnimationFrame(update);
})();

function initGL(): WebGL2RenderingContext {
    try {
        gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
    } catch (e) {
        throw new Error("GL init error:\n" + e);
    }

    if (!gl) {
        alert("WebGL is not available on your browser.");
    }
    return gl;
}

function initScene(): void {
    let global_root = window.location.href.substr(0, window.location.href.lastIndexOf("/"));
    //Removes /examples subfolder off end of url so images are found in correct folder
    global_root = global_root.substring(0, global_root.lastIndexOf("/") + 1);

    const sky_tex = new Texture2D(gl);
    let irr_tex = new TextureCubeMap(gl);
    let env_tex = new TextureCubeMap(gl);
    const cube_tex = new TextureCubeMap(gl);

    const tex2D_opts = {
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR,
        flip: true,
    };

    const file_prefix = "../assets/cubemap/monvalley/MonValley_A_LookoutPoint";
    ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
        sky_tex.setImage(gl, image, tex2D_opts);
        ImageLoader.promise(file_prefix + "_8k.jpg").then((image: HTMLImageElement) => {
            sky_tex.setImage(gl, image, tex2D_opts);
        });
    });

    HDRImageLoader.promise(file_prefix + "_Env.hdr").then((data: HDRBuffer) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex);
        env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex);
        HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: HDRBuffer) => {
            cube_tex.setEquirectangularHDRBuffer(renderer, data);
            env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
            cube_tex.destroy(gl);
        });
    });

    const earth_tex = TextureLoader.load(gl, "../assets/earth.jpg");

    const box_geom = new BoxGeometry(3.0, 3.0, 3.0, 1, 1, 1, false);
    const sphere_geom = new SphereGeometry(0.75, 16, 16);
    const plane_geom = new PlaneGeometry(100, 100, 1, 1, true);

    const sphere_mesh = new Mesh(gl, sphere_geom);
    const plane_mesh = new Mesh(gl, plane_geom);
    const box_mesh = new Mesh(gl, box_geom);

    sphere_mat = new PBRMaterial(vec3.fromValues(1, 0, 0), 0.0, 0.0);
    sphere_mat.albedo_texture = earth_tex;

    //GRID
    const grid_mat = new GridMaterial(50);
    grid = new MeshInstance(plane_mesh, grid_mat);

    //SKYBOX
    const sky_geom = new SphereGeometry(1, 48, 48);
    const sky_mesh = new Mesh(gl, sky_geom);
    const sky_mat = new BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new MeshInstance(sky_mesh, sky_mat);

    //LIGHTS
    const light_geom = new BoxGeometry(1.0, 1.0, 1.0);
    const light_mesh = new Mesh(gl, light_geom);
    const light_mat = new PBRMaterial(vec3.fromValues(1000, 1000, 1000), 0.0, 1.0);
    light_boxes = [];
    for (const pos of light_positions) {
        const lb = new MeshInstance(light_mesh, light_mat);
        mat4.translate(lb.model_matrix, lb.model_matrix, [pos[0], pos[1], pos[2]]);
        light_boxes.push(lb);
    }

    //BOX
    const box_mat = new BasicMaterial(vec3.fromValues(1, 1, 1));
    //box_mat.setAlbedoTexture(env_tex, true);
    box_mat.setAlbedoCubeTexture(cube_tex);
    box = new MeshInstance(box_mesh, box_mat);
    mat4.translate(box.model_matrix, box.model_matrix, vec3.fromValues(-2, 5, 3));

    //SPHERES

    spheres = [];
    const num_cols = 8;
    const num_rows = 8;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const mat = new PBRMaterial([1, 1, 1], k / num_rows, Math.min(1, Math.max(0.025, i / num_cols)), 1);
            //mat.albedo_texture = sphere_mat.albedo_texture;
            mat.irradiance_texture = irr_tex;
            mat.specular_env = env_tex;
            const s = new MeshInstance(sphere_mesh, mat);
            spheres.push(s);

            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 2, k * 2, 0));
            //  mat4.rotateY(model, model, glMatrix.toRadian(Date.now() * -0.08));
            //   mat4.rotateZ(model, model, glMatrix.toRadian(Date.now() * 0.06));
        }
    }
}

function update(): void {
    if (keys[87]) camera.processKeyboard(Camera_Movement.FORWARD, 0.001);
    else if (keys[83]) camera.processKeyboard(Camera_Movement.BACKWARD, 0.001);
    if (keys[65]) camera.processKeyboard(Camera_Movement.LEFT, 0.001);
    else if (keys[68]) camera.processKeyboard(Camera_Movement.RIGHT, 0.001);
    if (keys[82]) camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32]) camera.processKeyboard(Camera_Movement.UP, 0.001);

    camera.processMouseMovement(-mouse_x_total, -mouse_y_total, true);
    mouse_x_total = 0;
    mouse_y_total = 0;

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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    grid.render(renderer, view_matrix, proj_matrix);

    gl.disable(gl.BLEND);
}

window.onkeydown = function(e: KeyboardEvent): void {
    keys[e.keyCode] = true;
};

window.onkeyup = function(e: KeyboardEvent): void {
    keys[e.keyCode] = false;
};

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
