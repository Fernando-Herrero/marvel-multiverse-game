let audio = null;
let defaultVolume = 0.3;

const songs = {
	login: "/media/audio/intro-music.mp3",
	map: "/media/audio/map-music.mp3",
	battle: "/media/audio/battle-music.mp3",
	final: "/media/audio/final/music.mp3",
};

export const playMusicForScreen = async (screen) => {
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

	try {
		await audio.play();
		console.log(`Reproduciendo música para: ${screen}`);
	} catch (error) {
		console.warn(`Error al reproducir música (${screen}):`, error);

		const handleUserInteraction = () => {
			audio
				.play()
				.then(() => {
					document.removeEventListener("click", handleUserInteraction);
					document.removeEventListener("keydown", handleUserInteraction);
				})
				.catch((e) => console.warn("Error en reproducción diferida:", e));
		};

		document.addEventListener("click", handleUserInteraction);
		document.addEventListener("keydown", handleUserInteraction);
	}
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
