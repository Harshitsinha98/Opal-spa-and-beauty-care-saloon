// One-time media pipeline: converts the raw salon photos (HEIC/JPG) and the
// reception video (HEVC/HDR .mov) in /images into web-ready files in
// /public/media, plus a manifest with sizes and blur placeholders.
//
// Run with: npm i --no-save heic-convert ffmpeg-static && npm run media
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import convert from "heic-convert";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(root, "images");
const OUT = path.join(root, "public", "media");

// crop: fractions of the (rotated) source image { left, top, width, height }
const photos = [
  { name: "reception", file: "IMG_8939.heic", alt: "Reception desk with carved jaali panels and the waiting lounge", crop: { left: 0, top: 0.08, width: 1, height: 0.92 } },
  { name: "reception-front", file: "IMG_8941.heic", alt: "Front desk and styling area under the plum ceiling", crop: { left: 0, top: 0.05, width: 1, height: 0.95 } },
  { name: "reception-mirror", file: "PHOTO-2026-11-04-21-02-35(2).jpg", alt: "Lit mirror station behind the reception counter" },
  { name: "lounge", file: "PHOTO-2026-11-04-21-02-35(1).jpg", alt: "Velvet corner lounge with a brass Buddha" },
  { name: "lounge-tall", file: "PHOTO-2026-11-04-21-02-36(2).jpg", alt: "Waiting lounge with fresh flowers" },
  { name: "fountain", file: "PHOTO-2026-11-04-21-02-36.jpg", alt: "Stone Buddha water feature lit with warm light", crop: { left: 0, top: 0.05, width: 0.64, height: 0.95 } },
  { name: "entrance-sign", file: "PHOTO-2026-11-04-21-02-36(1).jpg", alt: "Opal Family Spa signage at the entrance", crop: { left: 0.18, top: 0, width: 0.82, height: 1 } },
  { name: "entrance", file: "IMG_8942.heic", alt: "Glass entrance and wooden panelled foyer" },
  { name: "corridor", file: "PHOTO-2026-11-04-21-02-33(1).jpg", alt: "Quiet corridor to the treatment rooms with floral drapes" },
  { name: "room-buddha", file: "PHOTO-2026-11-04-21-02-32(2).jpg", alt: "Treatment room with a Buddha painting and soft drapes" },
  { name: "room-drapes", file: "PHOTO-2026-11-04-21-02-31(1).jpg", alt: "Massage bed framed by patterned curtains", crop: { left: 0.06, top: 0.12, width: 0.94, height: 0.88 } },
  { name: "room-soft", file: "PHOTO-2026-11-04-21-02-32(1).jpg", alt: "Softly lit treatment room" },
  { name: "room-rose", file: "PHOTO-2026-11-04-21-02-32.jpg", alt: "Massage table prepared with a single rose", crop: { left: 0, top: 0.18, width: 1, height: 0.82 } },
  { name: "room-wine", file: "PHOTO-2026-11-04-21-02-34.jpg", alt: "Private massage room in wine and ivory stripes", crop: { left: 0, top: 0.1, width: 1, height: 0.9 } },
];

const VIDEO = { name: "reception-walk", file: "IMG_8946.mov" };

async function load(file) {
  let buf = await fs.readFile(path.join(SRC, file));
  if (/\.heic$/i.test(file)) buf = Buffer.from(await convert({ buffer: buf, format: "JPEG", quality: 0.96 }));
  return sharp(buf).rotate().toBuffer();
}

// Gentle grade: pulls back the magenta LED cast, warms slightly, adds a little contrast.
function grade(img) {
  return img
    .modulate({ saturation: 0.78, brightness: 1.0 })
    .recomb([
      [1.03, 0.02, -0.02],
      [0.0, 1.0, 0.0],
      [-0.02, 0.02, 0.94],
    ])
    .linear(1.06, -6);
}

await fs.mkdir(OUT, { recursive: true });
const manifest = {};

for (const p of photos) {
  const buf = await load(p.file);
  const meta = await sharp(buf).metadata();
  let img = sharp(buf);
  if (p.crop) {
    img = img.extract({
      left: Math.round(p.crop.left * meta.width),
      top: Math.round(p.crop.top * meta.height),
      width: Math.round(p.crop.width * meta.width),
      height: Math.round(p.crop.height * meta.height),
    });
  }
  const cropped = await grade(img).resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).toBuffer();
  const out = await sharp(cropped).webp({ quality: 82 }).toFile(path.join(OUT, `${p.name}.webp`));
  const blur = await sharp(cropped).resize(16).webp({ quality: 40 }).toBuffer();
  manifest[p.name] = {
    src: `/media/${p.name}.webp`,
    width: out.width,
    height: out.height,
    alt: p.alt,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
  console.log("photo", p.name, `${out.width}x${out.height}`, `${Math.round(out.size / 1024)}KB`);
}

// Video: HDR HEVC -> SDR H.264, muted, graded to match the photos.
const vIn = path.join(SRC, VIDEO.file);
const vOut = path.join(OUT, `${VIDEO.name}.mp4`);
const tonemap =
  "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p";
await run(ffmpegPath, [
  "-y", "-loglevel", "error", "-i", vIn,
  "-vf", `${tonemap},scale=720:-2,eq=saturation=0.8:contrast=1.04,setpts=1.6*PTS`,
  "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", "-r", "30", vOut,
]);
const poster = path.join(OUT, `${VIDEO.name}-poster.webp`);
const frame = path.join(OUT, "_frame.png");
await run(ffmpegPath, ["-y", "-loglevel", "error", "-ss", "0.2", "-i", vOut, "-frames:v", "1", frame]);
await sharp(frame).webp({ quality: 80 }).toFile(poster);
await fs.rm(frame);
const vStat = await fs.stat(vOut);
console.log("video", VIDEO.name, `${Math.round(vStat.size / 1024)}KB`);
manifest[VIDEO.name] = { src: `/media/${VIDEO.name}.mp4`, poster: `/media/${VIDEO.name}-poster.webp` };

await fs.writeFile(path.join(root, "lib", "media.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest written to lib/media.json");
