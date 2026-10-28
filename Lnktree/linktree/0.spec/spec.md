# CV PDF Viewer Specification

This document outlines the structure and components of the interactive PDF CV viewer.

## Overview

The CV PDF folder contains an interactive web-based PDF viewer that displays a curriculum vitae with advanced features like zoom, pan, page navigation, and clickable links with preview functionality.

## HTML Structure (`index.html`)

The main viewer is a single-page application built with semantic HTML5.

### Head Section

- **Meta tags:** Character set (`UTF-8`) and viewport settings for mobile responsiveness
- **Title:** "Diego's CV"
- **Google Analytics:** Tracking script with ID `G-VB9ENP6DZ0`
- **External Libraries:**
  - Tailwind CSS (via CDN) for styling
  - PDF.js v2.16.105 (Mozilla CDN) for PDF rendering
  - Inter font from rsms.me
- **Inline Styles:** Custom CSS for loader animation, container layout, zoom functionality, toggle switch, and mobile overrides

### Body Structure

**Main Layout:**
- Flexbox layout with full viewport height
- Centered content with max-width of 1024px (4xl)

**Components:**

1.  **Header (Sticky):**
    - A three-line layout.
    - **Line 1: Title & Page Indicator**
        - Title: "Diego's CV"
        - Page indicator: Shows current page / total pages
    - **Line 2: Download Buttons**
        - "Download:" label
        - Download "in PDF" button: Links to `DiegoNMarcos_CurriculumVitae_en.pdf`
        - Download "in Docx" button: Links to `DiegoNMarcos_CurriculumVitae_en.docx`
        - Download "in Markdown" button: Links to `DiegoNMarcos_CurriculumVitae_en.md`
        - Download "in Csv" button: Links to `DiegoNMarcos_CurriculumVitae_en.csv` (currently disabled)
    - **Line 3: Accessibility**
        - "Accessibility:" label
        - Reset zoom button (desktop only): Returns view to original state
        - Link preview toggle: iOS-style switch to enable/disable link previews

2. **Main PDF Container:**
   - ID: `pdf-container`
   - Fixed height calculated as `calc(100vh - 100px)`
   - Contains loader, error message, and zoom wrapper
   - **Loader:** Animated spinner with "Loading Document..." text
   - **Error Message:** Hidden by default, displays if PDF fails to load
   - **Zoom Wrapper:** Transform container for zoom and pan operations
   - **Viewer Content:** Dynamically generated page containers

3. **Link Preview Popup:**
   - Fixed position element that follows cursor
   - 256x192px (w-64 h-48) popup
   - Displays screenshot preview of links using WordPress mshots API
   - Hidden by default, pointer-events disabled

## CSS Styling

### Custom Inline Styles

**Core Layout:**
- **Font:** Inter font family
- **Loader Animation:** Spinning border animation (1s linear infinite)
- **PDF Container:** Scrollable container with overflow handling
- **Zoom Wrapper:** Transform origin at top-left, grab cursor on desktop

**Page Containers:**
- Individual containers for each PDF page
- Box shadow for depth effect
- White background
- Relative positioning for link layer overlay
- Centered canvas elements
- Bottom margin (1rem) between pages

**Link Layer:**
- Absolute positioning overlay
- Centered horizontally (left: 50%, transform: translateX(-50%))
- Contains clickable link elements positioned absolutely within
- Invisible clickable areas over PDF link annotations

**Toggle Switch:**
- Custom iOS-style toggle switch
- Green background (#48bb78) when checked
- Animated dot that slides on toggle
- Responsive sizing (smaller on mobile screens <640px)

**Mobile Overrides (max-width: 767px):**
- Native scrolling enabled on PDF container
- No grab cursor
- Reset button hidden
- Pan/zoom functionality disabled

### Tailwind Classes

Utilizes Tailwind utility classes throughout for:
- Background colors (bg-slate-100, bg-slate-900, bg-white, bg-gray-200)
- Dark mode variants (dark:bg-*, dark:text-*)
- Padding and margins (p-4, py-3, mb-4, etc.)
- Flexbox layouts (flex, flex-col, items-center, justify-between)
- Responsive breakpoints (sm:, md:)
- Shadow effects (shadow-lg)
- Border radius (rounded-lg, rounded-md)
- Typography (text-xl, font-bold, font-semibold)
- Spacing (gap-4, space-x-2)

## JavaScript Functionality

### Libraries and Dependencies

- **PDF.js:** Mozilla's PDF rendering library
- **Worker:** PDF.js worker for background processing

### Core Features

**1. PDF Loading and Rendering:**
- Loads PDF from `./DiegoNMarcos_CurriculumVitae_en.pdf`
- Async rendering with promise-based API
- Multi-page document support
- Dynamic page container generation with placeholder heights
- Lazy rendering with render queue system

**2. High-Quality Rendering:**
- Device pixel ratio detection for retina displays
- Quality factor of 2x for crisp rendering
- Separate viewport calculations for canvas (high-res) and display (CSS pixels)
- Canvas dimensions scaled up, CSS scaled down for sharp output

**3. Zoom and Pan System (Desktop Only):**
- **Scale Range:** 1x (min) to 4x (max)
- **Zoom Methods:**
  - Ctrl + Mouse wheel: Zoom in/out centered on cursor position
  - Calculates zoom focal point to maintain cursor position during zoom
- **Pan Methods:**
  - Mouse drag: Click and drag to pan around zoomed document
  - Mouse wheel (without Ctrl): Pan vertically and horizontally
  - Grab cursor during panning, grabbing cursor when active

**4. Page Navigation:**
- **Keyboard Navigation:** Arrow left/right keys
- **Smooth Animations:** Animated pan transitions (300ms with ease-in-out)
- **Page Indicator:** Real-time current page number based on viewport visibility
- **Scroll-Spy:** Calculates most visible page based on intersection with container

**5. Link Annotation System:**
- **Extraction:** Retrieves link annotations from PDF using `page.getAnnotations()`
- **Positioning:** Calculates absolute positions based on PDF coordinates and scale
- **Clickable Areas:** Invisible clickable overlays positioned over PDF link areas
- **Link Preview:**
  - Optional feature controlled by toggle switch
  - Hover over link shows preview popup
  - Uses WordPress mshots API: `https://s.wordpress.com/mshots/v1/{url}?w=256`
  - Popup follows cursor with 15px offset
  - MouseEnter: Shows preview
  - MouseLeave: Hides preview

**6. Render Queue System:**
- **Lazy Loading:** Only renders pages currently in or near viewport
- **Queue Management:** Set-based queue to avoid duplicate renders
- **Visibility Detection:** Checks which pages intersect with container viewport
- **Preloading:** Renders current page + adjacent pages (page-1, page+1)

**7. UI State Management:**
- **Transform State:** Tracks scale, panX, panY
- **Animation State:** Prevents conflicting animations
- **Debounced Updates:** Scheduled UI updates (50ms timeout) for performance
- **localStorage:** Persists link preview preference

**8. Viewport Calculations:**
- **Dynamic Scaling:** Calculates scale to fit container width
- **Responsive:** Adjusts to container size changes
- **Page Metrics:** Tracks page visibility and calculates most visible page

**9. Mobile Adaptations:**
- Detects mobile devices (width <= 768px)
- Disables zoom/pan interactions
- Enables native scrolling
- Hides reset button
- Removes advanced interaction event listeners

## Event Listeners

The JavaScript sets up the following event listeners:

- **`DOMContentLoaded` on `document`:** Initializes the PDF viewer
- **`change` on `#preview-toggle`:** Toggles link preview functionality
- **`click` on `#reset-zoom-btn`** (desktop only): Resets zoom and centers current page
- **`wheel` on `#pdf-container`** (desktop only): Handles zoom (with Ctrl) and pan
- **`mousedown` on `#pdf-container`** (desktop only): Initiates pan drag
- **`mouseup` on `#pdf-container`** (desktop only): Ends pan drag
- **`mouseleave` on `#pdf-container`** (desktop only): Ends pan drag
- **`mousemove` on `#pdf-container`** (desktop only): Updates pan position during drag
- **`keydown` on `document`** (desktop only): Arrow key navigation between pages
- **`mouseenter` on link elements:** Shows link preview popup
- **`mouseleave` on link elements:** Hides link preview popup

## Technical Implementation Details

### PDF Rendering Pipeline

1. Load PDF document using `pdfjsLib.getDocument()`
2. Get first page to calculate dimensions
3. Generate placeholder containers for all pages
4. Set up viewport and calculate responsive scale
5. Render pages as they enter viewport
6. Extract and position link annotations
7. Update UI with page count and enable download button

### Transform System

- Uses CSS `transform: translate() scale()` for smooth zoom/pan
- Transform origin at (0,0) for predictable scaling behavior
- Separate state tracking for scale and pan offsets
- Zoom centered on cursor position with mathematical focal point calculation

### Performance Optimizations

- Debounced UI updates (50ms) to reduce reflows
- Lazy page rendering (only visible pages)
- Background worker for PDF processing
- High-resolution canvas with CSS scaling for quality
- RequestAnimationFrame for smooth animations
- Render queue prevents duplicate render calls

### Responsive Design

- Mobile: Native scrolling, no zoom/pan
- Desktop: Full interactive features with zoom/pan
- Breakpoint: 768px
- Tailwind responsive utilities (sm:, hidden on mobile)

## File Assets

```
cv_pdf/
├── index.html                           (Main PDF viewer)
├── DiegoNMarcos_CurriculumVitae_en.pdf (The PDF file)
├── spec.md                              (This file)
├── assets/                              (Alternative versions/assets)
│   ├── index.html
│   ├── index.css
│   ├── index_css.html
│   ├── index_prezicss.html
│   ├── curriculum_html.html
│   ├── curriculum_html.css
│   └── curriculum_html.js
└── cv/                                  (Export versions)
    ├── cv_export.html                   (Google Docs exported HTML)
    ├── cv_style.css                     (Embedded fonts and styles)
    └── cv_css.html
```

## External APIs and Services

- **PDF.js CDN:** `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/`
- **Tailwind CSS CDN:** `https://cdn.tailwindcss.com`
- **Inter Font:** `https://rsms.me/inter/inter.css`
- **WordPress mshots API:** `https://s.wordpress.com/mshots/v1/` - Screenshot service for link previews
- **Google Analytics:** `https://www.googletagmanager.com/gtag/js?id=G-VB9ENP6DZ0`

## Browser Compatibility

- Modern browsers with ES6+ support
- PDF.js requires Web Workers support
- CSS transforms and transitions
- Flexbox and Grid layout support
- Pointer events API
- LocalStorage API
