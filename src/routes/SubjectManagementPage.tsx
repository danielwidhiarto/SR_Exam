import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import NavbarComponent from "../components/NavbarComponent";

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    invoke("get_all_subject", {}).then((rooms) => {
      console.log(rooms);
      setSubjects(rooms as Subject[]);
    });
  }, []);

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter(subject => 
    subject.subject_codes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">Subject Management Page</h3>
      
      <div className="ml-5 mt-3 mb-2 mr-5">
        <input 
          type="text" 
          placeholder="Search by subject code or name" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="table-responsive p-3">
        <table className="table table-hover table-bordered">
          <thead className="thead-dark">
            <tr>
              <th scope="col">Subject Code</th>
              <th scope="col">Subject Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject: Subject) => (
              <tr key={subject.subject_codes as React.Key}>
                <td>{subject.subject_codes}</td>
                <td>{subject.subject_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}