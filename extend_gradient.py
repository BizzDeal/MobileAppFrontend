from PIL import Image
from collections import deque
import sys

def extend_gradient(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    queue = deque()
    visited = set()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 128:
                visited.add((x, y))
                queue.append((x, y, r, g, b))
                
    while queue:
        x, y, r, g, b = queue.popleft()
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    visited.add((nx, ny))
                    pixels[nx, ny] = (r, g, b, 255)
                    queue.append((nx, ny, r, g, b))
                    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 128:
                pixels[x, y] = (r, g, b, 255)

    img.convert("RGB").save(output_path, "PNG")
    print(f"Gradient extended and saved to {output_path}")

if __name__ == "__main__":
    path = r"c:\Users\venkatasatyaraviteja\Desktop\Work Space\Outer-Projects\BizzDeal\bizz-deal-FE\src\assets\icon-background.png"
    extend_gradient(path, path)
