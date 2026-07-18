from PIL import Image
import sys

def extend_alpha(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    
    # Calculate the average color of opaque pixels
    pixels = img.load()
    r_sum, g_sum, b_sum, count = 0, 0, 0, 0
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if a > 128:
                r_sum += r
                g_sum += g
                b_sum += b
                count += 1
                
    if count > 0:
        avg_color = (r_sum // count, g_sum // count, b_sum // count)
    else:
        avg_color = (255, 255, 255)
        
    # Create background with this average color
    bg = Image.new("RGBA", img.size, avg_color + (255,))
    bg.alpha_composite(img)
    bg.convert("RGB").save(output_path, "PNG")
    print(f"Saved {output_path} with background color {avg_color}")

if __name__ == "__main__":
    path = r"c:\Users\venkatasatyaraviteja\Desktop\Work Space\Outer-Projects\BizzDeal\bizz-deal-FE\src\assets\icon-background.png"
    extend_alpha(path, path)
