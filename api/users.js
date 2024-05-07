const router = require('express').Router();
const { getPool } = require('../lib/mysql_connection');
exports.router = router;


router.get('/:userid/businesses', async function (req, res) {
  const userid = parseInt(req.params.userid);
  try {
    const [results] = await getPool().query(
      `SELECT * FROM Businesses WHERE OwnerID = ?`, [userid]
    );

    for (let i = 0; i < results.length; i++) {
      const business = results[i];
      const [reviews] = await getPool().query('SELECT * FROM Reviews WHERE BusinessID = ?', [business.BusinessID]);
      business.reviews = reviews;

      const [photos] = await getPool().query('SELECT * FROM Photos WHERE BusinessID = ?', [business.BusinessID]);
      business.photos = photos;
    }
    if (results.length > 0) {
      res.status(200).json({
        businesses: results
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
    const [results] = await getPool().query(
      `SELECT * FROM Reviews WHERE UserID = ?`, [userid]
    );

    if (results.length > 0 ) {
      res.status(200).json({
        reviews: results
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
