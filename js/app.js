let bgAudio = null;

window.addEventListener('load', () => {
    if (typeof initRippleEngine === 'function') initRippleEngine();

    // Start background ambient audio (persists through state changes)
    bgAudio = new Audio('./audio/deep_space.wav');
    bgAudio.loop = true;

    bgAudio.play().catch(() => {
        const enableAudioOnInteraction = () => {
            bgAudio.play().catch(() => {});
            window.removeEventListener('click', enableAudioOnInteraction);
            window.removeEventListener('keydown', enableAudioOnInteraction);
        };
        window.addEventListener('click', enableAudioOnInteraction);
        window.addEventListener('keydown', enableAudioOnInteraction);
    });
});


let isConduitView = false;

function toggleView() {
    isConduitView = !isConduitView;
    
    const wrapper = document.getElementById('canvas-wrapper');
    const audioEnter = document.getElementById('enter-chime');
    const audioRetne = document.getElementById('emihc-retne');

    // Toggle container state class
    wrapper.classList.toggle('conduit-active', isConduitView);

    if (isConduitView) {
        if (audioRetne) { audioRetne.pause(); audioRetne.currentTime = 0; }
        if (audioEnter) { audioEnter.currentTime = 0; audioEnter.play().catch(() => {}); }
    } else {
        if (audioEnter) { audioEnter.pause(); audioEnter.currentTime = 0; }
        if (audioRetne) { audioRetne.currentTime = 0; audioRetne.play().catch(() => {}); }
    }
}

/* ---------------- For the About overlay panel ---------------------*/
const aboutLink = document.getElementById('nav-about');
const aboutOverlay = document.getElementById('about-overlay');
const closeOverlay = document.getElementById('close-overlay');

aboutLink.addEventListener('click', (event) => {
    event.preventDefault();
    aboutOverlay.classList.add('visible');
});

closeOverlay.addEventListener('click', () => {
    aboutOverlay.classList.remove('visible');
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        aboutOverlay.classList.remove('visible');
    }
});
