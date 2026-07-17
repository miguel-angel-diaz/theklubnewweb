
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    if (typeof initReveal === 'function') initReveal();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initNavbar === 'function') initNavbar();
    if (typeof initLoginModal === 'function') initLoginModal();
    if (typeof initLogin === 'function') initLogin();
    if (typeof comprobarSesionActiva === 'function') comprobarSesionActiva();
    if (typeof initMemberView === 'function') initMemberView();
    if (typeof initIntro === 'function') initIntro();
    if (typeof initBackToTop === 'function') initBackToTop();
    if (typeof initAdmission === 'function') initAdmission();
    if (typeof initBroadcast === 'function') initBroadcast();
    if (typeof initStandingsSlider === 'function') initStandingsSlider();
});