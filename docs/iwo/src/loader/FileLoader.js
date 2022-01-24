class FileLoader {
    static Default_Base_URL = window.location.href.substr(0, window.location.href.lastIndexOf("/"));
    static onProgress = () => {
        //no-op
    };
    static onFileComplete = () => {
        //no-op
    };
    static async promiseAll(files, base_url = this.Default_Base_URL) {
        const promises = [];
        for (const file of files) {
            const p = FileLoader.promise(file, base_url);
            promises.push(p);
        }
        return Promise.all(promises);
    }
    static async promise(file_name, base_url = this.Default_Base_URL) {
        if (!base_url.endsWith("/"))
            base_url += "/";
        return fetch(base_url + file_name)
            .then(response => {
            if (!response.ok)
                throw new Error(response.status + " " + response.statusText);
            const contentLength = response.headers.get("content-length");
            if (!contentLength)
                console.warn(`Content-Length response header unavailable for ${response.url}`);
            const total = (contentLength && parseInt(contentLength, 10)) || 0;
            if (response.body && ReadableStream)
                return FileLoader.readAllChunks(response.body, total, file_name);
            else
                return response;
        })
            .then(response => {
            this.onFileComplete(file_name);
            return response;
        });
    }
    static setOnProgress(func) {
        this.onProgress = (loaded_bytes, total_bytes, file_name) => {
            try {
                func(loaded_bytes, total_bytes, file_name);
            }
            catch (e) {
                console.error(e);
            }
        };
    }
    static setOnFileComplete(f) {
        this.onFileComplete = (file_name) => {
            try {
                f(file_name);
            }
            catch (e) {
                console.error(e);
            }
        };
    }
    static readAllChunks(readableStream, total_size, file_name) {
        let loaded = 0;
        const reader = readableStream.getReader();
        const stream = new ReadableStream({
            async start(controller) {
                //Pump the whole file
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    loaded += value.byteLength;
                    controller.enqueue(value);
                }
                controller.close();
                reader.releaseLock();
            },
        });
        return new Response(stream, {});
    }
}

export { FileLoader };
//# sourceMappingURL=FileLoader.js.map
