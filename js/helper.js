// js/helpers.js

// Helper untuk GUI Kamera
export class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }
    get min() { return this.obj[this.minProp]; }
    set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() { return this.obj[this.maxProp]; }
    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min;
    }
}

// Helper untuk GUI Lampu
export class ColorGUIHelper {
    constructor(light, prop) {
        this.light = light;
        this.prop = prop;
    }
    get color() {
        return `#${this.light[this.prop].getHexString()}`;
    }
    set color(hexString) {
        this.light[this.prop].set(hexString);
    }
}
