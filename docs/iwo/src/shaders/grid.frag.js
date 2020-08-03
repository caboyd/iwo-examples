var gridFrag = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n\nout vec4 frag_color;\n\nin vec3 view_pos;\nin vec3 world_pos;\n\nuniform float distance;\nuniform float frequency;\n\nvoid main() {\n\t\n    vec2 coord = world_pos.xz * frequency;\n        \n    // Compute anti-aliased world-space grid lines\n    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);\n    float line = min(grid.x, grid.y);\n    \n    // Just visualize the grid lines directly\n    vec3 color = vec3(0.5 - min(line,1.0));\n    float alpha = 1.0 - line;\n\n    //red lines every 10 units\n    if(mod(abs(world_pos.z),10.0f) <= 0.1 && grid.y <= 0.7) {\n        color = vec3(0.9,0.1,0.1);\n        alpha = 0.7;\n    }\n\n    //Main red line where z = 0\n    if(abs(world_pos.z) < 0.07 && mod(grid.y, 0.1f) <= 0.7) {\n        color = vec3(0.9,0.1,0.1);\n        alpha = 0.9;\n    }\n\n    //blue lines every 10 units\n    if(mod(abs(world_pos.x),10.0f) <= 0.1 && grid.x <= 0.7) {\n        color = vec3(0.1,0.3,1.0);\n        alpha =0.7;\n    }\n\n    //Main blue line where x = 0\n     if(abs(world_pos.x) <= 0.07f && mod(grid.x, 0.1f) <= 0.7) {\n        color = vec3(0.1,0.3,1.0);\n        alpha = 0.9;\n     }\n\n     \n    float transition = 10.0;\n    float dist = length(view_pos);\n    dist = dist - (distance - transition);\n    dist = dist / transition;\n    alpha = clamp(alpha - dist, 0.0, alpha);\n    \n    frag_color = vec4(color, alpha);\n    \t\n}\n"; // eslint-disable-line

export default gridFrag;
//# sourceMappingURL=grid.frag.js.map
