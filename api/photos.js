const router = require('express').Router();
const { validateAgainstSchema, validateWithPartialSchema, extractValidFields } = require('../lib/validation');
const { getPool } = require('../lib/mysql_connection');

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  imageURL: { required: true },
  caption: { required: false }
};


// mysqlPool.query = util.promisify(mysqlPool.query);


/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);
    // console.log(photo);
    try {
      // console.log("Try");
      const result = await getPool().query(
        `INSERT INTO Photos (UserID, BusinessID, ImageURL, Caption) VALUES (?, ?, ?, ?)`, [
          photo.userid,
          photo.businessid,
          photo.imageURL,
          photo.caption]
      );
      if (result[0].insertId != null) {
        res.status(201).json({
          id: photo.id,
          links: {
            photo: `/photos/${result[0].insertId}`,
            business: `/businesses/${photo.businessid}`
          }
        });
      } else {
        next();
      }
    } catch (err) {
      next();
    }
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);

  try {
    // console.log("PhotoId: ", photoID);
    // console.log("Try");
    const result = await getPool().query(
      `SELECT * FROM Photos WHERE PhotoID = ?`, [photoID]
    );
    // console.log("Result below:")
    // console.log(result)
    // console.log(`\n\nResult[0][0]`)
    // console.log(result[0][0]);
    // console.log(`\nResult[0] ${result[0].PhotoID}`);
    // console.log(`\nResult: ${result.PhjotoID}`);
    if (result[0][0].PhotoID == photoID) {
      res.status(200).json(result[0][0]);
    } else {
      // console.log("\nElse");
      next();
    }
    
  } catch (err) {
    // console.log(`Error: ${err}`);
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  // console.log(`PhotoID: ${photoID}`);
  try {
    // console.log(`ValidateWithPartialSchema: ${validateWithPartialSchema(req.body, photoSchema)}`);
    if (validateWithPartialSchema(req.body, photoSchema)) {
      // console.log("Validated");
      const photo = extractValidFields(req.body, photoSchema);
      const fieldNames = Object.keys(photo);
      const fieldValues = Object.values(photo);


      let updateFields = fieldNames.map((name) => `${name} = ?`).join(', ');


      let sql = `UPDATE Photos SET ${updateFields} WHERE PhotoID = ?`;
      fieldValues.push(photoID);



      const result = await getPool().query(sql, fieldValues);

      if (result[0].affectedRows > 0) {
        res.status(200).json({
          Links: {
            photo: `/photos/${photoID}`,
            business: `/businesses/${photo.businessid}`
          }
        });
      } else {
        next();
      }
    } else {
      res.status(400).json({"Error": "Malformed Request"});
    }
  } catch (err) {
    console.log(`Error: ${err}`);
    next();
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  // console.log(`PhotoID: ${photoID}`);

  try {
    const result = await getPool().query(
      `DELETE FROM Photos WHERE PhotoID = ?`, [photoID]
    );

    // console.log(`Affected Rows: ${result[0].affectedRows}`);
    if (result[0].affectedRows > 0) {
      res.status(200).json({"Deleted": `Photo with ID ${photoID} has been deleted`});
    } else {
      res.status(404).json({ error: "Photo not found" });
    }

  } catch (err) {
    console.log(err);
    next();
  }
});
