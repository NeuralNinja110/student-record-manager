import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StudentWithDetails, Subject, EnrollmentWithDetails } from "@shared/schema";

export default function EnrollmentView() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { toast } = useToast();

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students"],
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: studentEnrollments = [] } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/students", selectedStudentId, "enrollments"],
    enabled: !!selectedStudentId,
    queryFn: ({ queryKey }) => {
      const [, studentId] = queryKey;
      return fetch(`/api/students/${studentId}/enrollments`, {
        credentials: "include",
      }).then(res => res.json());
    },
  });

  const updateEnrollmentsMutation = useMutation({
    mutationFn: async ({ studentId, subjectIds }: { studentId: number; subjectIds: number[] }) => {
      await apiRequest("PUT", `/api/students/${studentId}/enrollments`, { subjectIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Enrollment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update enrollment",
        variant: "destructive",
      });
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async ({ studentId, subjectId }: { studentId: number; subjectId: number }) => {
      await apiRequest("DELETE", `/api/enrollments/${studentId}/${subjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Enrollment removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove enrollment",
        variant: "destructive",
      });
    },
  });

  const enrolledSubjectIds = studentEnrollments.map(e => e.subjectId);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  // Update selected subjects when student changes
  useState(() => {
    setSelectedSubjectIds(enrolledSubjectIds);
  });

  const handleSubjectToggle = (subjectId: number, checked: boolean) => {
    setSelectedSubjectIds(prev => 
      checked 
        ? [...prev, subjectId]
        : prev.filter(id => id !== subjectId)
    );
  };

  const handleUpdateEnrollment = () => {
    if (!selectedStudentId) return;
    
    updateEnrollmentsMutation.mutate({
      studentId: parseInt(selectedStudentId),
      subjectIds: selectedSubjectIds,
    });
  };

  const handleRemoveEnrollment = (studentId: number, subjectId: number) => {
    if (confirm("Are you sure you want to remove this enrollment? This will also delete any associated marks.")) {
      removeEnrollmentMutation.mutate({ studentId, subjectId });
    }
  };

  if (studentsLoading || subjectsLoading) {
    return (
      <div>
        <Card className="p-6 mb-6">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Subject Enrollment Management</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <Select 
              value={selectedStudentId} 
              onValueChange={(value) => {
                setSelectedStudentId(value);
                // Reset selected subjects when student changes
                const newEnrollments = enrollments.filter(e => e.studentId === parseInt(value));
                setSelectedSubjectIds(newEnrollments.map(e => e.subjectId));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} (Class {student.class}-{student.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Subjects</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjectIds.includes(subject.id)}
                      onCheckedChange={(checked) => 
                        handleSubjectToggle(subject.id, checked as boolean)
                      }
                      disabled={!selectedStudentId}
                    />
                    <label 
                      htmlFor={`subject-${subject.id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {subject.name}
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">({subject.code})</span>
                </div>
              ))}
            </div>
            <Button 
              className="mt-4 w-full" 
              onClick={handleUpdateEnrollment}
              disabled={!selectedStudentId || updateEnrollmentsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateEnrollmentsMutation.isPending ? "Updating..." : "Update Enrollment"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Current Enrollments Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Enrollments</h3>
        </div>
        <div className="overflow-x-auto">
          {enrollmentsLoading ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-primary text-sm"></i>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.studentName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enrollment.classSection}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {enrollment.subjectName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleRemoveEnrollment(enrollment.studentId, enrollment.subjectId)}
                        disabled={removeEnrollmentMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {enrollments.length === 0 && !enrollmentsLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-book text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
              <p className="text-gray-500">Select a student above to manage their subject enrollments</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
