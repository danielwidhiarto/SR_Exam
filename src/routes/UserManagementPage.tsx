import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import NavbarComponent from "../components/NavbarComponent";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");

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
    (roleFilter === "" || user.role === roleFilter)
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewRole("");
    setAlertMessage("");
  };

  const handleRoleChange = async () => {
    if (!newRole) {
      setAlertMessage("Please choose a role");
      return;
    }

    if (editingUser && newRole) {
      try {
        await invoke("update_user_role", { bnNumber: editingUser.bn_number, newRole });
        setUsers(users.map(user => user.bn_number === editingUser.bn_number ? { ...user, role: newRole } : user));
        setEditingUser(null);
      } catch (error) {
        console.error("Failed to update role:", error);
      }
    }
  };

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">User Management Page</h3>
      
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
              <th scope="col">Actions</th>
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
                <td>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Role</h5>
                <button type="button" className="close" onClick={() => setEditingUser(null)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {alertMessage && <div className="alert alert-danger">{alertMessage}</div>}
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-control"
                >
                  <option value="">Choose Role</option>
                  <option value="Student">Student</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Subject Development">Subject Development</option>
                  <option value="Exam Coordinator">Exam Coordinator</option>
                </select>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleRoleChange}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}