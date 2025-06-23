import { pgTable, text, serial, integer, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  studentId: varchar("student_id", { length: 20 }).unique(),
  class: varchar("class", { length: 10 }).notNull(),
  section: varchar("section", { length: 5 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  maxMarks: integer("max_marks").notNull().default(200), // CAT1(50) + CAT2(50) + FAT(100)
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
});

export const marks = pgTable("marks", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  cat1: decimal("cat1", { precision: 5, scale: 2 }).default("0"),
  cat2: decimal("cat2", { precision: 5, scale: 2 }).default("0"),
  fat: decimal("fat", { precision: 5, scale: 2 }).default("0"),
  totalMarks: decimal("total_marks", { precision: 6, scale: 2 }).default("0"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [enrollments.subjectId],
    references: [subjects.id],
  }),
  marks: many(marks),
}));

export const marksRelations = relations(marks, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [marks.enrollmentId],
    references: [enrollments.id],
  }),
}));

// Zod schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  studentId: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertMarksSchema = createInsertSchema(marks).omit({
  id: true,
  totalMarks: true,
  percentage: true,
  updatedAt: true,
}).extend({
  cat1: z.number().min(0).max(50),
  cat2: z.number().min(0).max(50),
  fat: z.number().min(0).max(100),
});

// Types
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertMarks = z.infer<typeof insertMarksSchema>;
export type Marks = typeof marks.$inferSelect;

// Extended types for API responses
export type StudentWithDetails = Student & {
  subjectCount: number;
  averagePercentage: number;
};

export type EnrollmentWithDetails = Enrollment & {
  studentName: string;
  subjectName: string;
  subjectCode: string;
  classSection: string;
};

export type MarksWithDetails = Marks & {
  studentName: string;
  studentId: string;
  subjectName: string;
  subjectCode: string;
};
