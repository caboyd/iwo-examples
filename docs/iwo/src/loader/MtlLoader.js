import { FileLoader } from './FileLoader.js';
import { ImageLoader } from './ImageLoader.js';
import { vec3 } from 'https://unpkg.com/gl-matrix@3.4.3/esm/index.js';
import { PBRMaterial } from '../materials/PBRMaterial.js';

class MtlLoader extends FileLoader {
    static async promise(file_name, base_url = this.Default_Base_URL) {
        const response = await super.promise(file_name, base_url);
        const text = await response.text();
        const data = MtlLoader.fromMtlString(text, base_url);
        return data;
    }
    static fromMtlString(s, base_url = this.Default_Base_URL) {
        const lines = s.split(/\r?\n/);
        const mtl_data = MtlLoader.toMtlData(lines);
        //find unique images and load them
        const unique_images = [];
        for (let [key, value] of mtl_data) {
            if (value.map_Ka) {
                if (!unique_images.includes(value.map_Ka))
                    unique_images.push(value.map_Ka);
                value.map_Ka_index = unique_images.indexOf(value.map_Ka);
            }
            if (value.map_Kd) {
                if (!unique_images.includes(value.map_Kd))
                    unique_images.push(value.map_Kd);
                value.map_Kd_index = unique_images.indexOf(value.map_Kd);
            }
            if (value.map_Ks) {
                if (!unique_images.includes(value.map_Ks))
                    unique_images.push(value.map_Ks);
                value.map_Ks_index = unique_images.indexOf(value.map_Ks);
            }
            if (value.map_Ke) {
                if (!unique_images.includes(value.map_Ke))
                    unique_images.push(value.map_Ke);
                value.map_Ke_index = unique_images.indexOf(value.map_Ke);
            }
        }
        const images = ImageLoader.loadAllBackground(unique_images, base_url);
        const m = new Map();
        //create materials
        for (let [key, value] of mtl_data) {
            //we dont have ambient so color is diffuse + ambient
            const color = value.Kd || vec3.create();
            if (value.Ka)
                vec3.add(color, color, value.Ka);
            const emmisive = value.Ke;
            //use specular average color as metallic 
            const metallic = value.Ks ? ((value.Ks[0] + value.Ks[1] + value.Ks[2]) / 3) : 0;
            //use specular exponent as rougness
            const roughness = value.Ns ? (1 - Math.max(value.Ns / 1000, 0.975)) : 0;
            const mat = new PBRMaterial(color, metallic, roughness, undefined, emmisive);
            if (value.map_Kd_index !== undefined)
                mat.albedo_image = images[value.map_Kd_index];
            if (value.map_Ke_index !== undefined)
                mat.emissive_image = images[value.map_Ke_index];
            m.set(key, mat);
        }
        return m;
    }
    static toMtlData(lines) {
        const m = new Map();
        let current_object = "";
        let current_mtldata = {};
        for (let line of lines) {
            const arr = line.trim().split(" ");
            const first = arr[0];
            switch (first) {
                case "newmtl":
                    current_object = arr[1];
                    current_mtldata = {};
                    m.set(current_object, current_mtldata);
                    break;
                case "Ns":
                case "Ni":
                case "d":
                case "Tr":
                case "illum":
                    current_mtldata[first] = Number(arr[1]);
                    break;
                case "Tf":
                case "Ka":
                case "Kd":
                case "Ks":
                case "Ke":
                    current_mtldata[first] = [Number(arr[1]), Number(arr[2]), Number(arr[3])];
                    break;
                case "map_Ka":
                case "map_Kd":
                case "map_Ks":
                case "map_Ke":
                    current_mtldata[first] = arr[1];
                    break;
            }
        }
        return m;
    }
}

export { MtlLoader };
//# sourceMappingURL=MtlLoader.js.map
