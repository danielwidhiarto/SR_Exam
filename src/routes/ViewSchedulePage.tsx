import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import NavbarComponent from "../components/NavbarComponent";

export default function ViewSchedulePage() {

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [initialFilter, setInitialFilter] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await invoke("get_all_users", {});
      setUsers(fetchedUsers as User[]);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.initial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nim?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (roleFilter === "" || user.role === roleFilter) &&
    (initialFilter === "" || user.initial?.slice(-4) === initialFilter)
  );

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">View Schedule Page</h3>
      
      <div className="ml-5 mt-3 mb-2 mr-5">
        <input 
          type="text" 
          placeholder="Search by name, initial, or NIM" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="ml-5 mb-3">
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-control"
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Assistant">Assistant</option>
          <option value="Subject Development">Subject Development</option>
          <option value="Exam Coordinator">Exam Coordinator</option>
        </select>
      </div>

      <div className="ml-5 mb-3">
        <select 
          value={initialFilter}
          onChange={(e) => setInitialFilter(e.target.value)}
          className="form-control"
        >
          <option value="">All Initials</option>
          <option value="24-1">24-1</option>
          <option value="23-2">23-2</option>
          <option value="23-1">23-1</option>
          <option value="22-2">22-2</option>
          <option value="22-1">22-1</option>
          <option value="21-2">21-2</option>
          <option value="21-1">21-1</option>
          <option value="20-2">20-2</option>
        </select>
      </div>

      <div className="table-responsive p-3">
        <table className="table table-hover table-bordered">
          <thead className="thead-dark">
            <tr>
              <th scope="col">BN Number</th>
              <th scope="col">NIM</th>
              <th scope="col">Name</th>
              <th scope="col">Major</th>
              <th scope="col">Role</th>
              <th scope="col">Initial</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user: User) => (
              <tr key={user.id as React.Key}>
                <td>{user.bn_number}</td>
                <td>{user.nim}</td>
                <td>{user.name}</td>
                <td>{user.major}</td>
                <td>{user.role}</td>
                <td>{user.initial || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}