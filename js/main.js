/**
 * Divyansh Raghuvanshi — Dark Glass Developer Portfolio
 * Interactive Functionality & Navigation Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initActiveNavSpy();
  initMobileDrawer();
  initBackToTop();
  initEmailCopyToast();
  initScrollAnimations();
  initDynamicYear();
});

/* --------------------------------------------------------------------------
   1. NAVBAR SCROLL ELEVATION
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   2. ACTIVE NAVIGATION SPY (IntersectionObserver)
   -------------------------------------------------------------------------- */
function initActiveNavSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else if (href && href.startsWith('#')) {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/* --------------------------------------------------------------------------
   3. MOBILE NAVIGATION DRAWER
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const drawerLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !drawer) return;

  function toggleMenu(open) {
    const shouldOpen = open !== undefined ? open : !drawer.classList.contains('open');
    toggleBtn.classList.toggle('open', shouldOpen);
    drawer.classList.toggle('open', shouldOpen);
    toggleBtn.setAttribute('aria-expanded', String(shouldOpen));
    drawer.setAttribute('aria-hidden', String(!shouldOpen));
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   4. BACK TO TOP BUTTON
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  const toggleVisibility = () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* --------------------------------------------------------------------------
   5. EMAIL COPY & TOAST NOTIFICATION
   -------------------------------------------------------------------------- */
function initEmailCopyToast() {
  const copyBtn = document.getElementById('copy-email-btn');
  const emailTextEl = document.getElementById('contact-email-text');
  const toast = document.getElementById('toast');

  if (!copyBtn || !emailTextEl || !toast) return;

  let toastTimeout;

  const showToast = (message) => {
    const toastMsgEl = toast.querySelector('.toast-message');
    if (toastMsgEl && message) toastMsgEl.textContent = message;

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  };

  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const rawEmail = emailTextEl.getAttribute('data-email') || emailTextEl.textContent.trim();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawEmail);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = rawEmail;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Email address copied to clipboard!');
    } catch (err) {
      showToast(`Selected email: ${rawEmail}`);
    }
  });
}

/* --------------------------------------------------------------------------
   6. SCROLL REVEAL ANIMATIONS
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const revealElements = document.querySelectorAll(
    '.about-highlight-card, .skills-card, .project-slot-card, .education-card, .contact-card-main'
  );

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* --------------------------------------------------------------------------
   7. DYNAMIC COPYRIGHT YEAR
   -------------------------------------------------------------------------- */
function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
