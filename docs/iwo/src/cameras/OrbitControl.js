import { vec3, mat4, vec4 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';

const DefaultOrbitControlBinds = {
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
    UP: "ArrowUp",
    DOWN: "ArrowDown",
};
class OrbitControl {
    constructor(camera, options) {
        this.target_pitch = 0;
        this.target_heading = 0;
        this.mouse_sensitivity = 0.005;
        this.step_size = 0.5;
        this.minimum_distance = 5.0;
        this.maximum_distance = 10.0;
        this.orbit_control_binds = DefaultOrbitControlBinds;
        this.orbit_point = [0, 0, 0];
        this.camera = camera;
        this.mouse_sensitivity = options?.mouse_sensitivity ?? this.mouse_sensitivity;
        this.orbit_point = options?.orbit_point ?? this.orbit_point;
        this.minimum_distance = options?.minimum_distance ?? this.minimum_distance;
        this.maximum_distance = options?.maximum_distance ?? this.maximum_distance;
        this.orbit_control_binds = options?.orbit_control_binds ?? this.orbit_control_binds;
        this.camera.lookAt(this.orbit_point);
        window.addEventListener("keydown", (e) => {
            if (Object.values(this.orbit_control_binds).includes(e.code))
                this.processKeyboard(e.code);
        });
        window.addEventListener("wheel", (e) => {
            e.stopPropagation();
            this.scroll(e.deltaY > 0);
        });
    }
    update() { }
    processKeyboard(key) {
        const target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        if (key === this.orbit_control_binds.LEFT) {
            //move camera based on step_size
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getRight(), -this.step_size);
        }
        else if (key === this.orbit_control_binds.RIGHT) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.getRight(), this.step_size);
        }
        else if (key === this.orbit_control_binds.UP) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.up, this.step_size);
        }
        else if (key === this.orbit_control_binds.DOWN) {
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.up, -this.step_size);
        }
        //place orbit point to same relative position
        vec3.sub(this.orbit_point, this.camera.position, target_to_camera);
        this.camera.lookAt(this.orbit_point);
    }
    scroll(scroll_direction_forward) {
        let target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        const dist = vec3.len(target_to_camera);
        let step_scaled_dist = dist + this.step_size * (scroll_direction_forward ? 1 : -1);
        step_scaled_dist = Math.max(this.minimum_distance, step_scaled_dist);
        step_scaled_dist = Math.min(this.maximum_distance, step_scaled_dist);
        //Rescale vector
        target_to_camera = vec3.normalize(target_to_camera, target_to_camera);
        target_to_camera = vec3.scale(target_to_camera, target_to_camera, step_scaled_dist);
        //Set camera back to scaled vector position
        vec3.add(this.camera.position, this.orbit_point, target_to_camera);
    }
    processMouseMovement(xOffset, yOffset, constrainPitch = true) {
        if (xOffset === 0 && yOffset === 0)
            return;
        //rotate about orbit_point
        xOffset *= this.mouse_sensitivity;
        yOffset *= this.mouse_sensitivity;
        const angle_y = vec3.angle(this.camera.getForward(), this.camera.up);
        if (constrainPitch) {
            if (angle_y > Math.PI * 0.99 && yOffset < 0)
                yOffset = 0;
            if (angle_y < Math.PI * 0.01 && yOffset > 0)
                yOffset = 0;
        }
        this.rotateAroundTarget(this.orbit_point, xOffset, yOffset);
    }
    rotateAroundTarget(target, x, y) {
        //pitch up down
        let new_pos = vec3.sub(vec3.create(), this.camera.position, target);
        const m = mat4.create();
        //pitch up down
        mat4.rotate(m, m, y, this.camera.getRight());
        //yaw left right
        mat4.rotate(m, m, x, this.camera.up);
        let p = vec4.fromValues(new_pos[0], new_pos[1], new_pos[2], 1);
        p = vec4.transformMat4(p, p, m);
        vec3.set(new_pos, p[0], p[1], p[2]);
        new_pos = vec3.add(new_pos, new_pos, target);
        this.camera.position = new_pos;
        this.camera.lookAt(target);
    }
}

export { DefaultOrbitControlBinds, OrbitControl };
//# sourceMappingURL=OrbitControl.js.map
