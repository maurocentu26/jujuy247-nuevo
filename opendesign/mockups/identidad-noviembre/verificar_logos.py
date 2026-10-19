"""Comprueba que los trazados no se salen del viewBox. Requiere fonttools."""
from pathlib import Path
import sys, re, xml.etree.ElementTree as ET
sys.path.insert(0, str(Path(__file__).resolve().parents[3]/'tmp/branding-tools'))
from fontTools.svgLib.path import parse_path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

for path in (Path(__file__).parent/'assets/logos').glob('*.svg'):
    root=ET.parse(path).getroot(); _,_,width,height=map(float,root.attrib['viewBox'].split())
    pen=BoundsPen(None)
    def visit(node,parent=Transform()):
        transform=parent
        for op, args in re.findall(r'(translate|scale)\(([^)]+)\)',node.attrib.get('transform','')):
            values=[float(n) for n in re.split(r'[\s,]+',args.strip())]
            if op=='translate': transform=transform.translate(values[0],values[1] if len(values)>1 else 0)
            else: transform=transform.scale(values[0],values[1] if len(values)>1 else values[0])
        if node.tag.endswith('path'):parse_path(node.attrib['d'],TransformPen(pen,transform))
        if node.tag.endswith('polygon'):
            points=[transform.transformPoint(tuple(map(float,p.split(',')))) for p in node.attrib['points'].split()]
            pen.moveTo(points[0])
            for point in points[1:]:pen.lineTo(point)
            pen.closePath()
        if node.tag.endswith(('circle','line')):
            margin=float(node.attrib.get('stroke-width',0))/2
            if node.tag.endswith('circle'):
                x,y,r=map(float,[node.attrib['cx'],node.attrib['cy'],node.attrib['r']])
                box=(x-r-margin,y-r-margin,x+r+margin,y+r+margin)
            else:
                x1,y1,x2,y2=[float(node.attrib[k]) for k in ['x1','y1','x2','y2']]
                box=(min(x1,x2)-margin,min(y1,y2)-margin,max(x1,x2)+margin,max(y1,y2)+margin)
            points=[transform.transformPoint(p) for p in [(box[0],box[1]),(box[2],box[1]),(box[2],box[3]),(box[0],box[3])]]
            pen.moveTo(points[0])
            for point in points[1:]:pen.lineTo(point)
            pen.closePath()
        for child in node:visit(child,transform)
    visit(root)
    x0,y0,x1,y1=pen.bounds
    assert 0<=x0<=x1<=width and 0<=y0<=y1<=height,(path.name,pen.bounds,(width,height))
print('Todos los SVG: contornos y trazos dentro de su viewBox.')
