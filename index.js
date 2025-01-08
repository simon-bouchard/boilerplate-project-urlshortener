require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
	original_url: {
		required: true,
		type: String
	},
	short_url: Number
});

let urls = mongoose.model('urls', urlSchema);

const CreateURL = (url, done) => {
	urls.create(url, (err, saved_url) => {
		if (err) return console.error(err);
		done(null);
	});
};

// handle POST body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));	

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
	const originalurl = req.body.url

	let hostname;
    try {
        const urlObj = new URL(originalurl); // Validate and parse the URL
	    hostname = urlObj.hostname;
    } catch (error) {
         return res.json({ error: "Invalid URL" });
    }
	
	dns.lookup(hostname, async (err) => {
		if (err) {
			return res.json({error: "Invalid URL"});
		}
		try {
		let url = await urls.findOne({ original_url: originalurl });
			if (!url) {
				const count = await urls.countDocuments();
				url = await urls.create({original_url: originalurl, short_url: count});
			}
			res.json({original_url: url.original_url, short_url: url.short_url})
		} catch (dbError) {
			console.error(dbError);
	        res.status(500).json({ error: 'Database error' }); // Handle database errors
	   }
	});
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
