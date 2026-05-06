import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";
import { getBlogExcerpt } from "../../utils/blogContent";
import "./PublicBlogsPage.css";

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

const PublicBlogsPage = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalDocs: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "",
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api
          .get(`/blogs/public/categories/${websiteId}`)
          .catch(() => null);

        if (response?.data?.data) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, [websiteId]);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);

      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.category && { category: filters.category }),
        };

        const response = await api.get(`/blogs/public/${websiteId}`, {
          params,
        });
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

        if (!categories.length && items.length) {
          const uniqueCategories = [
            ...new Set(items.map((blog) => blog.category)),
          ].filter(Boolean);
          setCategories(uniqueCategories);
        }
      } catch (error) {
        toast.error("Failed to fetch blogs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [pagination.page, pagination.limit, filters, websiteId, categories.length]);

  const handleFilterChange = ({ target: { name, value } }) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleBlogClick = (slug) => {
    navigate(`/blogs/${websiteId}/${slug}`);
  };

  if (loading && blogs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="public-blogs-page">
      <div className="blogs-header-section">
        <div className="header-content">
          <h1>Blog</h1>
          <p>Discover insights and stay updated with our latest articles</p>
        </div>
      </div>

      <div className="blogs-container">
        <div className="blogs-filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Search blogs..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />

          {categories.length > 0 && (
            <select
              className="filter-select"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>

        {blogs.length === 0 ? (
          <EmptyState
            title="No blogs found"
            description="Check back later for new articles"
          />
        ) : (
          <>
            <div className="blogs-grid">
              {blogs.map((blog) => (
                <article
                  key={blog._id}
                  className="blog-card"
                  onClick={() => handleBlogClick(blog.slug)}
                >
                  {blog.featuredImage && (
                    <div className="blog-image">
                      <img
                        src={blog.featuredImage}
                        alt={blog.featuredImageAlt || blog.title}
                      />
                    </div>
                  )}

                  <div className="blog-content">
                    {blog.category && (
                      <span className="blog-category">{blog.category}</span>
                    )}

                    <h3>{blog.title}</h3>

                    <p className="blog-description">
                      {blog.description || getBlogExcerpt(blog.content, 150)}
                    </p>

                    <div className="blog-meta">
                      <span className="blog-author">
                        By {blog.author?.name || "Admin"}
                      </span>
                      <span className="blog-readtime">
                        {blog.readingTime} min read
                      </span>
                    </div>

                    {blog.tags?.length > 0 && (
                      <div className="blog-tags">
                        {blog.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <button type="button" className="read-more">
                      Read More -&gt;
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  &lt;- Previous
                </button>

                <div className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Next -&gt;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicBlogsPage;
