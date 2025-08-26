export async function getAverageColorFromImage(
  imageUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject("Canvas not supported");
        return;
      }

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const { data } = ctx.getImageData(0, 0, img.width, img.height);

      let r = 0,
        g = 0,
        b = 0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      const pixelCount = data.length / 4;
      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);

      resolve(`rgb(${r}, ${g}, ${b})`);
    };

    img.onerror = () => {
      reject("Failed to load image");
    };
  });
}

// colorUtils.ts
export function withOpacity(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));

  // rgb(…) -> rgba(…, a)
  const rgbMatch = color.match(
    /^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i
  );
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // rgba(…) -> replace alpha
  const rgbaMatch = color.match(
    /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i
  );
  if (rgbaMatch) {
    const [_, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // #rrggbb or #rgb -> rgba
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const to255 = (h: string) => parseInt(h.length === 1 ? h + h : h, 16);
    const [r, g, b] =
      hex.length === 3
        ? [to255(hex[0]), to255(hex[1]), to255(hex[2])]
        : [
            to255(hex.slice(0, 2)),
            to255(hex.slice(2, 4)),
            to255(hex.slice(4, 6)),
          ];
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // hsl(…)/hsla(…) and others — let the browser compute it via a hidden element
  try {
    const el = document.createElement("div");
    el.style.color = color;
    document.body.appendChild(el);
    const cs = getComputedStyle(el).color; // becomes rgb(…)
    document.body.removeChild(el);
    return withOpacity(cs, a); // recurse once with computed rgb
  } catch {
    return color; // fallback: return original
  }
}
