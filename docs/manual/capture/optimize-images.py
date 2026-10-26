"""Shrinks the manual's PNG screenshots: 256-colour palette with dithering, kept only if smaller.
   python3 optimize-images.py [file ...]   (default: every PNG under ../images)"""
import sys
from pathlib import Path
from PIL import Image

files = [Path(f) for f in sys.argv[1:]] or sorted((Path(__file__).parent.parent / 'images').rglob('*.png'))
saved = 0
for f in files:
    before = f.stat().st_size
    img = Image.open(f).convert('RGB')
    q = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    tmp = f.with_suffix('.tmp.png')
    q.save(tmp, optimize=True)
    after = tmp.stat().st_size
    if after < before * 0.9:
        tmp.replace(f)
        saved += before - after
        print(f'{f.name}: {before // 1024} KB -> {after // 1024} KB')
    else:
        tmp.unlink()
print(f'saved {saved // 1024} KB')
