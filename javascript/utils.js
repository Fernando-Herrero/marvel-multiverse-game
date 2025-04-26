export const modalBackdrop = document.getElementById("modal-backdrop");
export const modalMessage = document.getElementById("modal-message");
export const modalCloseBtn = document.getElementById("modal-close-btn");

export const showModal = (message) => {
    modalMessage.textContent = message;
    modalBackdrop.style.display = "flex";
    document.body.style.overflow = "hidden";
};

export const hideModal = () => {
    modalBackdrop.style.display = "none";
    document.body.style.overflow = "auto";
};

