import { FileLoader } from './FileLoader.js';
import { MtlLoader } from './MtlLoader.js';

var VertexDataTraits;
(function (VertexDataTraits) {
    VertexDataTraits[VertexDataTraits["v"] = 1] = "v";
    VertexDataTraits[VertexDataTraits["vt"] = 2] = "vt";
    VertexDataTraits[VertexDataTraits["vn"] = 4] = "vn";
    VertexDataTraits[VertexDataTraits["vp"] = 8] = "vp";
})(VertexDataTraits || (VertexDataTraits = {}));
class ObjLoader extends FileLoader {
    static async promise(file_name, base_url = this.Default_Base_URL) {
        return new Promise((resolve) => {
            super.promise(file_name, base_url).then((response) => {
                response.text().then((s) => {
                    const data = ObjLoader.fromObjString(s, base_url);
                    resolve(data);
                });
            });
        });
    }
    static async fromObjString(s, base_url = this.Default_Base_URL) {
        const lines = s.split(/\r?\n/);
        console.log(lines);
        const raw_obj_data_array = { objects: [createEmptyObject("Default")] };
        let current_obj = raw_obj_data_array.objects[0];
        let current_group = current_obj.groups[0];
        let current_smoothing_group = undefined;
        for (let line of lines)
            parse_line(line.trim());
        console.log(raw_obj_data_array);
        return {};
        function parse_line(line) {
            if (line.length === 0 || line[0] === "#")
                return;
            const arr = line.split(" ");
            const nums = arr.map(Number);
            const first = arr[0];
            switch (first) {
                case "#": //comment
                    break;
                case "o":
                    if (current_obj.name === "Default")
                        current_obj.name = arr[1];
                    else {
                        current_obj = createEmptyObject(arr[1]);
                        raw_obj_data_array.objects.push(current_obj);
                    }
                    break;
                case "g":
                    if (current_group.name === "Default")
                        current_group.name = arr[1];
                    else {
                        //new group
                        current_group = createEmptyGroup(arr[1]);
                        current_obj.groups.push(current_group);
                    }
                    break;
                case "usemtl":
                    current_group.material_name = arr[1];
                    break;
                case "mtllib":
                    MtlLoader.promise(arr[1], base_url);
                    break;
                case "v":
                    current_obj.trait_flags |= VertexDataTraits.v;
                    current_obj.data[VertexDataTraits.v].push([nums[1], nums[2], nums[3]]);
                    break;
                case "vt":
                    current_obj.trait_flags |= VertexDataTraits.vt;
                    current_obj.data[VertexDataTraits.vt].push([nums[1], nums[2]]);
                    break;
                case "vn":
                    current_obj.trait_flags |= VertexDataTraits.vn;
                    current_obj.data[VertexDataTraits.vn].push([nums[1], nums[2], nums[3]]);
                    break;
                case "vp":
                    throw "Not able to parse obj files with parameter space vertices (vp)";
                case "cstype":
                    throw "Not able to parse obj files with rational or non-rational forms of curve or surface type (cstype)";
                case "s":
                    //sides
                    current_smoothing_group = {
                        index: Number(arr[1]),
                        faces_array_indices: [],
                    };
                    current_obj.smoothing_groups.push(current_smoothing_group);
                    break;
                case "f":
                    const new_face = {
                        v_indices: [],
                        vt_indices: [],
                        vn_indices: [],
                    };
                    //remove "f" from array
                    const vertices = arr.slice(1);
                    for (const vertex of vertices) {
                        const values = vertex.split("/");
                        const v = Number(values[0]);
                        const vt = Number(values[1]);
                        const vn = Number(values[2]);
                        if (v)
                            new_face.v_indices.push(v);
                        if (vt)
                            new_face.vt_indices.push(vt);
                        if (vn)
                            new_face.vn_indices.push(vn);
                    }
                    if (current_smoothing_group) {
                        current_smoothing_group.faces_array_indices.push(current_group.faces.length);
                    }
                    current_group.faces.push(new_face);
                    break;
            }
        }
    }
}
function createEmptyObject(name) {
    return {
        name: name,
        trait_flags: 0,
        data: {
            [VertexDataTraits.v]: [],
            [VertexDataTraits.vt]: [],
            [VertexDataTraits.vn]: [],
            // [VertexDataTraits.vp]: [],
        },
        groups: [
            {
                name: "Default",
                faces: [],
            },
        ],
        smoothing_groups: [],
    };
}
function createEmptyGroup(name) {
    return {
        name: name,
        faces: [],
    };
}

export { ObjLoader };
//# sourceMappingURL=ObjLoader.js.map
