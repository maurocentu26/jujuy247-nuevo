"""Regenera exploraciones SVG desde fuentes OFL; requiere fonttools, no modifica originales."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tmp/branding-tools'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

BASE = Path(__file__).resolve().parent
OUT = BASE/'assets/logos'
archivo = TTFont(BASE/'assets/fonts/archivo.ttf')
heavy = instantiateVariableFont(archivo, {'wght':900, 'wdth':100}, inplace=False)
condensed = instantiateVariableFont(archivo, {'wght':850, 'wdth':85}, inplace=False)
bold = instantiateVariableFont(archivo, {'wght':700, 'wdth':100}, inplace=False)
barlow = TTFont(BASE/'assets/fonts/barlow-condensed-black.ttf')

def word(text,x,y,size,font,fill,tracking=0):
    glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); upem=font['head'].unitsPerEm
    cursor=0; pieces=[]
    for char in text:
        name=cmap[ord(char)]; pen=SVGPathPen(glyphs); glyphs[name].draw(pen)
        pieces.append(f'<path transform="translate({cursor:.3f} 0)" d="{pen.getCommands()}"/>')
        cursor += font['hmtx'].metrics[name][0]+tracking*upem/size
    return f'<g fill="{fill}" transform="translate({x} {y}) scale({size/upem:.6f} {-size/upem:.6f})">'+''.join(pieces)+'</g>', cursor*size/upem

def text(*args,**kwargs): return word(*args,**kwargs)[0]

def a(fg):
    n,w=word('24',20,175,205,heavy,fg)
    sx=20+w+12
    slash=f'<polygon fill="{fg}" points="{sx},190 {sx+45},20 {sx+67},20 {sx+22},190"/>'
    return n+slash+text('7',sx+73,175,205,heavy,fg)+text('JUJUY',23,250,49,bold,fg,5)

def b(fg):
    return text('24',25,135,180,barlow,fg)+text('/7',68,280,180,barlow,fg)+text('JUJUY',29,327,34,bold,fg,4)

def c(fg,bg):
    return f'<polygon fill="{fg}" points="12,10 328,10 282,168 12,168"/><polygon fill="{fg}" points="354,10 548,10 548,168 308,168"/>'+text('24',31,145,175,condensed,bg)+text('7',372,145,175,condensed,bg)+text('JUJUY',14,225,48,bold,fg,5)

def svg(name,content,w,h,title):
    source=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc"><title id="title">{title}</title><desc id="desc">Exploración de identidad para Jujuy247. 24/7 protagonista. Propuesta no aprobada.</desc>{content}</svg>'
    ET.fromstring(source)
    (OUT/name).write_text(source,encoding='utf-8')

for key,draw,w,h,fg,yellow in [('claro',a,560,270,'#202124','#F6CE2D'),('par',b,260,350,'#30363B','#E6AD23'),('encuentro',c,560,250,'#153E4E','#E9F04A')]:
    for variant,ink,paper in [('principal',fg,yellow),('mono','#202124','#ffffff'),('inverso','#ffffff',fg)]:
        content=draw(ink,paper) if key=='encuentro' else draw(ink)
        svg(f'{key}-{variant}.svg',content,w,h,f'Jujuy247 / {key} / {variant}')
    if key=='par':
        compact=text('24',29,105,128,barlow,fg)+text('/7',80,216,128,barlow,fg)
    elif key=='claro':
        compact='<g transform="translate(8 65) scale(.4)">'+a(fg)+'</g>'
    else:
        compact='<g transform="translate(5 65) scale(.42)">'+c(fg,yellow)+'</g>'
    svg(f'{key}-avatar.svg',f'<rect width="240" height="240" fill="{yellow}"/>'+compact,240,240,f'Jujuy247 / {key} / avatar')
    svg(f'{key}-avatar-mono.svg','<rect width="240" height="240" fill="#ffffff"/>'+compact.replace(fg,'#202124').replace(yellow,'#ffffff'),240,240,f'Jujuy247 / {key} / avatar monocromático')

svg('par-horizontal.svg','<g transform="translate(0 0) scale(.62)">'+text('24',25,135,180,barlow,'#30363B')+text('/7',68,280,180,barlow,'#30363B')+'</g>'+text('JUJUY',185,132,57,bold,'#30363B',2),450,215,'Jujuy247 / A la par / firma horizontal')

def clock(ink, compact=False):
    if compact:
        face=f'<circle cx="120" cy="120" r="96" fill="none" stroke="{ink}" stroke-width="10"/><g stroke="{ink}" stroke-width="10" stroke-linecap="round"><line x1="120" y1="88" x2="120" y2="48"/><line x1="120" y1="88" x2="151" y2="66"/></g>'
        label,width=word('24/7',0,178,68,heavy,ink)
        return face+f'<g transform="translate({(240-width)/2:.3f} 0)">{label}</g>'
    return f'<circle cx="120" cy="125" r="91" fill="none" stroke="{ink}" stroke-width="12"/><g stroke="{ink}" stroke-width="12" stroke-linecap="round"><line x1="120" y1="125" x2="96" y2="103"/><line x1="120" y1="125" x2="163" y2="82"/></g>'

for variant,ink in [('principal','#000000'),('mono','#000000'),('inverso','#FFD400')]:
    svg(f'reloj-{variant}.svg',clock(ink)+text('24/7',250,173,190,heavy,ink)+text('JUJUY',258,246,50,bold,ink,6),800,270,f'Jujuy247 / Tiempo presente / {variant}')
svg('reloj-avatar.svg','<rect width="240" height="240" fill="#000000"/>'+clock('#FFD400',True),240,240,'Jujuy247 / Tiempo presente / avatar')
svg('reloj-avatar-mono.svg','<rect width="240" height="240" fill="#ffffff"/>'+clock('#000000',True),240,240,'Jujuy247 / Tiempo presente / avatar monocromático')
assert len(list(OUT.glob('*.svg')))==21
assert all('24/7' in p.read_text(encoding='utf-8') and '<text' not in p.read_text(encoding='utf-8') for p in OUT.glob('*.svg'))
print('21 SVG trazados y validados; no necesitan fuentes instaladas.')
