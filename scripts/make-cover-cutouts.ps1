Add-Type -AssemblyName System.Drawing

$source = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class GameCoverCutout {
    static bool IsBackground(byte[] pixels, int offset, int minimumLight, int maximumSpread) {
        int blue = pixels[offset];
        int green = pixels[offset + 1];
        int red = pixels[offset + 2];
        int minimum = Math.Min(red, Math.Min(green, blue));
        int maximum = Math.Max(red, Math.Max(green, blue));
        return minimum >= minimumLight && maximum - minimum <= maximumSpread;
    }

    static Bitmap LoadWorkingImage(string sourcePath, Rectangle? crop, int maximumEdge) {
        using (Image source = Image.FromFile(sourcePath)) {
            Rectangle sourceArea = crop ?? new Rectangle(0, 0, source.Width, source.Height);
            double scale = Math.Min(1.0, (double)maximumEdge / Math.Max(sourceArea.Width, sourceArea.Height));
            int width = Math.Max(1, (int)Math.Round(sourceArea.Width * scale));
            int height = Math.Max(1, (int)Math.Round(sourceArea.Height * scale));
            Bitmap result = new Bitmap(width, height, PixelFormat.Format32bppArgb);
            using (Graphics graphics = Graphics.FromImage(result)) {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.DrawImage(source, new Rectangle(0, 0, width, height), sourceArea, GraphicsUnit.Pixel);
            }
            return result;
        }
    }

    public static void Remove(string sourcePath, string targetPath, int minimumLight, int maximumSpread, int maximumEdge, Rectangle? crop) {
        Remove(sourcePath, targetPath, minimumLight, maximumSpread, maximumEdge, crop, false);
    }

    public static void Remove(string sourcePath, string targetPath, int minimumLight, int maximumSpread, int maximumEdge, Rectangle? crop, bool keepLargestObject) {
        using (Bitmap bitmap = LoadWorkingImage(sourcePath, crop, maximumEdge)) {
            int width = bitmap.Width;
            int height = bitmap.Height;
            Rectangle bounds = new Rectangle(0, 0, width, height);
            BitmapData data = bitmap.LockBits(bounds, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            bool[] removed = new bool[width * height];
            Queue<int> queue = new Queue<int>();

            Action<int, int> enqueue = (x, y) => {
                if (x < 0 || x >= width || y < 0 || y >= height) return;
                int point = y * width + x;
                if (removed[point]) return;
                int offset = y * stride + x * 4;
                if (!IsBackground(pixels, offset, minimumLight, maximumSpread)) return;
                removed[point] = true;
                queue.Enqueue(point);
            };

            for (int x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
            for (int y = 1; y < height - 1; y++) { enqueue(0, y); enqueue(width - 1, y); }

            while (queue.Count > 0) {
                int point = queue.Dequeue();
                int x = point % width;
                int y = point / width;
                enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
            }

            bool[] keep = null;
            if (keepLargestObject) {
                bool[] seen = new bool[width * height];
                List<int> largest = new List<int>();
                Queue<int> foregroundQueue = new Queue<int>();
                for (int start = 0; start < width * height; start++) {
                    if (removed[start] || seen[start]) continue;
                    List<int> component = new List<int>();
                    seen[start] = true;
                    foregroundQueue.Enqueue(start);
                    while (foregroundQueue.Count > 0) {
                        int point = foregroundQueue.Dequeue();
                        component.Add(point);
                        int x = point % width;
                        int y = point / width;
                        int[] neighbors = new int[] { point - 1, point + 1, point - width, point + width };
                        for (int index = 0; index < neighbors.Length; index++) {
                            int neighbor = neighbors[index];
                            if (neighbor < 0 || neighbor >= width * height) continue;
                            int neighborX = neighbor % width;
                            if (index < 2 && Math.Abs(neighborX - x) != 1) continue;
                            if (removed[neighbor] || seen[neighbor]) continue;
                            seen[neighbor] = true;
                            foregroundQueue.Enqueue(neighbor);
                        }
                    }
                    if (component.Count > largest.Count) largest = component;
                }
                keep = new bool[width * height];
                foreach (int point in largest) keep[point] = true;
            }

            int left = width, top = height, right = -1, bottom = -1;
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int point = y * width + x;
                    int offset = y * stride + x * 4;
                    if (removed[point] || (keepLargestObject && !keep[point])) pixels[offset + 3] = 0;
                    if (pixels[offset + 3] != 0) {
                        if (x < left) left = x;
                        if (x > right) right = x;
                        if (y < top) top = y;
                        if (y > bottom) bottom = y;
                    }
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
            bitmap.UnlockBits(data);

            if (right < left || bottom < top) throw new InvalidOperationException("No foreground remained in " + sourcePath);
            const int padding = 12;
            int croppedWidth = right - left + 1 + padding * 2;
            int croppedHeight = bottom - top + 1 + padding * 2;
            using (Bitmap cropped = new Bitmap(croppedWidth, croppedHeight, PixelFormat.Format32bppArgb)) {
                using (Graphics graphics = Graphics.FromImage(cropped)) {
                    graphics.Clear(Color.Transparent);
                    graphics.CompositingMode = CompositingMode.SourceCopy;
                    graphics.DrawImageUnscaled(bitmap, padding - left, padding - top);
                }
                Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
                cropped.Save(targetPath, ImageFormat.Png);
            }
        }
    }

}
'@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$real = Join-Path $root 'assets\real'

[GameCoverCutout]::Remove((Join-Path $real 'catan-box.jpg'), (Join-Path $real 'catan-box-cutout.png'), 220, 38, 1200, $null)
[GameCoverCutout]::Remove((Join-Path $real 'secret-hitler-box.jpg'), (Join-Path $real 'secret-hitler-box-cutout.png'), 190, 55, 1200, $null)
[GameCoverCutout]::Remove((Join-Path $real 'el-camarero-box.jpg'), (Join-Path $real 'el-camarero-box-cutout.png'), 185, 60, 1200, $null)
[GameCoverCutout]::Remove((Join-Path $real 'monopoly-box.jpg'), (Join-Path $real 'monopoly-box-cutout.png'), 235, 28, 1200, $null)
[GameCoverCutout]::Remove((Join-Path $real 'burako-box-components.jpg'), (Join-Path $real 'burako-box-cutout.png'), 185, 60, 1200, [System.Drawing.Rectangle]::new(45, 90, 485, 225), $true)
[GameCoverCutout]::Remove((Join-Path $real 'truco-box.jpg'), (Join-Path $real 'truco-box-cutout.png'), 150, 52, 1200, [System.Drawing.Rectangle]::new(260, 300, 1060, 1800), $true)

Write-Output 'Created transparent game-cover cutouts.'
