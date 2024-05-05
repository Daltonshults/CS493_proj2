const router = require('express').Router();
const { validateAgainstSchema, validateWithPartialSchema, extractValidFields } = require('../lib/validation');
const mysql = require('mysql2/promise');
const util = require('util');
const { getPool } = require('../lib/mysql_connection');
const reviews = require('../data/reviews');

exports.router = router;
exports.reviews = reviews;


// const mysqlPool = mysql.createPool({
//   connectionLimit: 10,
//   host: process.env.MYSQL_HOST || "mysql-server",
//   port: process.env.MYSQL_PORT || 3306,
//   database: process.env.MYSQL_DATABASE || "proj_2",
//   user: process.env.MYSQL_USER || "proj_2_user",
//   password: process.env.MYSQL_PASSWORD ||"sql_password",
// })

// mysqlPool.query = util.promisify(mysqlPool.query);
/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  cost: { required: true },
  star: { required: true },
  writtenreview: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, reviewSchema)) {
    // console.log("Validate");
    const review = extractValidFields(req.body, reviewSchema);
    // console.log(`Review: ${review}`);

    /*
     * Make sure the user is not trying to review the same business twice.
     * Handled by the database UNIQUE requirement.
     */

    try {
      const result = await getPool().query(
        `INSERT INTO Reviews (UserID, BusinessID, Cost, Star, WrittenReview) VALUES (?, ?, ?, ?, ?)`,
        [
          review.userid,
          review.businessid,
          review.cost,
          review.star,
          review.writtenreview
        ]
      );

      // console.log("Result");
      // console.log(result);

      // console.log("Result[0]");
      // console.log(result[0]);

      if (result[0].insertId != null) {
        res.status(201).json({
          id: result.insertId,
          links: {
            review: `/reviews/${result.insertId}`,
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

    // console.log("Result below:");
    // console.log(result);

    // console.log("REsult[0]");
    // console.log(result[0]);

    // console.log("Result[0][0]");
    // console.log(result[0][0]);

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
  // console.log(`ReviewID: ${reviewID}`);
  try {
    if (validateWithPartialSchema(req.body, reviewSchema)) {
      // console.log("Validated");
      const review = extractValidFields(req.body, reviewSchema);
      const fieldNames = Object.keys(review);
      const fieldValues = Object.values(review);
      // console.log(`Review: ${review}`);
      // console.log(`FieldNames: ${fieldNames}`);
      // console.log(`FieldValues: ${fieldValues}`);

      let updateFields = fieldNames.map((name) => `${name} = ?`).join(', ');
      // console.log(updateFields);

      let sql = `UPDATE Reviews SET ${updateFields} WHERE ReviewID = ?`;
      fieldValues.push(reviewID);

      const result = await getPool().query(sql, fieldValues);
      // console.log("Result");
      // console.log(result);

      // console.log("Result[0]");
      // console.log(result[0]);
      
      const userBusiness = await getPool().query(
        `SELECT * FROM Reviews WHERE ReviewID = ?`, [reviewID]
      );
      // console.log("UserBusiness");
      // console.log(userBusiness);

      const {BusinessID, UserID} = userBusiness[0];
      // console.log(`BusinessID: ${BusinessID}`);
      // console.log(`UserID: ${UserID}`);

      // console.log(`Result: ${result}`);
      // console.log(`Result[0].affectedRows ${result[0].affectedRows}`);
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
    // console.log("Result");
    // console.log(result);

    // console.log("Result[0]");
    // console.log(result[0]);

    // console.log(`Affected Rows: ${result.affectedRows}`);
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
