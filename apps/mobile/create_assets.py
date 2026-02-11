#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

# Crear icono 1024x1024
icon = Image.new('RGB', (1024, 1024), color='#4F46E5')
draw = ImageDraw.Draw(icon)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 400)
except:
    font = ImageFont.load_default()
draw.text((512, 512), 'CL', fill='white', anchor='mm', font=font)
icon.save('assets/icon.png')

# Crear adaptive icon (Android) 1024x1024
icon.save('assets/adaptive-icon.png')

# Crear splash 2048x2048
splash = Image.new('RGB', (2048, 2048), color='white')
draw_splash = ImageDraw.Draw(splash)
try:
    font_splash = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 200)
except:
    font_splash = ImageFont.load_default()
draw_splash.text((1024, 1024), 'ContaLink', fill='#4F46E5', anchor='mm', font=font_splash)
splash.save('assets/splash.png')

# Crear favicon 48x48
favicon = icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save('assets/favicon.png')

print("✅ Assets creados exitosamente:")
print("   - assets/icon.png (1024x1024)")
print("   - assets/adaptive-icon.png (1024x1024)")
print("   - assets/splash.png (2048x2048)")
print("   - assets/favicon.png (48x48)")
