var normalOnlyFrag = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n\nout vec4 frag_color;\n\nin vec3 view_normal;\n\nvoid main() {\n    frag_color = vec4(view_normal, 1.0);\n}\n\n"; // eslint-disable-line

export default normalOnlyFrag;
//# sourceMappingURL=normals.frag.js.map
