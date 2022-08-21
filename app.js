const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`Server Running at http://localhost:3000/`)
    );
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

app.get("/movies/", async (request, response) => {
  const movieDetails = `SELECT movie_name FROM movie ;`;
  const movieDetailsResult = await db.all(movieDetails);
  response.send(
    movieDetailsResult.map((movieNames) => ({
      movieName: movieNames.movie_name,
    }))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addingMovie = `INSERT INTO movie (director_id,movie_name,lead_actor)
    VALUES('${directorId}','${movieName}','${leadActor}');
    `;
  const addingMovieDetails = await db.run(addingMovie);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `SELECT * FROM movie WHERE movie_id='${movieId}';`;
  const movie = await db.get(getMovieDetails);
  response.send(convertMovieDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updatingMovieDetails = `UPDATE movie
                            SET
                            director_id='${directorId}',
                            movie_name='${movieName}',
                            lead_actor='${leadActor}'
                            WHERE 
                            movie_id='${movieId}';`;
  await db.run(updatingMovieDetails);
  response.send("Movie Details Updated");
});

app.delete(`/movies/:movieId/`, async (request, response) => {
  const { movieId } = request.params;
  const getMovieToBeRemoved = `DELETE  FROM movie WHERE movie_id=${movieId};`;
  const movieArray = await db.run(getMovieToBeRemoved);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const directorDetails = `SELECT * FROM director ;`;
  const directorTableDetails = await db.all(directorDetails);
  response.send(
    directorTableDetails.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
