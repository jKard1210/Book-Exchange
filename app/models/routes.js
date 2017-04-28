module.exports = function(app, passport) {

var mongoose = require('mongoose');
        var db = require('../../config/database.js');
        
        var Schema = mongoose.Schema;
         var bookSchema = new Schema({
                title: String,
                author: String,
                imgUrl: String,
                user: String,
                requests: Array
         });
         

        var book = mongoose.model('books', bookSchema);
        var books = require('google-books-search');
        

    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });


    app.get('/login', function(req, res) {

        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });


app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
    
    
   app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    

    app.get('/home', isLoggedIn, function(req, res) {


        book.find({}, function(err, data){
        if (err) console.log(err);
        res.render('home.ejs', {
            user: req.user,
            data: data
        });
    });

    });
    
    app.get('/create', isLoggedIn, function(req, res) {
        book.find({user: req.user.local.email}, function(err, data) {
            if (err) console.log(err);
            res.render('create.ejs', {
            user: req.user,
            data: data
        });
        })
    });
    
    
    
    app.get('/account', isLoggedIn, function(req, res) {
        res.render('account.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });
    
    app.get('/trades', isLoggedIn, function(req,res) {
        book.find({user: req.user.local.email}, function(err, data) {
            if (err) console.log(err);
            book.find({requests: {$elemMatch: req.user.local.email}}, function(err, data2) {
            if (err) console.log(err);  
            res.render('trades.ejs', {
            user: req.user,
            inTrades: data,
            outTrades: data2
        });
        })})
})

app.get('/reqTrade/:book', isLoggedIn, function(req, res) {
    var title = req.params.book;
    book.findOneAndUpdate({'title': title}, {$push: { "requests" : req.user.local.email}}, function(err, data) {
            if (err) console.log(err);
            res.redirect('/home');
            
    })
})


    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    app.get('/addBook', isLoggedIn, function(req, res) {
        var book1 = req.query.book1;
        var bookTitle = "";
        var author = "";
        var imgUrl = "";
        var user = req.user.local.email;
        books.search(book1, function(error, results) {
    if ( ! error ) {
        bookTitle = results[0].title;
        author = results[0].author;
        imgUrl = results[0].thumbnail;
        console.log(results);
    } else {
        console.log(error);
    }
});

setTimeout(function() {
        
        var newBook = new book({
            "title" : bookTitle,
            "author": author,
            "imgUrl": imgUrl,
            "user": user,
            "requests": []
        });
        newBook.save(function(err) {
                    if (err)
                        throw err;
                    return newBook;
                });
        
        res.redirect("/create");
}, 1000);
    });
    
   
    
};

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}
