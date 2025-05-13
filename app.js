
const express = require("express");
const port = 6060;
const mongoose = require('mongoose');
const Issue = require("./model/schema.js");
const Review = require("./model/review.js");
const path = require("path");
const app = express();
const methodOverride = require('method-override');
const multer = require("multer");
const session = require("express-session");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.set('strictQuery', false);

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Connect DB
main()
    .then(() => console.log("Connected to database 'Hostel'.."))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Hostel");
}

// Schemas
const loginSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ['user', 'staff',],
        default: 'user',
        required: true
    }
});

const Login = mongoose.model("login", loginSchema);

// Middlewares
function isLoggedIn(req, res, next) {
    if (req.session.user) return next();
    console.log(req.session.user);  // Check if user is logged in
    res.redirect('/login');
}

function isStaff(req, res, next) {
    if (req.session.user && req.session.user.role === 'staff') return next();
    res.status(403).send("Access denied: staff only");
}

// Auth
app.get("/login", (req, res) => {
    res.render('include/login.ejs');
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.post("/register", async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
        return res.send("<script>alert('Passwords do not match!'); window.history.back();</script>");
    }

    const existingUser = await Login.findOne({ email });
    if (existingUser) {
        return res.send("<script>alert('Email already registered!'); window.history.back();</script>");
    }

    const newUser = new Login({ firstname, lastname, email, password, role });
    await newUser.save();
    //console.log(req.body);
    res.redirect("/home");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await Login.findOne({ email, password });

    if (user) {
        req.session.user = {
            id: user._id,
            email: user.email,
            role: user.role
        };
        res.redirect("/home");
    } else {
        res.send("<script>alert('Invalid email or password!'); window.history.back();</script>");
    }
});

//reviews

app.post("/reviews", async (req, res) => {
    try {
        const { name, room, date, mealType, rating, reviewText } = req.body;

        const currentDate = date || new Date().toISOString().split('T')[0];

        const newReview = new Review({
            name, 
            room,
            date: currentDate,
            mealType, 
            rating, 
            reviewText
        });

        await newReview.save();
        res.redirect("/reviews"); // or wherever you want to go after submission
    } catch (err) {
        console.error("Error saving review:", err);
        res.status(500).send("Error saving review. Please try again.");
    }
});


// Home, Static Pages
app.get("/home", (req, res) => res.render("listing/home.ejs"));
app.get("/about", (req, res) => res.render("listing/about.ejs"));
app.get("/cards", (req, res) => res.render("listing/cards.ejs"));
app.get("/form", (req, res) => res.render("listing/form.ejs"));
app.get("/contact", (req, res) => res.render("listing/contact.ejs"));

// Servicesnode
app.get("/services", async (req, res) => {
    const allServices = await Issue.find({});
    res.render("services/services.ejs", { allServices });
});

app.get('/services/cleaning', async (req, res) => {
    const cleaningIssues = await Issue.find({ issue_type: "cleaning" });
    res.render('services/cleaining.ejs', { issues: cleaningIssues });
});

app.get('/services/electrical', async (req, res) => {
    const electricalIssues = await Issue.find({ issue_type: "electrical" });
    res.render('services/electrical', { issues: electricalIssues });
});

app.get('/services/plumbing', async (req, res) => {
    const plumbingIssues = await Issue.find({ issue_type: "plumbing" });
    res.render('services/plumbing.ejs', { issues: plumbingIssues });
});

// Form Submission
app.get('/services/cleaning/form', (req, res) => {
    res.render('listing/form', { issueType: "cleaning" });
});

app.post('/services/cleaning', upload.single('beforeImage'), async (req, res) => {
    try {
        const { name, room, issue_type, description } = req.body;

        const beforeImage = req.file ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
        } : null;

        await Issue.create({
            name,
            room,
            issue_type,
            description,
            status: "Pending",
            beforeImage,
            afterImage: null
        });

        if (issue_type === "cleaning") return res.redirect('/services/cleaning');
        if (issue_type === "electrical") return res.redirect('/services/electrical');
        if (issue_type === "plumbing") return res.redirect('/services/plumbing');
    } catch (error) {
        console.error('Error saving issue:', error);
        res.status(500).send('Something went wrong. Please try again.');
    }
});


// Show Issue
app.get("/issues/:id", async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).send("Issue not found");

    const userRole = req.session.user ? req.session.user.role : 'user';

    res.render("services/show_issue", { issue, userRole });
});


// Edit Issue (user only)
app.get("/issues/:id/edit", isLoggedIn, async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).send("Issue not found");
    res.render("services/edit_issue", { issue });
});

app.put("/issues/:id", isLoggedIn, async (req, res) => {
    const { name, room, issue_type, description } = req.body;

    await Issue.findByIdAndUpdate(req.params.id, {
        name, room, issue_type, description
    });

    // Redirect based on updated issue type
    if (issue_type === "cleaning") return res.redirect('/services/cleaning');
    if (issue_type === "plumbing") return res.redirect('/services/plumbing');
    if (issue_type === "electrical") return res.redirect('/services/electrical');

    // Default fallback
    res.redirect("/services");
});


// Delete
app.delete("/issues/:id", async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).send("Issue not found");
        }

        const issueType = issue.issue_type; // 'cleaning', 'plumbing', or 'electrical'

        await Issue.findByIdAndDelete(req.params.id);

        // Redirect based on issue type
        if (issueType === "cleaning") return res.redirect("/services/cleaning");
        if (issueType === "plumbing") return res.redirect("/services/plumbing");
        if (issueType === "electrical") return res.redirect("/services/electrical");

        // Default fallback
        res.redirect("/services");
    } catch (error) {
        console.error("Error deleting issue:", error);
        res.status(500).send("Internal server error");
    }
});


// View Images
app.get("/issues/:id/images", async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    res.render("services/images", { issue });
});

// Upload After Image (staff only)
app.post("/issues/:id/after-image", isStaff, upload.single("afterImage"), async (req, res) => {
    const { status } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).send("Issue not found");

      // Update after image
    if (req.file) {
        issue.afterImage = {
            data: req.file.buffer,
            contentType: req.file.mimetype
        };
    }

    // Update status
    if (status) {
        issue.status = status;
    }

    // Redirect to issue detail page or services
    await issue.save();
    res.redirect(`/issues/${issue._id}/images`);
});

//review form route
app.get("/services/mess-food", (req, res) => {
    res.render("services/review_form");
});

app.get("/reviews", async (req, res) => {
    try {
        const allReviews = await Review.find({});
        res.render("services/index", { reviews: allReviews });
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send("Internal Server Error. Please try again later.");
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
