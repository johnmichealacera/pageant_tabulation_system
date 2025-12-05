# Pageant Winner Image Guide

## Current Setup

The login page is currently using a beautiful image from Unsplash. The code will automatically:
1. Try to load the Unsplash image first
2. Fallback to `/public/pageant-winner.png` if the external image fails
3. Show a placeholder with instructions if both fail

## Recommended Free Image Sources

### Option 1: Pixabay (Best Quality)
- **URL**: https://pixabay.com/illustrations/winner-woman-beauty-pageant-contest-7785333/
- **Resolution**: 2000 x 3100 pixels
- **Format**: PNG with transparent background
- **License**: Free for commercial use
- **How to use**: Download and save as `/public/pageant-winner.png`

### Option 2: Unsplash
- **Search**: "beauty queen", "pageant winner", "crown"
- **URL**: https://unsplash.com/s/photos/beauty-queen
- **License**: Free to use
- **Note**: Most images have backgrounds (not transparent)

### Option 3: Pexels
- **Search**: "pageant", "beauty queen"
- **URL**: https://www.pexels.com/search/pageant/
- **License**: Free to use

## How to Use Your Own Image

1. **Download a high-quality image** (recommended: 800-1200px height, portrait orientation)
2. **Save it as** `pageant-winner.png` in the `/public` folder
3. **The code will automatically use it** as a fallback

## Image Requirements

- **Format**: PNG (with transparent background preferred) or JPG
- **Orientation**: Portrait (vertical)
- **Size**: 800-1200px height recommended
- **Content**: Beautiful woman with crown or in elegant pageant attire
- **Background**: Transparent or light background works best

## Current Image Source

The code is currently configured to use:
- Primary: Unsplash image (beauty/portrait)
- Fallback: Local `/public/pageant-winner.png`
- Final fallback: Placeholder with instructions

## Customization

To change the image source, edit `src/app/auth/signin/page.tsx`:

```tsx
// Change this line to use a different image:
src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop&q=80"

// Or use your local image directly:
src="/pageant-winner.png"
```
