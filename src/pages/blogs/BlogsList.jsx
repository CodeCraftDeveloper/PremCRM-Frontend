import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";
import "./BlogsList.css";

const getWebsiteItems = (payload) => {
  if (Array.isArray(payload?.websites)) {
    return payload.websites;
  }

  return Array.isArray(payload) ? payload : [];
};

const getPaginatedCollection = (response) => {
  const payload = response?.data?.data;

  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: response?.data?.pagination || {},
    };
  }

  return {
    items: Array.isArray(payload?.data) ? payload.data : [],
    pagination: payload?.pagination || response?.data?.pagination || {},
  };
};

const BlogsList = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    websiteId: "",
  });
  const [websites, setWebsites] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await api.get("/websites", {
          params: { limit: 100 },
        });
        setWebsites(getWebsiteItems(response.data.data));
      } catch (error) {
        console.error("Failed to fetch websites", error);
      }
    };

    fetchWebsites();
  }, []);

  useEffect(() => {
    if (!filters.websiteId) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get(`/blogs/categories/${filters.websiteId}`);
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, [filters.websiteId]);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);

      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.status && { status: filters.status }),
          ...(filters.category && { category: filters.category }),
          ...(filters.websiteId && { websiteId: filters.websiteId }),
        };

        const response = await api.get("/blogs", { params });
        const { items, pagination: nextPagination } =
          getPaginatedCollection(response);

        setBlogs(items);
        setPagination((current) => ({
          ...current,
          page: nextPagination.page || current.page,
          limit: nextPagination.limit || current.limit,
          totalDocs: nextPagination.totalDocs || 0,
          totalPages: nextPagination.totalPages || 0,
        }));
      } catch (error) {
        toast.error("Failed to fetch blogs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [pagination.page, pagination.limit, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      await api.delete(`/blogs/${id}`);
      toast.success("Blog deleted successfully");
      setBlogs((current) => current.filter((blog) => blog._id !== id));
    } catch (error) {
      toast.error("Failed to delete blog");
      console.error(error);
    }
  };

  const handleFilterChange = ({ target: { name, value } }) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handlePublishToggle = async (blog) => {
    try {
      const response = await api.put(`/blogs/${blog._id}`, {
        ...blog,
        isPublished: !blog.isPublished,
        status:
          !blog.isPublished && blog.status !== "published"
            ? "published"
            : blog.status,
      });

      setBlogs((current) =>
        current.map((item) =>
          item._id === blog._id ? response.data.data : item,
        ),
      );
      toast.success(
        `Blog ${!blog.isPublished ? "published" : "unpublished"} successfully`,
      );
    } catch (error) {
      toast.error("Failed to update blog");
      console.error(error);
    }
  };

  if (loading && blogs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="blogs-container">
      <div className="blogs-header">
        <h1>Blogs</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/admin/blogs/new")}
        >
          + New Blog
        </button>
      </div>

      <div className="blogs-filters">
        <input
          type="text"
          className="form-control"
          placeholder="Search blogs..."
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select
          className="form-control"
          name="websiteId"
          value={filters.websiteId}
          onChange={handleFilterChange}
        >
          <option value="">All Websites</option>
          {websites.map((website) => (
            <option key={website._id} value={website._id}>
              {website.name}
            </option>
          ))}
        </select>

        <select
          className="form-control"
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          disabled={!filters.websiteId}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="form-control"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {blogs.length === 0 ? (
        <EmptyState
          title="No blogs found"
          description="Create your first blog to get started"
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/admin/blogs/new")}
            >
              Create Blog
            </button>
          }
        />
      ) : (
        <>
          <div className="blogs-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Website</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Reading Time</th>
                  <th>Published</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id}>
                    <td className="title">
                      <strong>{blog.title}</strong>
                      {blog.slug && <div className="slug">/{blog.slug}</div>}
                    </td>
                    <td>{blog.websiteId?.name || "-"}</td>
                    <td>{blog.category || "-"}</td>
                    <td>
                      <span className={`badge status-${blog.status}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td>{blog.author?.name || "-"}</td>
                    <td>{blog.views ?? 0}</td>
                    <td>{blog.readingTime ?? 0} min</td>
                    <td>
                      <button
                        type="button"
                        className={`btn-icon ${blog.isPublished ? "active" : ""}`}
                        onClick={() => handlePublishToggle(blog)}
                        title={blog.isPublished ? "Unpublish" : "Publish"}
                      >
                        {blog.isPublished ? "Yes" : "No"}
                      </button>
                    </td>
                    <td>
                      {blog.createdAt
                        ? new Date(blog.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className="btn-icon edit"
                        onClick={() => navigate(`/admin/blogs/${blog._id}/edit`)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => handleDelete(blog._id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogsList;
