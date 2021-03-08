const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'course',
  },
  subject: {
    type: String,
  },
  files: [
    {
      data: {
        type: Buffer,
      },
    },
  ],
});

const Subject = mongoose.model('subject', SubjectSchema);

module.exports = Subject;
