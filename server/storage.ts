import { 
  students, subjects, enrollments, marks,
  type Student, type InsertStudent, type StudentWithDetails,
  type Subject, type InsertSubject,
  type Enrollment, type InsertEnrollment, type EnrollmentWithDetails,
  type Marks, type InsertMarks, type MarksWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudents(): Promise<StudentWithDetails[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  searchStudents(query: string, classFilter?: string, sectionFilter?: string): Promise<StudentWithDetails[]>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Enrollments
  getEnrollments(): Promise<EnrollmentWithDetails[]>;
  getStudentEnrollments(studentId: number): Promise<EnrollmentWithDetails[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(studentId: number, subjectId: number): Promise<void>;
  updateStudentEnrollments(studentId: number, subjectIds: number[]): Promise<void>;

  // Marks
  getMarks(): Promise<MarksWithDetails[]>;
  getMarksByEnrollment(enrollmentId: number): Promise<Marks | undefined>;
  saveMarks(marks: InsertMarks): Promise<Marks>;
  updateMarks(enrollmentId: number, marks: Partial<InsertMarks>): Promise<Marks>;
  deleteMarks(enrollmentId: number): Promise<void>;

  // Reports
  getStudentStats(): Promise<{
    totalStudents: number;
    activeSubjects: number;
    averageScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudents(): Promise<StudentWithDetails[]> {
    const result = await db
      .select({
        id: students.id,
        name: students.name,
        studentId: students.studentId,
        class: students.class,
        section: students.section,
        createdAt: students.createdAt,
        subjectCount: count(enrollments.id),
        averagePercentage: sql<number>`COALESCE(AVG(${marks.percentage}), 0)`,
      })
      .from(students)
      .leftJoin(enrollments, eq(students.id, enrollments.studentId))
      .leftJoin(marks, eq(enrollments.id, marks.enrollmentId))
      .groupBy(students.id)
      .orderBy(desc(students.createdAt));

    return result.map(row => ({
      ...row,
      subjectCount: Number(row.subjectCount),
      averagePercentage: Number(row.averagePercentage),
    }));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    // Generate student ID
    const studentCount = await db.select({ count: count() }).from(students);
    const studentId = `STU${String(studentCount[0].count + 1).padStart(3, '0')}`;
    
    const [student] = await db
      .insert(students)
      .values({ 
        name: insertStudent.name,
        class: insertStudent.class,
        section: insertStudent.section,
        studentId 
      })
      .returning();
    return student;
  }

  async updateStudent(id: number, updateData: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async searchStudents(query: string, classFilter?: string, sectionFilter?: string): Promise<StudentWithDetails[]> {
    let whereConditions = [];
    
    if (query) {
      whereConditions.push(
        sql`LOWER(${students.name}) LIKE LOWER(${'%' + query + '%'}) OR LOWER(${students.studentId}) LIKE LOWER(${'%' + query + '%'})`
      );
    }
    
    if (classFilter) {
      whereConditions.push(eq(students.class, classFilter));
    }
    
    if (sectionFilter) {
      whereConditions.push(eq(students.section, sectionFilter));
    }

    const result = await db
      .select({
        id: students.id,
        name: students.name,
        studentId: students.studentId,
        class: students.class,
        section: students.section,
        createdAt: students.createdAt,
        subjectCount: count(enrollments.id),
        averagePercentage: sql<number>`COALESCE(AVG(${marks.percentage}), 0)`,
      })
      .from(students)
      .leftJoin(enrollments, eq(students.id, enrollments.studentId))
      .leftJoin(marks, eq(enrollments.id, marks.enrollmentId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .groupBy(students.id)
      .orderBy(desc(students.createdAt));

    return result.map(row => ({
      ...row,
      subjectCount: Number(row.subjectCount),
      averagePercentage: Number(row.averagePercentage),
    }));
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(insertSubject)
      .returning();
    return subject;
  }

  // Enrollments
  async getEnrollments(): Promise<EnrollmentWithDetails[]> {
    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        subjectId: enrollments.subjectId,
        enrollmentDate: enrollments.enrollmentDate,
        studentName: students.name,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        classSection: sql<string>`CONCAT(${students.class}, '-', ${students.section})`,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .orderBy(desc(enrollments.enrollmentDate));

    return result;
  }

  async getStudentEnrollments(studentId: number): Promise<EnrollmentWithDetails[]> {
    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        subjectId: enrollments.subjectId,
        enrollmentDate: enrollments.enrollmentDate,
        studentName: students.name,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        classSection: sql<string>`CONCAT(${students.class}, '-', ${students.section})`,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .where(eq(enrollments.studentId, studentId))
      .orderBy(subjects.name);

    return result;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db
      .insert(enrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async deleteEnrollment(studentId: number, subjectId: number): Promise<void> {
    await db
      .delete(enrollments)
      .where(and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.subjectId, subjectId)
      ));
  }

  async updateStudentEnrollments(studentId: number, subjectIds: number[]): Promise<void> {
    // Get current enrollments
    const currentEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));

    const currentSubjectIds = currentEnrollments.map(e => e.subjectId);

    // Remove enrollments not in new list
    const toRemove = currentSubjectIds.filter(id => !subjectIds.includes(id));
    for (const subjectId of toRemove) {
      await this.deleteEnrollment(studentId, subjectId);
    }

    // Add new enrollments
    const toAdd = subjectIds.filter(id => !currentSubjectIds.includes(id));
    for (const subjectId of toAdd) {
      await this.createEnrollment({ studentId, subjectId });
    }
  }

  // Marks
  async getMarks(): Promise<MarksWithDetails[]> {
    const result = await db
      .select({
        id: marks.id,
        enrollmentId: marks.enrollmentId,
        cat1: marks.cat1,
        cat2: marks.cat2,
        fat: marks.fat,
        totalMarks: marks.totalMarks,
        percentage: marks.percentage,
        updatedAt: marks.updatedAt,
        studentName: students.name,
        studentId: students.studentId,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(marks)
      .innerJoin(enrollments, eq(marks.enrollmentId, enrollments.id))
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(subjects, eq(enrollments.subjectId, subjects.id))
      .orderBy(desc(marks.updatedAt));

    return result;
  }

  async getMarksByEnrollment(enrollmentId: number): Promise<Marks | undefined> {
    const [mark] = await db.select().from(marks).where(eq(marks.enrollmentId, enrollmentId));
    return mark || undefined;
  }

  async saveMarks(insertMarks: InsertMarks): Promise<Marks> {
    const cat1 = Number(insertMarks.cat1) || 0;
    const cat2 = Number(insertMarks.cat2) || 0;
    const fat = Number(insertMarks.fat) || 0;
    const totalMarks = cat1 + cat2 + fat;
    const percentage = (totalMarks / 200) * 100;

    // Check if marks already exist for this enrollment
    const existingMarks = await this.getMarksByEnrollment(insertMarks.enrollmentId);
    
    if (existingMarks) {
      // Update existing marks
      const [updatedMarks] = await db
        .update(marks)
        .set({
          cat1: cat1.toString(),
          cat2: cat2.toString(),
          fat: fat.toString(),
          totalMarks: totalMarks.toString(),
          percentage: percentage.toString(),
          updatedAt: new Date(),
        })
        .where(eq(marks.enrollmentId, insertMarks.enrollmentId))
        .returning();
      return updatedMarks;
    } else {
      // Insert new marks
      const [newMarks] = await db
        .insert(marks)
        .values({
          ...insertMarks,
          cat1: cat1.toString(),
          cat2: cat2.toString(),
          fat: fat.toString(),
          totalMarks: totalMarks.toString(),
          percentage: percentage.toString(),
        })
        .returning();
      return newMarks;
    }
  }

  async updateMarks(enrollmentId: number, updateData: Partial<InsertMarks>): Promise<Marks> {
    const existingMarks = await this.getMarksByEnrollment(enrollmentId);
    if (!existingMarks) {
      throw new Error("Marks not found for this enrollment");
    }

    const cat1 = Number(updateData.cat1 ?? existingMarks.cat1) || 0;
    const cat2 = Number(updateData.cat2 ?? existingMarks.cat2) || 0;
    const fat = Number(updateData.fat ?? existingMarks.fat) || 0;
    const totalMarks = cat1 + cat2 + fat;
    const percentage = (totalMarks / 200) * 100;

    const [updatedMarks] = await db
      .update(marks)
      .set({
        ...updateData,
        cat1: cat1.toString(),
        cat2: cat2.toString(),
        fat: fat.toString(),
        totalMarks: totalMarks.toString(),
        percentage: percentage.toString(),
        updatedAt: new Date(),
      })
      .where(eq(marks.enrollmentId, enrollmentId))
      .returning();
    return updatedMarks;
  }

  async deleteMarks(enrollmentId: number): Promise<void> {
    await db.delete(marks).where(eq(marks.enrollmentId, enrollmentId));
  }

  // Reports
  async getStudentStats(): Promise<{
    totalStudents: number;
    activeSubjects: number;
    averageScore: number;
  }> {
    const [studentCount] = await db.select({ count: count() }).from(students);
    const [subjectCount] = await db.select({ count: count() }).from(subjects);
    const [avgScore] = await db.select({ 
      avg: sql<number>`COALESCE(AVG(${marks.percentage}), 0)` 
    }).from(marks);

    return {
      totalStudents: Number(studentCount.count),
      activeSubjects: Number(subjectCount.count),
      averageScore: Number(avgScore.avg),
    };
  }
}

export const storage = new DatabaseStorage();
