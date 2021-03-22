const { validationResult } = require('express-validator');
const fs = require('fs');
const { google } = require('googleapis');
const { Readable } = require('stream');

const Course = require('../models/Course');
const User = require('../models/User');

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
    const user = await User.findById(req.user.id).select('-password');
    const course = new Course({
      user: req.user.id,
      courseName,
      courseInfo,
      color,
    });

    await course.save();
    res.json(course);

    folder(course.id, req.user.id, user.folder)
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

// Authorize google drive api credentials
const authorize = (
  credentials,
  file,
  req_body,
  googleApiFileResponse,
  callback
) => {
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
    callback(oAuth2Client, file, req_body, googleApiFileResponse); //get file static id from my drive the folder name invoices
  });
};

// Create inside user folder, new course folder 
const createGoogleDriveCourseFolder = (auth, file, req_body, googleApiFileResponse) => {
  const drive = google.drive({ version: 'v3', auth });
  
  var folderId = req_body.folderId;
  var fileMetadata = {
    name: req_body.cid,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [folderId]
  };

  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('File Id: ', file.data.id);
    }
  });
};

const folder = (cid, uid, folderId) => {
  fs.readFile('./credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), null, {cid, uid, folderId}, null, createGoogleDriveCourseFolder);
  });
}

// Convert buffer to stream
const createReadableStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

const uploadFile = (auth, file, req_body, googleApiFileResponse) => {
  const fileStream = createReadableStream(file.buffer);
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
      fields: 'id',
    },
    async function (error, uploadResponse) {
      if (error) {
        // Handle error
        googleApiFileResponse.status(500).send('Erorr: Unable to upload folder');
      } else {
        try {
          const course = await Course.findById(req_body.cid);
          
          const newFile = {
            fileId: uploadResponse.data.id,
            fileName: googleApiFileResponse.req.file.originalname,
          };
          // subject.files.unshift(newFile)
          course.subjects.map((subject) => {
            subject.id === req_body.sid
              ? subject.files.unshift(newFile)
              : subject;
          });

          await course.save();
          googleApiFileResponse.json(course);
        } catch (err) {
          res.status(500).send('Server Error');
        }
      }
    }
  );
};

const upload = (req, res) => {
  const googleApiFileResponse = res;
  fs.readFile('./credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    // authorize(JSON.parse(content), listFiles);
    // console.log(content)
    // authorize(JSON.parse(content), getFile);
    authorize(
      JSON.parse(content),
      req.file,
      req.body,
      googleApiFileResponse,
      uploadFile
    );
  });
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
  upload,
  getFile,
};
