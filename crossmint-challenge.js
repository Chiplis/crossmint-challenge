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
	let [modifier, property] = coin.toLowerCase().split("_");
	[modifier, property] = [!property ? undefined : modifier, !property ? modifier : property] // POLY coin does not have any modifier, normalize coin format
	const body = JSON.stringify({
		candidateId,
		color: modifier, // Unused body params are ignored server side so this is safe for both types of coins
		direction: modifier,
		row,
		column
	});
	const url = `https://challenge.crossmint.io/api/${property.toLowerCase() + 's'}`;
	
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
	for (let row = 0; row < goal.length; row++) {
		for (let column = 0; column < goal.length; column++) {
			const response = await coinToParams(goal[row][column], row, column);
			console.log("Response is", response);
		}
	}
}

drawGoal().then(() => console.log("Goal achieved!"))
