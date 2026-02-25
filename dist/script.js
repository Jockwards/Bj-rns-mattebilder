class Math2Pic {
    constructor() {
        this.mathInput    = document.getElementById('mathInput');
        this.mathPreview  = document.getElementById('mathPreview');
        this.downloadBtn  = document.getElementById('downloadBtn');
        this.copyBtn      = document.getElementById('copyBtn');
        this.transparentBg = document.getElementById('transparentBg');
        this.exampleBtns  = document.querySelectorAll('.example-btn');
        this.sizeBtns     = document.querySelectorAll('.size-btn');
        this.symbolBtns   = document.querySelectorAll('.symbol-btn');
        this.imageScale   = 1.5; // default: medium

        this.initEventListeners();
    }

    initEventListeners() {
        this.downloadBtn.addEventListener('click', () => this.downloadImage('png'));
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Size selector
        this.sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.imageScale = parseFloat(btn.dataset.scale);
            });
        });

        // Symbol insert buttons
        this.symbolBtns.forEach(btn => {
            btn.addEventListener('click', () => this.insertSymbol(btn.dataset.insert));
        });

        // Auto-render on input with debounce
        let timeout;
        this.mathInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.renderMath(), 500);
        });

        // Example buttons
        this.exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.mathInput.value = btn.getAttribute('data-formula');
                this.renderMath();
            });
        });

        // Ctrl+Enter to render
        this.mathInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.renderMath();
        });
    }

    insertSymbol(text) {
        const el = this.mathInput;
        const start = el.selectionStart;
        const end   = el.selectionEnd;
        const before = el.value.slice(0, start);
        const after  = el.value.slice(end);
        el.value = before + text + after;
        // Place cursor inside braces if present, otherwise after inserted text
        const cursorOffset = text.includes('{}') ? before.length + text.indexOf('{}') + 1
                           : text.includes('()') ? before.length + text.indexOf('()') + 1
                           : text === '| |'      ? before.length + 1
                           : before.length + text.length;
        el.selectionStart = el.selectionEnd = cursorOffset;
        el.focus();
        el.dispatchEvent(new Event('input'));
    }

    convertToLatex(input) {
        let latex = input;
        latex = latex.replace(/\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/g, '\\$1');
        latex = latex.replace(/\binfinity\b/g, '\\infty');
        latex = latex.replace(/\bapprox\b/g, '\\approx');
        latex = latex.replace(/\bangle\b/g, '\\angle');
        latex = latex.replace(/\bintegral\b/g, '\\int');
        latex = latex.replace(/\bsum\b/g, '\\sum');
        latex = latex.replace(/\blim\b/g, '\\lim');
        latex = latex.replace(/\b(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp)\b/g, '\\$1');
        latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
        latex = latex.replace(/(\w+|\d+)\/(\w+|\d+)/g, '\\frac{$1}{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])_\{([^}]+)\}/g, '$1_{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])\^{([^}]+)}/g, '$1^{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])_([a-zA-Z0-9])/g, '$1_{$2}');
        latex = latex.replace(/([a-zA-Z0-9)}\]])\^([a-zA-Z0-9])/g, '$1^{$2}');
        latex = latex.replace(/(\\(?:lim|sum|int))_\{([^}]+)\}\^\{([^}]+)\}/g, '$1_{$2}^{$3}');
        latex = latex.replace(/(\\(?:lim|sum|int))_\{([^}]+)\}/g, '$1_{$2}');
        latex = latex.replace(/(\\lim)_([a-zA-Z0-9]+)\s*->\s*([a-zA-Z0-9\\infty]+)/g, '$1_{$2 \\to $3}');
        latex = latex.replace(/->/g, '\\to');
        latex = latex.replace(/<->/g, '\\leftrightarrow');
        latex = latex.replace(/<=/g, '\\leq');
        latex = latex.replace(/>=/g, '\\geq');
        latex = latex.replace(/!=/g, '\\neq');
        latex = latex.replace(/\*/g, ' \\cdot ');
        latex = latex.replace(/\+\/-/g, '\\pm');
        latex = latex.replace(/-\+/g, '\\mp');
        return latex;
    }

    async renderMath() {
        const input = this.mathInput.value.trim();
        const dlBtns = [this.downloadBtn];

        // Copy button works from raw input — enable as soon as there's text
        this.copyBtn.disabled = !input;

        if (!input) {
            this.mathPreview.innerHTML = 'Din ekvation kommer att visas här...';
            this.mathPreview.classList.remove('has-content');
            dlBtns.forEach(b => b.disabled = true);
            return;
        }

        try {
            this.mathPreview.innerHTML = '<div class="loading"></div>Renderar...';
            const latex = this.convertToLatex(input);
            this.mathPreview.innerHTML = `$$${latex}$$`;
            if (window.MathJax?.typesetPromise) {
                await window.MathJax.typesetPromise([this.mathPreview]);
            }
            this.mathPreview.classList.add('has-content');
            dlBtns.forEach(b => b.disabled = false);
        } catch (error) {
            console.error('Rendering error:', error);
            this.mathPreview.innerHTML = `<span style="color:red;">Fel vid rendering av ekvation. Kontrollera din syntax.</span>`;
            this.mathPreview.classList.remove('has-content');
            dlBtns.forEach(b => b.disabled = true);
        }
    }

    async downloadImage(format = 'png') {
        const svgElement = this.mathPreview.querySelector('svg');
        if (!svgElement) { alert('Ingen ekvation att ladda ner. Rendera en ekvation först.'); return; }
        try {
            this.convertSVGToCanvas(svgElement, format);
        } catch (error) {            console.error('Download error:', error);
            alert('Misslyckades med att ladda ner bild. Försök igen.');
        }
    }

    convertSVGToCanvas(svgElement, format) {
        const transparent = format === 'png' && this.transparentBg.checked;
        try {
            const standalone = this.buildStandaloneSVG(svgElement, 20, transparent);
            this.rasterizeStandaloneSVG(standalone, format, this.imageScale, transparent);
        } catch (e) {
            console.error('SVG conversion failed:', e);
            this.fallbackTextDownload(format);
        }
    }

    buildStandaloneSVG(svgElement, padding = 20, transparent = false) {
        const clone = svgElement.cloneNode(true);
        clone.removeAttribute('style');
        let bbox;
        try {
            bbox = svgElement.getBBox();
        } catch (e) {
            const r = svgElement.getBoundingClientRect();
            bbox = { x: 0, y: 0, width: r.width, height: r.height };
        }
        const width  = Math.max(2, Math.ceil(bbox.width)  + padding * 2);
        const height = Math.max(2, Math.ceil(bbox.height) + padding * 2);
        const translateX = padding - bbox.x;
        const translateY = padding - bbox.y;
        const serializer = new XMLSerializer();
        const children = Array.from(clone.childNodes).map(n => serializer.serializeToString(n)).join('');
        let defsBlock = '';
        if (!children.includes('<defs')) {
            const globalSVG = document.querySelector('svg.mjx-svg-global, svg[style*="width: 0"][style*="height: 0"], svg[height="0"][width="0"]');
            if (globalSVG) {
                const defsNode = globalSVG.querySelector('defs');
                if (defsNode) defsBlock = serializer.serializeToString(defsNode);
            }
        }
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
            defsBlock,
            transparent ? '' : '<rect width="100%" height="100%" fill="white"/>',
            `<g transform="translate(${translateX}, ${translateY})">${children}</g>`,
            '</svg>'
        ].join('');
    }

    rasterizeStandaloneSVG(svgString, format, scale = 2, transparent = false) {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const img  = new Image();

        const drawAndDownload = (imgEl, cleanup) => {
            const canvas = document.createElement('canvas');
            canvas.width  = imgEl.width  * scale;
            canvas.height = imgEl.height * scale;
            const ctx = canvas.getContext('2d');
            if (!transparent) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.setTransform(scale, 0, 0, scale, 0, 0);
            ctx.drawImage(imgEl, 0, 0);
            if (cleanup) cleanup();
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            canvas.toBlob((blobOut) => {
                if (!blobOut) { this.fallbackTextDownload(format); return; }
                const outUrl = URL.createObjectURL(blobOut);
                const a = document.createElement('a');
                a.href = outUrl;
                a.download = `matematik-ekvation.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(outUrl);
            }, mimeType, format === 'jpg' ? 0.92 : 1.0);
        };

        img.onload = () => { drawAndDownload(img, () => URL.revokeObjectURL(url)); };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            try {
                const base64  = btoa(unescape(encodeURIComponent(svgString)));
                const dataUrl = 'data:image/svg+xml;base64,' + base64;
                const img2 = new Image();
                img2.onload  = () => drawAndDownload(img2, null);
                img2.onerror = () => this.fallbackTextDownload(format);
                img2.src = dataUrl;
            } catch (e) { this.fallbackTextDownload(format); }
        };
        img.src = url;
    }

    async copyToClipboard() {
        const input = this.mathInput.value.trim();
        if (!input) { alert('Ingen ekvation att kopiera. Skriv en ekvation först.'); return; }
        if (!navigator.clipboard?.writeText) {
            alert('Din webbläsare stöder inte kopiering till urklipp.');
            return;
        }
        try {
            const unicode = this.convertToUnicode(input);
            await navigator.clipboard.writeText(unicode);
            this.copyBtn.textContent = '✓ Kopierad!';
            setTimeout(() => { this.copyBtn.textContent = 'Kopiera till urklipp som text*'; }, 2000);
        } catch (err) {
            console.error('Clipboard error:', err);
            alert('Misslyckades med att kopiera till urklipp.');
        }
    }

    convertToUnicode(input) {
        const superMap = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','n':'ⁿ','i':'ⁱ','+':'⁺','-':'⁻','a':'ᵃ','b':'ᵇ','c':'ᶜ','k':'ᵏ','m':'ᵐ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','x':'ˣ','y':'ʸ','z':'ᶻ' };
        const subMap   = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','n':'ₙ','i':'ᵢ','a':'ₐ','k':'ₖ','m':'ₘ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ' };
        const greekMap = { alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',upsilon:'υ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω' };

        let s = input;

        // Greek letters
        s = s.replace(/\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/gi,
            m => greekMap[m.toLowerCase()] || m);

        // Common words
        s = s.replace(/\binfinity\b/gi, '∞');
        s = s.replace(/\bapprox\b/gi, '≈');
        s = s.replace(/\bangle\b/gi, '∠');
        s = s.replace(/\bsqrt\(([^)]+)\)/g, '√($1)');
        s = s.replace(/\bintegral\b/gi, '∫');
        s = s.replace(/\bsum\b/gi, 'Σ');
        s = s.replace(/\blim\b/gi, 'lim');

        // Fractions: (a)/(b) or a/b
        s = s.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '($1)/($2)');

        // Superscripts: ^{abc} or ^x (single char)
        s = s.replace(/\^\{([^}]+)\}/g, (_, exp) =>
            [...exp].map(c => superMap[c] || c).join(''));
        s = s.replace(/\^([a-zA-Z0-9])/g, (_, c) => superMap[c] || ('^' + c));

        // Subscripts: _{abc} or _x (single char)
        s = s.replace(/_\{([^}]+)\}/g, (_, sub) =>
            [...sub].map(c => subMap[c] || c).join(''));
        s = s.replace(/_([a-zA-Z0-9])/g, (_, c) => subMap[c] || ('_' + c));

        // Operators
        s = s.replace(/<->/g, '↔');
        s = s.replace(/->/g, '→');
        s = s.replace(/<=/g, '≤');
        s = s.replace(/>=/g, '≥');
        s = s.replace(/!=/g, '≠');
        s = s.replace(/\+\/-/g, '±');
        s = s.replace(/-\+/g, '∓');
        s = s.replace(/\*/g, '·');

        return s;
    }

    rasterizeToBlob(svgString, scale = 2) {
        return new Promise((resolve, reject) => {
            const tryRasterize = (src, cleanup) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width  = img.width  * scale;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.setTransform(scale, 0, 0, scale, 0, 0);
                        ctx.drawImage(img, 0, 0);
                        if (cleanup) cleanup();
                        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1.0);
                    } catch (e) { reject(e); }
                };
                img.onerror = () => {
                    if (cleanup) cleanup();
                    reject(new Error('Image load failed'));
                };
                img.src = src;
            };

            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const img  = new Image();
            img.onload = () => {
                tryRasterize(url, () => URL.revokeObjectURL(url));
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                try {
                    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
                    tryRasterize(dataUrl, null);
                } catch (e) { reject(e); }
            };
            img.src = url;
        });
    }

    fallbackTextDownload(format) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 200;
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 400, 200);
        ctx.fillStyle = 'black'; ctx.font = '24px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.mathInput.value, 200, 100);
        ctx.font = '12px sans-serif';
        ctx.fillText('(Förenklad textversion)', 200, 140);
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob((blob) => {
            if (!blob) { alert('Misslyckades med att skapa bild.'); return; }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `matematik-ekvation.${format}`;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(url);
        }, mimeType, 0.9);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const initApp = () => {
        new Math2Pic();

        // Show keyboard shortcut hint briefly
        const hint = document.createElement('div');
        hint.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.8);color:white;padding:10px;border-radius:5px;font-size:12px;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:1000;';
        hint.textContent = 'Tryck Ctrl+Enter för att rendera ekvation';
        document.body.appendChild(hint);
        setTimeout(() => {
            hint.style.opacity = '1';
            setTimeout(() => { hint.style.opacity = '0'; }, 3000);
        }, 1000);
    };

    if (window.MathJax?.startup?.promise) {
        window.MathJax.startup.promise.then(initApp).catch(initApp);
    } else {
        setTimeout(() => {
            if (window.MathJax?.startup?.promise) {
                window.MathJax.startup.promise.then(initApp).catch(initApp);
            } else {
                initApp();
            }
        }, 2000);
    }
});
