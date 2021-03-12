// const Subject = require('../models/Subject');

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

// const createSubject = async (req, res) => {
//   try {
//     const { subjectName } = req.body

//     const subject = new Subject({
//       user: req.user.id,
//       subjectName
//     })

//     await subject.save();
//     res.json(subject);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// }

// const deleteSubject = async (req, res) => {
//   try {
//     const subject = await Subject.findById(req.params.sid);

//     if(!subject){
//       return res.status(401).json({msg: 'Subject not found'});
//     }

//     if (subject.user.toString() !== req.user.id) {
//       return res.status(401).json({ msg: 'User not authorized' });
//     }

//     await subject.remove();
//     res.json({msg: "Subject removed"});
//   } catch (err) {

//     if (err.kind === 'ObjectId') {
//       return res.status(400).json({ msg: 'Course not found' });
//     }
//     res.status(500).send('Server Error');
//   }
// }

// module.exports = {
//   getSubjects,
//   createSubject,
//   deleteSubject
// }
