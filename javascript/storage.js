// Guardar datos (ej: tema, visitas, formulario)
const saveToStorage = (key, value) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		console.error("Error saving to localStorage:", error);
		return false;
	}
};

// Cargar datos
const loadFromStorage = (key) => {
	try {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error("Error loading from localStorage:", error);
		return null;
	}
};

// Borrar datos específicos
const clearStorageKey = (key) => {
	localStorage.removeItem(key);
};