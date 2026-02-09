
// Mock process.env API_KEY first
process.env.API_KEY = "mock_key";

(async () => {
    console.log("Starting Validation...");

    // 1. Mock setup first
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => { store[key] = value.toString(); },
          removeItem: (key: string) => { delete store[key]; },
          clear: () => { store = {}; },
        };
    })();

    // @ts-ignore
    global.localStorage = localStorageMock;
    console.log("LocalStorage mocked.");

    // Dynamic import to bypass hoisting
    const { db } = await import('./services/dbService');
    const { verifyFaceWithGemini } = await import('./services/geminiService');
    const { AttendanceStatus } = await import('./types');

    // 2. Clear DB
    db.clearData();
    console.log("DB Cleared and Initialized.");

    // 3. Add a student
    const newStudent = {
        id: "test-student-1",
        admissionNumber: "ADM001",
        name: "Test Student",
        email: "test@college.edu",
        department: "Computer Science",
        year: "1",
        section: "A",
        faceEmbeddings: "data:image/png;base64,fakeimage",
        isApproved: true,
        createdAt: new Date().toISOString()
    };

    db.addStudent(newStudent);
    console.log("Student added.");

    const retrievedStudent = db.getStudentById("test-student-1");
    if (!retrievedStudent || retrievedStudent.name !== "Test Student") {
        console.error("FAILED: Could not retrieve student.");
        process.exit(1);
    }
    console.log("Student retrieval verified.");

    // 4. Simulate Face Verification (Mock Mode)
    // Ensure API_KEY is undefined to trigger mock mode in geminiService
    const originalApiKey = process.env.API_KEY;
    delete process.env.API_KEY;

    console.log("Verifying face (Mock Mode)...");
    const verificationResult = await verifyFaceWithGemini("ref", "cap");

    if (!verificationResult.match || verificationResult.confidence !== 95) {
        console.error("FAILED: Mock verification failed.", verificationResult);
        process.exit(1);
    }
    console.log("Mock verification passed.");

    // Restore Env (optional)
    process.env.API_KEY = originalApiKey;

    // 5. Mark Attendance
    const today = new Date().toISOString().split('T')[0];
    const record = {
        id: "att-1",
        studentId: newStudent.id,
        studentName: newStudent.name,
        department: newStudent.department,
        subject: "CS101",
        date: today,
        timestamp: new Date().toISOString(),
        status: AttendanceStatus.PRESENT,
        verificationConfidence: 95
    };

    db.addAttendance(record);
    console.log("Attendance marked.");

    // 6. Verify Attendance
    const hasMarked = db.hasMarkedAttendance(newStudent.id, "CS101", today);
    if (!hasMarked) {
        console.error("FAILED: Attendance verification failed.");
        process.exit(1);
    }
    console.log("Attendance verification passed.");

    console.log("ALL CHECKS PASSED.");
})();
