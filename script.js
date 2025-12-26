let isDarkMode = false;
let ctx = null;
let particles = [];
let animationFrameId = null;


let cursorCtx = null;
let cursorParticles = [];
let mouse = { x: null, y: null };
let cursorAnimationId = null;

let rippleParticles = [];

const pastelHues = [0, 10, 25, 40, 330, 340, 350]; // Reds, Oranges, Pinks



const particleColors = {
    light: {
        particle: 'rgba(253, 186, 116, 0.5)', // Pale Orange
        line: '253, 186, 116'
    },
    dark: {
        particle: 'rgba(214, 200, 190, 0.4)', // Pale Warm Grey/Brown
        line: '214, 200, 190'
    }
};


const updateParticleColors = (dark) => {
    const newColor = dark ? particleColors.dark.particle : particleColors.light.particle;

    for (let i = 0; i < particles.length; i++) {
        if (particles[i]) {
            particles[i].color = newColor;
        }
    }
};


const applyTheme = (dark) => {
    const htmlEl = document.documentElement;

    if (dark) {
        htmlEl.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlEl.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }


    isDarkMode = dark;


    updateParticleColors(dark);
};


document.addEventListener('DOMContentLoaded', () => {


    const themeToggles = document.querySelectorAll('.theme-toggle');


    const savedTheme = localStorage.getItem('theme');

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;


    let initialDarkMode = false;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        initialDarkMode = true;
    }


    applyTheme(initialDarkMode);


    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {

            applyTheme(!isDarkMode);
        });
    });


    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.menu-link');

    if (menuBtn && mobileMenu) {
        const toggleMenu = () => {
            menuBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('overflow-hidden');
            document.body.classList.toggle('menu-open-blur');
        };

        menuBtn.addEventListener('click', toggleMenu);

        menuLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    } else {
    }




    const sectionsFadeInUp = document.querySelectorAll('.fade-in-up');
    const sectionsFadeInRight = document.querySelectorAll('.fade-in-right');


    const animatedHeadings = document.querySelectorAll('#history h2.fade-in-up, #gallery h2.fade-in-up');

    if ('IntersectionObserver' in window) {


        const observerOnce = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');

                    if (entry.target.classList.contains('gallery-item') && entry.target.style.transitionDelay) {
                        entry.target.style.transitionDelay = '0s';
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });


        sectionsFadeInRight.forEach(section => {
            observerOnce.observe(section);
        });


        const animatedHeadingsSet = new Set(animatedHeadings);
        sectionsFadeInUp.forEach(section => {
            if (!animatedHeadingsSet.has(section)) {
                observerOnce.observe(section);
            }
        });



        if (animatedHeadings.length > 0) {
            const headingObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    } else {

                        entry.target.classList.remove('is-visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            animatedHeadings.forEach(heading => {
                headingObserver.observe(heading);
            });
        }

    } else {


        [...sectionsFadeInUp, ...sectionsFadeInRight].forEach(section => {
            section.classList.add('is-visible');
        });
    }


    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });


    const sectionsForNav = document.querySelectorAll('main > section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .menu-link');

    const makeLinksActive = (id) => {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        mobileNavLinks.forEach(link => {

            link.classList.toggle('text-blue-500', link.getAttribute('href') === `#${id}`);
            link.classList.toggle('text-gray-800', link.getAttribute('href') !== `#${id}`);
        });
    };

    if ('IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver((entries) => {
            const heroEntry = entries.find(entry => entry.target.id === 'hero');

            if (heroEntry && heroEntry.isIntersecting && heroEntry.intersectionRatio >= 0.5) {
                navLinks.forEach(link => link.classList.remove('active'));
                mobileNavLinks.forEach(link => {
                    link.classList.remove('text-blue-500');
                    link.classList.add('text-gray-800');
                });
            } else {
                const intersectingEntries = entries
                    .filter(entry => entry.isIntersecting && entry.target.id !== 'hero');

                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries.reduce((prev, current) => {
                        return (prev.boundingClientRect.top < current.boundingClientRect.top) ? prev : current;
                    });
                    makeLinksActive(topEntry.target.id);
                }
            }
        }, {
            threshold: [0.1, 0.5, 0.9],
            rootMargin: '-50% 0px -50% 0px'
        });

        sectionsForNav.forEach(section => {
            navObserver.observe(section);
        });

        const heroSection = document.getElementById('hero');
        if (heroSection) {
            navObserver.observe(heroSection);
        }
    }

    // --- REFACTORED HISTORY SECTION LOGIC ---
    // Previously complex history line animation logic has been removed
    // Now it uses the standard 'fade-in-up' observer which is already handled above.


    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            constructor(x, y, dx, dy, radius, color) {
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
                this.radius = radius;
                this.color = color;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            update() {
                if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
                    this.dx = -this.dx;
                }
                if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
                    this.dy = -this.dy;
                }
                this.x += this.dx;
                this.y += this.dy;
                this.draw();
            }
        }

        const initParticles = () => {
            particles = [];

            let particleCount = Math.floor(canvas.width / 30);
            if (particleCount < 40) particleCount = 40;
            if (particleCount > 100) particleCount = 100;


            const initialColor = isDarkMode ? particleColors.dark.particle : particleColors.light.particle;

            for (let i = 0; i < particleCount; i++) {
                let radius = Math.random() * 3.5 + 1;
                let x = Math.random() * (canvas.width - radius * 2) + radius;
                let y = Math.random() * (canvas.height - radius * 2) + radius;
                let dx = (Math.random() - 0.5) * 0.8;
                let dy = (Math.random() - 0.5) * 0.8;

                particles.push(new Particle(x, y, dx, dy, radius, initialColor));
            }
        };


        const connectParticles = () => {
            let maxDistance = 100;


            const currentLineColor = isDarkMode ? particleColors.dark.line : particleColors.light.line;

            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        ctx.strokeStyle = `rgba(${currentLineColor}, ${1 - distance / maxDistance})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };


        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            connectParticles();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animate();

    } else {
        console.warn("'#particle-canvas' not found");
    }


    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-scroller-item');

    if (lightbox && lightboxImage && lightboxCloseBtn && galleryItems.length > 0) {

        const openLightbox = (imgSrc) => {
            lightboxImage.src = imgSrc;
            lightbox.classList.add('show');
            document.body.classList.add('lightbox-open');
        };

        const closeLightbox = () => {
            lightbox.classList.remove('show');
            document.body.classList.remove('lightbox-open');
            setTimeout(() => {
                lightboxImage.src = '';
            }, 300);
        };

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img && img.src) {
                    let highResSrc = img.src;
                    if (highResSrc.includes('pbs.twimg.com')) {
                        highResSrc = highResSrc.replace(/&name=[^&]+/, '') + '&name=orig';
                    }
                    openLightbox(highResSrc);
                }
            });
        });

        // Also add click listener for History items images
        // Since we rewrote the HTML, we need to attach listeners to the new .timeline-card images
        // But since they are dynamic or just refactored, let's use a delegate or re-query
        const historyImages = document.querySelectorAll('.timeline-card img');
        historyImages.forEach(img => {
            img.addEventListener('click', () => {
                let highResSrc = img.src;
                if (highResSrc.includes('pbs.twimg.com')) {
                    highResSrc = highResSrc.replace(/&name=[^&]+/, '') + '&name=orig';
                }
                openLightbox(highResSrc);
            });
        });


        lightboxCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightboxImage) {
                return;
            }
            closeLightbox();
        });

    } else {
    }


    const cursorCanvas = document.getElementById('cursor-particle-canvas');
    if (cursorCanvas) {
        cursorCtx = cursorCanvas.getContext('2d');
        cursorParticles = [];
        rippleParticles = [];
        mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let prevMouse = { x: mouse.x, y: mouse.y };
        let frameCount = 0;

        const resizeCursorCanvas = () => {
            cursorCanvas.width = window.innerWidth;
            cursorCanvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCursorCanvas);
        resizeCursorCanvas();


        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });


        window.addEventListener('click', (e) => {
            createRipple(e.clientX, e.clientY);
        });


        class CursorParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;

                this.vx = (Math.random() - 0.5) * 2.0;
                this.vy = (Math.random() - 0.5) * 2.0;

                this.gravity = 0.01;
                this.radius = Math.random() * 4 + 2;

                this.life = 80 + Math.random() * 50;
                this.maxLife = this.life;

                this.shape = ['circle', 'heart'][Math.floor(Math.random() * 2)];

                this.hue = pastelHues[Math.floor(Math.random() * pastelHues.length)];

                this.angle = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.08;
            }

            update() {
                this.life--;

                this.vx *= 0.98;
                this.vy *= 0.98;

                this.vy += this.gravity;

                this.angle += this.rotationSpeed;

                this.x += this.vx;
                this.y += this.vy;
            }

            draw() {
                if (this.life <= 0) return;


                const opacity = Math.max(0, this.life / this.maxLife);
                const radius = Math.max(0, this.radius * (this.life / this.maxLife));

                cursorCtx.save();


                cursorCtx.fillStyle = `hsla(${this.hue}, 80%, 85%, ${opacity})`;


                cursorCtx.translate(this.x, this.y);
                cursorCtx.rotate(this.angle);

                cursorCtx.beginPath();


                if (this.shape === 'circle') {
                    cursorCtx.arc(0, 0, radius, 0, Math.PI * 2, false);
                } else if (this.shape === 'heart') {
                    // Draw a cute heart
                    let topCurveHeight = radius * 0.5;
                    cursorCtx.moveTo(0, radius * 0.3);
                    cursorCtx.bezierCurveTo(0, 0, -radius, 0, -radius, radius * 0.3);
                    cursorCtx.bezierCurveTo(-radius, radius * 0.6, 0, radius, 0, radius * 1.3);
                    cursorCtx.bezierCurveTo(0, radius, radius, radius * 0.6, radius, radius * 0.3);
                    cursorCtx.bezierCurveTo(radius, 0, 0, 0, 0, radius * 0.3);
                }

                cursorCtx.fill();
                cursorCtx.restore();
            }
        }


        class RippleParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 1;
                this.maxRadius = 40 + Math.random() * 30;
                this.life = 1;
                this.hue = pastelHues[Math.floor(Math.random() * pastelHues.length)];
            }

            update() {

                this.radius += (this.maxRadius - this.radius) * 0.04;

                this.life -= 0.015;
            }

            draw() {
                if (this.life <= 0) return;

                cursorCtx.beginPath();
                cursorCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);

                cursorCtx.strokeStyle = `hsla(${this.hue}, 80%, 85%, ${this.life})`;
                cursorCtx.lineWidth = 3;
                cursorCtx.stroke();
            }
        }


        const createRipple = (x, y) => {

            for (let i = 0; i < 3; i++) {
                rippleParticles.push(new RippleParticle(x, y));
            }
        };

        const createCursorParticles = () => {

            if (mouse.x !== null && frameCount % 3 === 0) {
                cursorParticles.push(new CursorParticle(mouse.x, mouse.y));
            }
        };

        const animateCursorParticles = () => {

            cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

            frameCount++;


            const mouseMoved = mouse.x !== prevMouse.x || mouse.y !== prevMouse.y;


            if (mouse.x !== null && mouseMoved) {
                createCursorParticles();
            }


            for (let i = cursorParticles.length - 1; i >= 0; i--) {
                const p = cursorParticles[i];
                p.update();
                p.draw();


                if (p.life <= 0) {
                    cursorParticles.splice(i, 1);
                }
            }


            for (let i = rippleParticles.length - 1; i >= 0; i--) {
                const r = rippleParticles[i];
                r.update();
                r.draw();

                if (r.life <= 0) {
                    rippleParticles.splice(i, 1);
                }
            }


            if (cursorParticles.length > 200) {
                cursorParticles.splice(0, cursorParticles.length - 200);
            }


            prevMouse.x = mouse.x;
            prevMouse.y = mouse.y;

            cursorAnimationId = requestAnimationFrame(animateCursorParticles);
        };


        if (cursorAnimationId) {
            cancelAnimationFrame(cursorAnimationId);
        }
        animateCursorParticles();

    }

    // Removed: adjustHistoryYearFontSizes() logic as the new design uses simpler, consistent typography.

});