import { glMatrix, mat4, vec3 } from "gl-matrix";
import * as IWO from "iwo";
import {
    BasicMaterial,
    HDRImageLoader,
    ImageLoader,
    Material,
    Mesh,
    MeshInstance,
    PBRMaterial,
    SphereGeometry,
    Texture2D,
    TextureCubeMap,
} from "iwo";
import { glTFData, glTFLoader } from "loader/glTFLoader";
import { HDRBuffer } from "loader/HDRImageLoader";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();

const cPos: vec3 = vec3.fromValues(0.5, 8, 9.0);
let camera: IWO.Camera;

let mouse_x_total = 0;
let mouse_y_total = 0;
const keys: Array<boolean> = [];

let grid: IWO.MeshInstance;
let renderer: IWO.Renderer;
let skybox: MeshInstance;
let helmet: IWO.MeshInstance;
let helmet_loaded = false;

document.getElementById("loading-text-wrapper")!.remove();

const moveCallback = (e: MouseEvent): void => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    if (e.which == 1) {
        mouse_x_total += movementX;
        mouse_y_total += movementY;
    }
};

const stats = (): void => {
    const script = document.createElement("script");
    script.onload = (): void => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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

    camera = new IWO.Camera(cPos);

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    mat4.perspective(proj_matrix, glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

    const sun_dir = [1, 1, 1];
    const sun_intensity = 0.5;
    const sun_color = [(sun_intensity * 254) / 255, (sun_intensity * 238) / 255, (sun_intensity * 224) / 255];

    const pbrShader = IWO.PBRMaterial.Shader;
    pbrShader.use();
    pbrShader.setUniform("gamma", 1.0);
    pbrShader.setUniform("u_lights[0].position", [sun_dir[0], sun_dir[1], sun_dir[2], 0]);
    pbrShader.setUniform("u_lights[0].color", sun_color);
    pbrShader.setUniform("u_light_count", 1);

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
    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, true);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    const sky_tex = new Texture2D(gl);
    let irr_tex = new TextureCubeMap(gl);
    let env_tex = new TextureCubeMap(gl);
    const cube_tex = new TextureCubeMap(gl);

    const file_prefix = "../assets/cubemap/royal_esplanade/royal_esplanade";
    ImageLoader.promise(file_prefix + "_preview.jpg").then((image: HTMLImageElement) => {
        sky_tex.setImage(gl, image, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR);
        ImageLoader.promise(file_prefix + ".jpg").then((image: HTMLImageElement) => {
            sky_tex.setImage(gl, image, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR);
        });
    });

    HDRImageLoader.promise(file_prefix + "_1k.hdr").then((data: HDRBuffer) => {
        cube_tex.setEquirectangularHDRBuffer(renderer, data);
        irr_tex = TextureCubeMap.irradianceFromCubemap(irr_tex, renderer, cube_tex);
        env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex);
        HDRImageLoader.promise(file_prefix + "_2k.hdr").then((data: HDRBuffer) => {
            cube_tex.setEquirectangularHDRBuffer(renderer, data);
            env_tex = TextureCubeMap.specularFromCubemap(env_tex, renderer, cube_tex, data.width);
            cube_tex.destroy(gl);
        });
    });

    //Init Helmet
    glTFLoader.promise("DamagedHelmet.gltf", "../assets/damaged-helmet/").then((value: glTFData) => {
        helmet_loaded = true;
        const m = new Mesh(gl, value.buffered_geometries[0]);
        renderer.resetSaveBindings();
        helmet = new MeshInstance(m, value.materials);
        const pbr = (helmet.materials as Material[])[0] as PBRMaterial;
        pbr.irradiance_texture = irr_tex;
        pbr.specular_env = env_tex;
        const rot = mat4.fromQuat(mat4.create(), [0.7071068286895752, 0.0, -0.0, 0.7071068286895752]);
        mat4.translate(helmet.model_matrix, helmet.model_matrix, [0, 5, 0]);
        mat4.multiply(helmet.model_matrix, helmet.model_matrix, rot);
        mat4.scale(helmet.model_matrix, helmet.model_matrix, [4, 4, 4]);
    });

    //GRID
    const grid_mat = new IWO.GridMaterial(50);
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    //SKYBOX
    const sky_geom = new SphereGeometry(1, 48, 48);
    const sky_mesh = new Mesh(gl, sky_geom);
    const sky_mat = new BasicMaterial([1, 1, 1]);
    sky_mat.setAlbedoTexture(sky_tex);
    skybox = new MeshInstance(sky_mesh, sky_mat);
}

function update(): void {
    if (keys[87]) camera.processKeyboard(IWO.Camera_Movement.FORWARD, 0.001);
    else if (keys[83]) camera.processKeyboard(IWO.Camera_Movement.BACKWARD, 0.001);
    if (keys[65]) camera.processKeyboard(IWO.Camera_Movement.LEFT, 0.001);
    else if (keys[68]) camera.processKeyboard(IWO.Camera_Movement.RIGHT, 0.001);
    if (keys[82]) camera.lookAt(vec3.fromValues(0, 0, 0));
    if (keys[32]) camera.processKeyboard(IWO.Camera_Movement.UP, 0.001);

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

    //Draw Helmet
    if (helmet_loaded) helmet.render(renderer, view_matrix, proj_matrix);
    renderer.resetSaveBindings();

    // gl.enable(gl.BLEND);
    // gl.disable(gl.CULL_FACE);
    // //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // grid.render(renderer, view_matrix, proj_matrix);
    // gl.enable(gl.CULL_FACE);
    // gl.disable(gl.BLEND);
}

window.onkeydown = function(e: KeyboardEvent): void {
    keys[e.keyCode] = true;
};

window.onkeyup = function(e: KeyboardEvent): void {
    keys[e.keyCode] = false;
};
