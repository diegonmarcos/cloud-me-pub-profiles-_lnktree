# MINDMAP IFRAME PERFORMANCE DIAGNOSIS
**Date**: 2026-01-22
**Issue**: Mindmap iframe extremely laggy, not using GPU, flickering/crashing, showing background page

---

## CRITICAL ISSUES IDENTIFIED

### 🔴 PROBLEM 1: IFRAME NOT USING GPU ACCELERATION

**Current iframe HTML:**
```html
<iframe
    id="mindmap-iframe"
    src=""
    frameborder="0"
    allow="fullscreen">
</iframe>
```

**MISSING GPU-CRITICAL ATTRIBUTES:**
- ❌ NO `allow="accelerometer; gyroscope"` (needed for WebGL)
- ❌ NO explicit GPU hints
- ❌ NO `loading="eager"` (may lazy-load and miss GPU context)
- ❌ NO `sandbox` attribute (but may affect performance)

**CSS Issues:**
```scss
#mindmap-iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 24px;  // ⚠️ FORCES SOFTWARE RENDERING!
}
```
- `border-radius` on iframe PREVENTS GPU compositing
- Browser must use CPU to clip rounded corners frame-by-frame
- WebGL inside iframe can't use GPU layer if parent is CPU-rendered

**FIX:**
```html
<iframe
    id="mindmap-iframe"
    src=""
    frameborder="0"
    loading="eager"
    allow="accelerometer; gyroscope; fullscreen"
    style="transform: translateZ(0); will-change: contents;">
</iframe>
```

---

### 🔴 PROBLEM 2: BACKGROUND VIDEO COMPETING FOR GPU

**Current background video:**
```html
<video autoplay muted loop playsinline id="background-video">
```

**CSS:**
```scss
#background-video {
    position: fixed;
    z-index: -2;
    will-change: transform;  // ⚠️ RESERVES GPU LAYER!
    transform: translateZ(0); // ⚠️ FORCES GPU LAYER!
}
```

**CONFLICT:**
- Video has `will-change: transform` → reserves GPU layer
- Video is ALWAYS PLAYING even when mindmap is open
- GPU must render: video + backdrop-filter + WebGL iframe simultaneously
- Mobile GPUs can't handle this load

**FIX:**
1. **PAUSE video when mindmap opens**
2. **Remove will-change when not needed**
3. **Disable backdrop-filter when overlay is active**

---

### 🔴 PROBLEM 3: BACKDROP-FILTER KILLING PERFORMANCE

**Current overlay CSS:**
```scss
.mindmap-overlay {
    backdrop-filter: blur(10px);       // ⚠️ EXTREMELY EXPENSIVE!
    -webkit-backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.85);
}
```

**WHY IT'S SLOW:**
- `backdrop-filter: blur()` is ONE OF THE MOST EXPENSIVE CSS OPERATIONS
- Must sample and blur EVERY PIXEL behind the overlay
- Runs on CPU if GPU is busy with WebGL
- Re-renders on EVERY frame of the video behind it

**EVEN WORSE - Multiple backdrop-filters:**
```scss
.mindmap-btn {
    backdrop-filter: blur(12px);  // ⚠️
}
.controls-fab {
    backdrop-filter: blur(12px);  // ⚠️
}
.mindmap-overlay {
    backdrop-filter: blur(10px);  // ⚠️
}
```

**FIX:**
- Remove backdrop-filter from overlay (use solid background instead)
- OR: Add `.mindmap-overlay.active ~ .mindmap-btn { backdrop-filter: none; }`

---

### 🔴 PROBLEM 4: IFRAME RELOADS ON EVERY OPEN

**Current code:**
```typescript
const openOverlay = () => {
    iframe.src = mindmapUrl;  // ⚠️ RELOADS EVERY TIME!
    addClass(overlay, 'active');
    addClass(mindmapBtn, 'hidden');
};
```

**PROBLEM:**
- Every time you open mindmap, iframe RELOADS from scratch
- WebGL context must reinitialize
- All shaders must recompile
- All textures must re-upload to GPU
- Takes 1-3 seconds on mobile

**FIX:**
- Load iframe ONCE on page load
- Keep it loaded but hidden
- Just show/hide the overlay container

---

### 🔴 PROBLEM 5: TRANSFORM TRANSITIONS BLOCKING GPU

**Current CSS:**
```scss
.mindmap-overlay-content {
    transform: scale(0.9);
    transition: transform 0.4s ease;  // ⚠️ ANIMATES WHILE LOADING!

    .mindmap-overlay.active & {
        transform: scale(1);
    }
}
```

**PROBLEM:**
- Scale animation runs WHILE iframe is loading WebGL
- GPU must handle: scale transform + WebGL init + video + backdrop-filter
- Scale forces repaint of entire iframe content
- WebGL may not get GPU context while transform is animating

**FIX:**
- Remove scale animation
- Use opacity fade only (cheaper)

---

### 🔴 PROBLEM 6: Z-INDEX LAYERING ISSUES

**Current z-index stack:**
```scss
#background-video {        z-index: -2;   }
body::after {              z-index: -1;   }
.container {               z-index: 1;    }
.controls-fab-container {  z-index: 1000; }
.mindmap-overlay {         z-index: 2000; }
.mindmap-overlay-close {   z-index: 2001; }
.mindmap-btn {             z-index: 2500; }
```

**PROBLEM:**
- Video at z-index -2 creates separate compositing layer
- Overlay at z-index 2000 creates another layer
- GPU must composite 4+ layers with effects
- Iframe inside overlay may create sub-layers

**WHY FLICKERING HAPPENS:**
- When GPU is overloaded, it drops frames
- Browser may fall back to showing cached layer (background page)
- Z-index reordering may happen out of sync
- Iframe content may not be ready when overlay fades in

---

### 🔴 PROBLEM 7: NO IFRAME ERROR HANDLING

**Current code has NO:**
- iframe `onerror` handler
- iframe `onload` handler
- Loading state/spinner
- Timeout detection
- Fallback behavior

**WHAT HAPPENS:**
- If mindmap page fails to load → blank iframe
- If mindmap page is slow → no feedback
- If WebGL fails → user sees nothing
- If cross-origin issues → silent failure

---

### 🔴 PROBLEM 8: MINDMAP PAGE ISSUES (EXTERNAL)

**The mindmap page itself may have:**
1. **No GPU hints in HTML:**
   - Missing `<meta name="renderer" content="webkit">`
   - Missing viewport settings for GPU

2. **WebGL not using hardware acceleration:**
   - Check if using `powerPreference: "high-performance"`
   - Check if using `antialias: false` (expensive on mobile)
   - Check if using `preserveDrawingBuffer: false`

3. **Shader compilation blocking main thread:**
   - Are shaders compiled synchronously?
   - Are programs linked before first frame?

4. **Too many draw calls:**
   - How many triangles per frame?
   - Are textures batched?
   - Is there overdraw?

5. **Heavy JavaScript running:**
   - Physics simulations?
   - Node graph calculations?
   - Layout algorithms?

---

## DIAGNOSTIC TESTS TO RUN

### Test 1: GPU Acceleration Check
```javascript
// In browser console on mindmap page:
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
console.log('Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
console.log('Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
```
**Expected:** Should show GPU name (Intel/AMD/Nvidia)
**If shows "SwiftShader" or "Software"** → NOT USING GPU!

### Test 2: Compositing Layers Check
```
Chrome DevTools → More Tools → Layers
```
- Check how many layers exist
- Check if video/overlay/iframe are separate layers
- Check for "squashing" warnings

### Test 3: Performance Recording
```
Chrome DevTools → Performance → Record while opening mindmap
```
Look for:
- Long tasks (>50ms) - indicates main thread blocking
- GPU activity - should be high, not low
- Scripting time - should be minimal
- Layout thrashing - indicates forced reflows

### Test 4: Memory Usage
```
Chrome DevTools → Memory → Take heap snapshot
```
- Check for memory leaks (growing on each open/close)
- Check texture memory usage
- Check if old WebGL contexts are being released

---

## PRIORITY FIXES (IMPLEMENT IN ORDER)

### 🔥 CRITICAL (Do First):

1. **PAUSE BACKGROUND VIDEO when mindmap opens**
   ```typescript
   const video = document.getElementById('background-video');
   const openOverlay = () => {
       video?.pause();
       // ... rest
   };
   const closeOverlay = () => {
       video?.play();
       // ... rest
   };
   ```

2. **REMOVE BACKDROP-FILTER from overlay**
   ```scss
   .mindmap-overlay {
       background: rgba(0, 0, 0, 0.95); // Solid, not transparent
       // backdrop-filter: blur(10px); // ← DELETE THIS
   }
   ```

3. **REMOVE BORDER-RADIUS from iframe**
   ```scss
   #mindmap-iframe {
       border: none;
       // border-radius: 24px; // ← DELETE THIS (use on wrapper instead)
   }
   ```

4. **ADD GPU HINTS to iframe**
   ```html
   <iframe
       allow="accelerometer; gyroscope; fullscreen"
       style="transform: translateZ(0); will-change: contents;">
   ```

5. **REMOVE SCALE ANIMATION**
   ```scss
   .mindmap-overlay-content {
       // transform: scale(0.9); // ← DELETE
       // transition: transform 0.4s ease; // ← DELETE
   }
   ```

### ⚠️ HIGH PRIORITY:

6. **LOAD IFRAME ONCE (don't reload)**
   ```typescript
   let iframeLoaded = false;
   const openOverlay = () => {
       if (!iframeLoaded) {
           iframe.src = mindmapUrl;
           iframeLoaded = true;
       }
       // ... rest
   };
   ```

7. **ADD LOADING SPINNER**
   ```html
   <div class="mindmap-loading">Loading mindmap...</div>
   ```

8. **ADD ERROR HANDLING**
   ```typescript
   iframe.addEventListener('load', () => {
       // Hide loading spinner
   });
   iframe.addEventListener('error', () => {
       // Show error message
   });
   ```

### 📋 MEDIUM PRIORITY:

9. **Optimize z-index layers** (reduce layer count)
10. **Add intersection observer** (only load when visible)
11. **Add connection check** (don't load on slow networks)

---

## EXPECTED IMPROVEMENTS

After implementing CRITICAL fixes:
- **GPU usage**: Should go from ~10% to ~60-80%
- **CPU usage**: Should drop from ~80% to ~20%
- **FPS**: Should go from ~15fps to ~60fps
- **Load time**: Should drop from 3s to <1s (after first load)
- **Flickering**: Should completely stop
- **Crashes**: Should be eliminated

---

## TOOLS FOR TESTING

**Chrome DevTools:**
- Performance → Rendering → Frame Rendering Stats
- Performance → Rendering → Paint Flashing
- Performance → Rendering → Layer Borders
- More Tools → Rendering → Scrolling Performance Issues

**Firefox DevTools:**
- Performance → Gecko Profiler
- about:support → Graphics (check GPU status)

**Safari DevTools:**
- Develop → Show Web Inspector → Timelines

---

## CONCLUSION

The mindmap iframe is laggy because:
1. ❌ Iframe has no GPU hints
2. ❌ Border-radius forces software rendering
3. ❌ Background video competing for GPU
4. ❌ Backdrop-filter extremely expensive
5. ❌ Iframe reloads every time
6. ❌ Scale animation during load
7. ❌ No error handling

**The flickering/crashing happens because:**
- GPU is overloaded and drops frames
- Browser shows cached background layer when GPU can't keep up
- Z-index compositing fails under load
- Iframe content not ready when overlay shows

**Fix these 5 things FIRST:**
1. Pause video when mindmap opens
2. Remove backdrop-filter
3. Remove border-radius from iframe
4. Add GPU hints to iframe
5. Remove scale animation

This should make it smooth even on mobile!
