var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Set Handlebars.

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.get("/", function(req, res) {
  console.log("/ End Point");
  var hbsObject = {
    message: "Success"
  };
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.aljazeera.com").then(response => {
    console.log("axios response");
    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    const $ = cheerio.load(response.data);

    // An empty array to save the data that we'll scrape
    //const results = [];

    $(".mts-article").each(function(i, element) {
      console.log("mts-article");
      let headline_parent = $(element)
        .find("h1.mts-article-title")
        .children("a")
        .text();
      let headline_child = $(element)
        .find("p.mts-article-p")
        .text();
      let link = $(element)
        .find("h1.mts-article-title")
        .children("a")
        .attr("href");
      console.log(link);

      console.log(" ");
      console.log(" ");
      console.log(" ");
      // console.log("Parent");
      // console.log(headline_parent);
      console.log(" ");
      console.log("Children");
      console.log(headline_child);
      let article={
        title:headline_parent,
        link:link,
        description:headline_child,

      }
      db.Article.create(article).then(function(article){
        console.log(article)
      })
      
    });
    //Load index page now...

    res.send("complete");
  });
});

app.get("/search", function(req, res) {
  const searchQuery = req.query.search;
// originally I used RegExp
  // We did this with calvin, I worked with Musheer, on his computer because my computer was down check the dates, calvin and Musheer can both vouch for this. its basically the mongoose homework
  
// https://mongoosejs.com/docs/api.html
//   Here is where it comes from in the data

// method name or regular expression
//   Parameters
// name «String|RegExp» if string, the name of the model to remove. If regexp, removes all models whose name matches the regexp.
// Returns:
// «Mongoose» this
// Removes the model named name from the default connection, if it exists. You can use this function to clean up any models you created in your tests to prevent OverwriteModelErrors.

// Equivalent to mongoose.connection.deleteModel(name).

// Example:
// mongoose.model('User', new Schema({ name: String }));
// console.log(mongoose.model('User')); // Model object
// mongoose.deleteModel('User');
// console.log(mongoose.model('User')); // undefined

// // Usually useful in a Mocha `afterEach()` hook
// afterEach(function() {
//   mongoose.deleteModel(/.+/); // Delete every model
// });
// ______________________________________________________
  // ?https://mongoosejs.com/docs/api.html

  db.Article.find({headline: new (searchQuery, "i")})
// as in the documentation it only returns a query if the 

    // Throw any errors to the console
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  // Find all results from the scrapedData collection in the db
  db.Article.find()
    // Throw any errors to the console
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.findById(req.params.id)
    .populate("note")
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function(dbPopulate) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: dbPopulate._id } },
        { new: true }
      );
    })
    .then(function(dbPopulate) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});