"""Typeset manuscript.md as a review PDF using ReportLab and math images."""
from pathlib import Path
import re
import html
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.mathtext import math_to_image
from PIL import Image as PILImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                               Table, TableStyle, KeepTogether)

ROOT = Path(__file__).resolve().parent
OUT = ROOT/"output"
TMP = ROOT/"tmp"
OUT.mkdir(exist_ok=True)
TMP.mkdir(exist_ok=True)
FONT = Path(matplotlib.get_data_path())/"fonts"/"ttf"
for key, name in [("Serif","DejaVuSerif.ttf"),("Serif-Bold","DejaVuSerif-Bold.ttf"),
                  ("Serif-Italic","DejaVuSerif-Italic.ttf"),("Sans","DejaVuSans.ttf"),
                  ("Sans-Bold","DejaVuSans-Bold.ttf"),("Mono","DejaVuSansMono.ttf")]:
    pdfmetrics.registerFont(TTFont(key, str(FONT/name)))
pdfmetrics.registerFontFamily("Serif",normal="Serif",bold="Serif-Bold",italic="Serif-Italic",boldItalic="Serif-Bold")
pdfmetrics.registerFontFamily("Sans",normal="Sans",bold="Sans-Bold",italic="Sans",boldItalic="Sans-Bold")
NAVY=colors.HexColor("#183a5b")
BODY=colors.HexColor("#202b35")
styles={
    "body":ParagraphStyle("body",fontName="Serif",fontSize=9.5,leading=13.8,textColor=BODY,spaceAfter=7),
    "title":ParagraphStyle("title",fontName="Sans-Bold",fontSize=23,leading=28,textColor=NAVY,spaceAfter=8),
    "subtitle":ParagraphStyle("subtitle",fontName="Sans",fontSize=13,leading=18,textColor=NAVY,spaceAfter=17),
    "heading":ParagraphStyle("heading",fontName="Sans-Bold",fontSize=12,leading=16,textColor=NAVY,spaceBefore=12,spaceAfter=8,keepWithNext=True),
    "caption":ParagraphStyle("caption",fontName="Sans",fontSize=8,leading=11,textColor=colors.HexColor("#4d5963"),spaceAfter=10),
    "reference":ParagraphStyle("reference",fontName="Serif",fontSize=8.2,leading=11.6,spaceAfter=7,textColor=BODY),
    "number":ParagraphStyle("number",fontName="Serif",fontSize=9,alignment=2,textColor=BODY),
}
styles["lead"] = ParagraphStyle("lead",parent=styles["body"],keepWithNext=True)


def inline(s):
    links=[]
    def save_link(m):
        links.append((m.group(1),m.group(2)))
        return f"ZZLINK{len(links)-1}ZZ"
    s=re.sub(r"\[([^\]]+)\]\((https?://[^\s)]+)\)",save_link,s)
    s=html.escape(s)
    greek={"tau":"τ","delta":"δ","eta":"η","alpha":"α","beta":"β",
           "gamma":"γ","kappa":"κ","rho":"ρ","sigma":"σ","chi":"χ","nu":"ν"}
    for name,symbol in greek.items():
        s=re.sub(r"\b"+name+r"\b",symbol,s)
    s=re.sub(r"\*\*(.+?)\*\*",r"<b>\1</b>",s)
    s=re.sub(r"\*([^*]+?)\*",r"<i>\1</i>",s)
    s=re.sub(r"`([^`]+)`",r'<font name="Mono" size="8.2">\1</font>',s)
    for j,(label,url) in enumerate(links):
        s=s.replace(f"ZZLINK{j}ZZ",f'<link href="{html.escape(url,quote=True)}" color="#245f8b">{html.escape(label)}</link>')
    return s


def equation(block, index):
    tag=re.search(r"\\tag\{(\d+[a-z]?)\}",block)
    num=tag.group(1) if tag else str(index)
    block=re.sub(r"\\tag\{\d+[a-z]?\}","",block).strip()
    block=block.replace(r"\mathbb R",r"\mathbb{R}")
    block=block.replace(r"\frac12",r"\frac{1}{2}")
    block=block.replace(r"\frac{e\pi^{3/2}}2",r"\frac{e\pi^{3/2}}{2}")
    block=block.replace(r"\sqrt3",r"\sqrt{3}")
    block=block.replace(r"\big|", "|")
    # Long multi-part equations are broken at their explicit logical separator.
    chunks=block.split(r"\qquad") if num in ("2","4","12","13","18","22") else [block]
    cells=[]
    for j,chunk in enumerate(chunks):
        chunk=" ".join(chunk.split()).strip().rstrip(",")
        if not chunk:
            continue
        path=TMP/f"eq_{num}_{j}.png"
        math_to_image("$"+chunk+"$",str(path),dpi=300,format="png",color="#202b35")
        im=PILImage.open(path)
        width,height=im.size
        width,height=width*72/300,height*72/300
        if width>457:
            factor=457/width
            width,height=width*factor,height*factor
        cells.append([Image(str(path),width=width,height=height),Paragraph(f"({num})" if j==len(chunks)-1 else "",styles["number"])])
    table=Table(cells,colWidths=[465,31],hAlign="CENTER")
    table.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                               ("ALIGN",(0,0),(0,-1),"CENTER"),
                               ("LEFTPADDING",(0,0),(-1,-1),0),
                               ("RIGHTPADDING",(0,0),(-1,-1),0),
                               ("TOPPADDING",(0,0),(-1,-1),4),
                               ("BOTTOMPADDING",(0,0),(-1,-1),5)]))
    return table


def footer(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d3dce3"))
    canvas.line(49,752,563,752)
    canvas.setFont("Sans",7)
    canvas.setFillColor(colors.HexColor("#667581"))
    canvas.drawString(49,761,"VERDIER  /  FINITE-RESOLUTION OBSERVABILITY")
    canvas.drawRightString(563,761,"TECHNICAL NOTE 0.3")
    canvas.drawString(49,29,"9 September 2026  |  Kinematic benchmark and analytic measurement theory")
    canvas.drawRightString(563,29,str(doc.page))
    canvas.restoreState()


text=(ROOT/"manuscript.md").read_text()
blocks=re.split(r"\n\s*\n",text)
story=[]
eqnum=0
references=False
for bi,block in enumerate(blocks):
    block=block.strip()
    if not block:
        continue
    if block.startswith("$$"):
        eqnum+=1
        story.append(equation(block.removeprefix("$$").removesuffix("$$"),eqnum))
    elif block.startswith("### "):
        heading=block[4:]
        references=heading=="References"
        story.append(Paragraph(inline(heading),styles["heading"]))
    elif block.startswith("## "):
        story.append(Paragraph(inline(block[3:]),styles["subtitle"]))
    elif block.startswith("# "):
        story.append(Paragraph(inline(block[2:]),styles["title"]))
    elif block.startswith("!["):
        m=re.fullmatch(r"!\[(.+)\]\((.+)\)",block)
        path=ROOT/m.group(2)
        w,h=PILImage.open(path).size
        pic=Image(str(path),width=496,height=496*h/w)
        story.append(KeepTogether([Spacer(1,5),pic,Paragraph(inline(m.group(1)),styles["caption"])]))
    else:
        if block.startswith("**Thomas Verdier**"):
            content="<br/>".join(inline(line.rstrip()) for line in block.splitlines())
        else:
            content=inline(" ".join(block.splitlines()))
        lead=bi+1<len(blocks) and blocks[bi+1].strip().startswith("$$")
        style=styles["reference"] if references else styles["lead"] if lead else styles["body"]
        story.append(Paragraph(content,style))

doc=SimpleDocTemplate(str(OUT/"Finite_Resolution_Vortices.pdf"),pagesize=(612,792),
                      leftMargin=58,rightMargin=58,topMargin=57,bottomMargin=49,
                      title="Finite-resolution observability of concentrating vortices",
                      author="Thomas Verdier",subject="Working manuscript: exact filtering, anisotropy crossover, and resolution certificates")
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT/"Finite_Resolution_Vortices.pdf")
