var standardVert = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n\nlayout (location = 0) in vec3 a_vertex;\nlayout (location = 1) in vec2 a_tex_coord;\nlayout (location = 2) in vec3 a_normal;\nlayout (location = 3) in vec3 a_tangent;\nlayout (location = 4) in vec3 a_bitangent;\n\nlayout (std140) uniform ubo_per_frame{\n                          // base alignment   // aligned offset\n    mat4 view;            // 64               // 0\n    mat4 view_inverse;    // 64               // 64\n    mat4 projection;      // 64               // 128\n    mat4 view_projection; // 64               // 192\n\n};\n\nlayout (std140) uniform ubo_per_model{\n                          // base alignment   // aligned offset\n    mat4 model_view;      // 64               // 0\n    mat3 normal_view;     // 48               // 64\n    mat4 mvp;             // 64               // 112\n};\n\nout vec3 local_pos;\nout vec3 view_pos;\nout vec3 world_pos;\nout vec2 tex_coord;\nout vec3 view_normal;\nout vec3 world_normal;\nout vec3 camera_pos;\n//out mat3 TBN;\n\nvec3 inverseTransformDirection(in vec3 normal, in mat4 matrix) {\n    return normalize( (vec4(normal,0.0) * matrix).xyz );\n}\n\nvec3 calculate_tangent(vec3 n) {\n    vec3 v = vec3(1.0, 0.0, 0.0);\n    float d = dot(v, n);\n    if (abs(d) < 1.0e-3) {\n        v = vec3(0.0, 1.0, 0.0);\n        d = dot(v, n);\n    }\n    return normalize(v - d * n);\n}\n\nvoid main() {\n    gl_Position = mvp * vec4(a_vertex,1.0f);\n\n//\n//    vec3 n = normalize(gl_NormalMatrix * gl_Normal);\n//    vec3 t = calculate_tangent(n);\n//    vec3 b = cross(n, t);\n//    TBN = mat3(t,b,n);\n\n    camera_pos = inverse(view)[3].xyz;\n    local_pos = a_vertex;\n    view_pos = (model_view * vec4(a_vertex,1.0f)).xyz ;\n    view_normal =  normal_view * a_normal ;\n    world_pos = (view_inverse * vec4(view_pos, 1.0)).xyz;\n    world_normal = normalize(inverseTransformDirection( view_normal, view ));\n        \n    tex_coord =  a_tex_coord;\n}\n"; // eslint-disable-line

export { standardVert as default };
//# sourceMappingURL=standard.vert.js.map