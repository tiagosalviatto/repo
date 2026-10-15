"""Gera os icones do app a partir de tools/violao-fonte.png.

Nao roda no `npm test` e nao e dependencia de nada: esta aqui para os PNGs
da raiz terem procedencia. O tests/pwa.test.js confere o que sai daqui
(tamanho, opacidade, o que o manifest declara); quem quiser trocar a arte
ou as cores roda isto de novo.

    python tools/gera-icones.py

A arte-fonte e um violao branco sobre preto. O proprio cinza serve de
mascara: o violao sai na cor dos marcadores do braco (--bone, #EDE7D9) sobre
a madeira do jacaranda (--wood-2, #241B18).

Dois tipos de icone, porque cada sistema corta de um jeito:

  - "any" (180, 192, 512): o desenho ocupa o quadrado com 13% de folga.
    O iOS e o Chrome arredondam o canto por conta propria; sem a folga, a
    mascara come a cabeca do braco, que aponta justo para o canto.

  - "maskable" (512): o Android recorta com a forma que o launcher quiser
    (circulo, gota, quadrado arredondado). So o circulo central de 80% do
    lado e garantido de aparecer. O violao e diagonal, entao o que limita
    nao e a caixa da arte, e o pixel mais distante do centro: a escala sai
    dele, e o script se recusa a gravar se algum pixel cair fora do circulo.

Tudo e desenhado 6x maior e reduzido no fim. Reduzir por ultimo e o que
evita serrilhar as cordas e o braco, que no icone de 180 tem 1 pixel.
"""
import math, os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
FONTE = os.path.join(AQUI, "violao-fonte.png")

FUNDO = (36, 27, 24)       # --wood-2
ARTE = (237, 231, 217)     # --bone do jacaranda
FOLGA_ANY = 0.13           # de cada lado, no icone comum
RAIO_ARTE = 0.36           # raio maximo da arte no maskable, em fracao do lado
RAIO_SEGURO = 0.40         # o circulo que o Android garante mostrar
SUPER = 6                  # fator de superamostragem


def arte_recortada():
    src = Image.open(FONTE).convert("L")
    caixa = src.point(lambda v: 255 if v > 40 else 0).getbbox()
    return src.crop(caixa)


def raio_maximo(mascara):
    """Distancia do centro da imagem ao pixel de arte mais longe, em px."""
    w, h = mascara.size
    cx, cy = (w - 1) / 2, (h - 1) / 2
    px = mascara.load()
    r = 0.0
    for y in range(h):
        for x in range(w):
            if px[x, y] > 40:
                r = max(r, math.hypot(x - cx, y - cy))
    return r


def compor(lado, escala_arte):
    """Desenha a arte com a escala dada, centrada, num quadrado de `lado`."""
    G = lado * SUPER
    arte = arte_recortada()
    novo = (max(1, round(arte.width * escala_arte * SUPER)),
            max(1, round(arte.height * escala_arte * SUPER)))
    mascara = arte.resize(novo, Image.LANCZOS)
    capa = Image.new("L", (G, G), 0)
    capa.paste(mascara, ((G - novo[0]) // 2, (G - novo[1]) // 2))
    grande = Image.composite(Image.new("RGB", (G, G), ARTE),
                             Image.new("RGB", (G, G), FUNDO), capa)
    return grande.resize((lado, lado), Image.LANCZOS), capa


def icone_any(lado):
    arte = arte_recortada()
    livre = lado * (1 - 2 * FOLGA_ANY)
    escala = min(livre / arte.width, livre / arte.height)
    return compor(lado, escala)[0]


def icone_maskable(lado):
    arte = arte_recortada()
    escala = (RAIO_ARTE * lado) / raio_maximo(arte)
    img, capa = compor(lado, escala)
    # confere no resultado, nao na conta: a reamostragem pode empurrar borda
    r = raio_maximo(capa) / SUPER
    if r > RAIO_SEGURO * lado:
        sys.exit(f"maskable: arte chega a {r:.1f}px do centro, "
                 f"o seguro e {RAIO_SEGURO * lado:.1f}px")
    print(f"  maskable: arte ate {r:.1f}px do centro "
          f"(seguro: {RAIO_SEGURO * lado:.0f}px)")
    return img


def main():
    saidas = {
        "icone-180.png": icone_any(180),            # apple-touch-icon
        "icone-192.png": icone_any(192),            # manifest, favicon
        "icone-512.png": icone_any(512),            # manifest e ficha da Play
        "icone-maskable-512.png": icone_maskable(512),
    }
    for nome, img in saidas.items():
        caminho = os.path.join(RAIZ, nome)
        img.save(caminho, optimize=True)
        print(f"  {nome:24} {img.size[0]}x{img.size[1]} "
              f"{os.path.getsize(caminho):6} bytes")


if __name__ == "__main__":
    main()
