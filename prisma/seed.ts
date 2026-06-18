// @ts-nocheck
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create default teacher user
  const hashedPassword = await bcrypt.hash("teacher123", 10);
  await prisma.user.upsert({
    where: { email: "teacher@learnify.com" },
    update: {},
    create: {
      email: "teacher@learnify.com",
      hashedPassword,
      name: "Teacher",
      role: "TEACHER",
    },
  });
  console.log("✅ Teacher user created (teacher@learnify.com / teacher123)");

  // 1b. Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@learnify.com" },
    update: {},
    create: {
      email: "admin@learnify.com",
      hashedPassword: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created (admin@learnify.com / admin123)");

  // 1c. Seed default site settings
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      collegeName: "Shubhashree College of Management",
      tagline: "Unlock Your Learning Potential",
      heroText: "Education is not the learning of facts, but the training of the mind to think.",
      contactEmail: "info@shubhashree.com",
      contactPhone: "+977 9876 543 210",
      contactAddress: "Baneshwor, Kathmandu",
      logoUrl: "/images/logo.png",
    },
  });
  console.log("✅ Default site settings seeded");

  // 2. Create courses
  const coursesData = [
    { id: "bba", name: "BBA", slug: "bba", description: "Bachelor of Business Administration", icon: "📊" },
    { id: "bcsit", name: "BCSIT", slug: "bcsit", description: "Bachelor of Computer Science & Information Technology", icon: "💻" },
    { id: "bhm", name: "BHM", slug: "bhm", description: "Bachelor of Hotel Management", icon: "🏨" },
  ];

  for (const course of coursesData) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: { name: course.name, slug: course.slug, description: course.description, icon: course.icon },
      create: course,
    });
  }
  console.log("✅ Courses created (BBA, BCSIT, BHM)");

  // 3. Create semesters for each course (up to 8 per course)
  const ordinalNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  let semesterIdCounter = 1;
  const semesterMap: Record<string, number[]> = {}; // courseId -> [semesterIds]

  for (const course of coursesData) {
    semesterMap[course.id] = [];
    for (let i = 0; i < 8; i++) {
      const semId = semesterIdCounter++;
      await prisma.semester.upsert({
        where: { id: semId },
        update: { name: `${ordinalNames[i]} Semester`, courseId: course.id },
        create: { id: semId, name: `${ordinalNames[i]} Semester`, courseId: course.id },
      });
      semesterMap[course.id].push(semId);
    }
  }
  console.log("✅ Semesters created (8 per course)");

  // 4. Seed all subjects, chapters, and questions
  // Subjects are assigned to BCSIT course semesters
  const bcsitSemesters = semesterMap["bcsit"]; // [9, 10, 11, 12, 13, 14, 15, 16]
  const subjectsData = [
    {
      id: "mathematics",
      title: "Mathematics I",
      description: "Calculus, Algebra, and Trigonometry",
      icon: "📐",
      semesterId: bcsitSemesters[0],
      chapters: [
        {
          id: "math-ch1",
          title: "Calculus",
          pdfPath: "/uploads/seed/mathematics/calculus.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is procedure oriented programming?",
              options: [
                "a method of structuring code",
                "a random technique",
                "only OOP",
                "none of these",
              ],
              answer: "a method of structuring code",
            },
            {
              text: "What is OOP?",
              options: [
                "Object Oriented Programming",
                "Old Oriented Programming",
                "Organized Order Programming",
                "none of these",
              ],
              answer: "Object Oriented Programming",
            },
            {
              text: "What are the properties of OOP?",
              options: [
                "Encapsulation",
                "Inheritance",
                "Polymorphism",
                "All of these",
              ],
              answer: "All of these",
            },
          ],
        },
        {
          id: "math-ch2",
          title: "Algebra",
          pdfPath: "/uploads/seed/mathematics/algebra.pdf",
          orderIndex: 2,
          questions: [
            {
              text: "Which keyword is used to define a class in JavaScript?",
              options: ["class", "function", "object", "prototype"],
              answer: "class",
            },
            {
              text: "What is a closure in JavaScript?",
              options: [
                "A function that can access variables from its outer scope",
                "A way to hide variables",
                "A built-in JavaScript method",
                "A type of loop",
              ],
              answer:
                "A function that can access variables from its outer scope",
            },
            {
              text: "What does the 'this' keyword refer to in JavaScript?",
              options: [
                "The current function",
                "The global object",
                "The object on which the method is called",
                "None of these",
              ],
              answer: "The object on which the method is called",
            },
          ],
        },
        {
          id: "math-ch3",
          title: "Trigonometry",
          pdfPath: "/uploads/seed/mathematics/trigonometry.pdf",
          orderIndex: 3,
          questions: [
            {
              text: "What is asynchronous programming?",
              options: [
                "Code that executes in parallel",
                "Code that runs in a separate thread",
                "Code that can continue executing while waiting for operations to complete",
                "None of these",
              ],
              answer:
                "Code that can continue executing while waiting for operations to complete",
            },
            {
              text: "What is a Promise in JavaScript?",
              options: [
                "A guarantee that a function will execute",
                "An object representing the eventual completion of an async operation",
                "A special type of function",
                "A JavaScript keyword",
              ],
              answer:
                "An object representing the eventual completion of an async operation",
            },
            {
              text: "What is the purpose of async/await?",
              options: [
                "To make code run faster",
                "To simplify working with Promises",
                "To create multithreaded JavaScript",
                "None of these",
              ],
              answer: "To simplify working with Promises",
            },
          ],
        },
      ],
    },
    {
      id: "english",
      title: "English",
      description: "Communication Skills, Literature, and Technical Writing",
      icon: "📚",
      semesterId: bcsitSemesters[0],
      chapters: [
        {
          id: "eng-ch1",
          title: "Communication Skills",
          pdfPath: "/uploads/seed/english/communication.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is the main purpose of English grammar?",
              options: [
                "To establish rules for effective communication",
                "To make language more complex",
                "To create confusion",
                "None of these",
              ],
              answer: "To establish rules for effective communication",
            },
            {
              text: "What is a noun?",
              options: [
                "A person, place, or thing",
                "An action word",
                "A describing word",
                "A connecting word",
              ],
              answer: "A person, place, or thing",
            },
            {
              text: "What is a verb?",
              options: [
                "An action word",
                "A person, place, or thing",
                "A describing word",
                "A connecting word",
              ],
              answer: "An action word",
            },
          ],
        },
        {
          id: "eng-ch2",
          title: "Literature",
          pdfPath: "/uploads/seed/english/literature.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "eng-ch3",
          title: "Technical Writing",
          pdfPath: "/uploads/seed/english/technical-writing.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "internet-technology",
      title: "Internet Technology I",
      description: "Introduction to Internet, Web Technologies, and Networks",
      icon: "🌐",
      semesterId: bcsitSemesters[0],
      chapters: [
        {
          id: "it-ch1",
          title: "Introduction to Internet",
          pdfPath: "/uploads/seed/internet-technology/intro.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is the Internet?",
              options: [
                "A global network of interconnected computers",
                "A single computer system",
                "A type of software",
                "A programming language",
              ],
              answer: "A global network of interconnected computers",
            },
            {
              text: "What does HTTP stand for?",
              options: [
                "Hypertext Transfer Protocol",
                "High Tech Transfer Protocol",
                "Hypertext Technical Program",
                "Hypertext Terminal Process",
              ],
              answer: "Hypertext Transfer Protocol",
            },
            {
              text: "What is HTML used for?",
              options: [
                "Creating web page structure",
                "Database management",
                "Network security",
                "Operating systems",
              ],
              answer: "Creating web page structure",
            },
          ],
        },
        {
          id: "it-ch2",
          title: "Web Technologies",
          pdfPath: "/uploads/seed/internet-technology/web-tech.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "it-ch3",
          title: "Network Fundamentals",
          pdfPath: "/uploads/seed/internet-technology/network.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "computer-fundamentals",
      title: "Fundamental of Computer System",
      description: "Computer Architecture, Operating Systems, and Hardware",
      icon: "🖥️",
      semesterId: bcsitSemesters[0],
      chapters: [
        {
          id: "cf-ch1",
          title: "Computer Architecture",
          pdfPath: "/uploads/seed/computer-fundamentals/architecture.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What does CPU stand for?",
              options: [
                "Central Processing Unit",
                "Computer Personal Unit",
                "Central Program Utility",
                "Central Processor Underlying",
              ],
              answer: "Central Processing Unit",
            },
            {
              text: "What is the function of RAM?",
              options: [
                "Temporary data storage while a computer is running",
                "Permanent data storage",
                "Processing calculations",
                "Connecting to the internet",
              ],
              answer: "Temporary data storage while a computer is running",
            },
            {
              text: "What is an operating system?",
              options: [
                "Software that manages computer hardware and software resources",
                "A type of computer processor",
                "A physical component of the computer",
                "A programming language",
              ],
              answer:
                "Software that manages computer hardware and software resources",
            },
          ],
        },
        {
          id: "cf-ch2",
          title: "Operating Systems",
          pdfPath: "/uploads/seed/computer-fundamentals/os.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "cf-ch3",
          title: "Computer Hardware",
          pdfPath: "/uploads/seed/computer-fundamentals/hardware.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "programming-language",
      title: "Programming Language",
      description: "Introduction to Programming, Control Structures, Functions",
      icon: "💻",
      semesterId: bcsitSemesters[0],
      chapters: [
        {
          id: "pl-ch1",
          title: "Introduction to Programming",
          pdfPath: "/uploads/seed/programming-language/intro.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is a variable in programming?",
              options: [
                "A container for storing data values",
                "A mathematical operation",
                "A type of function",
                "A programming language",
              ],
              answer: "A container for storing data values",
            },
            {
              text: "Which of the following is not a programming language?",
              options: ["Java", "Python", "HTML", "C++"],
              answer: "HTML",
            },
            {
              text: "What is a function in programming?",
              options: [
                "A block of code designed to perform a particular task",
                "A variable that stores data",
                "A type of loop",
                "A mathematical equation",
              ],
              answer: "A block of code designed to perform a particular task",
            },
          ],
        },
        {
          id: "pl-ch2",
          title: "Control Structures",
          pdfPath: "/uploads/seed/programming-language/control.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "pl-ch3",
          title: "Functions and Arrays",
          pdfPath: "/uploads/seed/programming-language/functions.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },

    // ===== BCSIT SEMESTER 2 =====
    {
      id: "dsa",
      title: "DSA",
      description: "Arrays, Linked Lists, Trees, Graphs, Sorting",
      icon: "🔄",
      semesterId: bcsitSemesters[1],
      chapters: [
        {
          id: "dsa-ch1",
          title: "Arrays and Linked Lists",
          pdfPath: "/uploads/seed/dsa/arrays-linked-lists.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is a data structure?",
              options: [
                "A way of organizing and storing data",
                "A programming language",
                "A type of algorithm",
                "A computer hardware component",
              ],
              answer: "A way of organizing and storing data",
            },
            {
              text: "What is an algorithm?",
              options: [
                "A step-by-step procedure for solving a problem",
                "A data storage method",
                "A programming language",
                "A computer hardware component",
              ],
              answer: "A step-by-step procedure for solving a problem",
            },
            {
              text: "Which of the following is not a basic data structure?",
              options: ["Array", "Linked List", "SQL", "Stack"],
              answer: "SQL",
            },
          ],
        },
        {
          id: "dsa-ch2",
          title: "Trees and Graphs",
          pdfPath: "/uploads/seed/dsa/trees-graphs.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "dsa-ch3",
          title: "Sorting and Searching",
          pdfPath: "/uploads/seed/dsa/sorting-searching.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "java",
      title: "Java",
      description: "Object-Oriented Programming, Collections, and more",
      icon: "☕",
      semesterId: bcsitSemesters[1],
      chapters: [
        {
          id: "java-ch1",
          title: "Unit 1",
          pdfPath: "/uploads/seed/java/unit1.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is Java?",
              options: [
                "A high-level, class-based, object-oriented programming language",
                "A database management system",
                "An operating system",
                "A web browser",
              ],
              answer:
                "A high-level, class-based, object-oriented programming language",
            },
            {
              text: "What is the main method in Java?",
              options: [
                "The entry point of a Java application",
                "A method to create objects",
                "A method to connect to databases",
                "A method to handle exceptions",
              ],
              answer: "The entry point of a Java application",
            },
            {
              text: "What does JVM stand for?",
              options: [
                "Java Virtual Machine",
                "Java Variable Method",
                "Java Visual Module",
                "Java Verified Mechanism",
              ],
              answer: "Java Virtual Machine",
            },
          ],
        },
        {
          id: "java-ch2",
          title: "Unit 2",
          pdfPath: "/uploads/seed/java/unit2.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "java-ch3",
          title: "Unit 3",
          pdfPath: "/uploads/seed/java/unit3.pdf",
          orderIndex: 3,
          questions: [],
        },
        {
          id: "java-ch4",
          title: "Unit 4",
          pdfPath: "/uploads/seed/java/unit4.pdf",
          orderIndex: 4,
          questions: [],
        },
        {
          id: "java-ch5",
          title: "Unit 5",
          pdfPath: "/uploads/seed/java/unit5.pdf",
          orderIndex: 5,
          questions: [],
        },
        {
          id: "java-ch6",
          title: "Unit 6",
          pdfPath: "/uploads/seed/java/unit6.pdf",
          orderIndex: 6,
          questions: [],
        },
        {
          id: "java-ch7",
          title: "Unit 7",
          pdfPath: "/uploads/seed/java/unit7.pdf",
          orderIndex: 7,
          questions: [],
        },
        {
          id: "java-ch8",
          title: "Unit 8",
          pdfPath: "/uploads/seed/java/unit8.pdf",
          orderIndex: 8,
          questions: [],
        },
      ],
    },
    {
      id: "mathematics-2",
      title: "Mathematics II",
      description: "Differential Equations, Statistics, and Linear Algebra",
      icon: "🧮",
      semesterId: bcsitSemesters[1],
      chapters: [
        {
          id: "math2-ch1",
          title: "Differential Equations",
          pdfPath: "/uploads/seed/mathematics-2/differential-equations.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is calculus?",
              options: [
                "The study of rates of change and accumulation",
                "The study of shapes and spaces",
                "The study of numbers and counting",
                "The study of data and statistics",
              ],
              answer: "The study of rates of change and accumulation",
            },
            {
              text: "What is a derivative?",
              options: [
                "The rate of change of a function with respect to a variable",
                "The area under a curve",
                "A type of equation",
                "A mathematical constant",
              ],
              answer:
                "The rate of change of a function with respect to a variable",
            },
            {
              text: "What is an integral?",
              options: [
                "The accumulation of quantities",
                "A type of equation",
                "A mathematical constant",
                "The rate of change of a function",
              ],
              answer: "The accumulation of quantities",
            },
          ],
        },
        {
          id: "math2-ch2",
          title: "Statistics",
          pdfPath: "/uploads/seed/mathematics-2/statistics.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "math2-ch3",
          title: "Linear Algebra",
          pdfPath: "/uploads/seed/mathematics-2/linear-algebra.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "business-communication",
      title: "Business Communication",
      description: "Business Writing, Presentation Skills, Professional Communication",
      icon: "📝",
      semesterId: bcsitSemesters[1],
      chapters: [
        {
          id: "bc-ch1",
          title: "Business Writing",
          pdfPath: "/uploads/seed/business-communication/writing.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is business communication?",
              options: [
                "The exchange of information within and outside an organization for business purposes",
                "Only written communication in a business",
                "Only verbal communication in a business",
                "Communication between businesses only",
              ],
              answer:
                "The exchange of information within and outside an organization for business purposes",
            },
            {
              text: "What is the purpose of a business letter?",
              options: [
                "To communicate formally with external stakeholders",
                "To communicate informally with colleagues",
                "To create legal documents",
                "To advertise products",
              ],
              answer: "To communicate formally with external stakeholders",
            },
            {
              text: "What is active listening?",
              options: [
                "Fully concentrating on, understanding, and responding to a speaker",
                "Pretending to listen while thinking about something else",
                "Interrupting the speaker frequently",
                "Listening only to important parts of a conversation",
              ],
              answer:
                "Fully concentrating on, understanding, and responding to a speaker",
            },
          ],
        },
        {
          id: "bc-ch2",
          title: "Presentation Skills",
          pdfPath: "/uploads/seed/business-communication/presentation.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "bc-ch3",
          title: "Professional Communication",
          pdfPath: "/uploads/seed/business-communication/professional.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
    {
      id: "digital-system",
      title: "Digital System",
      description: "Digital Logic, Boolean Algebra, and Digital Circuits",
      icon: "⚙️",
      semesterId: bcsitSemesters[1],
      chapters: [
        {
          id: "ds-ch1",
          title: "Digital Logic",
          pdfPath: "/uploads/seed/digital-system/logic.pdf",
          orderIndex: 1,
          questions: [
            {
              text: "What is a digital system?",
              options: [
                "A system that processes discrete data",
                "A system that processes continuous data",
                "A type of computer network",
                "A type of operating system",
              ],
              answer: "A system that processes discrete data",
            },
            {
              text: "What is a logic gate?",
              options: [
                "A physical device implementing a Boolean function",
                "A type of computer memory",
                "A security feature in digital systems",
                "A type of digital display",
              ],
              answer: "A physical device implementing a Boolean function",
            },
            {
              text: "What is the binary number system?",
              options: [
                "A number system with base 2",
                "A number system with base 10",
                "A number system with base 8",
                "A number system with base 16",
              ],
              answer: "A number system with base 2",
            },
          ],
        },
        {
          id: "ds-ch2",
          title: "Boolean Algebra",
          pdfPath: "/uploads/seed/digital-system/boolean.pdf",
          orderIndex: 2,
          questions: [],
        },
        {
          id: "ds-ch3",
          title: "Digital Circuits",
          pdfPath: "/uploads/seed/digital-system/circuits.pdf",
          orderIndex: 3,
          questions: [],
        },
      ],
    },
  ];

  // Seed each subject with chapters and questions
  for (const subject of subjectsData) {
    await prisma.subject.upsert({
      where: { id: subject.id },
      update: {
        title: subject.title,
        description: subject.description,
        icon: subject.icon,
      },
      create: {
        id: subject.id,
        title: subject.title,
        description: subject.description,
        icon: subject.icon,
        semesterId: subject.semesterId,
      },
    });

    for (const chapter of subject.chapters) {
      await prisma.chapter.upsert({
        where: { id: chapter.id },
        update: {
          title: chapter.title,
          pdfPath: chapter.pdfPath,
          orderIndex: chapter.orderIndex,
        },
        create: {
          id: chapter.id,
          title: chapter.title,
          pdfPath: chapter.pdfPath,
          orderIndex: chapter.orderIndex,
          subjectId: subject.id,
        },
      });

      // Delete existing questions for this chapter to avoid duplicates
      await prisma.question.deleteMany({ where: { chapterId: chapter.id } });

      // Create questions
      for (let i = 0; i < chapter.questions.length; i++) {
        const q = chapter.questions[i];
        await prisma.question.create({
          data: {
            text: q.text,
            options: q.options,
            answer: q.answer,
            orderIndex: i + 1,
            chapterId: chapter.id,
          },
        });
      }
    }

    console.log(`✅ Seeded: ${subject.title} (${subject.chapters.length} chapters)`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("📧 Teacher login: teacher@learnify.com / teacher123");
  console.log("📧 Admin login: admin@learnify.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
