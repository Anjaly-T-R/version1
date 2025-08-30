export async function enrichByExternalAPI(filename) {
  // If you don't have an API key, just return null.
  const titleGuess = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[._-]+/g, ' ').trim();
  if (!process.env.OMDB_API_KEY && !process.env.TMDB_API_KEY) return null;

  // TODO: call OMDb or TMDB. Keep it simple (omitted here for keyless build).
  // Return shape below:
  return {
    source: 'OMDB',       // or 'TMDB'
    externalId: 'tt1234567',
    title: titleGuess,
    overview: 'Autofilled description.',
    poster: null,
    runtimeSec: 3600
  };
}
