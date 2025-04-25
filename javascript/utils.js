//<==== FECTH ====>
export const fetchMarvelData = async (endpoint) => {
	const publicKey = "692ce75347ed6c24fc0f278499fff8af";
	const privateKey = "7b704350c83b3a66851807fa7dcd86ec748b483c"; 
	const timestamp = new Date().getTime();
	const hash = md5(timestamp + privateKey + publicKey);

	const url = `https://gateway.marvel.com/v1/public/${endpoint}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;

	try {
		const response = await fetch(url);
		const data = await response.json();
		return data.data.results;
	} catch (error) {
		console.error("Error fetching Marvel data:", error);
		return null;
	}
};
