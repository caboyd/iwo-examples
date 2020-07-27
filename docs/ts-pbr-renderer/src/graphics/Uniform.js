/*
 * Rewritten and modified by Chris Boyd
 * Copyright (c) 2018 Chris Boyd
 *
 * Original code from:
 * https://github.com/greggman/twgl.js/blob/933df9634c64766f72d92f4f73edfdda138296e1/src/programs.js
 *
 * Copyright 2015, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
export class Uniform {
    constructor(gl, program, info) {
        const location = gl.getUniformLocation(program, info.name);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const uniform_info = uniform_info_map[info.type];
        const is_array = info.size > 1 && info.name.substr(-3) === "[0]";
        if (is_array && uniform_info.set_array !== undefined) {
            this.set = uniform_info.set_array(gl, location);
        }
        else {
            this.set = uniform_info.set(gl, location);
        }
    }
}
export class UniformBlock {
    constructor(buffer, type, offset, count, size) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const uniform_info = uniform_info_map[type];
        const total_count = uniform_info.default_rows * count;
        if (!uniform_info.Type)
            throw new Error("Samplers not allowed in Uniform Buffers");
        //Buffer view as a Typed Array (float/int)
        this._buffer_view = new uniform_info.Type(buffer, offset, size);
        if (total_count > 1 && uniform_info.items_per_row < 4) {
            this.set = setBlockPadded(this._buffer_view, uniform_info.items_per_row, total_count);
        }
        else {
            this.set = setBlock(this._buffer_view);
        }
    }
}
//prettier-ignore
const uniform_info_map = {
    [5126 /* FLOAT */]: { Type: Float32Array, size: 4, items_per_row: 1, default_rows: 1, set: setFloat, set_array: setFloatArray, },
    [35664 /* FLOAT_VEC2 */]: { Type: Float32Array, size: 8, items_per_row: 2, default_rows: 1, set: setVec2Float, },
    [35665 /* FLOAT_VEC3 */]: { Type: Float32Array, size: 12, items_per_row: 3, default_rows: 1, set: setVec3Float, },
    [35666 /* FLOAT_VEC4 */]: { Type: Float32Array, size: 16, items_per_row: 4, default_rows: 1, set: setVec4Float, },
    [5124 /* INT */]: { Type: Int32Array, size: 4, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [35667 /* INT_VEC2 */]: { Type: Int32Array, size: 8, items_per_row: 2, default_rows: 1, set: setVec2Int, },
    [35668 /* INT_VEC3 */]: { Type: Int32Array, size: 12, items_per_row: 3, default_rows: 1, set: setVec3Int, },
    [35669 /* INT_VEC4 */]: { Type: Int32Array, size: 16, items_per_row: 4, default_rows: 1, set: setVec4Int, },
    [5125 /* UNSIGNED_INT */]: { Type: Uint32Array, size: 4, items_per_row: 1, default_rows: 1, set: setUint, set_array: setUintArray, },
    [36294 /* UNSIGNED_INT_VEC2 */]: { Type: Uint32Array, size: 8, items_per_row: 2, default_rows: 1, set: setVec2Uint, },
    [36295 /* UNSIGNED_INT_VEC3 */]: { Type: Uint32Array, size: 12, items_per_row: 3, default_rows: 1, set: setVec3Uint, },
    [36296 /* UNSIGNED_INT_VEC4 */]: { Type: Uint32Array, size: 16, items_per_row: 4, default_rows: 1, set: setVec4Uint, },
    [35670 /* BOOL */]: { Type: Uint32Array, size: 4, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [35671 /* BOOL_VEC2 */]: { Type: Uint32Array, size: 8, items_per_row: 2, default_rows: 1, set: setVec2Int, },
    [35672 /* BOOL_VEC3 */]: { Type: Uint32Array, size: 12, items_per_row: 3, default_rows: 1, set: setVec3Int, },
    [35673 /* BOOL_VEC4 */]: { Type: Uint32Array, size: 16, items_per_row: 4, default_rows: 1, set: setVec4Int, },
    [35674 /* FLOAT_MAT2 */]: { Type: Float32Array, size: 16, items_per_row: 2, default_rows: 2, set: setMat2, },
    [35675 /* FLOAT_MAT3 */]: { Type: Float32Array, size: 36, items_per_row: 3, default_rows: 3, set: setMat3, },
    [35676 /* FLOAT_MAT4 */]: { Type: Float32Array, size: 64, items_per_row: 4, default_rows: 4, set: setMat4, },
    [35685 /* FLOAT_MAT2x3 */]: { Type: Float32Array, size: 24, items_per_row: 3, default_rows: 2, set: setMat2x3, },
    [35686 /* FLOAT_MAT2x4 */]: { Type: Float32Array, size: 32, items_per_row: 4, default_rows: 2, set: setMat2x4, },
    [35687 /* FLOAT_MAT3x2 */]: { Type: Float32Array, size: 24, items_per_row: 2, default_rows: 3, set: setMat3x2, },
    [35688 /* FLOAT_MAT3x4 */]: { Type: Float32Array, size: 48, items_per_row: 4, default_rows: 3, set: setMat3x4, },
    [35689 /* FLOAT_MAT4x2 */]: { Type: Float32Array, size: 32, items_per_row: 2, default_rows: 4, set: setMat4x2, },
    [35690 /* FLOAT_MAT4x3 */]: { Type: Float32Array, size: 48, items_per_row: 3, default_rows: 4, set: setMat4x3, },
    [35678 /* SAMPLER_2D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [35679 /* SAMPLER_3D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [35680 /* SAMPLER_CUBE */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [35682 /* SAMPLER_2D_SHADOW */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36289 /* SAMPLER_2D_ARRAY */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36292 /* SAMPLER_2D_ARRAY_SHADOW */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36293 /* SAMPLER_CUBE_SHADOW */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36298 /* INT_SAMPLER_2D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36299 /* INT_SAMPLER_3D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36300 /* INT_SAMPLER_CUBE */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36303 /* INT_SAMPLER_2D_ARRAY */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36306 /* UNSIGNED_INT_SAMPLER_2D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36307 /* UNSIGNED_INT_SAMPLER_3D */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36308 /* UNSIGNED_INT_SAMPLER_CUBE */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
    [36311 /* UNSIGNED_INT_SAMPLER_2D_ARRAY */]: { Type: undefined, size: 0, items_per_row: 1, default_rows: 1, set: setInt, set_array: setIntArray, },
};
//std140 layout pads everything to be 16 bytes wide
//so a float array will have 12 bytes padded per
function setBlockPadded(buffer, items_per_row, array_count) {
    return function (value) {
        for (let i = 0; i < array_count; i++) {
            //std140 has 4 items per row
            for (let j = 0; j < items_per_row; j++) {
                buffer[i * 4 + j] = value[i * items_per_row + j];
            }
        }
    };
}
function setBlock(buffer) {
    return function (value) {
        buffer.set(value);
    };
}
function setFloat(gl, location) {
    return function (value) {
        gl.uniform1f(location, value);
    };
}
function setFloatArray(gl, location) {
    return function (value) {
        gl.uniform1fv(location, value);
    };
}
function setVec2Float(gl, location) {
    return function (value) {
        gl.uniform2fv(location, value);
    };
}
function setVec3Float(gl, location) {
    return function (value) {
        gl.uniform3fv(location, value);
    };
}
function setVec4Float(gl, location) {
    return function (value) {
        gl.uniform4fv(location, value);
    };
}
function setInt(gl, location) {
    return function (value) {
        gl.uniform1i(location, value);
    };
}
function setIntArray(gl, location) {
    return function (value) {
        gl.uniform1iv(location, value);
    };
}
function setVec2Int(gl, location) {
    return function (value) {
        gl.uniform2iv(location, value);
    };
}
function setVec3Int(gl, location) {
    return function (value) {
        gl.uniform3iv(location, value);
    };
}
function setVec4Int(gl, location) {
    return function (value) {
        gl.uniform4iv(location, value);
    };
}
function setUint(gl, location) {
    return function (value) {
        gl.uniform1ui(location, value);
    };
}
function setUintArray(gl, location) {
    return function (value) {
        gl.uniform1uiv(location, value);
    };
}
function setVec2Uint(gl, location) {
    return function (value) {
        gl.uniform2uiv(location, value);
    };
}
function setVec3Uint(gl, location) {
    return function (value) {
        gl.uniform3uiv(location, value);
    };
}
function setVec4Uint(gl, location) {
    return function (value) {
        gl.uniform4uiv(location, value);
    };
}
function setMat2(gl, location) {
    return function (value) {
        gl.uniformMatrix2fv(location, false, value);
    };
}
function setMat3(gl, location) {
    return function (value) {
        gl.uniformMatrix3fv(location, false, value);
    };
}
function setMat4(gl, location) {
    return function (value) {
        gl.uniformMatrix4fv(location, false, value);
    };
}
function setMat2x3(gl, location) {
    return function (value) {
        gl.uniformMatrix2x3fv(location, false, value);
    };
}
function setMat3x2(gl, location) {
    return function (value) {
        gl.uniformMatrix3x2fv(location, false, value);
    };
}
function setMat2x4(gl, location) {
    return function (value) {
        gl.uniformMatrix2x4fv(location, false, value);
    };
}
function setMat4x2(gl, location) {
    return function (value) {
        gl.uniformMatrix4x2fv(location, false, value);
    };
}
function setMat3x4(gl, location) {
    return function (value) {
        gl.uniformMatrix3x4fv(location, false, value);
    };
}
function setMat4x3(gl, location) {
    return function (value) {
        gl.uniformMatrix4x3fv(location, false, value);
    };
}
//# sourceMappingURL=Uniform.js.map