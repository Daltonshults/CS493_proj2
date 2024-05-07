const router = require('express').Router();
const { validateAgainstSchema, validateWithPartialSchema, extractValidFields } = require('../lib/validation');
const { getPool } = require('../lib/mysql_connection');
const reviews = require('../data/reviews');

exports.router = router;
exports.reviews = reviews;


/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, reviewSchema)) {

    const review = extractValidFields(req.body, reviewSchema);
    /*
     * Make sure the user is not trying to review the same business twice.
     * Handled by the database UNIQUE requirement.
     */

    try {
      const result = await getPool().query(
        `INSERT INTO Reviews (UserID, BusinessID, Dollars, Stars, review) VALUES (?, ?, ?, ?, ?)`,
        [
          review.userid,
          review.businessid,
          review.dollars,
          review.stars,
          review.review
        ]
      );

      if (result[0].insertId != null) {
        res.status(201).json({
          id: result.insertId,
          links: {
            review: `/reviews/${result[0].insertId}`,
            business: `/businesses/${review.businessid}`
          }
        });
      } else {
        res.status(500).json({ error: "Error inserting review into DB." });
      }
    } catch (err) {
      if (err.code == 'ER_DUP_ENTRY') {
        res.status(409).json({error: "User has already posted a review of this business"});
      } else {
        console.log(err);
        res.status(500).json({error: "Error inserting review into DB."});
      }
    }
  } else {
    res.status(400).json({error: "Request body is not a valid review object"});
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);

  try {
    const result = await getPool().query(
      `SELECT * FROM Reviews WHERE ReviewID = ?`, [reviewID]
    );

    if (result[0][0].ReviewID == reviewID) {
      res.status(200).json(result[0][0]);
    } else {
      next();
    }
  } catch(err) {
    console.log(`Error: ${err}`);
    next();
  }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  try {
    if (validateWithPartialSchema(req.body, reviewSchema)) {
      const review = extractValidFields(req.body, reviewSchema);
      const fieldNames = Object.keys(review);
      const fieldValues = Object.values(review);

      let updateFields = fieldNames.map((name) => `${name} = ?`).join(', ');

      let sql = `UPDATE Reviews SET ${updateFields} WHERE ReviewID = ?`;
      fieldValues.push(reviewID);

      const result = await getPool().query(sql, fieldValues);

      const userBusiness = await getPool().query(
        `SELECT * FROM Reviews WHERE ReviewID = ?`, [reviewID]
      );

      const {BusinessID, UserID} = userBusiness[0];

      if (result[0].affectedRows > 0) {
        res.status(200).json({
          links: {
            review: `/reviews/${reviewID}`,
            business: `/businesses/${BusinessID}`
          }
        });
      } else {
        next();
      }

    } else {
      res.status(400).json({
        error: "Request body is not a valid review object"
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting review into DB if your request has an Business or user id match the review, or remove from request' });
  }

});


/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);

  try {
    const result = await getPool().query(
      `DELETE FROM Reviews WHERE ReviewID = ?`, [reviewID]
    );

    if(result[0].affectedRows > 0) {
      res.status(200).json({deleted: `Review with ID ${reviewID} has been deleted`});
    } else {
      res.status(404).json({ error: "Review not found" });
    }

  } catch (err) {
    console.log(err);
    next();
  }
});
