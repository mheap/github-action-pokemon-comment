const { Toolkit } = require('actions-toolkit');
const fetch = require("node-fetch");

Toolkit.run(async tools => {
  const pokemonSets = {
    'original': [1, 151],
    'all': [1, 618],
  };

  // Which set of pokemon are we pulling from?
  const chosenSet = pokemonSets[tools.inputs.pokemonSet];

  // If it's an invalid set, exit with an error
  if (!chosenSet) {
    tools.exit.failure(`Invalid input: pokemonSet. Must be one of: ${Object.keys(pokemonSets).join(', ')}`);
  }

  // Extract the minimum and maximum pokemon number to use
  const [min, max] = chosenSet;

  // Generate a random number somewhere between those numbers
  const pokemonNumber = Math.floor(Math.random() * (max - min + 1) + min);
  tools.log.info(`Fetch details: ${pokemonNumber}`);

  // Fetch the information for that Pokemon
  const pokemon = await getPokemon(pokemonNumber);
  tools.log.info(`Fetched: ${JSON.stringify(pokemon)}`);

  const body = `Thanks for raising a PR! We'll have it reviewed as soon as we can by our friendly ${pokemon.name}

  <img src="${pokemon.imageUrl}">`;

  tools.log.info(`Adding comment: ${body}`);

  // Add a comment to the PR that was raised
  await tools.github.issues.createComment({
    ...tools.context.issue,
    body
  });

  tools.exit.success("Action completed");
});

async function getPokemon(id) {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
    const imageUrl = `https://pokeres.bastionbot.org/images/pokemon/${id}.png`;

    const response = await fetch(url);
    const body = await response.json();

    return {
        name: body.name,
        imageUrl
    };
}
