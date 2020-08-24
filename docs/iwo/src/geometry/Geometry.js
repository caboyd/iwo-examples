//TODO: Change to match glTF https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshes
var AttributeType;
(function (AttributeType) {
    AttributeType[AttributeType["Vertex"] = 0] = "Vertex";
    AttributeType[AttributeType["Tex_Coord"] = 1] = "Tex_Coord";
    AttributeType[AttributeType["Normal"] = 2] = "Normal";
    AttributeType[AttributeType["Tangent"] = 3] = "Tangent";
    AttributeType[AttributeType["Bitangent"] = 4] = "Bitangent";
})(AttributeType || (AttributeType = {}));
const AttributeTypeValues = Object.keys(AttributeType)
    .filter(value => !isNaN(Number(value)))
    .map(value => Number(value));
class Geometry {
    constructor() {
        this.attributes = new Map();
        this.groups = [];
    }
}

export { AttributeType, AttributeTypeValues, Geometry };
//# sourceMappingURL=Geometry.js.map
