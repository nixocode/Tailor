/**
 * TAILOR - Ultra-Snappy Interactive Scripts
 * Optimized for 200fps feel with instant responsiveness
 */

(() => {
    'use strict';

    // ============================================
    // PERFORMANCE UTILITIES
    // ============================================

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    // Throttle for scroll events
    const throttle = (fn, wait) => {
        let last = 0;
        return (...args) => {
            const now = performance.now();
            if (now - last >= wait) {
                last = now;
                fn(...args);
            }
        };
    };

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // SCROLL REVEAL (Ultra-fast)
    // ============================================

    const initScrollReveal = () => {
        const elements = document.querySelectorAll('.reveal');

        if (prefersReducedMotion) {
            elements.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Immediate reveal for snappy feel
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -20px 0px'
        });

        elements.forEach(el => observer.observe(el));
    };

    // ============================================
    // NAVIGATION
    // ============================================

    const initNavigation = () => {
        const nav = document.getElementById('nav');
        if (!nav || nav.classList.contains('nav-scrolled-always')) return;

        let isScrolled = false;

        const updateNav = throttle(() => {
            const shouldBeScrolled = window.scrollY > 50;
            if (shouldBeScrolled !== isScrolled) {
                isScrolled = shouldBeScrolled;
                nav.classList.toggle('scrolled', isScrolled);
            }
        }, 50);

        window.addEventListener('scroll', updateNav, { passive: true });
    };

    // ============================================
    // HERO CANVAS - Seeing Theory Style Force Physics
    // ============================================

    const initHeroCanvas = () => {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas || prefersReducedMotion) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        let width, height, centerX, centerY;
        let animationId;
        let isVisible = true;

        // Mouse state
        let mouseX = -9999, mouseY = -9999;

        // Scroll dispersion state
        let scrollProgress = 0;

        // Click shockwave state
        let shockwaves = [];

        // Physics constants
        const HOME_STRENGTH = 0.005;
        const CURSOR_REPULSION = 8000;
        const DAMPING = 0.88;
        const BALL_COUNT = 280;

        // Color palette (Seeing Theory inspired)
        const COLORS = [
            '#009cde', // blue
            '#46c8b2', // teal
            '#f5d800', // yellow
            '#ff8b22', // orange
            '#ff6859', // coral
            '#fc4d77', // pink
        ];

        // Ball nodes
        let nodes = [];

        // ---- Quadtree for collision detection ----
        class QuadTree {
            constructor(x, y, w, h, depth = 0) {
                this.x = x; this.y = y;
                this.w = w; this.h = h;
                this.depth = depth;
                this.items = [];
                this.children = null;
            }
            insert(node) {
                if (this.children) {
                    const idx = this._getIndex(node);
                    if (idx !== -1) { this.children[idx].insert(node); return; }
                }
                this.items.push(node);
                if (this.items.length > 8 && this.depth < 6 && !this.children) {
                    this._split();
                    let i = this.items.length;
                    while (i--) {
                        const idx = this._getIndex(this.items[i]);
                        if (idx !== -1) {
                            this.children[idx].insert(this.items.splice(i, 1)[0]);
                        }
                    }
                }
            }
            retrieve(node, result) {
                if (this.children) {
                    const idx = this._getIndex(node);
                    if (idx !== -1) {
                        this.children[idx].retrieve(node, result);
                    } else {
                        for (let i = 0; i < 4; i++) this.children[i].retrieve(node, result);
                    }
                }
                for (let i = 0; i < this.items.length; i++) result.push(this.items[i]);
                return result;
            }
            _getIndex(node) {
                const mx = this.x + this.w / 2;
                const my = this.y + this.h / 2;
                const r = node.r;
                const top = node.y - r < my && node.y + r < my;
                const bottom = node.y - r > my;
                const left = node.x - r < mx && node.x + r < mx;
                const right = node.x - r > mx;
                if (right) { if (top) return 0; if (bottom) return 2; }
                if (left) { if (top) return 1; if (bottom) return 3; }
                return -1;
            }
            _split() {
                const hw = this.w / 2, hh = this.h / 2;
                const d = this.depth + 1;
                this.children = [
                    new QuadTree(this.x + hw, this.y, hw, hh, d),
                    new QuadTree(this.x, this.y, hw, hh, d),
                    new QuadTree(this.x, this.y + hh, hw, hh, d),
                    new QuadTree(this.x + hw, this.y + hh, hw, hh, d),
                ];
            }
        }

        const generateNodes = () => {
            nodes = [];
            for (let i = 0; i < BALL_COUNT; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * Math.min(width, height) * 0.35;
                const homeX = centerX + Math.cos(angle) * dist;
                const homeY = centerY + Math.sin(angle) * dist;
                nodes.push({
                    // Start above viewport for rain-in effect
                    x: Math.random() * width,
                    y: -50 - Math.random() * height,
                    homeX, homeY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3,
                    r: 4 + Math.random() * 12,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                });
            }
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            generateNodes();
        };

        const simulate = () => {
            // Build quadtree for collisions
            const qt = new QuadTree(0, 0, width, height);
            for (let i = 0; i < nodes.length; i++) qt.insert(nodes[i]);

            // Update shockwaves (decay over time)
            const now = performance.now();
            shockwaves = shockwaves.filter(s => now - s.time < 400);

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];

                // 1. Return to home position — gentle pull back to where it spawned
                const gdx = n.homeX - n.x;
                const gdy = n.homeY - n.y;
                n.vx += gdx * HOME_STRENGTH;
                n.vy += gdy * HOME_STRENGTH;

                // 2. Scroll dispersion — push outward when scrolling past hero
                if (scrollProgress > 0) {
                    const sdx = n.x - centerX;
                    const sdy = n.y - centerY;
                    const sDist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
                    const disperseForce = scrollProgress * 2.5;
                    n.vx += (sdx / sDist) * disperseForce;
                    n.vy += (sdy / sDist) * disperseForce;
                }

                // 3. Cursor repulsion — strong push away from mouse
                const cdx = n.x - mouseX;
                const cdy = n.y - mouseY;
                const cDistSq = cdx * cdx + cdy * cdy;
                if (cDistSq > 0 && cDistSq < 200 * 200) {
                    const cDist = Math.sqrt(cDistSq);
                    const force = CURSOR_REPULSION / cDistSq;
                    n.vx += (cdx / cDist) * force;
                    n.vy += (cdy / cDist) * force;
                }

                // 4. Click shockwave — radial burst from click point
                for (let s = 0; s < shockwaves.length; s++) {
                    const sw = shockwaves[s];
                    const age = (now - sw.time) / 400; // 0 → 1
                    const swdx = n.x - sw.x;
                    const swdy = n.y - sw.y;
                    const swDistSq = swdx * swdx + swdy * swdy;
                    const swRadius = 300;
                    if (swDistSq < swRadius * swRadius && swDistSq > 0) {
                        const swDist = Math.sqrt(swDistSq);
                        const swForce = (1 - age) * 15 * (1 - swDist / swRadius);
                        n.vx += (swdx / swDist) * swForce;
                        n.vy += (swdy / swDist) * swForce;
                    }
                }

                // 5. Collision with other nearby balls
                const nearby = [];
                qt.retrieve(n, nearby);
                for (let j = 0; j < nearby.length; j++) {
                    const o = nearby[j];
                    if (o === n) continue;
                    const dx = n.x - o.x;
                    const dy = n.y - o.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = n.r + o.r + 1;
                    if (distSq < minDist * minDist && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        n.vx += nx * overlap * 0.3;
                        n.vy += ny * overlap * 0.3;
                    }
                }

                // 6. Apply velocity with damping
                n.vx *= DAMPING;
                n.vy *= DAMPING;
                n.x += n.vx;
                n.y += n.vy;

                // 7. Keep balls in bounds (soft bounce)
                const margin = n.r;
                if (n.x < margin) { n.x = margin; n.vx *= -0.5; }
                if (n.x > width - margin) { n.x = width - margin; n.vx *= -0.5; }
                if (n.y < margin) { n.y = margin; n.vy *= -0.5; }
                if (n.y > height - margin) { n.y = height - margin; n.vy *= -0.5; }
            }
        };

        const draw = () => {
            if (!isVisible) {
                animationId = requestAnimationFrame(draw);
                return;
            }

            // Physics step
            simulate();

            // Clear
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, width, height);

            // Scroll-based fade
            const baseAlpha = Math.max(0, 0.6 * (1 - scrollProgress));

            // Draw balls with glow effect near cursor
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];

                // Distance to cursor for glow effect
                const gdx = n.x - mouseX;
                const gdy = n.y - mouseY;
                const gDist = Math.sqrt(gdx * gdx + gdy * gdy);
                const glowRange = 150;
                const glowFactor = gDist < glowRange ? 1 - gDist / glowRange : 0;

                // Alpha: base + very subtle glow boost near cursor
                ctx.globalAlpha = Math.min(1, baseAlpha + glowFactor * 0.08);

                // Size: barely larger near cursor
                const drawR = n.r * (1 + glowFactor * 0.05);

                ctx.beginPath();
                ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            animationId = requestAnimationFrame(draw);
        };

        // Mouse tracking — update cursor position for repulsion
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        // Move cursor off-screen when mouse leaves
        document.addEventListener('mouseleave', () => {
            mouseX = -9999;
            mouseY = -9999;
        }, { passive: true });

        // Click shockwave
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.addEventListener('click', (e) => {
                shockwaves.push({ x: e.clientX, y: e.clientY, time: performance.now() });
            });
            heroSection.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    shockwaves.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: performance.now() });
                }
            }, { passive: true });
        }

        // Scroll dispersion tracking
        window.addEventListener('scroll', () => {
            const heroEl = document.getElementById('hero');
            if (!heroEl) return;
            const rect = heroEl.getBoundingClientRect();
            const heroH = rect.height;
            // scrollProgress: 0 = hero fully in view, 1 = hero scrolled away
            scrollProgress = clamp(-rect.top / (heroH * 0.6), 0, 1);
        }, { passive: true });

        // Touch support — finger acts as cursor
        if (heroSection) {
            heroSection.addEventListener('touchmove', (e) => {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
            }, { passive: true });

            heroSection.addEventListener('touchend', () => {
                mouseX = -9999;
                mouseY = -9999;
            }, { passive: true });
        }

        // Visibility optimization
        if (heroSection) {
            const visibilityObserver = new IntersectionObserver((entries) => {
                isVisible = entries[0].isIntersecting;
            }, { threshold: 0 });
            visibilityObserver.observe(heroSection);
        }

        // Pause on tab hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else if (isVisible) {
                animationId = requestAnimationFrame(draw);
            }
        });

        // Initialize
        resize();
        window.addEventListener('resize', throttle(resize, 150));
        animationId = requestAnimationFrame(draw);
    };

    // ============================================
    // SMOOTH ANCHOR SCROLLING
    // ============================================

    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = 80;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            });
        });
    };

    // ============================================
    // FORM HANDLING (with security)
    // ============================================

    const initForm = () => {
        const form = document.getElementById('cta-form');
        if (!form) return;

        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button');

        // Rate limiting
        let lastSubmit = 0;
        const RATE_LIMIT_MS = 5000;

        // Sanitize input
        const sanitize = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        // Email validation
        const isValidEmail = (email) => {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(email) && email.length <= 254;
        };

        // Security check
        const isSuspicious = (email) => {
            const suspiciousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+=/i,
                /<[^>]+>/,
                /\{\{/,
                /\$\{/
            ];
            return suspiciousPatterns.some(pattern => pattern.test(email));
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const now = Date.now();
            if (now - lastSubmit < RATE_LIMIT_MS) return;

            // Honeypot check
            const honeypot = form.querySelector('input[name="website"]');
            if (honeypot && honeypot.value) {
                showSuccess();
                return;
            }

            const rawEmail = input.value.trim();
            const email = sanitize(rawEmail);

            if (!email || !isValidEmail(email)) {
                input.classList.add('error');
                input.setAttribute('aria-invalid', 'true');
                input.focus();
                return;
            }

            if (isSuspicious(rawEmail)) {
                input.classList.add('error');
                return;
            }

            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
            lastSubmit = now;

            showSuccess();
        });

        const showSuccess = () => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span>Thank you! ✓</span>';
            btn.disabled = true;
            btn.classList.add('success');

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                btn.classList.remove('success');
                form.reset();
            }, 2500);
        };

        // Clear error on input
        input.addEventListener('input', () => {
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
        });
    };

    // ============================================
    // FOCUS MANAGEMENT (Accessibility)
    // ============================================

    const initAccessibility = () => {
        document.body.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });

        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    };

    // ============================================
    // CURSOR GLOW TRAIL
    // ============================================

    const initCursorGlow = () => {
        const glow = document.getElementById('cursor-glow');
        if (!glow || prefersReducedMotion || window.innerWidth < 768) return;

        let glowX = 0, glowY = 0;
        let targetX = 0, targetY = 0;

        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            glow.classList.add('visible');
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            glow.classList.remove('visible');
        }, { passive: true });

        const updateGlow = () => {
            glowX += (targetX - glowX) * 0.15;
            glowY += (targetY - glowY) * 0.15;
            glow.style.transform = `translate(${glowX - 150}px, ${glowY - 150}px)`;
            requestAnimationFrame(updateGlow);
        };
        requestAnimationFrame(updateGlow);
    };

    // ============================================
    // INITIALIZE
    // ============================================

    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initNavigation();
        initHeroCanvas();
        initSmoothScroll();
        initForm();
        initAccessibility();
        initCursorGlow();
    });

})();
