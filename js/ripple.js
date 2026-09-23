/**
 * ripple.js - Inward Collapse & Focal Amplification (opposite from the version for Saraswati)
 * Also, adjusted max rad to 0.4x so it starts out visible.
 */
const RIPPLE_CONFIG = {
    STEP: 2, 
    VELOCITY: 10.0,            // Speed of inward collapse
    BASE_DISPLACEMENT: 25.0,   // Base pixel shift at outer radius
    DEFAULT_PADDING: 1.05,     // Scale factor relative to screen boundaries (1.05 = just outside edge)
    WAVE_WIDTH: 80.0,          // Thickness of the wave ring
    FREQUENCY: 0.1,            // Wave oscillation density
    MIN_INTERVAL: 400 
};

let canvas, ctx, img, referenceData, outputImageData, outputBuffer;
let ripples = [];
let LastRippleTime = 0;

function initRippleEngine() {
    canvas = document.getElementById('rippleCanvas');
    ctx = canvas.getContext('2d', { alpha: false });
    
    canvas.addEventListener('mousedown', (e) => { triggerRipple(e); });

    img = new Image();
    img.src = 'img/Conduit-bg.webp';
    img.onload = () => {
        const w = canvas.width = img.naturalWidth;
        const h = canvas.height = img.naturalHeight;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        
        const rawData = tempCtx.getImageData(0, 0, w, h).data;
        referenceData = new Uint32Array(rawData.buffer);
        
        outputImageData = ctx.createImageData(w, h);
        outputBuffer = new Uint32Array(outputImageData.data.buffer);
        
        requestAnimationFrame(renderLoop);
    };
}

function triggerRipple(e) {
    const now = Date.now();
    if (now - LastRippleTime < RIPPLE_CONFIG.MIN_INTERVAL) return;
    LastRippleTime = now;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Calculate maximum distance to any of the 4 canvas corners
    const distToTopLeft     = Math.hypot(clickX, clickY);
    const distToTopRight    = Math.hypot(canvas.width - clickX, clickY);
    const distToBottomLeft  = Math.hypot(clickX, canvas.height - clickY);
    const distToBottomRight = Math.hypot(canvas.width - clickX, canvas.height - clickY);

    // Maximum visible distance from click point to screen boundary
    const maxVisibleDist = Math.max(distToTopLeft, distToTopRight, distToBottomLeft, distToBottomRight);

    // Dynamic starting radius: starts just outside the furthest visible corner
    const startRadius = maxVisibleDist * RIPPLE_CONFIG.DEFAULT_PADDING * 0.4;

    ripples.push({
        x: clickX,
        y: clickY,
        radius: startRadius,
        initialRadius: startRadius // Store for focal gain scaling
    });
    
    new Audio('./audio/bubble.wav').play().catch(() => {});
}

function renderLoop() {
    if (ripples.length === 0) {
        ctx.drawImage(img, 0, 0);
        requestAnimationFrame(renderLoop);
        return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const s = RIPPLE_CONFIG.STEP;

    outputBuffer.set(referenceData);

    for (let y = 0; y < h; y += s) {
        for (let x = 0; x < w; x += s) {
            let dX = 0, dY = 0, active = false;
            
            for (let i = 0; i < ripples.length; i++) {
                const r = ripples[i];
                const dx = x - r.x;
                const dy = y - r.y;
                const dist = Math.hypot(dx, dy);
                
                // Distance relative to current collapsing ring position
                const delta = dist - r.radius;

                // Process pixels within the wave's active band
                if (Math.abs(delta) < RIPPLE_CONFIG.WAVE_WIDTH) {
                    active = true;
                    
                    // Gaussian bell curve profile for smooth falloff around ring center
                    const envelope = Math.exp(-Math.pow(delta / (RIPPLE_CONFIG.WAVE_WIDTH * 0.5), 2));
                    
                    // Scale amplification relative to where this specific wave started
                    const focalGain = (r.initialRadius / Math.max(r.radius, 40));
                    const currentAmplitude = RIPPLE_CONFIG.BASE_DISPLACEMENT * focalGain;
                    
                    // Compute pixel shift magnitude
                    const displacement = Math.sin(delta * RIPPLE_CONFIG.FREQUENCY) * envelope * currentAmplitude;
                    
                    // Normalize vector direction
                    const norm = dist || 1;
                    dX += (dx / norm) * displacement;
                    dY += (dy / norm) * displacement;
                }
            }

            if (active) {
                const tx = Math.min(w - 1, Math.max(0, (x + dX) | 0));
                const ty = Math.min(h - 1, Math.max(0, (y + dY) | 0));
                const color = referenceData[ty * w + tx];

                for (let ky = 0; ky < s && (y + ky) < h; ky++) {
                    const offset = (y + ky) * w;
                    for (let kx = 0; kx < s && (x + kx) < w; kx++) {
                        outputBuffer[offset + (x + kx)] = color;
                    }
                }
            }
        }
    }

    ctx.putImageData(outputImageData, 0, 0);
    updateRipplePhysics();
    requestAnimationFrame(renderLoop);
}

function updateRipplePhysics() {
    for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].radius -= RIPPLE_CONFIG.VELOCITY;
        
        if (ripples[i].radius <= 0) {
            ripples.splice(i, 1);
        }
    }
}

window.triggerRipple = triggerRipple;
window.initRippleEngine = initRippleEngine;
