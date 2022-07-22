const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);
console.log(mongoose.connection.readyState);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

var userSchema = new Schema({
    username: { type: String, required: true },
});
var User = mongoose.model("User", userSchema);

var exerciseSchema = new Schema({
    username: String,
    description: String,
    duration: Number,
    date: { type: Date },
    userid: String,
});
var Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", function (req, res) {
    let { username } = req.body;
    let user = new User({ username: username });
    user.save(function (err, data) {
        if (err) return console.log(err);
        res.json({
            _id: data._id,
            username: username,
        });
    });
});

app.get("/api/users", function (req, res) {
    User.find({}, function (err, data) {
        if (err) return console.log(err);
        res.json(data);
    });
});

app.post("/api/users/:_id/exercises", function (req, res) {
    let { description, duration, date } = req.body;
    let userid = req.params._id;
    date = date ? new Date(date) : new Date();
    User.findById({ _id: userid }).exec(function (err, username) {
        if (err) return console.log(err);
        let exercise = new Exercise({
            username: username.username,
            description: description,
            duration: duration,
            date: date,
            userid: userid,
        });
        exercise.save(function (err, data) {
            if (err) return console.log(err);
            res.json({
                username: data.username,
                description: data.description,
                duration: data.duration,
                date: new Date(data.date).toDateString(),
                _id: data.userid,
            });
        });
    });
});

app.get("/api/users/:_id/logs", function (req, res) {
    let { from, to, limit } = req.query;
    console.log(from, to, limit);
    let id = req.params._id;
	try {
		User.findById({ _id: id }, function (err, user) {
        if (err) return console.error(err);
        Exercise.find({
            userid: user.id,
            date: {
                $gte: 
					!isNaN(Date.parse(from)) 
						? new Date(from) 
						: new Date(1970),
                $lte:
                    !isNaN(Date.parse(to))
                        ? new Date(to)
                        : new Date()
            }
        })
            .select("description duration date")
            .limit(limit != "undefined" ? limit : 0)
            .lean()
            .exec(function (err, exe) {
                if (err) return console.error(err);
                // console.log(exe);
                let json = {
                    _id: user._id,
                    username: user.username,
                };
                // if (typeof from != "undefined") {
				if (!isNaN(Date.parse(from))) {
                    json.from = new Date(from).toDateString();
                }
                // if (typeof to != "undefined") {
				if (!isNaN(Date.parse(to))) {
                    json.to = new Date(to).toDateString();
                }
                json.count = exe.length;
                for (let e of exe) {
					delete e._id;
                    e.date = new Date(e.date).toDateString();
                    // console.log(new Date(e.date).toDateString())
                }
                json.log = exe;
                res.json(json);
            });
    });
	} catch (error) {
		console.log(error)
	}
    
});

const listener = app.listen(process.env.PORT || 8080, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
