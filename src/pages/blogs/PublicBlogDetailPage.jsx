import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import api from "../../services/api";
import { getBlogContentHtml, getBlogExcerpt } from "../../utils/blogContent";
import "./PublicBlogDetailPage.css";

const PublicBlogDetailPage = () => {
  const { websiteId, slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogAndRelated = async () => {
      try {
        const blogResponse = await api.get(`/blogs/public/${websiteId}/${slug}`);
        const fetchedBlog = blogResponse.data.data;
        setBlog(fetchedBlog);

        if (fetchedBlog.category) {
          const relatedResponse = await api.get(`/blogs/public/${websiteId}`, {
            params: {
              category: fetchedBlog.category,
              limit: 3,
            },
          });
          const relatedItems = Array.isArray(relatedResponse.data.data)
            ? relatedResponse.data.data
            : relatedResponse.data.data?.data || [];

          setRelatedBlogs(
            relatedItems.filter(
              (relatedBlog) => relatedBlog._id !== fetchedBlog._id,
            ),
          );
        }
      } catch {
        toast.error("Blog not found");
        navigate(`/blogs/${websiteId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogAndRelated();
  }, [websiteId, slug, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!blog) {
    return <div className="error">Blog not found</div>;
  }

  return (
    <div className="public-blog-detail">
      <div className="breadcrumb">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={() => navigate(`/blogs/${websiteId}`)}
        >
          Blog
        </button>
        {blog.category && (
          <>
            <span>/</span>
            <span>{blog.category}</span>
          </>
        )}
        <span>/</span>
        <span className="current">{blog.title}</span>
      </div>

      {blog.featuredImage && (
        <div className="featured-image-section">
          <img src={blog.featuredImage} alt={blog.featuredImageAlt} />
        </div>
      )}

      <article className="blog-article">
        <header className="article-header">
          {blog.category && (
            <span className="article-category">{blog.category}</span>
          )}
          <h1>{blog.title}</h1>

          <div className="article-meta">
            <span className="meta-item">
              <strong>By</strong> {blog.author?.name || "Admin"}
            </span>
            <span className="meta-item">
              <strong>Published</strong>{" "}
              {blog.publishedAt
                ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unpublished"}
            </span>
            <span className="meta-item">
              <strong>Reading time</strong> {blog.readingTime} min
            </span>
            <span className="meta-item">
              <strong>Views</strong> {blog.views}
            </span>
          </div>
        </header>

        {blog.description && (
          <p className="article-description">{blog.description}</p>
        )}

        <div className="article-content">
          <div
            className="rich-blog-content"
            dangerouslySetInnerHTML={{
              __html: getBlogContentHtml(blog.content),
            }}
          />
        </div>

        {blog.tags?.length > 0 && (
          <div className="article-tags">
            <h4>Tags</h4>
            <div className="tag-list">
              {blog.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {blog.author && (
          <div className="author-section">
            <h4>About the Author</h4>
            <div className="author-info">
              <div className="author-name">{blog.author.name}</div>
              {blog.author.email && (
                <div className="author-email">{blog.author.email}</div>
              )}
            </div>
          </div>
        )}
      </article>

      {relatedBlogs.length > 0 && (
        <section className="related-blogs">
          <h2>Related Articles</h2>
          <div className="related-blogs-grid">
            {relatedBlogs.map((relatedBlog) => (
              <article
                key={relatedBlog._id}
                className="related-blog-card"
                onClick={() => navigate(`/blogs/${websiteId}/${relatedBlog.slug}`)}
              >
                {relatedBlog.featuredImage && (
                  <div className="related-blog-image">
                    <img
                      src={relatedBlog.featuredImage}
                      alt={relatedBlog.featuredImageAlt}
                    />
                  </div>
                )}
                <div className="related-blog-content">
                  <h3>{relatedBlog.title}</h3>
                  <p>
                    {relatedBlog.description ||
                      getBlogExcerpt(relatedBlog.content, 100) ||
                      "Read the full article for more details."}
                  </p>
                  <button type="button" className="read-more">
                    Read More -&gt;
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="back-link">
        <button type="button" onClick={() => navigate(`/blogs/${websiteId}`)}>
          &lt;- Back to Blog
        </button>
      </div>
    </div>
  );
};

export default PublicBlogDetailPage;
