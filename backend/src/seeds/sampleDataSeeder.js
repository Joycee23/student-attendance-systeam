require('dotenv').config({ debug: false });
const connectDB = require('../config/database');

const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Settings = require('../models/Settings');

// Sample data
const sampleLecturers = [
  {
    fullName: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@school.edu.vn',
    password: 'Lecturer@123',
    role: 'lecturer',
    lecturerCode: 'GV001',
    phoneNumber: '0987654321',
    address: '456 Teacher Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Trần Thị Lan',
    email: 'lan.tran@school.edu.vn',
    password: 'Lecturer@123',
    role: 'lecturer',
    lecturerCode: 'GV002',
    phoneNumber: '0987654322',
    address: '789 Teacher Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Phạm Văn Hùng',
    email: 'hung.pham@school.edu.vn',
    password: 'Lecturer@123',
    role: 'lecturer',
    lecturerCode: 'GV003',
    phoneNumber: '0987654323',
    address: '101 Teacher Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  }
];

const sampleStudents = [
  {
    fullName: 'Lê Minh Anh',
    email: 'anh.le@student.edu.vn',
    password: 'Student@123',
    role: 'student',
    studentCode: 'SV001',
    phoneNumber: '0912345678',
    address: '123 Student Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Ngô Thị Bình',
    email: 'binh.ngo@student.edu.vn',
    password: 'Student@123',
    role: 'student',
    studentCode: 'SV002',
    phoneNumber: '0912345679',
    address: '456 Student Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Vũ Văn Cao',
    email: 'cao.vu@student.edu.vn',
    password: 'Student@123',
    role: 'student',
    studentCode: 'SV003',
    phoneNumber: '0912345680',
    address: '789 Student Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Đỗ Thị Dung',
    email: 'dung.do@student.edu.vn',
    password: 'Student@123',
    role: 'student',
    studentCode: 'SV004',
    phoneNumber: '0912345681',
    address: '101 Student Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  },
  {
    fullName: 'Hoàng Văn Em',
    email: 'em.hoang@student.edu.vn',
    password: 'Student@123',
    role: 'student',
    studentCode: 'SV005',
    phoneNumber: '0912345682',
    address: '202 Student Street, Hanoi',
    isActive: true,
    isEmailVerified: true
  }
];

const sampleSubjects = [
  {
    code: 'IT001',
    name: 'Lập trình JavaScript',
    description: 'Khóa học lập trình JavaScript cơ bản đến nâng cao',
    credits: 3,
    theoryHours: 30,
    practiceHours: 15,
    semester: 1,
    department: 'CNTT',
    isRequired: true,
    academicYear: '2024-2025',
    attendanceRequirement: 80
  },
  {
    code: 'IT002',
    name: 'Cấu trúc dữ liệu và Giải thuật',
    description: 'Nắm vững các khái niệm về cấu trúc dữ liệu và giải thuật',
    credits: 4,
    theoryHours: 45,
    practiceHours: 30,
    semester: 2,
    department: 'CNTT',
    isRequired: true,
    academicYear: '2024-2025',
    attendanceRequirement: 85
  },
  {
    code: 'DB001',
    name: 'Cơ sở dữ liệu',
    description: 'Học về thiết kế và quản trị cơ sở dữ liệu',
    credits: 3,
    theoryHours: 30,
    practiceHours: 20,
    semester: 3,
    department: 'CNTT',
    isRequired: true,
    academicYear: '2024-2025',
    attendanceRequirement: 80
  },
  {
    code: 'WEB001',
    name: 'Thiết kế Web',
    description: 'Thiết kế và phát triển ứng dụng web',
    credits: 3,
    theoryHours: 25,
    practiceHours: 25,
    semester: 4,
    department: 'CNTT',
    isRequired: false,
    academicYear: '2024-2025',
    attendanceRequirement: 75
  }
];

const sampleClasses = [
  {
    name: 'CNTT-K18A',
    description: 'Lớp Công nghệ thông tin Khóa 18',
    academicYear: '2024-2025',
    semester: 1,
    department: 'CNTT',
    major: 'Công nghệ thông tin',
    courseYear: 'K18',
    maxStudents: 30,
    isActive: true
  },
  {
    name: 'CNTT-K18B',
    description: 'Lớp Công nghệ thông tin Khóa 18',
    academicYear: '2024-2025',
    semester: 1,
    department: 'CNTT',
    major: 'Công nghệ thông tin',
    courseYear: 'K18',
    maxStudents: 30,
    isActive: true
  }
];

const seedSampleData = async () => {
  try {
    console.log('🔄 Starting sample data seeding...');

    // 1. Seed lecturers
    console.log('👨‍🏫 Seeding lecturers...');
    const createdLecturers = [];
    for (const lecturerData of sampleLecturers) {
      const existingLecturer = await User.findOne({ email: lecturerData.email });
      if (!existingLecturer) {
        const lecturer = await User.create(lecturerData);
        createdLecturers.push(lecturer);
        console.log(`✅ Created lecturer: ${lecturer.fullName}`);
      } else {
        createdLecturers.push(existingLecturer);
        console.log(`⚠️ Lecturer already exists: ${existingLecturer.fullName}`);
      }
    }

    // 2. Seed students
    console.log('👨‍🎓 Seeding students...');
    const createdStudents = [];
    for (const studentData of sampleStudents) {
      const existingStudent = await User.findOne({ email: studentData.email });
      if (!existingStudent) {
        const student = await User.create(studentData);
        createdStudents.push(student);
        console.log(`✅ Created student: ${student.fullName}`);
      } else {
        createdStudents.push(existingStudent);
        console.log(`⚠️ Student already exists: ${existingStudent.fullName}`);
      }
    }

    // 3. Seed subjects
    console.log('📚 Seeding subjects...');
    const createdSubjects = [];
    for (let i = 0; i < sampleSubjects.length; i++) {
      const subjectData = sampleSubjects[i];
      const existingSubject = await Subject.findOne({ code: subjectData.code });

      if (!existingSubject) {
        // Gán giảng viên cho môn học
        const lecturer = createdLecturers[i % createdLecturers.length];
        subjectData.lecturerIds = [lecturer._id];

        const subject = await Subject.create(subjectData);
        createdSubjects.push(subject);
        console.log(`✅ Created subject: ${subject.name} (${subject.code})`);
      } else {
        createdSubjects.push(existingSubject);
        console.log(`⚠️ Subject already exists: ${existingSubject.name}`);
      }
    }

    // 4. Seed classes
    console.log('🏫 Seeding classes...');
    const createdClasses = [];
    for (let i = 0; i < sampleClasses.length; i++) {
      const classData = sampleClasses[i];
      const existingClass = await Class.findOne({ name: classData.name });

      if (!existingClass) {
        // Gán cố vấn học tập (ngẫu nhiên từ lecturers)
        const adviser = createdLecturers[i % createdLecturers.length];
        classData.lecturerId = adviser._id;

        // Gán sinh viên cho lớp
        const studentsForClass = createdStudents.slice(i * 2, (i + 1) * 2); // Mỗi lớp 2 sinh viên
        classData.studentIds = studentsForClass.map(s => s._id);

        // Gán môn học cho lớp
        const subjectsForClass = createdSubjects.slice(0, 3); // 3 môn đầu tiên
        classData.courseIds = subjectsForClass.map(s => s._id);

        const newClass = await Class.create(classData);
        createdClasses.push(newClass);
        console.log(`✅ Created class: ${newClass.name}`);
      } else {
        createdClasses.push(existingClass);
        console.log(`⚠️ Class already exists: ${existingClass.name}`);
      }
    }

    // 5. Update student classId references
    console.log('🔗 Updating student class references...');
    for (const classDoc of createdClasses) {
      if (classDoc.studentIds && classDoc.studentIds.length > 0) {
        await User.updateMany(
          { _id: { $in: classDoc.studentIds }, role: 'student' },
          { $set: { classId: classDoc._id } }
        );
        console.log(`✅ Updated classId for students in ${classDoc.name}`);
      }
    }

    // 6. Update subject classIds
    console.log('🔗 Updating subject class references...');
    for (const subject of createdSubjects) {
      const classesWithSubject = createdClasses.filter(cls =>
        cls.courseIds.some(courseId => courseId.equals(subject._id))
      );

      if (classesWithSubject.length > 0) {
        const classIds = classesWithSubject.map(cls => cls._id);
        await Subject.findByIdAndUpdate(subject._id, {
          $addToSet: { classIds: { $each: classIds } }
        });
        console.log(`✅ Updated classIds for subject ${subject.code}`);
      }
    }

    console.log('🎉 Sample data seeding completed successfully!');
    console.log(`📊 Summary:
    - Lecturers: ${createdLecturers.length}
    - Students: ${createdStudents.length}
    - Subjects: ${createdSubjects.length}
    - Classes: ${createdClasses.length}`);

  } catch (error) {
    console.error('❌ Sample data seeding failed:', error.message);
    throw error;
  }
};

const runSampleDataSeeder = async () => {
  try {
    require('dotenv').config({ debug: false });
    const connectDB = require('../config/database');

    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    const mongoose = require('mongoose');
    const User = require('../models/User');
    const Subject = require('../models/Subject');
    const Class = require('../models/Class');
    const Settings = require('../models/Settings');

    const startTime = Date.now();
    await seedSampleData();
    const endTime = Date.now();
    console.log(`🚀 Sample data seeder finished successfully in ${endTime - startTime}ms`);
  } catch (error) {
    console.error('💥 Sample data seeder failed:', error.message);
    process.exit(1);
  }
};

// Chạy nếu file được gọi trực tiếp
if (require.main === module) {
  runSampleDataSeeder();
}

module.exports = { seedSampleData, runSampleDataSeeder };