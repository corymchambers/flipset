# Flipset Icon Source

## Tools Used
- **htmlcsstoimage.com** - Convert HTML/CSS to PNG images
- **remove.bg** - Remove backgrounds from images (free version limited to 500x500)

## Colors
- Cyan: `rgb(34, 211, 238)` / `#22D3EE`
- Dark background: `#0a0a0a`

## Icon Files
- `icon-dark-bg.png` - 1024x1024, dark background (use for iOS App Store)
- `icon-white-bg.png` - 1024x1024, white background
- `icon-transparent.png` - 500x500, transparent background (use for Android adaptive icon and in-app)

## Source HTML

### Dark Background Version (1024x1024)
```html
<div style="width: 1024px; height: 1024px; border-radius: 220px; background: #0a0a0a; border: 18px solid rgb(34, 211, 238); box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 211, 238)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
  </svg>
</div>
```

### Transparent Background Version (1024x1024)
```html
<div style="width: 1024px; height: 1024px; display: flex; align-items: center; justify-content: center; background: transparent;">
  <div style="width: 880px; height: 880px; border-radius: 190px; background: transparent; border: 18px solid rgb(34, 211, 238); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 211, 238)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
    </svg>
  </div>
</div>
```

### SVG Only (for in-app use)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 211, 238)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
  <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
  <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
</svg>
```

## Original Tailwind Version (from Lovable prototype)
```html
<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 p-[1px]">
  <div class="w-full h-full bg-black rounded-xl flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers w-6 h-6 text-cyan-400">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
    </svg>
  </div>
</div>
```

## Notes
- iOS App Store requires 1024x1024 with solid background (no transparency)
- iOS automatically rounds corners
- For transparent exports, htmlcsstoimage.com adds white background - use remove.bg to remove it
- The icon uses the Lucide "layers" icon
