declare module 'decode-ico' {
    export interface IcoImage {
        width: number;
        height: number;
        bpp: number;
        data: Uint8Array;
        type: 'bmp' | 'png';
    }
    export default function decodeIco(buffer: Buffer | Uint8Array): IcoImage[];
}
