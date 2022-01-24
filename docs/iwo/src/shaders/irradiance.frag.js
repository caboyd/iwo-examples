var cubemapToIrradianceFrag = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n\nout vec4 frag_color;\n\nin vec3 local_pos;\n\nuniform samplerCube environment_map;\n\nconst float PI = 3.14159265359;\n\nvoid main()\n{\n    // the sample direction equals the hemisphere's orientation \n    vec3 normal = normalize(local_pos);\n\n    vec3 irradiance = vec3(0.0);\n\n    vec3 up    = vec3(0.0, 1.0, 0.0);\n    vec3 right = cross(up, normal);\n    up         = cross(normal, right);\n\n    float sample_delta = 0.025;\n    float num_samples = 0.0;\n    for(float phi = 0.0; phi < 2.0 * PI; phi += sample_delta)\n    {\n        for(float theta = 0.0; theta < 0.5 * PI; theta += sample_delta)\n        {\n            // spherical to cartesian (in tangent space)\n            vec3 tangent_sample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));\n            // tangent space to world\n            vec3 sample_vec = tangent_sample.x * right + tangent_sample.y * up + tangent_sample.z * normal;\n\n            irradiance += texture(environment_map, sample_vec).rgb * cos(theta) * sin(theta);\n            num_samples++;\n        }\n    }\n    irradiance = PI * irradiance * (1.0 / float(num_samples));\n\n    frag_color = vec4(irradiance, 1.0);\n}\n"; // eslint-disable-line

export { cubemapToIrradianceFrag as default };
//# sourceMappingURL=irradiance.frag.js.map
