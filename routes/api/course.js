const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const courseController = require('../../controllers/course');
const router = express.Router();

// @route         POST dashboard
// @description   Create new course

router.get('/', auth, courseController.getCoursesByUserId);

// @route         POST dashboard
// @description   Create new course

router.post(
  '/',
  [auth, [check('courseName', 'Course name is required').not().isEmpty()]],
  courseController.createCourse
);

// @route         Delete course
// @description   Delete course by cid

router.delete('/:cid', auth, courseController.deleteCourse);

// @route         Update course
// @description   Update course by cid

router.patch('/:cid', auth, courseController.updateCourse)

module.exports = router;
