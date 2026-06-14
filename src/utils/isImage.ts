
const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|avif|bmp|svg|ico|tiff?)$/i;

export const isImageUrl = (url: string): boolean => IMAGE_EXTS.test(url);