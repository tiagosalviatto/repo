"""Extrai as digitacoes das duas folhas de campo harmonico (PDF) para a
tabela CADERNO do index.html.

Nao roda no `npm test` e nao e dependencia de nada: esta aqui para as 126
strings terem procedencia. Quem quiser conferir os valores olha o
`tests/caderno.test.js`, que valida cada forma contra o motor do proprio
app; quem quiser refazer a extracao de um PDF revisado roda isto.

    python tools/extrai-caderno.py TRIADES.pdf TETRADES.pdf

Os diagramas nao sao imagem, sao vetor. Cada um e um grupo de 6 linhas
verticais (cordas) com 5 horizontais (trastes); os pontos sao poligonos
pequenos, a pestana e um poligono comprido, e o o/x acima da pestana e
glifo de fonte. A casa absoluta sai da espessura da linha de cima
(2.56 = pestana, logo casa 1) ou, quando o PDF omite o numero da posicao,
da unica transposicao que reproduz as notas do acorde.
"""
import re, zlib, collections, json, sys

# avanco do glifo de o/x, em em. Vale qualquer valor entre .30 e .62:
# as marcas caem na mesma corda em toda essa faixa.
ADV = 0.45

def load(p):
    d=open(p,"rb").read(); out=[]
    for m in re.finditer(rb"stream", d):
        s=m.end()
        while d[s:s+1] in (b"\r",b"\n"): s+=1
        e=d.find(b"endstream", s); raw=d[s:e]
        try: out.append(zlib.decompress(raw))
        except Exception: out.append(raw)
    return out

def cmaps(st):
    res=[]
    for s in st:
        if s and b"begincmap" in s:
            t=s.decode("latin1"); dd={}
            for blk in re.findall(r"beginbfchar(.*?)endbfchar",t,re.S):
                for a,b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>",blk):
                    dd[a.lower()]=chr(int(b[:4],16))
            for blk in re.findall(r"beginbfrange(.*?)endbfrange",t,re.S):
                for a,b,c in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>",blk):
                    for i in range(int(a,16),int(b,16)+1):
                        dd["%04x"%i]=chr(int(c,16)+i-int(a,16))
            res.append(dd)
    return res

def parse(content):
    lines=[];texts=[];fills=[]
    w=1.0;font=None;size=0;tm=None;cur=None;poly=[];ox=0.0;oy=0.0
    for ln in content.replace("\r","\n").split("\n"):
        t=ln.strip()
        m=re.fullmatch(r"1 0 0 1 ([\d.\-]+) ([\d.\-]+) cm", t)
        if m: ox+=float(m.group(1)); oy+=float(m.group(2)); continue
        m=re.fullmatch(r"/(\w+) ([\d.]+) Tf", t)
        if m: font=m.group(1); size=float(m.group(2)); continue
        m=re.fullmatch(r"([\d.\-]+) 0 0 ([\d.\-]+) ([\d.\-]+) ([\d.\-]+) Tm", t)
        if m: tm=(float(m.group(3))+ox,float(m.group(4))+oy); continue
        m=re.fullmatch(r"\[(.*)\]TJ", t)
        if m and tm:
            texts.append({"f":font,"sz":size,"x":tm[0],"y":tm[1],"raw":m.group(1)}); continue
        m=re.fullmatch(r"([\d.\-]+) w", t)
        if m: w=float(m.group(1)); continue
        m=re.fullmatch(r"([\d.\-]+) ([\d.\-]+) m", t)
        if m: cur=(float(m.group(1))+ox,float(m.group(2))+oy); poly=[cur]; continue
        m=re.fullmatch(r"([\d.\-]+) ([\d.\-]+) l", t)
        if m and cur:
            n=(float(m.group(1))+ox,float(m.group(2))+oy); poly.append(n)
            lines.append((w,cur[0],cur[1],n[0],n[1])); cur=n; continue
        if t=="f" and poly: fills.append(list(poly)); poly=[]; continue
    return lines,texts,fills

def dec(t,cms):
    gs=[g for h in re.findall(r"<([0-9A-Fa-f]+)>",t["raw"]) for g in re.findall("....",h.lower())]
    return "".join(next((d[g] for d in cms if g in d),"?") for g in gs)

def extract(P):
    st=load(P); cms=cmaps(st); res=[]
    pages=[s for s in st if s and s.lstrip().startswith(b"1 0 0 -1")]
    for pi,pg in enumerate(pages):
        lines,texts,fills=parse(pg.decode("latin1"))
        vert=[l for l in lines if abs(l[1]-l[3])<0.01 and 28<abs(l[2]-l[4])<45]
        horiz=[l for l in lines if abs(l[2]-l[4])<0.01 and abs(l[1]-l[3])>20]
        byspan=collections.defaultdict(list)
        for l in vert:
            byspan[(round(min(l[2],l[4]),1),round(max(l[2],l[4]),1))].append(round(l[1],2))
        pb=[]
        for key,xs in byspan.items():
            top,bot=key; xs=sorted(set(xs)); i=0
            while i+5<len(xs):
                g=xs[i:i+6]
                if g[-1]-g[0]<36:
                    pb.append({"pg":pi,"top":top,"bot":bot,"xs":g,"dots":[],"barres":[]}); i+=6
                else: i+=1
        for b in pb:
            hs=[l for l in horiz if b["top"]-1<=l[2]<=b["bot"]+1 and b["xs"][0]-3<=min(l[1],l[3]) and max(l[1],l[3])<=b["xs"][-1]+3]
            b["ys"]=sorted({round(l[2],2) for l in hs})
            b["nut"]=any(abs(l[0]-2.56)<.01 and abs(l[2]-b["top"])<0.8 for l in hs)
            b["mk"]=[t for t in texts if b["top"]-7<=t["y"]<=b["top"]-0.3 and b["xs"][0]-8<=t["x"]<=b["xs"][-1]+8 and t["sz"]<22]
            b["nm"]=sorted([t for t in texts if b["top"]-25<=t["y"]<=b["top"]-7 and b["xs"][0]-38<=t["x"]<=b["xs"][-1]+32], key=lambda t:t["x"])
        for poly in fills:
            xs=[q[0] for q in poly]; ys=[q[1] for q in poly]
            cx=sum(xs)/len(xs); cy=sum(ys)/len(ys)
            for b in pb:
                if b["xs"][0]-4<=cx<=b["xs"][-1]+4 and b["top"]-2<=cy<=b["bot"]+2:
                    if len(poly)>8 and (max(xs)-min(xs))>8:
                        b["barres"].append((min(xs),max(xs),max(ys)))
                    else: b["dots"].append((cx,cy))
                    break
        res.extend(pb)
    return res, cms

def build(b, cms):
    xs=b["xs"]; ys=b["ys"]
    def sidx(x): return min(range(6), key=lambda i: abs(xs[i]-x))
    def fidx(y):
        for k in range(len(ys)-1):
            if ys[k]-0.4 <= y <= ys[k+1]+0.4: return k+1
        return None
    rel=[None]*6
    for cx,cy in b["dots"]:
        s=sidx(cx); f=fidx(cy)
        if f: rel[s]=f
    for x0,x1,yb in b["barres"]:
        f=fidx(yb-1.2)
        if f is None: continue
        s0=sidx(x0); s1=sidx(x1)
        for s in range(min(s0,s1),max(s0,s1)+1):
            if rel[s] is None: rel[s]=f
    marks={}
    for t in b["mk"]:
        chars=dec(t,cms)
        kerns=[]
        k=0
        for a,bb in re.findall(r"<([0-9A-Fa-f]+)>|(-?\d+)", t["raw"]):
            if a:
                for g in re.findall("....",a.lower()): kerns.append(k); k=0
            else: k=int(bb)
        x=t["x"]+1.76
        for i,ch in enumerate(chars):
            if i>0: x += (ADV - kerns[i]/1000.0) * t["sz"]
            marks[sidx(x)] = "x" if ord(ch)>0xf000 else "o"
    return rel, marks

def name(b,cms):
    s="".join(dec(t,cms) for t in b["nm"])
    return re.sub(r"^\d+","",s).replace("\uf023","#").replace("\uf062","b").replace("\uf028","(").replace("\uf029",")")

NM={"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}
QUAL={"":[0,4,7],"m":[0,3,7],"dim":[0,3,6],"Maj7":[0,4,7,11],"m7":[0,3,7,10],"7":[0,4,7,10],"m7(b5)":[0,3,6,10]}
TUN=[40,45,50,55,59,64]

def chordpcs(nm):
    m=re.match(r"^([A-G])([#b]?)(.*)$", nm)
    if not m: return None,None,None
    acc=1 if m.group(2)=="#" else (-1 if m.group(2)=="b" else 0)
    root=(NM[m.group(1)]+acc)%12
    q=m.group(3).strip()
    if q not in QUAL: return root,None,q
    return root, set((root+i)%12 for i in QUAL[q]), q

def run(P,lab):
    bx,cms=extract(P)
    bx.sort(key=lambda b:(b["pg"], round(b["top"]/25), b["xs"][0]))
    rows=[]; bad=[]
    for b in bx:
        rel,marks=build(b,cms); nm=name(b,cms)
        root,want,q=chordpcs(nm)
        shape=[]
        for s in range(6):
            if rel[s] is not None: shape.append(rel[s])
            elif marks.get(s)=="o": shape.append(0)
            else: shape.append(None)
        cand=[]
        rng=[0] if b["nut"] else list(range(1,14))
        for off in rng:
            pcs=set()
            for s in range(6):
                if shape[s] is None: continue
                f = shape[s] + (off if shape[s]>0 else 0)
                pcs.add((TUN[s]+f)%12)
            if not want: continue
            need=set()
            if q in ("Maj7","m7","7","m7(b5)"):
                need={(root+QUAL[q][1])%12,(root+QUAL[q][3])%12,root}
            else:
                need={root,(root+QUAL[q][1])%12}
            if pcs<=want and need<=pcs: cand.append(off)
        rows.append({"name":nm,"q":q,"nut":b["nut"],"shape":shape,"off":cand})
        if not cand: bad.append(rows[-1])
    print("###",lab,"total",len(rows),"ok",len(rows)-len(bad),"FAILED",len(bad))
    for r in bad[:25]:
        print("   FAIL",r["name"],"q=",repr(r["q"]),"nut" if r["nut"] else "NONUT",r["shape"])
    amb=[r for r in rows if len(r["off"])>1]
    print("   ambiguous offset:",len(amb))
    for r in rows[:7]:
        print("   OK  ",r["name"],"nut" if r["nut"] else "NONUT",r["shape"],"off",r["off"])
    return rows

if len(sys.argv) != 3:
    raise SystemExit(__doc__)
R=run(sys.argv[1],"TRI")
T=run(sys.argv[2],"TET")
