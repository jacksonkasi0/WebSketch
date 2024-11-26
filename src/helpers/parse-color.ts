export function parseColor(color: string): RGB {
    const rgba = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return { r: rgba[0] / 255, g: rgba[1] / 255, b: rgba[2] / 255 };
  }
  