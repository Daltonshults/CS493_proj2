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
  caption: { required: false }
};

/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);
    try {

      const result = await getPool().query(
        `INSERT INTO Photos (UserID, BusinessID, Caption) VALUES (?, ?, ?)`, [
          photo.userid,
          photo.businessid,
          photo.caption || ""]
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
      res.status(404).json({"error": `${err}`});
    }
  } else {
    next();
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);

  try {

    const result = await getPool().query(
      `SELECT * FROM Photos WHERE PhotoID = ?`, [photoID]
    );

    if (result[0][0].PhotoID == photoID) {
      res.status(200).json(result[0][0]);
    } else {
      next();
    }
    
  } catch (err) {
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  try {
    if (validateWithPartialSchema(req.body, photoSchema)) {
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
  try {
    const result = await getPool().query(
      `DELETE FROM Photos WHERE PhotoID = ?`, [photoID]
    );
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
