import { useQuery } from "@tanstack/react-query";
import { Users, Book, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentWithDetails, MarksWithDetails } from "@shared/schema";

export default function ReportsView() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/reports/stats"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students"],
  });

  const { data: marks = [], isLoading: marksLoading } = useQuery<MarksWithDetails[]>({
    queryKey: ["/api/marks"],
  });

  // Calculate top performers
  const topPerformers = students
    .filter(student => student.averagePercentage > 0)
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, 5);

  // Calculate subject-wise performance
  const subjectPerformance = marks.reduce((acc, mark) => {
    const existing = acc.find(s => s.name === mark.subjectName);
    const percentage = parseFloat(mark.percentage || "0");
    
    if (existing) {
      existing.total += percentage;
      existing.count += 1;
      existing.average = existing.total / existing.count;
    } else {
      acc.push({
        name: mark.subjectName,
        total: percentage,
        count: 1,
        average: percentage,
      });
    }
    
    return acc;
  }, [] as { name: string; total: number; count: number; average: number }[])
  .sort((a, b) => b.average - a.average);

  const getPerformanceColor = (average: number) => {
    if (average >= 85) return { bg: "bg-green-500", text: "text-green-500" };
    if (average >= 70) return { bg: "bg-blue-500", text: "text-blue-500" };
    if (average >= 50) return { bg: "bg-yellow-500", text: "text-yellow-500" };
    return { bg: "bg-red-500", text: "text-red-500" };
  };

  if (statsLoading || studentsLoading || marksLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalStudents || students.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Book className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Subjects</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.activeSubjects || subjectPerformance.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.averageScore 
                    ? `${stats.averageScore.toFixed(1)}%`
                    : marks.length > 0 
                      ? `${(marks.reduce((sum, mark) => sum + parseFloat(mark.percentage || "0"), 0) / marks.length).toFixed(1)}%`
                      : "0%"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart Placeholder */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Class Performance Overview</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Class Performance Chart</p>
              <p className="text-sm text-gray-400">Chart visualization would be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers and Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">Class {student.class}-{student.section}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {student.averagePercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">{student.subjectCount} subjects</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subject-wise Performance */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subject-wise Performance</h3>
            <div className="space-y-4">
              {subjectPerformance.length > 0 ? (
                subjectPerformance.map((subject) => {
                  const colors = getPerformanceColor(subject.average);
                  return (
                    <div key={subject.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${colors.bg} rounded-full`}></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {subject.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`${colors.bg} h-2 rounded-full`}
                            style={{ width: `${Math.min(subject.average, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {subject.average.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No subject performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
