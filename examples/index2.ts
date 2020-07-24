// @ts-ignore
import {vec3} from 'gl-matrix';

console.log("teecoolst");

let c = vec3.create();

for(let i = 0; i < 200; i++){
    console.log(i*i*i);

    let a = 4;

    let b = a**a;

    console.log(b);
}

console.log(c);