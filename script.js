// MathJax configuration
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        macros: {
            // Add some common macros
            'infinity': '\\infty',
            'integral': '\\int',
            'sum': '\\sum',
            'lim': '\\lim'
        }
    },
    svg: {
        // Use 'none' so each equation's SVG contains its own <defs> glyph paths (easier for export)
        fontCache: 'none',
        scale: 1.2
    }
};

class Math2Pic {
    constructor() {
        this.mathInput = document.getElementById('mathInput');
        this.mathPreview = document.getElementById('mathPreview');
        this.renderBtn = document.getElementById('renderBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadJpgBtn = document.getElementById('downloadJpgBtn');
        this.exampleBtns = document.querySelectorAll('.example-btn');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.renderBtn.addEventListener('click', () => this.renderMath());
        this.downloadBtn.addEventListener('click', () => this.downloadImage('png'));
        this.downloadJpgBtn.addEventListener('click', () => this.downloadImage('jpg'));
    // Removed SVG and test buttons
        
        // Auto-render on input with debounce
        let timeout;
        this.mathInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.renderMath(), 500);
        });

        // Example buttons
        this.exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const formula = btn.getAttribute('data-formula');
                this.mathInput.value = formula;
                this.renderMath();
            });
        });

        // Enter key to render
        this.mathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.renderMath();
            }
        });
    }

    convertToLatex(input) {
        let latex = input;
        
        // Convert common patterns to LaTeX
        latex = latex.replace(/\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/g, '\\$1');
        latex = latex.replace(/\binfinity\b/g, '\\infty');
        latex = latex.replace(/\bintegral\b/g, '\\int');
        latex = latex.replace(/\bsum\b/g, '\\sum');
        latex = latex.replace(/\blim\b/g, '\\lim');
        
        // Handle function names
        latex = latex.replace(/\b(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp)\b/g, '\\$1');
        
        // Convert sqrt() to LaTeX
        latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        
        // Convert fractions with parentheses
        latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
        
        // Convert simple fractions
        latex = latex.replace(/(\w+|\d+)\/(\w+|\d+)/g, '\\frac{$1}{$2}');
        
        // Convert subscripts and superscripts
        latex = latex.replace(/([a-zA-Z0-9)}\]])_\{([^}]+)\}/g, '$1_{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])\^{([^}]+)}/g, '$1^{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])_([a-zA-Z0-9])/g, '$1_{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])\^([a-zA-Z0-9])/g, '$1^{$2}');
        
        // Handle limits, sums, and integrals with subscripts/superscripts
        latex = latex.replace(/(\\(?:lim|sum|int))_\{([^}]+)\}\^\{([^}]+)\}/g, '$1_{$2}^{$3}');
        latex = latex.replace(/(\\(?:lim|sum|int))_\{([^}]+)\}/g, '$1_{$2}');
        latex = latex.replace(/(\\lim)_([a-zA-Z0-9]+)\s*->\s*([a-zA-Z0-9\\infty]+)/g, '$1_{$2 \\to $3}');
        
        // Convert arrows
        latex = latex.replace(/->/g, '\\to');
        latex = latex.replace(/<->/g, '\\leftrightarrow');
        latex = latex.replace(/<=/g, '\\leq');
        latex = latex.replace(/>=/g, '\\geq');
        latex = latex.replace(/!=/g, '\\neq');
        
        // Handle multiplication (optional)
        latex = latex.replace(/\*/g, '\\cdot');
        
        // Plus/minus
        latex = latex.replace(/\+\/-/g, '\\pm');
        latex = latex.replace(/-\+/g, '\\mp');
        
        return latex;
    }

    async renderMath() {
        const input = this.mathInput.value.trim();
        
        if (!input) {
            this.mathPreview.innerHTML = 'Din ekvation kommer att visas här...';
            this.mathPreview.classList.remove('has-content');
            this.downloadBtn.disabled = true;
            this.downloadJpgBtn.disabled = true;
            // SVG button removed
            return;
        }

        try {
            // Show loading
            this.mathPreview.innerHTML = '<div class="loading"></div>Renderar...';
            
            // Convert user input to LaTeX
            const latex = this.convertToLatex(input);
            
            // Create math expression for MathJax
            const mathExpression = `$$${latex}$$`;
            
            // Clear and render
            this.mathPreview.innerHTML = mathExpression;
            
            // Wait for MathJax to render
            if (window.MathJax?.typesetPromise) {
                await window.MathJax.typesetPromise([this.mathPreview]);
            }
            
            this.mathPreview.classList.add('has-content');
            this.downloadBtn.disabled = false;
            this.downloadJpgBtn.disabled = false;
            // SVG button removed
            
        } catch (error) {
            console.error('Rendering error:', error);
            this.mathPreview.innerHTML = `<span style="color: red;">Fel vid rendering av ekvation. Kontrollera din syntax.</span>`;
            this.mathPreview.classList.remove('has-content');
            this.downloadBtn.disabled = true;
            this.downloadJpgBtn.disabled = true;
            // SVG button removed
        }
    }

    async downloadImage(format = 'png') {
        console.log('Download initiated for format:', format);
        const svgElement = this.mathPreview.querySelector('svg');
        
        if (!svgElement) {
            console.error('No SVG element found');
            alert('Ingen ekvation att ladda ner. Rendera en ekvation först.');
            return;
        }

        console.log('SVG element found:', svgElement);

        try {
            if (format === 'svg') {
                console.log('Downloading as SVG...');
                // Direct SVG download with complete markup
                const svgData = this.createCompleteSVG(svgElement);
                console.log('SVG data created, length:', svgData.length);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'matematik-ekvation.svg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('SVG download completed');
                return;
            }

            console.log('Downloading as raster image...');
            // For PNG/JPG, create a proper canvas
            this.convertSVGToCanvas(svgElement, format);
            
        } catch (error) {
            console.error('Download error:', error);
            alert('Misslyckades med att ladda ner bild. Försök igen.');
        }
    }

    createCompleteSVG(svgElement) {
        // Get the actual SVG content from MathJax
        const svgClone = svgElement.cloneNode(true);
        const svgRect = svgElement.getBoundingClientRect();
        
        // Get dimensions or use defaults
        const width = Math.max(svgRect.width || 200, 100);
        const height = Math.max(svgRect.height || 50, 30);
        
        // Set proper attributes on the clone
        svgClone.setAttribute('width', width);
        svgClone.setAttribute('height', height);
        svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Create a complete SVG with proper headers and white background
        const completeSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width + 40}" height="${height + 40}" viewBox="0 0 ${width + 40} ${height + 40}">
    <rect width="100%" height="100%" fill="white"/>
    <g transform="translate(20, 20)">
        ${svgClone.innerHTML}
    </g>
</svg>`;
        
        console.log('Created complete SVG:', completeSVG.substring(0, 200) + '...');
        return completeSVG;
    }

    convertSVGToCanvas(svgElement, format) {
        console.log('Converting SVG to canvas for format (high fidelity):', format);
        try {
            const standalone = this.buildStandaloneSVG(svgElement, 20);
            this.rasterizeStandaloneSVG(standalone, format);
        } catch (e) {
            console.error('High fidelity conversion failed, falling back:', e);
            // Last resort: old fallback path
            this.fallbackTextDownload(format);
        }
    }

    // Build a standalone self-contained SVG string from the MathJax-produced <svg>
    buildStandaloneSVG(svgElement, padding = 20) {
        // Deep clone so we don't mutate original
        const clone = svgElement.cloneNode(true);
        // Ensure namespace attributes (MathJax may rely on xlink)
        clone.removeAttribute('style'); // remove inline CSS width in ex units
        // Use getBBox for tight content
        let bbox;
        try {
            bbox = svgElement.getBBox();
        } catch (e) {
            console.warn('getBBox failed, falling back to rect()', e);
            const r = svgElement.getBoundingClientRect();
            bbox = { x: 0, y: 0, width: r.width, height: r.height };
        }
        const width = Math.max(2, Math.ceil(bbox.width) + padding * 2);
        const height = Math.max(2, Math.ceil(bbox.height) + padding * 2);
        const translateX = padding - bbox.x;
        const translateY = padding - bbox.y;
        // Serialize defs + content
        const serializer = new XMLSerializer();
        // We only want inner content (children of original svg)
        const children = Array.from(clone.childNodes).map(node => serializer.serializeToString(node)).join('');
        let defsBlock = '';
        // If this output lacks defs (can happen if fontCache was global or stripped), try to harvest from global cache
        if (!children.includes('<defs')) {
            console.warn('No <defs> inside expression SVG. Attempting to copy from global MathJax cache.');
            const globalCandidates = [
                'svg.mjx-svg-global',
                'svg[style*="width: 0"][style*="height: 0"]',
                'svg[height="0"][width="0"]'
            ];
            let globalSVG = null;
            for (const sel of globalCandidates) {
                globalSVG = document.querySelector(sel);
                if (globalSVG) break;
            }
            if (globalSVG) {
                const defsNode = globalSVG.querySelector('defs');
                if (defsNode) {
                    defsBlock = serializer.serializeToString(defsNode);
                    console.log('Copied global MathJax <defs> for export');
                } else {
                    console.warn('Global MathJax SVG found but no <defs> child');
                }
            } else {
                console.warn('No global MathJax SVG cache found');
            }
        }
        const svgParts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
            defsBlock,
            '<rect width="100%" height="100%" fill="white"/>',
            `<g transform="translate(${translateX}, ${translateY})">${children}</g>`,
            '</svg>'
        ];
        const svgString = svgParts.join('');
        console.log('Standalone SVG built (length,bbox,hasDefs):', svgString.length, bbox, svgString.includes('<defs'));
        return svgString;
    }

    // Rasterize the standalone SVG string to PNG/JPG via an offscreen canvas
    rasterizeStandaloneSVG(svgString, format) {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        // Important for proper sizing
        img.onload = () => {
            try {
                const scale = 2; // higher DPI
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.setTransform(scale, 0, 0, scale, 0, 0);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                canvas.toBlob((blobOut) => {
                    if (!blobOut) {
                        console.error('Canvas toBlob failed');
                        this.fallbackTextDownload(format);
                        return;
                    }
                    const outUrl = URL.createObjectURL(blobOut);
                    const a = document.createElement('a');
                    a.href = outUrl;
                    a.download = `matematik-ekvation.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(outUrl);
                    console.log('Raster download complete');
                }, mimeType, format === 'jpg' ? 0.92 : 1.0);
            } catch (err) {
                console.error('Rasterization error:', err);
                this.fallbackTextDownload(format);
            }
        };
        img.onerror = (err) => {
            console.error('Image load error for SVG rasterization. Will attempt data URI path.', err);
            URL.revokeObjectURL(url);
            // Try a secondary path using data URI (some browsers stricter with blob + svg)
            try {
                const base64 = btoa(unescape(encodeURIComponent(svgString)));
                const dataUrl = 'data:image/svg+xml;base64,' + base64;
                const img2 = new Image();
                img2.onload = () => {
                    try {
                        const scale = 2;
                        const canvas = document.createElement('canvas');
                        canvas.width = img2.width * scale;
                        canvas.height = img2.height * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.setTransform(scale, 0, 0, scale, 0, 0);
                        ctx.drawImage(img2, 0, 0);
                        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                        canvas.toBlob(b => {
                            if (!b) { this.fallbackTextDownload(format); return; }
                            const outUrl = URL.createObjectURL(b);
                            const a = document.createElement('a');
                            a.href = outUrl;
                            a.download = `matematik-ekvation.${format}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(outUrl);
                            console.log('Raster download (data URI path) complete');
                        }, mimeType, format === 'jpg' ? 0.92 : 1.0);
                    } catch (e2) {
                        console.error('Secondary rasterization failed:', e2);
                        this.fallbackTextDownload(format);
                    }
                };
                img2.onerror = e3 => {
                    console.error('Data URI image load also failed:', e3);
                    this.fallbackTextDownload(format);
                };
                img2.src = dataUrl;
            } catch (convErr) {
                console.error('Could not create data URI for SVG:', convErr);
                this.fallbackTextDownload(format);
            }
        };
        img.src = url;
    }


    getMathJaxStyles() {
        // Get MathJax styles from the page
        const styleSheets = Array.from(document.styleSheets);
        let mathJaxStyles = '';
        
        try {
            styleSheets.forEach(sheet => {
                if (sheet.href?.includes('mathjax')) {
                    try {
                        Array.from(sheet.cssRules).forEach(rule => {
                            mathJaxStyles += rule.cssText + '\n';
                        });
                    } catch (_) {
                        // Can't access cross-origin styles, that's ok
                    }
                }
            });
        } catch (e) {
            console.log('Could not extract MathJax styles:', e);
        }
        
        // Add some basic math font styles as fallback
        return mathJaxStyles + `
            .mjx-math { font-family: 'MJXZERO', 'MJXTEX'; }
            .mjx-mi { font-style: italic; }
            .mjx-mn { font-style: normal; }
            .mjx-mo { font-style: normal; }
        `;
    }

    // Removed legacy alternativeSVGRender

    downloadCanvasAsImage(canvas, format) {
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `matematik-ekvation.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Alternative rendering download completed');
            }
        }, mimeType, format === 'jpg' ? 0.9 : 1.0);
    }

    parseAndRenderMath(text) {
        // Convert common math notation to Unicode symbols
        let result = text;
        
        // Replace common patterns with Unicode math symbols
        result = result.replace(/\^2/g, '²');
        result = result.replace(/\^3/g, '³');
    result = result.replace(/\^(\d)/g, (_, digit) => {
            const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
            return superscripts[parseInt(digit)];
        });
        
    result = result.replace(/_(\d)/g, (_, digit) => {
            const subscripts = '₀₁₂₃₄₅₆₇₈₉';
            return subscripts[parseInt(digit)];
        });
        
        // Replace common math symbols
        result = result.replace(/\*/g, '·');
        result = result.replace(/sqrt\(([^)]+)\)/g, '√($1)');
        result = result.replace(/infinity/g, '∞');
        result = result.replace(/alpha/g, 'α');
        result = result.replace(/beta/g, 'β');
        result = result.replace(/gamma/g, 'γ');
        result = result.replace(/delta/g, 'δ');
        result = result.replace(/pi/g, 'π');
        result = result.replace(/theta/g, 'θ');
        result = result.replace(/lambda/g, 'λ');
        result = result.replace(/sigma/g, 'σ');
        result = result.replace(/omega/g, 'ω');
        
        // Replace arrows and inequalities
        result = result.replace(/->/g, '→');
        result = result.replace(/<=/g, '≤');
        result = result.replace(/>=/g, '≥');
        result = result.replace(/!=/g, '≠');
        result = result.replace(/\+\/-/g, '±');
        
        return result;
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    fallbackTextDownload(format) {
        console.log('Using fallback text download for format:', format);
        // Create canvas with math text as fallback
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const width = 400;
        const height = 200;
        canvas.width = width;
        canvas.height = height;
        
        // Fill background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Get the math formula text
        const mathText = this.mathInput.value;
        
        // Set font for math rendering
        ctx.fillStyle = 'black';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the formula text
        ctx.fillText(mathText, width / 2, height / 2);
        
        // Add a note that this is a fallback
        ctx.font = '12px sans-serif';
        ctx.fillText('(Förenklad textversion)', width / 2, height / 2 + 40);
        
        // Convert to blob and download
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `matematik-ekvation.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                alert('Misslyckades med att skapa bild.');
            }
        }, mimeType, 0.9);
    }

    testDownload() {
        // Test if basic download functionality works
        console.log('Testing download functionality...');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 300;
        canvas.height = 100;
        
        // Fill background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 300, 100);
        
        // Draw test text
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Test nedladdning fungerar!', 150, 50);
        
        // Download as PNG
        canvas.toBlob((blob) => {
            if (blob) {
                console.log('Blob created successfully, size:', blob.size);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'test-nedladdning.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Test download successful');
            } else {
                console.error('Test download failed - no blob created');
                alert('Test nedladdning misslyckades');
            }
        }, 'image/png');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if MathJax is available and ready
    const initApp = () => {
        new Math2Pic();
    };
    
    if (window.MathJax?.startup?.promise) {
        // Wait for MathJax to be ready
        window.MathJax.startup.promise.then(initApp).catch(() => {
            // If MathJax fails to load, still initialize the app
            console.warn('MathJax failed to load, initializing without it');
            initApp();
        });
    } else {
        // MathJax not loaded yet, wait a bit and try again
        setTimeout(() => {
            if (window.MathJax?.startup?.promise) {
                window.MathJax.startup.promise.then(initApp).catch(initApp);
            } else {
                // Initialize anyway after a delay
                initApp();
            }
        }, 2000);
    }
});

// Add some helpful keyboard shortcuts info
document.addEventListener('DOMContentLoaded', () => {
    const helpText = document.createElement('div');
    helpText.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        z-index: 1000;
    `;
    helpText.innerHTML = 'Tryck Ctrl+Enter för att rendera ekvation';
    document.body.appendChild(helpText);
    
    // Show help text briefly on load
    setTimeout(() => {
        helpText.style.opacity = '1';
        setTimeout(() => {
            helpText.style.opacity = '0';
        }, 3000);
    }, 1000);
});
