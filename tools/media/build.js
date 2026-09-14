// tools/media/build.js —— 动作示意图出图脚本（开发期工具，不打进小程序包）
// 输入：assets/exercise-media/<id>/0|1|2.svg（workout-guide 母版，线稿 fill="#fff"）
// 输出（就地写回同目录，PNG 不进 git）：
//   0|1|2.png  512×512 透明底、线稿改色 #1F2937、调色板压缩 —— 详情页/放大层循环播放
//   thumb.png  小尺寸静态缩略图（直接从 SVG 栅格化，比缩放大图清晰）—— 列表用
// 用法（在 tools/media 下）：
//   npm install
//   node build.js                         全部动作
//   node build.js --only=bench,squat      只处理指定动作（试跑）
//   node build.js --thumb-frame=1 --thumb-size=160
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MEDIA_DIR = path.resolve(__dirname, '../../assets/exercise-media');
const FRAMES = [0, 1, 2];
const SIZE = 512;
const SRC_FILL = 'fill="#fff"';
const INK = '#1F2937';

function parseArgs(argv) {
  const args = { only: null, thumbFrame: 1, thumbSize: 160 };
  argv.forEach((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    if (k === 'only' && v) args.only = v.split(',').map((s) => s.trim()).filter(Boolean);
    if (k === 'thumb-frame') args.thumbFrame = Number(v);
    if (k === 'thumb-size') args.thumbSize = Number(v);
  });
  if (FRAMES.indexOf(args.thumbFrame) < 0) throw new Error('--thumb-frame 只能是 0/1/2');
  if (!(args.thumbSize > 0)) throw new Error('--thumb-size 须为正数');
  return args;
}

// 改色：母版每个 SVG 只有线稿 path 的 fill="#fff"；替换不到说明母版格式变了，直接报错而非静默出白图
function recolor(svgText, file) {
  const count = svgText.split(SRC_FILL).length - 1;
  if (count === 0) throw new Error(`${file} 未找到 ${SRC_FILL}，母版格式可能已变`);
  return svgText.split(SRC_FILL).join(`fill="${INK}"`);
}

// SVG 栅格化到指定边长：按 viewBox 512 换算 density，避免先小后放大发虚
function render(svg, size) {
  return sharp(Buffer.from(svg), { density: 72 * size / SIZE })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function buildOne(id, args) {
  const dir = path.join(MEDIA_DIR, id);
  const out = { id, bytes: 0, thumbBytes: 0 };
  for (const n of FRAMES) {
    const svgPath = path.join(dir, `${n}.svg`);
    if (!fs.existsSync(svgPath)) throw new Error(`${id} 缺少 ${n}.svg`);
    const svg = recolor(fs.readFileSync(svgPath, 'utf8'), `${id}/${n}.svg`);
    const png = await render(svg, SIZE);
    fs.writeFileSync(path.join(dir, `${n}.png`), png);
    out.bytes += png.length;
    if (n === args.thumbFrame) {
      const thumb = await render(svg, args.thumbSize);
      fs.writeFileSync(path.join(dir, 'thumb.png'), thumb);
      out.thumbBytes = thumb.length;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = fs.readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const ids = args.only ? args.only : all;
  const unknown = ids.filter((id) => all.indexOf(id) < 0);
  if (unknown.length) throw new Error('不存在的动作目录：' + unknown.join(', '));

  const results = [];
  for (const id of ids) results.push(await buildOne(id, args));

  const kb = (b) => (b / 1024).toFixed(1) + 'KB';
  const frameTotal = results.reduce((s, r) => s + r.bytes, 0);
  const thumbTotal = results.reduce((s, r) => s + r.thumbBytes, 0);
  console.log(`完成 ${results.length} 个动作（缩略图取第 ${args.thumbFrame} 帧、${args.thumbSize}px）`);
  console.log(`帧图 ${results.length * FRAMES.length} 张，共 ${kb(frameTotal)}，单张均 ${kb(frameTotal / (results.length * FRAMES.length))}`);
  console.log(`缩略图 ${results.length} 张，共 ${kb(thumbTotal)}，单张均 ${kb(thumbTotal / results.length)}`);
}

main().catch((e) => { console.error('出图失败：' + e.message); process.exit(1); });
