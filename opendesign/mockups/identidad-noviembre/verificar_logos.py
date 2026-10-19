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
        for child in node:visit(child,transform)
    visit(root)
    x0,y0,x1,y1=pen.bounds
    assert 0<=x0<=x1<=width and 0<=y0<=y1<=height,(path.name,pen.bounds,(width,height))
print('16 SVG: todos los contornos dentro de su viewBox.')
