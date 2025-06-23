import { useState } from "react";
import { GraduationCap, Bell, User } from "lucide-react";
import StudentsView from "@/components/students-view";
import EnrollmentView from "@/components/enrollment-view";
import MarksView from "@/components/marks-view";
import ReportsView from "@/components/reports-view";

export default function Home() {
  const [activeTab, setActiveTab] = useState("students");

  const tabs = [
    { id: "students", label: "Students", icon: "fas fa-users" },
    { id: "enrollment", label: "Subject Enrollment", icon: "fas fa-book" },
    { id: "marks", label: "Marks Management", icon: "fas fa-chart-bar" },
    { id: "reports", label: "Reports", icon: "fas fa-file-alt" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "students":
        return <StudentsView />;
      case "enrollment":
        return <EnrollmentView />;
      case "marks":
        return <MarksView />;
      case "reports":
        return <ReportsView />;
      default:
        return <StudentsView />;
    }
  };

  return (
    <div className="font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Student Management System
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">AD</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-transparent py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}
