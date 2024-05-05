const express = require('express');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const { init, getPool } = require('./lib/mysql_connection');
const api = require('./api');

const app = express();
const port = process.env.PORT || 8000;

// setTimeout( () => {
//   mysqlPool = mysql.createPool({
//     connectionLimit: 10,
//     host: process.env.MYSQL_HOST || "mysql-server",
//     port: process.env.MYSQL_PORT || 3306,
//     database: process.env.MYSQL_DATABASE || "proj_2",
//     user: process.env.MYSQL_USER || "proj_2_user",
//     password: process.env.MYSQL_PASSWORD ||"sql_password",});
// }, 30000)

// mysqlPool.connect(error => {
//   if (error) throw error;
//   console.log('Successfully connected to the database.');
// });

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

// app.listen(port, function() {
//   console.log("== Server is running on port", port);
// });

// async function init() {
//   setTimeout(async () => {
//       try {
//       console.log("MySQL Host:", process.env.MYSQL_HOST);
//       console.log("MySQL User:", process.env.MYSQL_USER);
//       console.log("MySQL Password:", process.env.MYSQL_PASSWORD);
//       console.log("MySQL Database:", process.env.MYSQL_DATABASE);

//       mysqlPool = mysql.createPool({
//         connectionLimit: 10,
//         host: process.env.MYSQL_HOST || "mysql-server",
//         port: process.env.MYSQL_PORT || 3306,
//         database: process.env.MYSQL_DATABASE || "proj_2",
//         user: process.env.MYSQL_USER || "proj_2_user",
//         password: process.env.MYSQL_PASSWORD ||"sql_password",
//       })

//       console.log("CREATING USERS TABLE");

//       await mysqlPool.query(`
//         CREATE TABLE IF NOT EXISTS Users (
//           UserID INT AUTO_INCREMENT PRIMARY KEY,
//           Name VARCHAR(25)
//         );`
//       );

//       console.log("CREATING BUSINESSSES TABLE")
//       await mysqlPool.query(`
//           CREATE TABLE IF NOT EXISTS Businesses (
//             BusinessID INT AUTO_INCREMENT PRIMARY KEY,
//             OwnerID INT NOT NULL,
//             Name VARCHAR(255) NOT NULL,
//             Address VARCHAR(255) NOT NULL,
//             City VARCHAR(100) NOT NULL,
//             State CHAR(2) NOT NULL,
//             Zip VARCHAR(10) NOT NULL,
//             Phone VARCHAR(20) NOT NULL,
//             Category VARCHAR(100) NOT NULL,
//             Website VARCHAR(255),
//             Email VARCHAR(255),
//             FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
//         );`
//       );
//       console.log("CREATING REVIEWS TABLE")
//       await mysqlPool.query(`
//           CREATE TABLE IF NOT EXISTS Reviews (
//             ReviewID INT AUTO_INCREMENT PRIMARY KEY,
//             UserID INT NOT NULL,
//             BusinessID INT NOT NULL,
//             Star INT NOT NULL CHECK (Star BETWEEN 0 AND 5),
//             Cost INT NOT NULL CHECK (Cost BETWEEN 1 AND 4),
//             WrittenReview TEXT,
//             FOREIGN KEY (UserID) REFERENCES Users(UserID), 
//             FOREIGN KEY (BusinessID) REFERENCES Businesses(BusinessID),
//             UNIQUE (UserID, BusinessID)
//         );`
//       );
//       console.log("CREATING PHOTOS TABLE")
//       await mysqlPool.query(`
//           CREATE TABLE IF NOT EXISTS Photos (
//             PhotoID INT AUTO_INCREMENT PRIMARY KEY,
//             UserID INT NOT NULL,
//             BusinessID INT NOT NULL,
//             ImageURL VARCHAR(255) NOT NULL,
//             Caption TEXT,
//             FOREIGN KEY (UserID) REFERENCES Users(UserID),
//             FOREIGN KEY (BusinessID) REFERENCES Businesses(BusinessID)
//         );
//       `);
//       console.log("CREATING USERS")
//       for (let i = 1; i <= 10; i++) {
//         await mysqlPool.query(`
//           INSERT INTO Users (Name) VALUES (?);
//         `, [`User ${i}`]);
//       }
//       console.log("CREATING BUSINESSES")
//       for (let i = 1; i <= 10; i++) {
//         for (let j = 1; j <= 3; j++) {
//           await mysqlPool.query(`
//             INSERT INTO Businesses (OwnerID, Name, Address, City, State, Zip, Phone, Category, Website, Email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
//           `, [i, `Business ${i}-${j}`, `Address ${i}-${j}`, `City ${i}-${j}`, 'OR', '12345', '123-456-7890', 'Category', 'www.example.com' ,`email${i}_${j}@example.com`]
//         )}};

//         console.log("Initializiaiton completed successfully?");
        
//       } catch (err) {
//         console.error("Error initializing database:", err);
//         process.exit(1);
//       }}, 30000);


// }

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