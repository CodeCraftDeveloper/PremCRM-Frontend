import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";
import { getBlogContentHtml } from "../../utils/blogContent";
import "./BlogDetailPage.css";

const BlogDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [blog, setBlog] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        const [blogResponse, statsResponse] = await Promise.all([
          api.get(`/blogs/${id}`),
          api.get(`/blogs/${id}/stats`),
        ]);

        setBlog(blogResponse.data.data);
        setStats(statsResponse.data.data);
      } catch {
        toast.error("Failed to fetch blog details");
        navigate("/admin/blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!blog) {
    return <div className="error">Blog not found</div>;
  }

  return (
    <div className="blog-detail-container">
      <div className="blog-detail-header">
        <div>
          <h1>{blog.title}</h1>
          <p className="blog-slug">/{blog.slug}</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/admin/blogs/${id}/edit`)}
          >
            Edit Blog
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/blogs")}
          >
            Back to List
          </button>
        </div>
      </div>

      {blog.featuredImage && (
        <div className="featured-image">
          <img src={blog.featuredImage} alt={blog.featuredImageAlt} />
        </div>
      )}

      <div className="blog-detail-layout">
        <div className="blog-content">
          {blog.description && (
            <div className="description">
              <h2>Summary</h2>
              <p>{blog.description}</p>
            </div>
          )}

          <div className="content-body">
            <div
              className="rich-blog-content"
              dangerouslySetInnerHTML={{
                __html: getBlogContentHtml(blog.content),
              }}
            />
          </div>

          {blog.tags?.length > 0 && (
            <div className="tags">
              <h3>Tags</h3>
              <div className="tag-list">
                {blog.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(blog.seoTitle ||
            blog.seoDescription ||
            blog.seoKeywords?.length > 0) && (
            <div className="seo-info">
              <h3>SEO Information</h3>
              {blog.seoTitle && (
                <div>
                  <strong>Title:</strong> {blog.seoTitle}
                </div>
              )}
              {blog.seoDescription && (
                <div>
                  <strong>Description:</strong> {blog.seoDescription}
                </div>
              )}
              {blog.seoKeywords?.length > 0 && (
                <div>
                  <strong>Keywords:</strong> {blog.seoKeywords.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="blog-sidebar">
          {stats && (
            <div className="stat-card">
              <h3>Statistics</h3>
              <div className="stat-item">
                <span className="stat-label">Views</span>
                <span className="stat-value">{stats.views || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Word Count</span>
                <span className="stat-value">{stats.wordCount || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Reading Time</span>
                <span className="stat-value">{stats.readingTime} min</span>
              </div>
            </div>
          )}

          <div className="info-card">
            <h3>Blog Information</h3>

            <div className="info-item">
              <span className="label">Status</span>
              <span className={`badge status-${blog.status}`}>{blog.status}</span>
            </div>

            {blog.category && (
              <div className="info-item">
                <span className="label">Category</span>
                <span className="value">{blog.category}</span>
              </div>
            )}

            {blog.author && (
              <div className="info-item">
                <span className="label">Author</span>
                <span className="value">{blog.author.name}</span>
              </div>
            )}

            <div className="info-item">
              <span className="label">Published</span>
              <span className="value">{blog.isPublished ? "Yes" : "No"}</span>
            </div>

            {blog.publishedAt && (
              <div className="info-item">
                <span className="label">Published Date</span>
                <span className="value">
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="info-item">
              <span className="label">Created</span>
              <span className="value">
                {new Date(blog.createdAt).toLocaleDateString()}
              </span>
            </div>

            {blog.updatedAt && (
              <div className="info-item">
                <span className="label">Last Updated</span>
                <span className="value">
                  {new Date(blog.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {blog.websiteId && (
            <div className="info-card">
              <h3>Website</h3>
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{blog.websiteId.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Domain</span>
                <span className="value">{blog.websiteId.domain}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
