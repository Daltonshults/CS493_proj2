const router = require('express').Router();
const { validateAgainstSchema, validateWithPartialSchema, extractValidFields} = require('../lib/validation');
// const util = require('util');
const { getPool } = require('../lib/mysql_connection');
const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const mysql = require('mysql2/promise');


exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  website: { required: false },
  email: { required: false }
};


router.get('/', async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const numPerPage = 10;
  const offset = (page - 1) * numPerPage;

  try {
    const [countResults] = await getPool().query('SELECT COUNT(*) AS count FROM Businesses');
    const totalCount = countResults[0].count;
    const lastPage = Math.ceil(totalCount / numPerPage);

    const [results] = await getPool().query('SELECT * FROM Businesses ORDER BY BusinessID LIMIT ?,?',
                                        [offset, numPerPage]);

    for (let i = 0; i < results.length; i++) {
      const business = results[i];

      const [photos] = await getPool().query('SELECT * FROM Photos WHERE BusinessID = ?',
                                          [business.BusinessID]);
      business.photos = photos;

      const [reviews] = await getPool().query('SELECT * FROM Reviews WHERE BusinessID = ?',
                                          [business.BusinessID]);
      business.reviews = reviews;
    }

    const links = {};
    if (page < lastPage) {
      links.nextPage = `/businesses?page=${page + 1}`;
      links.lastPage = `/businesses?page=${lastPage}`;
    }
    if (page > 1) {
      links.prevPage = `/businesses?page=${page - 1}`;
      links.firstPage = '/businesses?page=1';
    }

    res.status(200).json({
      businesses: results,
      pageNumber: page,
      totalPages: lastPage,
      pageSize: numPerPage,
      totalCount: totalCount,
      links: links
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching businesses' });
  }
});

/*
 * Route to create a new business.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, businessSchema)) {
    const business = extractValidFields(req.body, businessSchema);

    try {
      const result = await getPool().query(
        `INSERT INTO Businesses (OwnerID, Name, Address, City, State, Zip, Phone, Category, Website, Email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [business.ownerid, business.name, business.address, business.city, business.state, business.zip, business.phone, business.category, business.website, business.email]
      );

      if (result[0].insertId != null){
        res.status(201).json({
          id: result[0].insertId,
          links: {
            business: `/businesses/${result[0].insertId}`
          }
        });
      } else {
        next();
      }

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error inserting business into DB' });
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object,"
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  try {
    const [ results ] = await getPool().query(`
    SELECT * FROM Businesses WHERE BusinessID = ?`, [businessid]);

    const [ reviewsResults ] = await getPool().query(
      `SELECT * FROM Reviews WHERE BusinessID = ?`, [businessid]
    );

    const [ photosResults ] = await getPool().query(`
    SELECT * FROM Photos WHERE BusinessID = ?`, [businessid]);

    if (results[0].BusinessID == businessid) {
      res.status(200).json({
        business_id: results[0].BusinessID,
        owner_id: results[0].OwnerID,
        name: results[0].Name,
        address: results[0].Address,
        city: results[0].City,
        state: results[0].State,
        zip: results[0].Zip,
        phone: results[0].Phone,
        category: results[0].Category,
        website: results[0].Website,
        email: results[0].Email,
        reviews: reviewsResults,
        photos: photosResults,
    })
    } else {
      next();
    }

  } catch (err) {
    console.log(`Error: ${err}`);
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async function (req, res, next) {
 
  /* 
  UPDATE table_name
  SET column1 = value1, column2 = value2, ...
  WHERE condition;
  */

  const businessid = parseInt(req.params.businessid);

  try {
    if (validateWithPartialSchema(req.body, businessSchema)){
      const business = extractValidFields(req.body, businessSchema);
      const fieldNames = Object.keys(business);
      const fieldValues = Object.values(business);

      let updateFields = fieldNames.map((name) => `${name} = ?`).join(', ');

      let sql = `UPDATE Businesses SET ${updateFields} WHERE BusinessID = ?`;
      fieldValues.push(businessid);

      const result = await getPool().query(sql, fieldValues);
      if (result[0].affectedRows == 1) {
        res.status(200).json({
          links: {
            business: `/businesses/${businessid}`
          }
        });
      } else {
        next();
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
  } catch (err) {
    next();
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);

  try {
    const result = await getPool().query(`DELETE FROM Businesses WHERE BusinessID = ?`, [businessid]);

    if (result[0].affectedRows > 0) {
      res.status(200).json({"Deleted": `Business with ID ${businessid} has been deleted`});
    } else {
      res.status(404).json({ error: "Business not found" });
    }
  } catch (err) {
    console.error(err);
    next();
  }

});
