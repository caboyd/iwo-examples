import { AttributeType } from '../geometry/Geometry.js';
import { BufferedGeometry as BufferedGeometry$1, DefaultAttribute } from '../geometry/BufferedGeometry.js';
import { FileLoader as FileLoader$1 } from './FileLoader.js';
import { PBRMaterial as PBRMaterial$1 } from '../materials/PBRMaterial.js';
import { ImageLoader as ImageLoader$1 } from './ImageLoader.js';

class Color {
    constructor(r, g, b, a) {
        if (Array.isArray(r)) {
            const [red, green, blue, alpha] = r;
            this.data = [red, green ?? red, blue ?? red, alpha ?? 1];
        }
        else {
            const red = r ?? 1.0;
            this.data = [red, g ?? red, b ?? red, a ?? 1];
        }
    }
    get rgb() {
        return this.data.slice(0, 3);
    }
    get rbga() {
        return [...this.data];
    }
}
class glTFLoader {
    static async promise(file_name, base_url = FileLoader$1.Default_Base_URL) {
        return new Promise(resolve => {
            FileLoader$1.promise(file_name, base_url).then((response) => {
                response.json().then(async (o) => {
                    //Validate toplevel
                    if (o.meshes === undefined)
                        glTFLoaderError(o.meshes);
                    if (o.buffers === undefined)
                        glTFLoaderError(o.buffers);
                    if (o.bufferViews === undefined)
                        glTFLoaderError(o.bufferViews);
                    if (o.accessors === undefined)
                        glTFLoaderError(o.accessors);
                    const buffers = (await FileLoader$1.promiseAll(o.buffers.map(v => v.uri), base_url));
                    const array_buffers = await Promise.all(buffers.map(v => v.arrayBuffer()));
                    // const typed_buffer_view = new Map<[number, ComponentType], TypedArray>();
                    // const geom_buffers: BufferView[] = [];
                    // for (const buffer_view of o.bufferViews) {
                    //     if (buffer_view.target === undefined)
                    //         throw new Error("Unexpected glTF bufferview with no target");
                    //     geom_buffers.push({
                    //         buffer: new DataView(
                    //             array_buffers[buffer_view.buffer],
                    //             buffer_view.byteOffset ?? 0,
                    //             buffer_view.byteLength
                    //         ),
                    //         target: buffer_view.target,
                    //     });
                    // }
                    //convert DataViews to proper buffers
                    //    const typed_buffers = array_buffers.map(b => new Uint8Array(b));
                    // console.log(array_buffers);
                    // console.log(geom_buffers);
                    let images = [];
                    if (o.images)
                        images = await ImageLoader$1.promiseAll(o.images.map(v => v.uri), base_url);
                    const buffered_geometries = [];
                    for (const mesh of o.meshes) {
                        const x = new BufferedGeometry$1();
                        //x.buffers = geom_buffers;
                        if (mesh.primitives.length === 0)
                            throw new Error("glTF missing mesh primitives");
                        if (mesh.primitives.length > 1)
                            throw new Error("Don't know how to handle more than one primitive per mesh");
                        // for (const prim of mesh.primitives) {
                        //     //FIXME: this is not covering any case except one where we have indices and no submesh
                        //     const group = {
                        //         offset: 0,
                        //         //use indices count
                        //         count:
                        //             prim.indices !== undefined
                        //                 ? o.accessors![prim.indices].count
                        //                 : o.accessors![prim.attributes["POSITION"]].count,
                        //         material_index: prim.material,
                        //     } as Group;
                        //     groups.push(group);
                        // }
                        const prim = mesh.primitives[0];
                        if (prim.indices !== undefined) {
                            const accessor = o.accessors[prim.indices];
                            const buffer_view = o.bufferViews[accessor.bufferView];
                            const count = accessor.count;
                            const componentType = accessor.componentType;
                            const buffer_index = buffer_view.buffer;
                            const offset = buffer_view.byteOffset;
                            const bytes = count > 66536 ? 4 : 2;
                            const length = buffer_view.byteLength / bytes;
                            x.index_buffer = {
                                buffer: ArrayBufferToTypedArray(componentType, array_buffers[buffer_index], offset, length),
                                target: buffer_view.target,
                            };
                            //  x.index_buffer =
                            //        {
                            //            buffer: count > 66536
                            //            ? geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint32(0)
                            //            : await geom_buffers[o.accessors[prim.indices].bufferView!].buffer.getUint16(0);
                            // target:geom_buffers[o.accessors[prim.indices].bufferView!].target
                            //        } as GeometryBuffer
                        }
                        let my_buffer_index = 0;
                        x.attributes = DefaultAttribute.SingleBufferApproach();
                        let attrib_index;
                        let a = x.attributes[AttributeType.Vertex];
                        if ((attrib_index = prim.attributes["POSITION"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(o, AttributeType.Vertex, o.accessors[attrib_index], x, array_buffers, a, my_buffer_index++);
                        }
                        else {
                            a.enabled = false;
                        }
                        a = x.attributes[AttributeType.Tex_Coord];
                        if ((attrib_index = prim.attributes["TEXCOORD_0"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(o, AttributeType.Tex_Coord, o.accessors[attrib_index], x, array_buffers, a, my_buffer_index++);
                        }
                        else {
                            a.enabled = false;
                        }
                        a = x.attributes[AttributeType.Normal];
                        if ((attrib_index = prim.attributes["NORMAL"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(o, AttributeType.Normal, o.accessors[attrib_index], x, array_buffers, a, my_buffer_index++);
                        }
                        else {
                            a.enabled = false;
                        }
                        a = x.attributes[AttributeType.Tangent];
                        if ((attrib_index = prim.attributes["TANGENT"]) !== undefined) {
                            this.buildAttributeAndTypedBuffer(o, AttributeType.Tangent, o.accessors[attrib_index], x, array_buffers, a, my_buffer_index++);
                        }
                        else {
                            a.enabled = false;
                        }
                        buffered_geometries.push(x);
                    }
                    const materials = [];
                    if (o.materials !== undefined)
                        for (const mat of o.materials) {
                            const m = new PBRMaterial$1(new Color(mat.pbrMetallicRoughness?.baseColorFactor).rgb, mat.pbrMetallicRoughness?.metallicFactor ?? 1, mat.pbrMetallicRoughness?.roughnessFactor ?? 1);
                            m.albedo_image = images[mat.pbrMetallicRoughness.baseColorTexture.index];
                            m.normal_image = images[mat.normalTexture.index];
                            m.occlusion_image = images[mat.occlusionTexture.index];
                            m.metal_roughness_image = images[mat.pbrMetallicRoughness.metallicRoughnessTexture.index];
                            m.emissive_image = images[mat.emissiveTexture.index];
                            materials.push(m);
                        }
                    resolve({ buffered_geometries: buffered_geometries, materials: materials });
                    function glTFLoaderError(prop) {
                        throw new Error(`${file_name} missing ${prop in o}`);
                    }
                });
            });
        });
    }
    //TODO: CLEANUP
    static buildAttributeAndTypedBuffer(o, type, accessor, x, array_buffers, a, my_buffer_index) {
        const buffer_view = o.bufferViews[accessor.bufferView];
        const componentType = accessor.componentType;
        const buffer_index = buffer_view.buffer;
        const offset = buffer_view.byteOffset;
        const length = buffer_view.byteLength / 4;
        x.buffers.push({
            buffer: ArrayBufferToTypedArray(componentType, array_buffers[buffer_index], offset, length),
            target: buffer_view.target,
        });
        a.type = type;
        a.enabled = true;
        a.buffer_index = my_buffer_index;
        a.component_type = accessor.componentType;
    }
}
function ArrayBufferToTypedArray(component_type, view, offset = 0, length) {
    switch (component_type) {
        case 5120:
        case 5121:
            return new Uint8Array(view, offset, length);
        case 5122:
            return new Int16Array(view, offset, length);
        case 5123:
            return new Uint16Array(view, offset, length);
        case 5124:
            return new Int32Array(view, offset, length);
        case 5125:
            return new Uint32Array(view, offset, length);
        case 5126:
            return new Float32Array(view, offset, length);
        default:
            throw new Error(`Bad ComponentType ${component_type}`);
    }
}

export { glTFLoader };
//# sourceMappingURL=glTFLoader.js.map
