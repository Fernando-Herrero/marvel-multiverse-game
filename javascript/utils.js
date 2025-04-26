export const modalBackdrop = document.getElementById("modal-backdrop");
export const modalMessage = document.getElementById("modal-message");
export const modalAcceptBtn = document.getElementById("modal-accept-btn");
export const modalCloseBtn = document.getElementById("modal-close-btn");

export const showModal = (message, options = {}) => {
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
};
