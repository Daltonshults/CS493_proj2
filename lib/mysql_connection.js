const mysql = require('mysql2/promise');

let mysqlPool;

// Set values to whatever you want, can't have more reviews than businesses.
const num_users = 50;
const num_businesses = 20;
const num_reviews = 3;
const num_photos = 3;

async function init() {
  let connected = false;
  while (!connected) {
      try {
          mysqlPool = await mysql.createPool({
            connectionLimit: 10,
            host: process.env.MYSQL_HOST || "mysql-server",
            port: process.env.MYSQL_PORT || 3306,
            database: process.env.MYSQL_DATABASE || "proj_2",
            user: process.env.MYSQL_USER || "proj_2_user",
            password: process.env.MYSQL_PASSWORD ||"sql_password",
          });

          // Test the pool
          const [rows] = await mysqlPool.query('SELECT 1 + 1 AS solution');
          console.log('Pool test result:', rows[0].solution);  // Should log: Pool test result: 2

          // If we reach this point, the pool was created successfully and the test query executed successfully
          connected = true;
      } catch (err) {
          console.error("Error initializing database:", err);
          console.log("Retrying in 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
      }
  }

  // The rest of your code...

  console.log("CREATING USERS TABLE");
  
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      UserID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(25)
    );`
  );

  console.log("CREATING BUSINESSSES TABLE")
  await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS Businesses (
        BusinessID INT AUTO_INCREMENT PRIMARY KEY,
        OwnerID INT NOT NULL,
        Name VARCHAR(255) NOT NULL,
        Address VARCHAR(255) NOT NULL,
        City VARCHAR(100) NOT NULL,
        State CHAR(2) NOT NULL,
        Zip VARCHAR(10) NOT NULL,
        Phone VARCHAR(20) NOT NULL,
        Category VARCHAR(100) NOT NULL,
        Website VARCHAR(255),
        Email VARCHAR(255),
        FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
    );`
  );
  console.log("CREATING REVIEWS TABLE")
  await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        ReviewID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        BusinessID INT NOT NULL,
        Stars INT NOT NULL CHECK (Stars BETWEEN 0 AND 5),
        Dollars INT NOT NULL CHECK (Dollars BETWEEN 1 AND 4),
        Review TEXT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID), 
        FOREIGN KEY (BusinessID) REFERENCES Businesses(BusinessID) ON DELETE CASCADE,
        UNIQUE (UserID, BusinessID)
    );`
  );
  console.log("CREATING PHOTOS TABLE")
  await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS Photos (
        PhotoID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        BusinessID INT NOT NULL,
        Caption TEXT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (BusinessID) REFERENCES Businesses(BusinessID)
    );
  `);

  console.log("CREATING USERS")
  for (let i = 1; i <= num_users; i++) {
    await mysqlPool.query(`
      INSERT INTO Users (Name) VALUES (?);
    `, [`User ${i}`]);
  }
  console.log("CREATING BUSINESSES")
  for (let i = 1; i <= num_businesses; i++) {
    for (let j = 1; j <= 3; j++) {
      await mysqlPool.query(`
        INSERT INTO Businesses (OwnerID, Name, Address, City, State, Zip, Phone, Category, Website, Email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [i, `Business ${i}-${j}`, `Address ${i}-${j}`, `City ${i}-${j}`, 'OR', '12345', '123-456-7890', 'Category', 'www.example.com' ,`email${i}_${j}@example.com`]
    )}};
  // Setup so that there isn't a review for every business, but instead a review for every user for num_reviews businesses
  console.log("CREATING REVIEWS AND PHOTOS")
  for (let i = 1; i <= num_users; i++) {
    for (let j = 1; j <= num_reviews; j++) {
      await mysqlPool.query(`
                  INSERT INTO Reviews (UserID, BusinessID, Stars, Dollars, Review) VALUES (?, ?, ?, ?, ?);
                  `, [i, j, 1, 1, `Review ${i+j} for Business ${i}-${j} by User ${i}`]);

      for (let k = 1; k <= num_photos; k++) {

        // Insert a photo
        await mysqlPool.query(`
          INSERT INTO Photos (UserID, BusinessID, Caption) VALUES (?, ?, ?);
        `, [i, j, `Photo ${k} for Business ${i}-${j} by User ${i}`]);
      }
    }
  }

    console.log("Initializiaiton completed successfully?");
}


module.exports = { init, getPool: () => mysqlPool };