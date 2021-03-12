const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const courseController = require('../../controllers/course');
const router = express.Router();

// @route         Get /dashboard
// @description   Get courses by user id

router.get('/', auth, courseController.getCoursesByUserId);

// @route         POST /dashboard
// @description   Create new course

router.post(
  '/',
  [auth, [check('courseName', 'Course name is required').not().isEmpty()]],
  courseController.createCourse
);

// @route         Delete /dashboard/:cid (course id)
// @description   Delete course by cid

router.delete('/:cid', auth, courseController.deleteCourse);

// @route         Update /dashboard/:cid (course id)
// @description   Update course by cid

router.patch('/:cid', auth, courseController.updateCourse);

// @route         GET dashboard/course/:cid/subject
// @description   Get course by cid

router.get('/course/:cid/subjects', auth, courseController.getCourse);

// @route         POST dashboard/course/subjects
// @description   Create new subject

router.post('/course/:cid/subjects', auth, courseController.createSubject);

// @route         DELETE dashboard/course/subjects/:sid
// @description   Delete subject

router.delete(
  '/course/subjects/:cid/:sid',
  auth,
  courseController.deleteSubject
); //sid: subject id

module.exports = router;
