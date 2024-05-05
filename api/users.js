const router = require('express').Router();
// const util = require('util');
// const mysql = require('mysql2/promise');
const { getPool } = require('../lib/mysql_connection');
exports.router = router;

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

router.get('/:userid/businesses', async function (req, res) {
  const userid = parseInt(req.params.userid);
  // console.log(userid);

  try {
    let query = `SELECT * FROM Businesses WHERE OwnerID = 1`;

    const results = await getPool().query(
      `SELECT * FROM Businesses WHERE OwnerID = ?`, [userid]
    );

    // console.log(results[0]);


    if (results[0].length > 0) {
      res.status(200).json({
        businesses: results[0]
      });
    } else {
      res.status(404).json({
        error: "User does not own any businesses"
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching businesses from DB' });
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async function (req, res) {
  const userid = parseInt(req.params.userid);

  try {
    const results = await getPool().query(
      `SELECT * FROM Reviews WHERE UserID = ?`, [userid]
    );

    // console.log("Results");
    // console.log(results);

    // console.log("Results[0]");
    // console.log(results[0]);

    if (results[0].length > 0 ) {
      res.status(200).json({
        reviews: results[0]
      });
    } else {
      res.status(404).json({
        error: "User does not have any reviews"
      });
    }

  } catch (err) {
    console.log(err);
    next();
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async function (req, res) {
  const userid = parseInt(req.params.userid);

  try {
    const results = await getPool().query(
      `SELECT * FROM Photos WHERE UserID = ?`, [userid]
    );
    // console.log(`resultslength: ${results.length}`);
    // console.log("Results");
    // console.log(results);

    // console.log("Results[0]");
    // console.log(results[0]);

    if (results[0].length > 0) {
      res.status(200).json({
        photos: results[0]
      });
    } else {
      res.status(404).json({
        error: "User does not have any photos"
      });
    }
  } catch (err) {
    console.log(err);
    next();
  }
});
