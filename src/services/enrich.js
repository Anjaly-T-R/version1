export async function enrichByExternalAPI(filename) {
  const titleGuess = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[._-]+/g, ' ').trim();
  if (!process.env.OMDB_API_KEY && !process.env.TMDB_API_KEY) return null;

 
  return {
    source: 'OMDB',       
    externalId: 'tt1234567',
    title: titleGuess,
    overview: 'Autofilled description.',
    poster: null,
    runtimeSec: 3600
  };
}
