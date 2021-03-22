const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { validationResult } = require('express-validator');
const fs = require('fs');
const { google } = require('googleapis');

const User = require('../models/User');

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    user = new User({
      name,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(8);
    user.password = await bcrypt.hash(req.body.password, salt);
    folder(user.id);
    await user.save();

    jwt.sign(
      { user: { id: user.id } },
      config.get('jwtSecret'),
      { expiresIn: 604800 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Wrong email or password' }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Wrong email or password' }] });
    }

    jwt.sign(
      { user: { id: user.id } },
      config.get('jwtSecret'),
      { expiresIn: 604800 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Folder handle - Create init folder when user created

const authorize = (credentials, uid, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile('./token.json', (err, token) => {
    oAuth2Client.setCredentials(JSON.parse(token));
    // callback(oAuth2Client);//list files and upload file
    callback(oAuth2Client, uid);
  });
};

// Create a folder in study plus google drive, with the user id
const createGoogleDriveFolder = (auth, uid) => {
  const drive = google.drive({ version: 'v3', auth });
  var fileMetadata = {
    name: uid,
    mimeType: 'application/vnd.google-apps.folder',
  };
  drive.files.create(
    {
      resource: fileMetadata,
      fields: 'id',
    },
    async function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        const user = await User.findById(uid).select('-password');
        user['folder'] = file.data.id
        await user.save();
      }
    }
  );
};

const folder = (uid) => {
  fs.readFile('./credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), uid, createGoogleDriveFolder);
  });
};

module.exports = {
  getUser,
  login,
  signup,
};
