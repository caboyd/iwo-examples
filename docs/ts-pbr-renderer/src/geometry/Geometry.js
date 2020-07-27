/*
    A Group is a subset of a Mesh that
    wants to be drawn separately because it uses a different material
 */
export var AttributeType;
(function (AttributeType) {
    AttributeType[AttributeType["Vertex"] = 1] = "Vertex";
    AttributeType[AttributeType["Tex_Coords"] = 2] = "Tex_Coords";
    AttributeType[AttributeType["Normals"] = 4] = "Normals";
    AttributeType[AttributeType["Tangents"] = 8] = "Tangents";
    AttributeType[AttributeType["Bitangents"] = 16] = "Bitangents";
})(AttributeType || (AttributeType = {}));
//# sourceMappingURL=Geometry.js.map