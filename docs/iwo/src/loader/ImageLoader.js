import { FileLoader } from './FileLoader.js';

class ImageLoader extends FileLoader {
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
    static loadAllBackground(files, base_url = FileLoader.Default_Base_URL) {
        const imgs = Array.from({ length: files.length }, () => new Image());
        const promises = [];
        this.promiseImages(files, base_url, imgs, promises);
        return imgs;
    }
    static promiseImages(files, base_url, imgs, promises) {
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
    static async promiseAll(files, base_url = FileLoader.Default_Base_URL) {
        const imgs = Array.from({ length: files.length }, () => new Image());
        const promises = [];
        return this.promiseImages(files, base_url, imgs, promises);
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
