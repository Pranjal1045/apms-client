import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignedStudents } from "../../store/slices/teacherSlice";
import AIDashboard from "../../components/AI/AIDashboard";

const TeacherAIWrapper = () => {
  const dispatch = useDispatch();
  const { assignedStudents, loading } = useSelector((state) => state.teacher);
  const { authUser } = useSelector((state) => state.auth);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    dispatch(fetchAssignedStudents());
  }, [dispatch]);

  // No students assigned
  if (!loading && assignedStudents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-primary">AI Features</h1>
        </div>
        <div className=" rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-secondary mb-2">No Students Assigned Yet</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            You need to have students assigned to you before you can use AI features.
            Accept student requests from the Pending Requests page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Student Selector */}
      <div className=" rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary">Select Student Project</h2>
            <p className="text-xs text-faint">Choose a student to analyze their project with AI</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading students...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedStudents.map((student) => {
              const projectId = student.project?._id || student.project;
              const isSelected = selectedStudent?._id === student._id;
              return (
                <button
                  key={student._id}
                  onClick={() => setSelectedStudent(student)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-elevated"
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm
                    ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-secondary"}`}>
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-700" : "text-primary"}`}>
                      {student.name}
                    </p>
                    <p className="text-xs text-faint truncate">{student.email}</p>
                    {projectId ? (
                      <span className="text-xs text-green-600 font-medium">✓ Has project</span>
                    ) : (
                      <span className="text-xs text-amber-500 font-medium">No project yet</span>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Dashboard — only show when student selected */}
      {selectedStudent ? (
        (() => {
          const projectId = selectedStudent.project?._id || selectedStudent.project;
          if (!projectId) {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-amber-700 mb-1">No Project Found</p>
                <p className="text-xs text-amber-600">
                  {selectedStudent.name} has not submitted a project proposal yet.
                </p>
              </div>
            );
          }
          return (
            <AIDashboard
              projectId={projectId}
              role={authUser?.role}
            />
          );
        })()
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-secondary">Select a student above</p>
          <p className="text-xs text-faint mt-1">Choose a student to run AI analysis on their project</p>
        </div>
      )}

    </div>
  );
};

export default TeacherAIWrapper;
