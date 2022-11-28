import { glMatrix, mat4, vec2, vec3, vec4 } from "gl-matrix";
import * as IWO from "iwo";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let depth_frame_buffer: WebGLFramebuffer;
let depth_texture: IWO.Texture2D;
let depth_texture2: IWO.Texture2D;

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
const shadow_map_matrix: mat4 = mat4.create();

let camera: IWO.Camera;
let orbit: IWO.OrbitControl;
let fps: IWO.FPSControl;
let frustum: IWO.Frustum;

let frustum_line: IWO.MeshInstance;
let cuboid_line: IWO.MeshInstance;

let grid: IWO.MeshInstance;
let plane: IWO.MeshInstance;
let quad: IWO.MeshInstance;
let spheres: IWO.MeshInstance[];
let renderer: IWO.Renderer;
let depth_mat: IWO.EmptyMaterial;

await (async function main(): Promise<void> {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    gl = IWO.initGL(canvas);

    renderer = new IWO.Renderer(gl);
    depth_frame_buffer = gl.createFramebuffer()!;

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

    gl.clearColor(173 / 255, 196 / 255, 221 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);

    camera.getViewMatrix(view_matrix);

    frustum = new IWO.Frustum(gl, light_view_matrix, camera, {
        fov: FOV,
        clip_far: SHADOW_DISTANCE - TRANSITION_DISTANCE,
        clip_near: -SHADOW_DISTANCE / 1.5,
    });
    initRenderDepth();

    const pbrShader = renderer.getorCreateShader(IWO.ShaderSource.PBR);
    renderer.setAndActivateShader(pbrShader);
    pbrShader.setUniform("u_lights[0].position", [LIGHT_DIRECTION[0], LIGHT_DIRECTION[1], LIGHT_DIRECTION[2], 0]);
    pbrShader.setUniform("u_lights[0].color", [3, 3, 3]);
    pbrShader.setUniform("u_light_count", 1);
    pbrShader.setUniform("light_ambient", [0.03, 0.03, 0.03]);
    pbrShader.setUniform("shadow_map_size", DEPTH_TEXTURE_SIZE);
    pbrShader.setUniform("shadow_distance", SHADOW_DISTANCE);
    pbrShader.setUniform("transition_distance", TRANSITION_DISTANCE);

    const inverse_view = camera.getInverseViewMatrix(mat4.create());
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

    const plane_mat = new IWO.PBRMaterial({ albedo_color: [1, 1, 1], shadow_texture: depth_texture });
    plane = new IWO.MeshInstance(plane_mesh, plane_mat);
    mat4.translate(plane.model_matrix, plane.model_matrix, [0, -0.01, 0]);

    //SPHERES
    let sphere_mat = new IWO.PBRMaterial({
        albedo_color: [1, 1, 1],
        metallic: 0.5,
        roughness: 1,
        shadow_texture: depth_texture,
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
    const mat = new IWO.BasicMaterial(vec3.fromValues(1, 1, 1));
    const sphere_mesh = new IWO.Mesh(gl, sphere_geom);
    const s = new IWO.MeshInstance(sphere_mesh, mat);
    spheres.push(s);
    const model = s.model_matrix;
    mat4.identity(model);
    mat4.translate(model, model, vec3.scale(vec3.create(), [0, 1, 0], 10));
    mat4.scale(model, model, [4, 4, 4]);
}

function initRenderDepth() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, depth_frame_buffer);

    let a = gl.getExtension("EXT_color_buffer_float");

    depth_texture = new IWO.Texture2D(gl, undefined, {
        width: DEPTH_TEXTURE_SIZE,
        height: DEPTH_TEXTURE_SIZE,
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        internal_format: gl.DEPTH_COMPONENT24,
        format: gl.DEPTH_COMPONENT,
        type: gl.UNSIGNED_INT,
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR,
        texture_compare_func: gl.LEQUAL,
        texture_compare_mode: gl.COMPARE_REF_TO_TEXTURE,
    });

    depth_texture2 = new IWO.Texture2D(gl, undefined, {
        width: DEPTH_TEXTURE_SIZE,
        height: DEPTH_TEXTURE_SIZE,
        wrap_S: gl.CLAMP_TO_EDGE,
        wrap_T: gl.CLAMP_TO_EDGE,
        internal_format: gl.RGBA,
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        mag_filter: gl.NEAREST,
        min_filter: gl.NEAREST,
        texture_compare_func: gl.LEQUAL,
    });

    //Set "renderedTexture" as our color attachment #0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture.texture_id, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depth_texture2.texture_id, 0);

    //Completed
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) throw "depth texture frame buffer error";

    //setup quad
    const attrs: IWO.Attributes = {
        [IWO.StandardAttribute.Position.name]: IWO.StandardAttribute.Position.createAttribute(),
    };

    const quad_vertex_buffer_data = [
        -1.0, -1.0, 0.0, 1.0, -1.0, 0.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0,
    ];

    const quad_buf_geom = new IWO.QuadGeometry();

    const quad_mesh = new IWO.Mesh(gl, quad_buf_geom);
    depth_mat = new IWO.EmptyMaterial(IWO.ShaderSource.Depth);
    const quad_mat = new IWO.EmptyMaterial(IWO.ShaderSource.Quad);
    quad = new IWO.MeshInstance(quad_mesh, quad_mat);
}

function update(): void {
    //orbit.update();
    fps.update();
    frustum.update();
    drawScene();

    let geom = getFrustumLineGeometry();
    frustum_line.mesh.vertexBufferSubDataFromGeometry(gl, geom);

    geom = getFrustumCuboidLineGeometry();
    cuboid_line.mesh.vertexBufferSubDataFromGeometry(gl, geom);

    renderer.resetSaveBindings();
    requestAnimationFrame(update);
}

function drawScene(): void {
    renderDepth();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    camera.getViewMatrix(view_matrix);

    const v = view_matrix;
    const p = proj_matrix;

    mat4.multiply(shadow_map_matrix, depth_proj_matrix, light_view_matrix);
    const s = shadow_map_matrix;

    renderer.setPerFrameUniforms(v, p, s);

    //frustum_line.render(renderer, v, p);
    //cuboid_line.render(renderer, v, p);

    plane.render(renderer, v, p);
    for (const sphere of spheres) {
        sphere.render(renderer, v, p);
    }

    grid.render(renderer, v, p);

    renderDepthTextureToQuad(0, 0, 256, 256);
}

function renderDepth() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, depth_frame_buffer);
    gl.viewport(0, 0, DEPTH_TEXTURE_SIZE, DEPTH_TEXTURE_SIZE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.4, 4.0);

    updateLightViewMatrix();
    frustum.getOrtho(depth_proj_matrix);
    camera.getViewMatrix(view_matrix);

    const v = light_view_matrix;
    const p = depth_proj_matrix;
    mat4.multiply(shadow_map_matrix, depth_proj_matrix, light_view_matrix);

    renderer.setPerFrameUniforms(v, p);
    plane.renderWithMaterial(renderer, v, p, depth_mat);
    for (const sphere of spheres) {
        sphere.renderWithMaterial(renderer, v, p, depth_mat);
    }

    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
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

function renderDepthTextureToQuad(offset_x: number, offset_y: number, width: number, height: number) {
    gl.viewport(offset_x, offset_y, width, height);

    renderer.getorCreateShader(IWO.ShaderSource.Quad).use();
    renderer.getorCreateShader(IWO.ShaderSource.Quad).setUniform("texture1", 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depth_texture2.texture_id);

    quad.render(renderer, view_matrix, proj_matrix);
}
