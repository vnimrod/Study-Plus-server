const { validationResult } = require('express-validator');
const fs = require('fs');
const { google } = require('googleapis');
const { Readable } = require('stream');

const Course = require('../models/Course');

const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.cid);
    if (!course) {
      return res.status(400).json({ msg: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
};

const getCoursesByUserId = async (req, res, next) => {
  try {
    const courses = await Course.find({ user: req.user.id });
    if (!courses) {
      return res.status(400).json({ msg: 'Courses not found' });
    }

    res.json(courses);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Courses not found' });
    }
    res.status(500).send('Server Error');
  }
};

const createCourse = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { courseName, courseInfo, color } = req.body;

    const course = new Course({
      user: req.user.id,
      courseName,
      courseInfo,
      color,
    });

    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.cid); //cid - course id;

    if (!course) {
      return res.status(401).json({ msg: 'Course not found' });
    }

    if (course.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await course.remove();
    res.json({ msg: 'Course removed' });
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
};

const updateCourse = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updates = Object.keys(req.body);

  try {
    let course = await Course.findById(req.params.cid);

    if (course) {
      updates.forEach((update) => {
        course[update] = req.body[update];
      });
    }

    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// const getSubjects = async (req, res) => {
//   try {
//     const subjects = await Subject.find({user: req.user.id}).populate('user',['name']);
//     if(!subjects){
//       return res.status(400).json ({ msg: 'Subjects not found'});
//     }

//     res.json(subjects);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// }

const createSubject = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const course = await Course.findById(req.params.cid);

    const subject = {
      user: req.user.id,
      subjectName,
    };
    course.subjects.unshift(subject);

    await course.save();
    res.json(course.subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const deleteSubject = async (req, res) => {
  try {
    // const subject = await Subject.findById(req.params.sid);
    const course = await Course.findById(req.params.cid);

    const subject = course.subjects.find(
      (subject) => subject.id === req.params.sid
    );

    if (!subject) {
      return res.status(401).json({ msg: 'Subject not found' });
    }

    const subjectIndex = course.subjects.findIndex(
      (sub) => sub._id.toString() === req.params.sid
    );

    course.subjects.splice(subjectIndex, 1);

    await course.save();
    res.json({ msg: 'Subject removed' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Handle Files

const authorize = (credentials, file, googleApiFileResponse, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile('./token.json', (err, token) => {
    // if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    // callback(oAuth2Client);//list files and upload file
    callback(oAuth2Client, file, googleApiFileResponse); //get file static id from my drive the folder name invoices
  });
};

// convert buffer to stream
const createReadableStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(buffer);
  readable.push(null);

  return readable;
};

const uploadFile = (auth, file, googleApiFileResponse) => {

  
  const fileStream = createReadableStream(file.buffer)

  const drive = google.drive({ version: 'v3', auth });

  var fileMetadata = {
    name: file.originalname,
  };
  var media = {
    mimeType: file.mimetype,
    body: fileStream,
  };
  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: 'id'
    },
    function (err, uploadResponse) {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        googleApiFileResponse.json(uploadResponse.data)
      }
    }
  );
}

const fileUpload = (req, res) => {

  const googleApiFileResponse = res;

  try {
    fs.readFile('./credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      // authorize(JSON.parse(content), listFiles);
      // console.log(content)
      // authorize(JSON.parse(content), getFile);
      authorize(JSON.parse(content), req.file, googleApiFileResponse, uploadFile);
    });
    
    // const course = await Course.findById('604cd66a611ea72ef49112ba');
    // const buffer = req.file.buffer;
    // course.subjects[0].files.push({ data: buffer });
    // // console.log(buffer.toString('hex').match(/../g).join(' '));
    // await course.save();
    // res.json(req.file);

  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const getFile = async (req, res) => {
  try {
    const course = await Course.findById('604cd66a611ea72ef49112ba');

    if (!course) {
      return res.status(404).json({ errors: [{ msg: 'Course not found' }] });
    }

    // res.json();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


// DELETE FILE   drive.files.delete({fileId:'15jvWha2Ya5pV1i3p-Xz5Kl_XEV1li2C1'})

module.exports = {
  getCourse,
  createCourse,
  getCoursesByUserId,
  deleteCourse,
  updateCourse,
  createSubject,
  deleteSubject,
  fileUpload,
  getFile,
};
