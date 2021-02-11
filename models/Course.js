const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  courseName: {
    type: String,
    required: true,
  },
  courseInfo: {
    type: String,
  },
  color: {
    type: String,
    default: 'white',
  },
});

const Course = mongoose.model('course', CourseSchema);

module.exports = Course;
