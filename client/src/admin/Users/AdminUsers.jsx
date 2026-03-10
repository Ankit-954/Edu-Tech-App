import React, { useEffect, useState } from "react";
import "./users.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../main";
import Layout from "../Utils/Layout";
import toast from "react-hot-toast";

const AdminUsers = ({ user }) => {
  const navigate = useNavigate();

  if (user && user.mainrole !== "superadmin") return navigate("/");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/users`, {
        params: { q, role: roleFilter, page, limit },
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      setUsers(data.users || []);
      setPagination(
        data.pagination || {
          page: 1,
          totalPages: 1,
          totalUsers: 0,
        }
      );
      setSelectedUserIds([]);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [q, roleFilter, page, limit]);

  const updateRole = async (id, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (confirm("are you sure you want to update this user role")) {
      try {
        const { data } = await axios.put(
          `${server}/api/user/${id}`,
          { role: nextRole },
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );

        toast.success(data.message);
        fetchUsers();
      } catch (error) {
        toast.error(error.response.data.message);
      }
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCurrentPage = () => {
    const currentPageIds = users.map((u) => u._id);
    const allSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
      return;
    }

    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
  };

  const bulkUpdateRoles = async (role) => {
    if (!selectedUserIds.length) return;
    if (
      !confirm(
        `Update ${selectedUserIds.length} selected users to ${role}?`
      )
    )
      return;

    try {
      const { data } = await axios.put(
        `${server}/api/users/roles`,
        { userIds: selectedUserIds, role },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );
      toast.success(data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bulk update failed");
    }
  };

  const allCurrentPageSelected =
    users.length > 0 && users.every((u) => selectedUserIds.includes(u._id));

  return (
    <Layout>
      <div className="users">
        <div className="users-header">
          <h1>All Users</h1>
          <p>Manage platform roles and admin access.</p>
        </div>
        <div className="users-toolbar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
          >
            <option value="all">All roles</option>
            <option value="user">Users only</option>
            <option value="admin">Admins only</option>
          </select>
        </div>
        <div className="users-bulk-actions">
          <span>{selectedUserIds.length} selected</span>
          <button
            className="common-btn users-action-btn"
            onClick={() => bulkUpdateRoles("admin")}
            disabled={!selectedUserIds.length}
          >
            Make Admin
          </button>
          <button
            className="common-btn users-action-btn"
            onClick={() => bulkUpdateRoles("user")}
            disabled={!selectedUserIds.length}
          >
            Make User
          </button>
        </div>
        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAllCurrentPage}
                  />
                </th>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Update Role</th>
              </tr>
            </thead>
            <tbody>
              {users &&
                users.map((e, i) => (
                  <tr key={e._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(e._id)}
                        onChange={() => toggleSelectUser(e._id)}
                      />
                    </td>
                    <td>{(pagination.page - 1) * limit + i + 1}</td>
                    <td>{e.name}</td>
                    <td>{e.email}</td>
                    <td>{e.role}</td>
                    <td>
                      <button
                        onClick={() => updateRole(e._id, e.role)}
                        className="common-btn users-action-btn"
                      >
                        {e.role === "admin" ? "Make User" : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="users-pagination">
          <span>Total: {pagination.totalUsers}</span>
          <div className="users-pagination-actions">
            <button
              className="common-btn users-action-btn"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span>
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="common-btn users-action-btn"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsers;
