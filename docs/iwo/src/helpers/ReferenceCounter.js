class ReferenceCounter {
    _count;
    constructor() {
        this._count = 0;
    }
    increment() {
        this._count++;
    }
    decrement() {
        this._count--;
        if (this._count < 0)
            throw new Error("Reference Counter is negative");
    }
    get count() {
        return this._count;
    }
}

export { ReferenceCounter };
//# sourceMappingURL=ReferenceCounter.js.map
