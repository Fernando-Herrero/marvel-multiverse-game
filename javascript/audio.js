let audio = null;
let defaultVolume = 0.3;

const songs = {
	login: "/media/audio/intro-music.mp3",
	map: "/media/audio/map-music.mp3",
	battle: "/media/audio/battle-music.mp3",
};

export const playMusicForScreen = (screen) => {
	if (!songs[screen]) {
		console.warn(`No hay canción definida para la pantalla: ${screen}`);
		return;
	}

	if (audio) {
		stopMusic();
	}

	audio = new Audio(songs[screen]);
	audio.loop = true;
	audio.volume = defaultVolume;
	audio.autoplay = true;
	audio.preload = "auto";

	const playPromise = audio.play().catch((error) => {
		console.warn("Autoplay bloqueado:", error);
	});

	return playPromise;
};

export const stopMusic = () => {
	if (audio) {
		audio.pause();
		audio.currentTime = 0;
	}
};

const setVolume = (value) => {
	if (!audio) return;

	defaultVolume = value;
	audio.volume = value;

	document.querySelectorAll(".volume-icon").forEach((icon) => {
		icon.src = value === 0 ? "/media/images/icons/music-mute-icon.webp" : "/media/images/icons/music-icon.webp";
	});
};

const toggleMute = () => {
	if (!audio) return;

	setVolume(audio.volume > 0 ? 0 : defaultVolume || 0.3);
};

document.querySelectorAll(".volume-slider").forEach((slider) => {
	slider.value = defaultVolume;
	slider.addEventListener("input", () => {
		setVolume(parseFloat(slider.value));
	});
});

document.querySelectorAll(".volume-icon").forEach((icon) => {
	icon.addEventListener("click", toggleMute);
});
