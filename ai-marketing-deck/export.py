# slides/*.png -> export/slides/*.jpg, export/ai-marketing-deck.pdf, export/index.html (viewer), export/contact-sheet.jpg
import glob, os, shutil
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(root, 'export')
os.makedirs(os.path.join(out, 'slides'), exist_ok=True)
pngs = sorted(glob.glob(os.path.join(root, 'slides', '*.png')))
ims = []
for p in pngs:
    im = Image.open(p).convert('RGB')
    im.save(os.path.join(out, 'slides', os.path.basename(p).replace('.png', '.jpg')), quality=92)
    ims.append(im)
ims[0].save(os.path.join(out, 'ai-marketing-deck.pdf'), save_all=True, append_images=ims[1:], resolution=144)
shutil.copy(os.path.join(root, 'viewer.html'), os.path.join(out, 'index.html'))
cols, tw, th = 4, 640, 360
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), '#030303')
for i, im in enumerate(ims):
    sheet.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
sheet.save(os.path.join(out, 'contact-sheet.jpg'), quality=88)
print(len(ims), 'slides exported')
