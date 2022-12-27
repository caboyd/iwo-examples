import { glMatrix, mat4, vec2, vec3, vec4 } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

const DEPTH_TEXTURE_SIZE = 1536;
const SHADOW_DISTANCE = 28;
const TRANSITION_DISTANCE = 5;

const FOV = 45 as const;
const LIGHT_DIRECTION = vec3.normalize(vec3.create(), vec3.fromValues(0.34, 0.83, 0.44));
const cPos: vec3 = vec3.scale(vec3.create(), LIGHT_DIRECTION, 5);

const view_matrix: mat4 = mat4.create();
const light_view_matrix: mat4 = mat4.create();
const proj_matrix: mat4 = mat4.create();
const depth_proj_matrix: mat4 = mat4.create();

let camera: IWO.Camera;
let orbit: IWO.OrbitControl;
let fps: IWO.FPSControl;
let frustum: IWO.Frustum;

let frustum_line: IWO.MeshInstance;
let cuboid_line: IWO.MeshInstance;

let grid: IWO.MeshInstance;
let plane: IWO.MeshInstance;
let spheres: IWO.MeshInstance[];
let quad: IWO.MeshInstance;
let renderer: IWO.Renderer;
let render_queue: IWO.RenderQueue;
let depth_pass: IWO.DepthPass;

(async function main(): Promise<void> {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    gl = IWO.initGL(canvas);

    renderer = new IWO.Renderer(gl);
    renderer.setShadows(true);

    window.addEventListener("resize", resizeCanvas, false);

    function resizeCanvas(): void {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        mat4.perspective(
            proj_matrix,
            glMatrix.toRadian(FOV),
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000.0
        );
        if (frustum) frustum.calculateWidthsAndHeights(gl);
    }

    resizeCanvas();

    initScene();

    requestAnimationFrame(update);
})();

function initScene(): void {
    const inv = vec3.negate(vec3.create(), LIGHT_DIRECTION);
    camera = new IWO.Camera(cPos, inv);
    //orbit = new IWO.OrbitControl(camera, { maximum_distance: 60, orbit_point: [0, 0, 0] });
    fps = new IWO.FPSControl(camera);

    camera.getViewMatrix(view_matrix);

    frustum = new IWO.Frustum(gl, light_view_matrix, camera, {
        fov: FOV,
        clip_far: SHADOW_DISTANCE - TRANSITION_DISTANCE,
        clip_near: -SHADOW_DISTANCE / 1.5,
    });

    render_queue = new IWO.RenderQueue(renderer);
    depth_pass = new IWO.DepthPass(
        renderer,
        light_view_matrix,
        depth_proj_matrix,
        DEPTH_TEXTURE_SIZE,
        SHADOW_DISTANCE,
        TRANSITION_DISTANCE,
        true
    );
    render_queue.appendRenderPass("depth", depth_pass);
    const default_pass = new IWO.DefaultRenderPass(renderer, view_matrix, proj_matrix);
    default_pass.onBeforePass = () => {
        gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };
    render_queue.appendRenderPass("default", default_pass);

    const uniforms = new Map();
    uniforms.set("u_lights[0].position", [LIGHT_DIRECTION[0], LIGHT_DIRECTION[1], LIGHT_DIRECTION[2], 0]);
    uniforms.set("u_lights[0].color", [3, 3, 3]);
    uniforms.set("u_light_count", 1);
    uniforms.set("light_ambient", [0.03, 0.03, 0.03]);
    renderer.addShaderVariantUniforms(IWO.ShaderSource.PBR, uniforms);

    let line_geom = getFrustumLineGeometry();
    let line_mesh = new IWO.Mesh(gl, line_geom);

    const line_mat = new IWO.LineMaterial([gl.drawingBufferWidth, gl.drawingBufferHeight], [0, 0, 0, 1], 6, false);
    frustum_line = new IWO.MeshInstance(line_mesh, line_mat);

    const cuboid_lines_geoms = getFrustumCuboidLineGeometry();
    let cuboid_line_mesh = new IWO.Mesh(gl, cuboid_lines_geoms);

    const cuboid_mat = new IWO.LineMaterial([gl.drawingBufferWidth, gl.drawingBufferHeight], [1, 1, 1, 1], 4, false);
    cuboid_line = new IWO.MeshInstance(cuboid_line_mesh, cuboid_mat);

    const plane_geom = new IWO.PlaneGeometry(100, 100, 1, 1, false);
    const plane_mesh = new IWO.Mesh(gl, plane_geom);

    //GRID
    const grid_mat = new IWO.GridMaterial();
    grid = new IWO.MeshInstance(plane_mesh, grid_mat);

    const plane_mat = new IWO.PBRMaterial({
        albedo_color: [0.4, 0.4, 0.4],
        shadow_texture: depth_pass.depth_texture_float,
    });
    plane = new IWO.MeshInstance(plane_mesh, plane_mat);
    mat4.translate(plane.model_matrix, plane.model_matrix, [0, -0.01, 0]);

    //SPHERES
    let sphere_mat = new IWO.PBRMaterial({
        albedo_color: [1, 1, 1],
        metallic: 0.5,
        roughness: 1,
        shadow_texture: depth_pass.depth_texture_float,
    });

    const sphere_geom = new IWO.SphereGeometry(0.3, 8, 8);
    spheres = [];
    const num_cols = 4;
    const num_rows = 6;
    for (let i = 0; i <= num_cols; i++) {
        for (let k = 0; k <= num_rows; k++) {
            const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
            const s = new IWO.MeshInstance(sphere_mesh, sphere_mat);
            spheres.push(s);
            const model = s.model_matrix;
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((i - num_cols / 2) * 5, 1, num_rows * 2 - k * 5));
        }
    }

    //add a sun
    const mat = new IWO.BasicUnlitMaterial(vec3.fromValues(1, 1, 1));
    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    const s = new IWO.MeshInstance(sphere_mesh, mat);
    spheres.push(s);
    const model = s.model_matrix;
    mat4.identity(model);
    mat4.translate(model, model, vec3.scale(vec3.create(), [0, 1, 0], 10));
    mat4.scale(model, model, [4, 4, 4]);

    const quad_geom = new IWO.QuadGeometry();
    const quad_mesh = new IWO.Mesh(gl, quad_geom);
    quad = new IWO.MeshInstance(quad_mesh, new IWO.EmptyMaterial(IWO.ShaderSource.Quad));
}

function update(): void {
    //orbit.update();
    fps.update();
    frustum.update();

    updateLightViewMatrix();
    frustum.getOrtho(depth_proj_matrix);
    camera.getViewMatrix(view_matrix);

    // let geom = getFrustumLineGeometry();
    // frustum_line.mesh.vertexBufferSubDataFromGeometry(gl, geom);

    // geom = getFrustumCuboidLineGeometry();
    // cuboid_line.mesh.vertexBufferSubDataFromGeometry(gl, geom);

    drawScene();

    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    gl.enable(gl.DEPTH_TEST);
    render_queue.addMeshInstanceToAllPasses(plane);
    for (const sphere of spheres) {
        render_queue.addMeshInstanceToAllPasses(sphere);
    }
    render_queue.addMeshInstanceToRenderPass("default", grid);

    render_queue.addCommandToRenderPass("default", {
        mesh_instance: quad,
        onBeforeRender: () => {
            gl.viewport(0, 0, 200, 200);
            const shader = renderer.getorCreateShader(IWO.ShaderSource.Quad);
            renderer.setAndActivateShader(shader);
            shader.setUniform("input_texture", 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, depth_pass.depth_texture_rgba!.texture_id);
        },
        onAfterRender: () => {
            renderer.resetViewport();
        },
    });

    render_queue.execute();
}

function updateLightViewMatrix() {
    frustum.update();
    let center = frustum.getCenter();
    vec3.negate(center, center);
    let light_inverse_dir = vec3.fromValues(-LIGHT_DIRECTION[0], -LIGHT_DIRECTION[1], -LIGHT_DIRECTION[2]);

    mat4.identity(light_view_matrix);
    let pitch = Math.acos(vec2.length([light_inverse_dir[0], light_inverse_dir[2]]));
    mat4.rotateX(light_view_matrix, light_view_matrix, pitch);
    let yaw = Math.atan2(light_inverse_dir[2], light_inverse_dir[0]);
    yaw = light_inverse_dir[2] > 0 ? yaw - Math.PI : yaw;
    mat4.rotateY(light_view_matrix, light_view_matrix, yaw + Math.PI / 2);
    mat4.translate(light_view_matrix, light_view_matrix, center);
}

function getFrustumLineGeometry() {
    const inverse = mat4.invert(mat4.create(), light_view_matrix);
    const p = frustum.getOrthoVertices(inverse);

    let line_points = [];
    //add  far plane line segments
    line_points.push(p[0], p[1], p[1], p[3], p[3], p[2], p[2], p[0]);
    //add near plane lines
    line_points.push(p[0 + 4], p[1 + 4], p[1 + 4], p[3 + 4], p[3 + 4], p[2 + 4], p[2 + 4], p[0 + 4]);
    //add near to far top left, top right, bottom left, bottom right
    line_points.push(p[0], p[0 + 4], p[1], p[1 + 4], p[2], p[2 + 4], p[3], p[3 + 4]);
    line_points = line_points.flat(2) as number[];

    let line_geom = new IWO.LineGeometry(line_points, { type: "lines" });
    return line_geom;
}

function getFrustumCuboidLineGeometry() {
    const inverse = mat4.invert(mat4.create(), light_view_matrix);
    let c = frustum.getCenter();
    //put center back into light space so we can move it to world space with the other points
    const c4 = vec4.fromValues(camera.position[0], camera.position[1], camera.position[2], 1);
    vec4.transformMat4(c4, c4, light_view_matrix);
    c = vec3.fromValues(c4[0], c4[1], c4[2]);
    //console.log(c);
    const w = frustum.getWidth() / 2;
    const l = frustum.getLength() / 2;
    const h = frustum.getHeight() / 2;

    let line_points = [];
    //far plane
    //prettier-ignore
    line_points.push(
        [c[0],c[1],c[2]-l],  [c[0],c[1],c[2]+l],
        [c[0],c[1]-h,c[2]],  [c[0],c[1]+h,c[2]],
        [c[0]-w,c[1],c[2]],  [c[0]+w,c[1],c[2]]
    )
    for (const point of line_points) {
        const p = vec4.fromValues(point[0], point[1], point[2], 1);
        vec4.transformMat4(p, p, inverse);
        point[0] = p[0];
        point[1] = p[1];
        point[2] = p[2];
    }
    line_points = line_points.flat(2) as number[];

    let line_geom = new IWO.LineGeometry(line_points, { type: "lines" });
    return line_geom;
}
