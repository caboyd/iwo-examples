import { vec3, mat4, vec4 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';

class OrbitControl {
    constructor(camera, options) {
        this.target_pitch = 0;
        this.target_heading = 0;
        this.mouse_sensitivity = 0.005;
        this.step_size = 0.5;
        this.minimum_distance = 5.0;
        this.orbit_point = [0, 0, 0];
        this.camera = camera;
        this.mouse_sensitivity = options?.mouse_sensitivity ?? this.mouse_sensitivity;
        this.orbit_point = options?.orbit_point ?? this.orbit_point;
        this.minimum_distance = options?.minimum_distance ?? this.minimum_distance;
        this.camera.lookAt(this.orbit_point);
    }
    update() { }
    // public processKeyboard(direction: Camera_Movement): void {
    //
    //     //move camera
    //     //move orbit point
    //
    //     forward = this.getForward(forward);
    //     right = this.getRight(right);
    //
    //     if (direction == Camera_Movement.FORWARD) {
    //         vec3.scaleAndAdd(this.position, this.position, forward, velocity);
    //     } else if (direction == Camera_Movement.BACKWARD) {
    //         vec3.scaleAndAdd(this.position, this.position, forward, -velocity);
    //     } else if (direction == Camera_Movement.LEFT) {
    //         vec3.scaleAndAdd(this.position, this.position, right, -velocity);
    //     } else if (direction == Camera_Movement.RIGHT) {
    //         vec3.scaleAndAdd(this.position, this.position, right, velocity);
    //     } else if (direction == Camera_Movement.UP) {
    //         vec3.scaleAndAdd(this.position, this.position, this.worldUp, velocity);
    //     }
    // }
    scroll(scroll_direction_forward) {
        let target_to_camera = vec3.sub(vec3.create(), this.camera.position, this.orbit_point);
        let step_modified_length = vec3.len(target_to_camera);
        step_modified_length += this.step_size * (scroll_direction_forward ? 1 : -1);
        step_modified_length = Math.max(this.minimum_distance, step_modified_length);
        //Rescale vector
        target_to_camera = vec3.normalize(target_to_camera, target_to_camera);
        target_to_camera = vec3.scale(target_to_camera, target_to_camera, step_modified_length);
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

export { OrbitControl };
//# sourceMappingURL=OrbitControl.js.map
