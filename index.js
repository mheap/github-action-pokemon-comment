const https = require("https");


async function action() {
  // Pull out the details that we'll need later on to add a comment
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
  const payload = require(process.env.GITHUB_EVENT_PATH);
  const issue = payload.pull_request.number;

  const pokemonSets = {
    'original': [1, 151],
    'all': [1, 618],
  };

  // Which set of pokemon are we pulling from?
  const chosenSet = pokemonSets[process.env.INPUT_POKEMONSET];

  // If it's an invalid set, exit with an error
  if (!chosenSet) {
    console.log(`Invalid input: pokemonSet. Must be one of: ${Object.keys(pokemonSets).join(', ')}`);
    process.exit(1);
  }

  // Extract the minimum and maximum pokemon number to use
  const [min, max] = chosenSet;

  // Generate a random number somewhere between those numbers
  const pokemonNumber = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`Fetch details: ${pokemonNumber}`);

  // Fetch the information for that Pokemon
  const pokemon = await getPokemon(pokemonNumber);
  console.log(`Fetched: ${JSON.stringify(pokemon)}`);

  const body = `Thanks for raising a PR! We'll have it reviewed as soon as we can by our friendly ${pokemon.name}

  <img src="${pokemon.imageUrl}">`;

  console.log(`Adding comment: ${body}`);

  // Add a comment to the PR that was raised
  await addComment(owner, repo, issue, body);

  console.log("Action completed");
};

function getPokemon(id) {
  return new Promise((resolve, reject) => {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
    const imageUrl = `https://pokeres.bastionbot.org/images/pokemon/${id}.png`;

    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);
        return resolve({
          name: body.name,
          imageUrl
        });
      });
    })
      .on('error', reject);
  });
}

function addComment(owner, repo, issue, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      body
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${owner}/${repo}/issues/${issue}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Demo GH Action - Pokemon',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        console.log(body);
        return resolve(body);
      });
    }) 
      .on('error', (error) => {
        console.log(error);
        reject(error);
      });

    req.write(data);
    req.end();
  });
}

if (require.main === module) {
  action();
}

module.exports = action;
