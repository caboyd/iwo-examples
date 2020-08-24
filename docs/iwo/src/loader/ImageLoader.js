import { FileLoader as FileLoader$1 } from './FileLoader.js';

class ImageLoader extends FileLoader$1 {
    static async promise(file_name, base_url = window.location.href.substr(0, window.location.href.lastIndexOf("/"))) {
        return new Promise((resolve, reject) => {
            super.promise(file_name, base_url).then((response) => {
                response.blob().then((data) => {
                    const img = new Image();
                    const clear = () => (img.onload = img.onerror = null);
                    img.src = URL.createObjectURL(data);
                    img.onload = () => {
                        clear();
                        resolve(img);
                    };
                    img.onerror = (e) => {
                        clear();
                        reject(e);
                    };
                });
            });
        });
    }
    static async promiseAll(files, base_url = FileLoader$1.Default_Base_URL) {
        const imgs = Array.from({ length: files.length }, u => new Image());
        const promises = [];
        return super.promiseAll(files, base_url).then((responses) => {
            for (let i = 0; i < responses.length; i++) {
                const img = imgs[i];
                const clear = () => (img.onload = img.onerror = null);
                const promise = new Promise((resolve, reject) => {
                    responses[i].blob().then((data) => {
                        img.src = URL.createObjectURL(data);
                        img.onload = () => {
                            clear();
                            resolve(img);
                        };
                        img.onerror = (e) => {
                            clear();
                            reject(e);
                        };
                    });
                });
                promises.push(promise);
            }
            return Promise.all(promises);
        });
    }
    static load(file_name, base_url = "") {
        const img = new Image();
        super.promise(file_name, base_url).then(data => {
            img.src = URL.createObjectURL(data);
        });
        return img;
    }
}

export { ImageLoader };
//# sourceMappingURL=ImageLoader.js.map
