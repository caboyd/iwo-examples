import { vec3, quat, mat4 } from 'https://unpkg.com/gl-matrix@3.3.0/esm/index.js';

const SPEED = 200.0;
const SENSITIVITY = 0.005;
var Camera_Movement;
(function (Camera_Movement) {
    Camera_Movement[Camera_Movement["FORWARD"] = 0] = "FORWARD";
    Camera_Movement[Camera_Movement["BACKWARD"] = 1] = "BACKWARD";
    Camera_Movement[Camera_Movement["LEFT"] = 2] = "LEFT";
    Camera_Movement[Camera_Movement["RIGHT"] = 3] = "RIGHT";
    Camera_Movement[Camera_Movement["UP"] = 4] = "UP";
})(Camera_Movement || (Camera_Movement = {}));
let forward = vec3.create();
let right = vec3.create();
const temp_quat = quat.create();
const temp = vec3.create();
const FORWARD = vec3.fromValues(0, 0, -1);
class Camera {
    constructor(pos, forward = FORWARD, up = vec3.fromValues(0, 1, 0)) {
        this.position = vec3.clone(pos);
        this.front = vec3.clone(forward);
        vec3.normalize(this.front, this.front);
        this.worldUp = vec3.fromValues(0, 1, 0);
        this.worldRight = vec3.fromValues(1, 0, 0);
        this.up = vec3.clone(up);
        vec3.normalize(this.up, this.up);
        // console.log(this.front);
        // console.log(this.worldRight);
        // console.log(this.up);
        this.movementSpeed = SPEED;
        this.mouseSensitivity = SENSITIVITY;
        this.pitch = -Math.asin(this.front[1]);
        this.heading = -(Math.atan2(this.front[0], this.front[2]) - Math.PI);
        this.orientation = quat.create();
        this.calculateOrientation();
    }
    getRight(out) {
        quat.conjugate(temp_quat, this.orientation);
        vec3.set(out, 1, 0, 0);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }
    getForward(out) {
        quat.conjugate(temp_quat, this.orientation);
        vec3.set(out, 0, 0, -1);
        vec3.transformQuat(out, out, temp_quat);
        return out;
    }
    lookAt(target) {
        vec3.sub(this.front, target, this.position);
        vec3.normalize(this.front, this.front);
        this.pitch = -Math.asin(this.front[1]);
        this.heading = -(Math.atan2(this.front[0], this.front[2]) - Math.PI);
        this.calculateOrientation();
    }
    getViewMatrix(out) {
        mat4.fromQuat(out, this.orientation);
        mat4.translate(out, out, vec3.negate(temp, this.position));
        return out;
    }
    getInverseViewMatrix(out) {
        out = this.getViewMatrix(out);
        mat4.invert(out, out);
        return out;
    }
    processKeyboard(direction, deltaTime) {
        const velocity = this.movementSpeed * deltaTime;
        forward = this.getForward(forward);
        right = this.getRight(right);
        if (direction == Camera_Movement.FORWARD) {
            vec3.scaleAndAdd(this.position, this.position, forward, velocity);
        }
        else if (direction == Camera_Movement.BACKWARD) {
            vec3.scaleAndAdd(this.position, this.position, forward, -velocity);
        }
        else if (direction == Camera_Movement.LEFT) {
            vec3.scaleAndAdd(this.position, this.position, right, -velocity);
        }
        else if (direction == Camera_Movement.RIGHT) {
            vec3.scaleAndAdd(this.position, this.position, right, velocity);
        }
        else if (direction == Camera_Movement.UP) {
            vec3.scaleAndAdd(this.position, this.position, this.worldUp, velocity);
        }
    }
    processMouseMovement(xOffset, yOffset, constrainPitch = true) {
        if (xOffset === 0 && yOffset === 0)
            return;
        xOffset *= this.mouseSensitivity;
        yOffset *= this.mouseSensitivity;
        this.heading += xOffset;
        if (this.heading > 2 * Math.PI)
            this.heading -= 2 * Math.PI;
        if (this.heading < 0)
            this.heading += 2 * Math.PI;
        this.pitch += yOffset;
        if (this.pitch > Math.PI)
            this.pitch -= 2 * Math.PI;
        if (this.pitch < -Math.PI)
            this.pitch += 2 * Math.PI;
        if (constrainPitch) {
            if (this.pitch > Math.PI / 2)
                this.pitch = Math.PI / 2;
            if (this.pitch < -Math.PI / 2)
                this.pitch = -Math.PI / 2;
        }
        this.calculateOrientation();
    }
    calculateOrientation() {
        const pitch_quat = quat.setAxisAngle(quat.create(), this.worldRight, this.pitch);
        const heading_quat = quat.setAxisAngle(quat.create(), this.worldUp, this.heading);
        quat.identity(this.orientation);
        quat.mul(this.orientation, this.orientation, pitch_quat);
        quat.mul(this.orientation, this.orientation, heading_quat);
        //   console.log(this.orientation);
        //   console.log(this.getRight(vec3.create()));
    }
}

export { Camera, Camera_Movement };
