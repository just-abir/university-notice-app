require("dotenv").config();
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const seedUsers = async () => {
  try {
    await connectDB();

    // 1. Create or Reset Teacher Accounts (1 Default + 5 New)
    const teachers = [
      {
        name: "Dr. Alan Turing",
        email: "teacher@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "MALE",
        designation: "Associate Professor",
        mustChangePassword: false,
      },
      {
        name: "Dr. Grace Hopper",
        email: "teacher1@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "FEMALE",
        designation: "Professor",
        mustChangePassword: false,
      },
      {
        name: "Dr. Donald Knuth",
        email: "teacher2@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "MALE",
        designation: "Professor",
        mustChangePassword: false,
      },
      {
        name: "Dr. Margaret Hamilton",
        email: "teacher3@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "FEMALE",
        designation: "Associate Professor",
        mustChangePassword: false,
      },
      {
        name: "Dr. Barbara Liskov",
        email: "teacher4@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "FEMALE",
        designation: "Assistant Professor",
        mustChangePassword: false,
      },
      {
        name: "Mr. Linus Torvalds",
        email: "teacher5@example.com",
        password: "password123",
        role: "TEACHER",
        gender: "MALE",
        designation: "Lecturer",
        mustChangePassword: false,
      },
    ];

    for (const teacherData of teachers) {
      let existingTeacher = await User.findOne({ email: teacherData.email });
      if (!existingTeacher) {
        await User.create(teacherData);
        console.log(
          `✅ Created Teacher: ${teacherData.email} / ${teacherData.password}`
        );
      } else {
        existingTeacher.password = teacherData.password;
        await existingTeacher.save();
        console.log(
          `✅ Reset Teacher Password: ${teacherData.email} / ${teacherData.password}`
        );
      }
    }

    // 2. Create or Reset Student Accounts (1 Default + 5 New)
    const students = [
      {
        name: "John Doe",
        email: "student@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "MALE",
        roll: "202101",
        registrationNo: "REG202101",
        batch: "2021",
        year: 3,
        semester: 5,
        mustChangePassword: false,
      },
      {
        name: "Alice Smith",
        email: "student1@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "FEMALE",
        roll: "202102",
        registrationNo: "REG202102",
        batch: "2021",
        year: 3,
        semester: 5,
        mustChangePassword: false,
      },
      {
        name: "Bob Johnson",
        email: "student2@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "MALE",
        roll: "202103",
        registrationNo: "REG202103",
        batch: "2021",
        year: 3,
        semester: 6,
        mustChangePassword: false,
      },
      {
        name: "Catherine Brown",
        email: "student3@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "FEMALE",
        roll: "202201",
        registrationNo: "REG202201",
        batch: "2022",
        year: 2,
        semester: 3,
        mustChangePassword: false,
      },
      {
        name: "David Wilson",
        email: "student4@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "MALE",
        roll: "202202",
        registrationNo: "REG202202",
        batch: "2022",
        year: 2,
        semester: 4,
        mustChangePassword: false,
      },
      {
        name: "Emma Davis",
        email: "student5@example.com",
        password: "password123",
        role: "STUDENT",
        gender: "FEMALE",
        roll: "202301",
        registrationNo: "REG202301",
        batch: "2023",
        year: 1,
        semester: 1,
        mustChangePassword: false,
      },
    ];

    for (const studentData of students) {
      let existingStudent = await User.findOne({ email: studentData.email });
      if (!existingStudent) {
        await User.create(studentData);
        console.log(
          `✅ Created Student: ${studentData.email} / ${studentData.password}`
        );
      } else {
        existingStudent.password = studentData.password;
        await existingStudent.save();
        console.log(
          `✅ Reset Student Password: ${studentData.email} / ${studentData.password}`
        );
      }
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedUsers();
