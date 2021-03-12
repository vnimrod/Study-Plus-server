const { validationResult } = require('express-validator');

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

module.exports = {
  getCourse,
  createCourse,
  getCoursesByUserId,
  deleteCourse,
  updateCourse,
  createSubject,
  deleteSubject,
};
