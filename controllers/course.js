const { validationResult } = require('express-validator');

const Course = require('../models/Course');

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

module.exports = {
  createCourse,
  getCoursesByUserId,
  deleteCourse,
  updateCourse,
};
