const options = {
	method: "GET",
	headers: { accept: "application/json", "x-cg-demo-api-key": "CG-Fxd3bgMWh5hcViBE52R6yhqY" },
};

fetch("https://api.coingecko.com/api/v3/coins/list", options)
	.then((res) => res.json())
	.then((res) => console.log(res))
	.catch((err) => console.error(err));
