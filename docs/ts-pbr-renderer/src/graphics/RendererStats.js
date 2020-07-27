export class RendererStats {
    constructor() {
        this.shader_bind_count = 0;
        this.material_bind_count = 0;
        this.index_buffer_bind_count = 0;
        this.vertex_buffer_bind_count = 0;
        this.index_draw_count = 0;
        this.vertex_draw_count = 0;
        this.draw_calls = 0;
        this.reset();
    }
    reset() {
        this.shader_bind_count = 0;
        this.material_bind_count = 0;
        this.index_buffer_bind_count = 0;
        this.vertex_buffer_bind_count = 0;
        this.index_draw_count = 0;
        this.vertex_draw_count = 0;
        this.draw_calls = 0;
    }
}
//# sourceMappingURL=RendererStats.js.map