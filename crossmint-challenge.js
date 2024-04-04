const candidateId = "DUMMY_ID"

const goalUrl = `https://challenge.crossmint.io/api/map/${candidateId}/goal`

const goalPromise = fetch(goalUrl).then(r => r.json()).then(r => r.goal)

const coinToRequest = async (coin, row, column, retries = 10) => {
	if (retries === 0) {
		console.error("Max retry limit reached");
		return;
	}
	if (coin === "SPACE") {
		return;
	}
	let [modifier, symbol] = coin.toLowerCase().split("_");
	[modifier, symbol] = [!symbol ? undefined : modifier, !symbol ? modifier : (symbol + "s")] // POLY coin does not have any modifier, normalize coin format
	const body = JSON.stringify({
		candidateId,
		color: modifier, // Unused body params are ignored server side so this is safe for both types of coins
		direction: modifier,
		row,
		column
	});
	const url = `https://challenge.crossmint.io/api/${symbol}`;
	
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json"},
			body
		});
		const body = await response.json();
		if (response.status >= 400 || body.reason) { // Error detected
			throw JSON.stringify(response);
		}
	} catch (error) {
		console.error(`Found error, retrying ${retries - 1} times`, error);
		await new Promise(r => setTimeout(r, 1000)); // Backoff to prevent overloading server with requests
		return await coinToParams(coin, row, column, retries - 1)
	}
} 

const drawGoal = async () => {
	let goal = await goalPromise;
	// Goal is always a square matrix so row and column have the same length
	for (let row = 0; row < goal.length; row++) {
		for (let column = 0; column < goal.length; column++) {
			const response = await coinToRequest(goal[row][column], row, column);
			console.log("Response is", response);
		}
	}
}

drawGoal().then(() => console.log("Goal achieved!"))
