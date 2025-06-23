import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSubjectSchema, insertEnrollmentSchema, insertMarksSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Students routes
  app.get("/api/students", async (req, res) => {
    try {
      const { search, class: classFilter, section } = req.query;
      let students;
      
      if (search || classFilter || section) {
        students = await storage.searchStudents(
          search as string || "",
          classFilter as string,
          section as string
        );
      } else {
        students = await storage.getStudents();
      }
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Subjects routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // Enrollments routes
  app.get("/api/enrollments", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/students/:id/enrollments", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const enrollments = await storage.getStudentEnrollments(studentId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching student enrollments:", error);
      res.status(500).json({ message: "Failed to fetch student enrollments" });
    }
  });

  app.put("/api/students/:id/enrollments", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { subjectIds } = req.body;
      
      if (!Array.isArray(subjectIds)) {
        return res.status(400).json({ message: "subjectIds must be an array" });
      }
      
      await storage.updateStudentEnrollments(studentId, subjectIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating enrollments:", error);
      res.status(500).json({ message: "Failed to update enrollments" });
    }
  });

  app.delete("/api/enrollments/:studentId/:subjectId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const subjectId = parseInt(req.params.subjectId);
      await storage.deleteEnrollment(studentId, subjectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // Marks routes
  app.get("/api/marks", async (req, res) => {
    try {
      const marks = await storage.getMarks();
      res.json(marks);
    } catch (error) {
      console.error("Error fetching marks:", error);
      res.status(500).json({ message: "Failed to fetch marks" });
    }
  });

  app.get("/api/enrollments/:id/marks", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const marks = await storage.getMarksByEnrollment(enrollmentId);
      
      if (!marks) {
        return res.status(404).json({ message: "Marks not found" });
      }
      
      res.json(marks);
    } catch (error) {
      console.error("Error fetching marks:", error);
      res.status(500).json({ message: "Failed to fetch marks" });
    }
  });

  app.post("/api/marks", async (req, res) => {
    try {
      const validatedData = insertMarksSchema.parse(req.body);
      const marks = await storage.saveMarks(validatedData);
      res.status(201).json(marks);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error saving marks:", error);
      res.status(500).json({ message: "Failed to save marks" });
    }
  });

  app.put("/api/enrollments/:id/marks", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const validatedData = insertMarksSchema.partial().parse(req.body);
      const marks = await storage.updateMarks(enrollmentId, validatedData);
      res.json(marks);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error updating marks:", error);
      res.status(500).json({ message: "Failed to update marks" });
    }
  });

  app.delete("/api/enrollments/:id/marks", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      await storage.deleteMarks(enrollmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting marks:", error);
      res.status(500).json({ message: "Failed to delete marks" });
    }
  });

  // Reports routes
  app.get("/api/reports/stats", async (req, res) => {
    try {
      const stats = await storage.getStudentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
