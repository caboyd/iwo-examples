import { FileLoader as FileLoader$1 } from './FileLoader.js';

/*
File Format:
http://paulbourke.net/dataformats/pic/

Sample Code:
http://radsite.lbl.gov/radiance/refer/Notes/picture_format.html
https://github.com/enkimute/hdrpng.js/blob/master/hdrpng.js
 */
const COLRFMT = "32-bit_rle_rgbe";
const FMT = "FORMAT";
const EXPOSURE = "EXPOSURE";
const XDECR = 1;
const YDECR = 2;
const YMAJOR = 4;
//NOTE: Why is this necessary?  Why not instance of HDRBuffer?
function instanceOfHDRBuffer(object) {
    return "data" in object && "width" in object && "height" in object;
}
class HDRImageLoader extends FileLoader$1 {
    static promise(file_name, base_url = this.Default_Base_URL) {
        return new Promise(resolve => {
            super.promise(file_name, base_url).then((response) => {
                response.arrayBuffer().then((data) => {
                    const image_data = HDRImageLoader.fromArrayBuffer(data);
                    resolve(image_data);
                });
            });
        });
    }
    static fromArrayBuffer(data) {
        const buffer = new Uint8Array(data);
        const header = getHeader(buffer);
        if (!header.has("#?RADIANCE") && !header.has("#?RGBE"))
            throw new Error("Invalid HDR Image");
        const good_format = header.get(FMT) === COLRFMT;
        if (!good_format)
            throw new Error("Invalid HDR Image FORMAT");
        const exposure = header.has(EXPOSURE) ? header.get(EXPOSURE) : 1;
        const max_y = parseInt(header.get("Y"));
        const max_x = parseInt(header.get("X"));
        const image = new Uint8Array(max_x * max_y * 4);
        let image_index = 0;
        let buffer_index = parseInt(header.get("HEADER_END"));
        for (let j = 0; j < max_y; j++) {
            const rgbe = buffer.slice(buffer_index, (buffer_index += 4));
            const scanline = [];
            if (rgbe[0] != 2 || rgbe[1] != 2 || rgbe[2] & 0x80)
                throw "HDR parse error ..";
            if ((rgbe[2] << 8) + rgbe[3] != max_x)
                throw "HDR line mismatch ..";
            for (let i = 0; i < 4; i++) {
                let ptr = i * max_x;
                const ptr_end = (i + 1) * max_x;
                let buf;
                let count;
                while (ptr < ptr_end) {
                    buf = buffer.slice(buffer_index, (buffer_index += 2));
                    if (buf[0] > 128) {
                        count = buf[0] - 128;
                        while (count-- > 0)
                            scanline[ptr++] = buf[1];
                    }
                    else {
                        count = buf[0] - 1;
                        scanline[ptr++] = buf[1];
                        while (count-- > 0)
                            scanline[ptr++] = buffer[buffer_index++];
                    }
                }
            }
            for (let i = 0; i < max_x; i++) {
                image[image_index++] = scanline[i];
                image[image_index++] = scanline[i + max_x];
                image[image_index++] = scanline[i + 2 * max_x];
                image[image_index++] = scanline[i + 3 * max_x];
            }
        }
        const float_buffer = rgbeToFloat(image);
        return { data: float_buffer, height: max_y, width: max_x, exposure: exposure };
    }
}
function rgbeToFloat(buffer) {
    const l = buffer.byteLength >> 2;
    const result = new Float32Array(l * 3);
    for (let i = 0; i < l; i++) {
        const s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
        result[i * 3] = buffer[i * 4] * s;
        result[i * 3 + 1] = buffer[i * 4 + 1] * s;
        result[i * 3 + 2] = buffer[i * 4 + 2] * s;
    }
    return result;
}
//
function getHeader(buffer) {
    const header = new Map();
    //Grabs all lines until first empty line
    let s = "";
    let index = 0;
    //Grabs text until the after the resolution line
    while (!s.match(/\n\n[^\n]+\n/g))
        s += String.fromCharCode(buffer[index++]);
    const lines = s.split(/\n/);
    for (const line of lines) {
        if (!line)
            continue;
        // Grabs the Resolution line
        // This line is of the form "{+-}{XY} xyres {+-}{YX} yxres\n".
        if (line.match(/[+-][XY] \d+ [+-][YX] \d+/)) {
            const res = getResolution(line);
            header.set("X", res.x);
            header.set("Y", res.y);
            continue;
        }
        const key_value = line.split("=");
        header.set(key_value[0], key_value[1] ? key_value[1] : undefined);
    }
    header.set("HEADER_END", index);
    return header;
}
function getResolution(line) {
    const values = line.split(" ");
    const y_index = line.indexOf("Y");
    const x_index = line.indexOf("X");
    const res = { x: 0, y: 0, orientation: 0 };
    if (x_index > y_index)
        res.orientation |= YMAJOR;
    if (line[x_index - 1] == "-")
        res.orientation |= XDECR;
    if (line[y_index - 1] == "-")
        res.orientation |= YDECR;
    if (x_index > y_index) {
        res.y = parseInt(values[1]);
        res.x = parseInt(values[3]);
    }
    else {
        res.x = parseInt(values[1]);
        res.y = parseInt(values[3]);
    }
    if (res.x <= 0 || res.y <= 0)
        throw new Error("Invalid HDR Image Resolution in File");
    //Swap x and y if not Y major
    if (res.orientation & YMAJOR) ;
    else
        [res.x, res.y] = [res.y, res.x];
    return res;
}

export { HDRImageLoader, instanceOfHDRBuffer };
