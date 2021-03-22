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
  folder:{
    type:String
  },
  subjects: [
    {
      subjectName: {
        type: String,
      },
      files: [
        {
          fileId: {
            type: String,
          },
          fileName: {
            type: String,
          },
        },
      ],
    },
  ],
});

const Course = mongoose.model('course', CourseSchema);

module.exports = Course;
