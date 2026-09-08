document.addEventListener('DOMContentLoaded', () => {
    initSlider();
});

function initSlider() {
    const slides = document.querySelectorAll('.slider-slide');
    const dots = document.querySelectorAll('.dot');
    const heroContainer = document.querySelector('.hero-container');

    // Pages without a carousel (inner pages) exit safely
    if (!slides.length) return;

    const totalSlides = slides.length;
    let currentSlide = 0;
    let slideInterval;

    // ACCESSIBILITY: Pause carousel if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Preload background images so slides never appear blank on first rotation
    slides.forEach((slide) => {
        const bg = slide.style.backgroundImage;
        const match = bg && bg.match(/url\(["']?(.*?)["']?\)/);
        if (match && match[1]) {
            const img = new Image();
            img.src = match[1];
        }
    });

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (dots[i]) {
                dots[i].classList.toggle('active', i === index);
                dots[i].setAttribute('aria-selected', i === index ? 'true' : 'false');
            }
        });
        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % totalSlides);
    }

    function startTimer() {
        if (prefersReducedMotion) return;
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopTimer() {
        clearInterval(slideInterval);
    }

    dots.forEach((dot) => {
        dot.addEventListener('click', (e) => {
            const slideIndex = parseInt(e.currentTarget.getAttribute('data-slide'), 10);
            if (!isNaN(slideIndex) && slideIndex < totalSlides) {
                showSlide(slideIndex);
                startTimer();
            }
        });
    });

    // Pause rotation on hover / keyboard focus for better usability
    if (heroContainer) {
        heroContainer.addEventListener('mouseenter', stopTimer);
        heroContainer.addEventListener('mouseleave', startTimer);
        heroContainer.addEventListener('focusin', stopTimer);
        heroContainer.addEventListener('focusout', startTimer);
    }

    // Stop the timer when the tab is hidden to avoid slide jumps
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopTimer() : startTimer();
    });

    showSlide(0);
    startTimer();
}

// Logo Fallback Trigger
function handleLogoError() {
    const mainLogo = document.getElementById('main-logo');
    const fallbackLogo = document.getElementById('logo-fallback');
    if (mainLogo) mainLogo.style.display = 'none';
    if (fallbackLogo) fallbackLogo.style.display = 'flex';
}