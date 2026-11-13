---
{
 "order": 12,
 "group": "Agents, crawlers and files",
 "category": "Print preparation",
 "title": "Image Resolution for Print: Pixels Needed at 300 DPI (Size Chart)",
 "h1": "How many pixels you need to print at 300 DPI",
 "description": "Pixel dimensions for A-series, US Letter and photo print sizes at 150, 300 and 600 DPI, the formula to calculate any size, how viewing distance changes the requirement, and why changing the DPI number alone does nothing.",
 "deck": "A printer does not care what the DPI field in your file says. It cares how many pixels you have and how large you ask it to print them. One formula and one table answer almost every \"is this image big enough?\" question.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["PrintSpec Lab", "https://printspeclab.guagua-alvin.top/"]],
 "related": ["block-ai-crawlers-robots-txt", "write-agents-md"],
 "cta": {"title": "Check a real file in seconds", "text": "Drop in an image or PDF to see its pixel dimensions, the largest size it prints at 300 DPI, and whether it meets a target size. Files are processed in your browser and are not uploaded.", "label": "Open PrintSpec Lab", "url": "https://printspeclab.guagua-alvin.top/"},
 "sources": [
  ["ISO 216: paper sizes (A and B series)", "https://www.iso.org/standard/36631.html"],
  ["Adobe: image size and resolution", "https://helpx.adobe.com/photoshop/using/image-size-resolution.html"],
  ["Wikipedia: pixel density and dots per inch", "https://en.wikipedia.org/wiki/Dots_per_inch"]
 ],
 "faq": [
  ["How many pixels is A4 at 300 DPI?", "A4 is 210 × 297 mm, or 8.27 × 11.69 inches. At 300 pixels per inch that is 2480 × 3508 pixels, about 8.7 megapixels. With a 3 mm bleed on every side the file should be 2551 × 3579 pixels."],
  ["Is 72 DPI good enough for printing?", "Not for anything viewed at reading distance. At 72 pixels per inch individual pixels are visible and edges look soft or jagged. It can be acceptable for very large prints seen from several metres away, such as banners, where the eye cannot resolve the detail."],
  ["Can I change an image from 72 DPI to 300 DPI?", "You can change the number, but that alone adds nothing. If you change the DPI setting without resampling, the pixels stay the same and the image is simply defined as a smaller print. If you resample to add pixels, the software invents them; the result is larger but not sharper than the original."],
  ["What is the difference between DPI and PPI?", "PPI, pixels per inch, describes how many image pixels are printed in each inch. DPI, dots per inch, describes how many ink dots a printer places per inch, which is usually a much higher number because several dots are needed to reproduce one pixel's colour. In everyday use, and in most print shop specifications, 'DPI' is used to mean PPI."]
 ]
}
---
## The one formula

```text
pixels needed = print size in inches × pixels per inch
```

An 8 × 10 inch print at 300 pixels per inch needs 8 × 300 = 2400 pixels by 10 × 300 = 3000 pixels. Working in millimetres, divide by 25.4 first: 210 mm ÷ 25.4 = 8.27 inches.

Turned around, the same formula tells you how large a given image can print:

```text
maximum print size in inches = pixels ÷ pixels per inch
```

A 6000 × 4000 pixel photograph prints at 20 × 13.3 inches at 300 PPI, and at 40 × 26.7 inches at 150 PPI.

Print shops ask for "300 DPI" because, at normal reading distance of roughly 30 cm, most people cannot see individual pixels at that density. It is a convention for a viewing distance, not a law.

## Paper sizes at 150, 300 and 600 DPI

Pixel dimensions are rounded to the nearest whole pixel.

| Size | Millimetres | Inches | 150 DPI | 300 DPI | 600 DPI |
|---|---|---|---|---|---|
| A6 | 105 × 148 | 4.13 × 5.83 | 620 × 874 | 1240 × 1748 | 2480 × 3496 |
| A5 | 148 × 210 | 5.83 × 8.27 | 874 × 1240 | 1748 × 2480 | 3496 × 4961 |
| A4 | 210 × 297 | 8.27 × 11.69 | 1240 × 1754 | 2480 × 3508 | 4961 × 7016 |
| A3 | 297 × 420 | 11.69 × 16.54 | 1754 × 2480 | 3508 × 4961 | 7016 × 9921 |
| A2 | 420 × 594 | 16.54 × 23.39 | 2480 × 3508 | 4961 × 7016 | 9921 × 14031 |
| A1 | 594 × 841 | 23.39 × 33.11 | 3508 × 4967 | 7016 × 9933 | 14031 × 19866 |
| A0 | 841 × 1189 | 33.11 × 46.81 | 4967 × 7022 | 9933 × 14043 | 19866 × 28087 |
| US Letter | 216 × 279 | 8.5 × 11 | 1275 × 1650 | 2550 × 3300 | 5100 × 6600 |
| US Legal | 216 × 356 | 8.5 × 14 | 1275 × 2100 | 2550 × 4200 | 5100 × 8400 |
| Tabloid | 279 × 432 | 11 × 17 | 1650 × 2550 | 3300 × 5100 | 6600 × 10200 |

Each step up the A series doubles the area, so the pixel count doubles too: an A3 file at 300 DPI has twice the pixels of an A4 file.

## Photo and card sizes at 300 DPI

| Print | Inches | Pixels at 300 DPI | Megapixels |
|---|---|---|---|
| Business card (US) | 3.5 × 2 | 1050 × 600 | 0.6 |
| Business card (EU, 85 × 55 mm) | 3.35 × 2.17 | 1004 × 650 | 0.7 |
| Photo 4 × 6 | 4 × 6 | 1200 × 1800 | 2.2 |
| Photo 5 × 7 | 5 × 7 | 1500 × 2100 | 3.2 |
| Photo 8 × 10 | 8 × 10 | 2400 × 3000 | 7.2 |
| Photo 11 × 14 | 11 × 14 | 3300 × 4200 | 13.9 |
| Poster 18 × 24 | 18 × 24 | 5400 × 7200 | 38.9 |
| Poster 24 × 36 | 24 × 36 | 7200 × 10800 | 77.8 |

A 12-megapixel phone photo (4000 × 3000) comfortably covers an 8 × 10 print at 300 DPI. It does not cover a 24 × 36 poster at 300 DPI, but it does not need to, for the reason in the next section.

## Bigger prints need fewer pixels per inch

People look at large prints from further away, and the eye resolves less detail at a distance. That is why a billboard can be printed at 20 PPI and look sharp from the road.

| Typical use | Viewing distance | Reasonable resolution |
|---|---|---|
| Books, magazines, flyers, photo prints | About 30 cm | 300 PPI |
| Small posters, wall calendars | About 1 m | 150 to 200 PPI |
| Large posters, exhibition panels | 1.5 to 3 m | 100 to 150 PPI |
| Banners, building wraps | 5 m and more | 30 to 75 PPI |

So the 4000 × 3000 phone photo printed at 24 × 36 inches gives about 111 PPI across the long side after cropping to shape, which is fine for a poster on a wall. The table of sizes above is a requirement for work that will be held in the hand, not a universal rule.

Two cases need more than 300. Line art and text stored as pixels, such as scanned drawings, logos saved as images and barcodes, show jagged edges at 300 and are usually prepared at 600 to 1200 PPI. Better still, keep text and logos as vectors, which have no resolution and print sharply at any size.

## The DPI number in the file is only a label

An image file stores a grid of pixels and, optionally, a density value such as 72 or 300. That value is metadata. It changes how large a layout program places the image by default, and nothing else. A 3000 × 2000 pixel image labelled 72 DPI and the same image labelled 300 DPI contain identical data and print identically at the same physical size.

This is the source of the most common misunderstanding in print preparation:

| What you did | What actually changed |
|---|---|
| Changed 72 to 300 **without** resampling | Nothing in the pixels. The default print size became smaller |
| Changed 72 to 300 **with** resampling | The software invented about 17 times as many pixels. The file is bigger, not more detailed |
| Exported from a design tool "at 300 DPI" | Usually a real change: the tool rendered more pixels for the same layout size |

When a printer rejects a file as "72 DPI", the real message is "this image does not have enough pixels for the size you ordered". Check the pixel dimensions against the table. If they are enough, the label is irrelevant; if they are not, relabelling will not help.

Upscaling tools, including AI-based ones, can make an enlargement look cleaner by generating plausible detail. That is often acceptable for photographs and risky for anything where accuracy matters, such as small text, faces, product details and maps, because the added detail is a guess.

## Bleed, trim and safe area

If colour or an image runs to the edge of the page, the file must extend beyond the final size, because cutting is never perfectly accurate. The extra margin is the **bleed**, commonly 3 mm in Europe and 0.125 inch (3.2 mm) in North America, on every side.

| Final size | With 3 mm bleed | Pixels at 300 DPI |
|---|---|---|
| A5, 148 × 210 mm | 154 × 216 mm | 1819 × 2551 |
| A4, 210 × 297 mm | 216 × 303 mm | 2551 × 3579 |
| US Letter with 0.125 in bleed | 8.75 × 11.25 in | 2625 × 3375 |

Keep text and logos inside a **safe area** at least 3 to 5 mm inside the trim line, so that a slightly off-centre cut does not clip them. Always follow the specific template your printer provides; binding methods and large formats often need more.

## Other things printers check

- **Colour mode.** Commercial presses print in CMYK. Many online printers accept RGB and convert it, but bright screen colours, especially saturated greens and blues, will look duller on paper. Ask what they want.
- **File format.** PDF is the usual delivery format because it keeps vectors and fonts intact. For images, TIFF or high-quality JPEG; avoid repeatedly re-saving JPEGs, which accumulates compression artefacts.
- **Fonts.** Embed them in the PDF or convert text to outlines.
- **Black text.** Small text should be pure black (100% K), not a mix of four inks, or slight misregistration makes it look blurred.
- **Images inside a PDF.** A PDF page has a physical size, but each placed image has its own effective resolution, which depends on how much it was scaled in the layout. A photo placed at 200% of its size has half its original PPI.

## A quick decision procedure

1. Find the final printed size in inches, including bleed.
2. Multiply each side by the PPI appropriate for the viewing distance: 300 for hand-held items.
3. Compare with the image's pixel dimensions, not its DPI label.
4. If the image is short by a small margin, say 250 PPI instead of 300, it will usually print well. If it has less than half the pixels needed, find a larger original or print smaller.

> Resolution cannot be added afterwards. Keep the largest original you have, crop and resize copies, and export for print as the last step.
