import { coverRect, EXCERPT_GAP, excerptFont, FLYER, textBlockTop, titleFont } from './layout.mjs';

const RED = '#e1191d';
const LOGO = { x: 655, y: 62, width: 361 };
const TEXT_LEFT = 80;
const TEXT_BOTTOM = 1110;

function skewedRect(ctx, x, y, width, height, degrees) {
  const shift = Math.tan((degrees * Math.PI) / 180) * height / 2;
  ctx.beginPath();
  ctx.moveTo(x + shift, y);
  ctx.lineTo(x + width + shift, y);
  ctx.lineTo(x + width - shift, y + height);
  ctx.lineTo(x - shift, y + height);
  ctx.closePath();
  ctx.fill();
}

function drawPhoto(ctx, photo, crop, gray) {
  const rect = coverRect(photo.naturalWidth, photo.naturalHeight, crop);
  ctx.drawImage(photo, rect.x, rect.y, rect.width, rect.height);
  if (gray) {
    // Safari no aplica ctx.filter: la composición en saturación funciona en todos.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, FLYER.width, FLYER.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// El fundido inferior sigue al texto: un título largo sobre una foto clara también se lee.
function drawFades(ctx, layout) {
  const top = ctx.createLinearGradient(0, 0, 0, 300);
  top.addColorStop(0, 'rgba(0,0,0,0.72)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, FLYER.width, 300);

  const textTop = layout ? textBlockTop(layout, TEXT_BOTTOM) : TEXT_BOTTOM - 144;
  const start = Math.max(420, textTop - 260);
  const span = FLYER.height - start;
  const bottom = ctx.createLinearGradient(0, start, 0, FLYER.height);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop((textTop - start) / span, 'rgba(0,0,0,0.8)');
  bottom.addColorStop((TEXT_BOTTOM - start) / span, 'rgba(0,0,0,0.94)');
  bottom.addColorStop(1, '#000');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, start, FLYER.width, span);
}

function drawSectionTag(ctx, label, family) {
  const text = label.trim().toLocaleUpperCase('es-AR');
  if (!text) return;
  ctx.font = `800 22px ${family}`;
  const x = 79;
  const y = 175;
  const height = 64;
  const width = 40 + ctx.measureText(text).width + 172;

  ctx.fillStyle = RED;
  skewedRect(ctx, x + width * 0.07, y + height, width * 0.68, 18, 20);
  ctx.fillStyle = '#fff';
  skewedRect(ctx, x, y, width, height, 20);
  ctx.fillStyle = RED;
  skewedRect(ctx, x + width * 0.76 - 36, y - 15, 36, 97, 22);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 40, y + height / 2 + 1);
}

function drawTexts(ctx, layout, family) {
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let cursor = textBlockTop(layout, TEXT_BOTTOM);

  ctx.fillStyle = '#fff';
  ctx.font = titleFont(layout.titleSize, family);
  for (const line of layout.titleLines) {
    ctx.fillText(line, TEXT_LEFT, cursor + layout.titleSize);
    cursor += layout.titleLine;
  }

  if (layout.excerptLines.length) {
    cursor += EXCERPT_GAP;
    ctx.fillStyle = '#e6e7e8';
    ctx.font = excerptFont(family);
    for (const line of layout.excerptLines) {
      ctx.fillText(line, TEXT_LEFT, cursor + layout.excerptSize);
      cursor += layout.excerptLine;
    }
  }
}

function drawPill(ctx, label, family) {
  const text = label.trim();
  if (!text) return;
  ctx.font = `500 25px ${family}`;
  const x = 79;
  const y = 1202;
  const height = 54;
  const width = ctx.measureText(text).width + 52;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 26, y + height / 2 + 1);
}

function drawSiteUrl(ctx, family) {
  ctx.font = `500 25px ${family}`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.fillText('www.jujuy247.com.ar', FLYER.width - 64, 1292);
  ctx.textAlign = 'left';
}

// Única función de dibujo: la vista previa y el archivo exportado son el mismo lienzo.
export function renderFlyer(ctx, { section, pill, gray, crop, layout }, { photo, logo, family }) {
  ctx.clearRect(0, 0, FLYER.width, FLYER.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, FLYER.width, FLYER.height);

  if (photo) drawPhoto(ctx, photo, crop, gray);
  drawFades(ctx, layout);
  if (logo) {
    ctx.drawImage(logo, LOGO.x, LOGO.y, LOGO.width, LOGO.width * (logo.naturalHeight / logo.naturalWidth));
  }
  drawSectionTag(ctx, section, family);
  if (layout) drawTexts(ctx, layout, family);
  drawPill(ctx, pill, family);
  drawSiteUrl(ctx, family);
}
