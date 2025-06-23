import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StudentWithDetails, EnrollmentWithDetails, MarksWithDetails } from "@shared/schema";

export default function MarksView() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");
  const [cat1, setCat1] = useState<string>("");
  const [cat2, setCat2] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const { toast } = useToast();

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students"],
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

  const { data: marks = [], isLoading: marksLoading } = useQuery<MarksWithDetails[]>({
    queryKey: ["/api/marks"],
  });

  const { data: existingMarks } = useQuery({
    queryKey: ["/api/enrollments", selectedEnrollmentId, "marks"],
    enabled: !!selectedEnrollmentId,
    queryFn: ({ queryKey }) => {
      const [, enrollmentId] = queryKey;
      return fetch(`/api/enrollments/${enrollmentId}/marks`, {
        credentials: "include",
      }).then(res => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch marks');
        return res.json();
      });
    },
  });

  const saveMarksMutation = useMutation({
    mutationFn: async (marksData: { enrollmentId: number; cat1: number; cat2: number; fat: number }) => {
      await apiRequest("POST", "/api/marks", marksData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Marks saved successfully",
      });
      // Clear form
      setCat1("");
      setCat2("");
      setFat("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save marks",
        variant: "destructive",
      });
    },
  });

  const deleteMarksMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}/marks`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Marks deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete marks",
        variant: "destructive",
      });
    },
  });

  // Load existing marks when enrollment is selected
  useEffect(() => {
    if (existingMarks) {
      setCat1(existingMarks.cat1 || "");
      setCat2(existingMarks.cat2 || "");
      setFat(existingMarks.fat || "");
    } else {
      setCat1("");
      setCat2("");
      setFat("");
    }
  }, [existingMarks]);

  const calculateTotal = () => {
    const c1 = parseFloat(cat1) || 0;
    const c2 = parseFloat(cat2) || 0;
    const f = parseFloat(fat) || 0;
    return c1 + c2 + f;
  };

  const calculatePercentage = () => {
    const total = calculateTotal();
    return (total / 200) * 100;
  };

  const handleSaveMarks = () => {
    if (!selectedEnrollmentId) {
      toast({
        title: "Error",
        description: "Please select a student and subject first",
        variant: "destructive",
      });
      return;
    }

    const c1 = parseFloat(cat1) || 0;
    const c2 = parseFloat(cat2) || 0;
    const f = parseFloat(fat) || 0;

    if (c1 > 50 || c2 > 50 || f > 100) {
      toast({
        title: "Error",
        description: "Marks exceed maximum allowed values",
        variant: "destructive",
      });
      return;
    }

    saveMarksMutation.mutate({
      enrollmentId: parseInt(selectedEnrollmentId),
      cat1: c1,
      cat2: c2,
      fat: f,
    });
  };

  const handleDeleteMarks = (enrollmentId: number) => {
    if (confirm("Are you sure you want to delete these marks?")) {
      deleteMarksMutation.mutate(enrollmentId);
    }
  };

  const getPercentageBadgeColor = (percentage: number) => {
    if (percentage >= 85) return "bg-green-100 text-green-800";
    if (percentage >= 70) return "bg-blue-100 text-blue-800";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (studentsLoading) {
    return (
      <div>
        <Card className="p-6 mb-6">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-32" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Marks Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <Select 
              value={selectedStudentId} 
              onValueChange={(value) => {
                setSelectedStudentId(value);
                setSelectedEnrollmentId("");
                setCat1("");
                setCat2("");
                setFat("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} ({student.class}-{student.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
            <Select 
              value={selectedEnrollmentId} 
              onValueChange={setSelectedEnrollmentId}
              disabled={!selectedStudentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject..." />
              </SelectTrigger>
              <SelectContent>
                {studentEnrollments.map((enrollment) => (
                  <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                    {enrollment.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Marks Entry Form */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Marks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CAT 1 Marks</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="0"
                  value={cat1}
                  onChange={(e) => setCat1(e.target.value)}
                  disabled={!selectedEnrollmentId}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">/ 50</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Maximum: 50 marks</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CAT 2 Marks</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="0"
                  value={cat2}
                  onChange={(e) => setCat2(e.target.value)}
                  disabled={!selectedEnrollmentId}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">/ 50</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Maximum: 50 marks</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FAT Marks</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  disabled={!selectedEnrollmentId}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">/ 100</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Maximum: 100 marks</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total: </span>
              <span className="text-lg font-semibold text-gray-900">
                {calculateTotal()} / 200
              </span>
              <span className="ml-2 text-green-600">
                ({calculatePercentage().toFixed(1)}%)
              </span>
            </div>
            <Button 
              onClick={handleSaveMarks}
              disabled={!selectedEnrollmentId || saveMarksMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Marks Summary Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Marks Summary</h3>
        </div>
        <div className="overflow-x-auto">
          {marksLoading ? (
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
                    Subject
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAT 1
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAT 2
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAT
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marks.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                      <div className="text-sm text-gray-500">{record.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {record.subjectName}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">{record.cat1}</span>
                      <span className="text-xs text-gray-500"> / 50</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">{record.cat2}</span>
                      <span className="text-xs text-gray-500"> / 50</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">{record.fat}</span>
                      <span className="text-xs text-gray-500"> / 100</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900">{record.totalMarks}</span>
                      <span className="text-xs text-gray-500"> / 200</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={getPercentageBadgeColor(parseFloat(record.percentage || "0"))}>
                        {parseFloat(record.percentage || "0").toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 mr-2"
                        onClick={() => {
                          // Find the enrollment to edit
                          const enrollment = studentEnrollments.find(e => 
                            marks.find(m => m.enrollmentId === e.id && m.id === record.id)
                          );
                          if (enrollment) {
                            setSelectedStudentId(enrollment.studentId.toString());
                            setSelectedEnrollmentId(enrollment.id.toString());
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteMarks(record.enrollmentId)}
                        disabled={deleteMarksMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {marks.length === 0 && !marksLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-bar text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No marks found</h3>
              <p className="text-gray-500">Start by selecting a student and subject above to enter marks</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
