# App icons for the installable 4Square / Fill the Hole web app: five element tiles round a blank "?" hole on the
# game's sky blue. Writes icons/icon-192.png, icon-512.png, icon-maskable-512.png and apple-touch-icon.png.
#   python3 docs/game/tools/make_icons.py      (needs Pillow)
import os, math
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'icons')
os.makedirs(OUT, exist_ok=True)
FIRE, WATER, AIR, EARTH = '#ef5a3c', '#3d8fe8', '#f2c230', '#4caf50'
INK = '#1c1640'


def font(px):
    for f in ('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        if os.path.exists(f): return ImageFont.truetype(f, px)
    return ImageFont.load_default()


def hexagon(cx, cy, r, rot=0):
    return [(cx + r * math.cos(rot + k * math.pi / 3), cy + r * math.sin(rot + k * math.pi / 3)) for k in range(6)]


def icon(size, safe=1.0, rounded=True):
    S = 4 * size                                           # draw big, scale down for smooth edges
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    bg = Image.new('RGBA', (S, S)); bd = ImageDraw.Draw(bg)
    for y in range(S):                                     # sky gradient, as on the title screen
        t = y / S; c = tuple(int(a + (b - a) * t) for a, b in zip((0x5f, 0xd0, 0xff), (0x2a, 0x7f, 0xdc)))
        bd.line([(0, y), (S, y)], fill=c + (255,))
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .22) if rounded else 0, fill=255)
    im.paste(bg, (0, 0), mask); d = ImageDraw.Draw(im)
    c = S / 2; R = S * .30 * safe; r = S * .135 * safe; w = max(2, int(S * .018 * safe))
    d.ellipse([c - R * 1.55, c - R * 1.45, c + R * 1.55, c + R * 1.5], fill='#ffe9b0')        # the island
    cols = [FIRE, WATER, EARTH, FIRE, AIR]                                                 # 4 elements on a 5-rim
    pts = [(c + R * math.cos(-math.pi / 2 + k * 2 * math.pi / 5), c + R * math.sin(-math.pi / 2 + k * 2 * math.pi / 5)) for k in range(5)]
    for i in range(5):                                                                      # bridges
        d.line([pts[i], pts[(i + 1) % 5]], fill='#b07a3a', width=w * 2); d.line([pts[i], (c, c)], fill='#b07a3a', width=w * 2)
    for (x, y), col in zip(pts, cols):
        d.polygon(hexagon(x, y, r), fill=col, outline=INK, width=w)
    d.polygon(hexagon(c, c, r * 1.12), fill='#ffffff', outline=INK, width=w)
    f = font(int(r * 1.35)); d.text((c, c + r * .05), '?', font=f, fill=INK, anchor='mm')
    return im.resize((size, size), Image.LANCZOS)


icon(192).save(os.path.join(OUT, 'icon-192.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(512, safe=.78, rounded=False).save(os.path.join(OUT, 'icon-maskable-512.png'))   # content inside the 80% safe zone
icon(180, rounded=False).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))  # iOS rounds it itself
print('wrote', sorted(os.listdir(OUT)))
