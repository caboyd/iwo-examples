class SubMesh {
    index_buffer;
    vertex_buffer;
    //Offset in the index/vertex buffer
    offset;
    //Number of indices/vertices to draw
    count;
    //Material index reference the material of the mesh instance
    material_index;
    constructor(material_index, offset, count, vertex_buffer, index_buffer) {
        this.index_buffer = index_buffer;
        this.vertex_buffer = vertex_buffer;
        this.offset = offset;
        this.count = count;
        this.material_index = material_index;
        this.vertex_buffer.references.increment();
        if (this.index_buffer)
            this.index_buffer.references.increment();
    }
    destroy() {
        this.vertex_buffer.references.decrement();
        if (this.index_buffer)
            this.index_buffer.references.decrement();
    }
}

export { SubMesh };
//# sourceMappingURL=SubMesh.js.map
