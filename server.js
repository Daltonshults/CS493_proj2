const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const { init, getPool } = require('./lib/mysql_connection');
const api = require('./api');

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);



/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})

// Define a route for initialization
app.get('/initialize', async (req, res, next) => {
  try {
    await init();
    res.status(200).send("Initialization completed successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
    res.status(500).send({"error": "Error initializing database"});
  }
});




app.listen(port, async function() {
  await init();
  console.log("== Server is running on port", port);
});

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});
