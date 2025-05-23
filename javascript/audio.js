let audio = null; //para las funciones posteriores y el control sobre la musica
let oldVolume = 0.3; //numero para recordar el volumen antes de silenciar

const initMusic = (src = "/media/audio/intro-music.mp3", initialVolume = 0.3) => {
	audio = new Audio(src);
	audio.loop = true;
	audio.volume = initialVolume;
	audio.autoplay = true;
	audio.preload = "auto";
};

const volumeSlider = document.getElementById("volume-slider");
if (volumeSlider) {
	volumeSlider.value = initialVolume;
	volumeSlider.addEventListener("input", () => {
		setVolume(parseFloat(volumeSlider.value));
	});
}

const volumeIcon = document.getElementById("volume-icon");
if (volumeIcon) {
	volumeIcon.addEventListener("click", toggleMute);
}

audio.play().catch(() => {
	console.warn("Autoplay bloqueado. Esperando interacción del usuario.");
});

const setVolume = (value) => {
	if (!audio) return;

	audio.volume = value;

	const volumeIcon = document.getElementById("volume-icon");
	if (volumeIcon) {
		if (value === 0) {
			volumeIcon.src = "/media-images/icons/music-mute-icon.webp";
		} else {
			volumeIcon.src = "/media/images/icons/music-icon.webp";
		}
	}
};

const toggleMute = () => {
	if (!audio) return;

	if (audio.volume > 0) {
		oldVolume = audio.volume;
		setVolume(0);
	} else {
		setVolume(oldVolume || 0.3);
	}
};
