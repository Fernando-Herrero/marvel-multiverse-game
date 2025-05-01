import { loadFromStorage, saveToStorage } from "./storage.js";

export const modalCard = document.getElementById("modal-card");
export const modalBackdrop = document.getElementById("modal-backdrop");
export const modalMessage = document.getElementById("modal-message");
export const modalAcceptBtn = document.getElementById("modal-accept-btn");
export const modalCloseBtn = document.getElementById("modal-close-btn");

export const briefingCard = document.getElementById("briefing-card");
export const briefingTitle = document.getElementById("briefing-title");
export const briefingMessage = document.getElementById("briefing-text");
export const briefingBeforeBtn = document.getElementById("briefing-before-btn");
export const briefingNextBtn = document.getElementById("briefing-after-btn");

export const showModal = (message, options = {}) => {
	briefingCard.style.display = "none";
	modalCard.style.display = "flex";

	modalMessage.textContent = message;
	modalBackdrop.style.display = "flex";
	document.body.style.overflow = "hidden";

	if (options.isConfirmation) {
		modalAcceptBtn.textContent = options.confirmText || "Accept";
		modalCloseBtn.textContent = options.cancelText || "Cancel";
		modalCloseBtn.style.display = "inline-block";
	} else {
		modalCloseBtn.style.display = "none";
	}
};

export const hideModal = () => {
	modalBackdrop.style.display = "none";
	document.body.style.overflow = "auto";

	const mainBriefing = loadFromStorage("mainBriefing");
	if (mainBriefing) {
		saveToStorage("mainBriefing", { ...mainBriefing, briefingShow: false });
	}
};

export const showBriefing = (title, message, buttons = {}) => {
	const charactersSelect = document.getElementById("characters-selector");
	const selectedValue = charactersSelect.value;

	message = message.replace(/\n/g, "<br>");

	briefingCard.style.display = "flex";
	briefingCard.style.border =
		selectedValue === "heroes" ? "1px solid var(--hero-color)" : "1px solid var(--villain-color)";
	modalCard.style.display = "none";

	briefingTitle.textContent = title;
	briefingTitle.style.color = selectedValue === "heroes" ? "var(--hero-color)" : "var(--villain-color)";
	briefingMessage.innerHTML = message;
	modalBackdrop.style.display = "flex";
	document.body.style.overflow = "hidden";

	if (buttons.before) {
		briefingBeforeBtn.textContent = buttons.after.text || "Before";
		briefingBeforeBtn.onclick = buttons.before.action;
		briefingBeforeBtn.style.display = "flex";
	} else {
		briefingBeforeBtn.style.display = "none";
	}

	if (buttons.after) {
		briefingNextBtn.textContent = buttons.after.text || "Next";
		briefingNextBtn.onclick = buttons.after.action;
		briefingNextBtn.style.display = "flex";
	} else {
		briefingNextBtn.style.display = "none";
	}
};
