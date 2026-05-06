import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import BlogCanvasEditor from "../../components/ui/BlogCanvasEditor";
import api from "../../services/api";
import {
  getBlogWordCount,
  getPlainTextFromBlogContent,
} from "../../utils/blogContent";
import "./BlogForm.css";

const DEFAULT_BLOG_CONFIG = {
  listing: {
    visibleFields: {
      title: true,
      description: true,
      category: true,
      author: true,
      publishedAt: true,
      readingTime: true,
      featuredImage: true,
      tags: true,
    },
    elements: {
      containerTag: "article",
      titleTag: "h3",
      descriptionTag: "p",
      categoryTag: "span",
      metaTag: "div",
      imageTag: "img",
    },
    styles: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#4f46e5",
      backgroundImage: "",
      textAlign: "left",
    },
  },
  detail: {
    visibleFields: {
      title: true,
      content: true,
      category: true,
      author: true,
      publishedAt: true,
      featuredImage: true,
      tags: true,
    },
    elements: {
      containerTag: "article",
      titleTag: "h1",
      contentTag: "div",
      categoryTag: "span",
      metaTag: "div",
      imageTag: "img",
    },
    styles: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#4f46e5",
      backgroundImage: "",
      textAlign: "left",
    },
  },
};

const mergeBlogConfig = (incoming = {}) => ({
  listing: {
    visibleFields: {
      ...DEFAULT_BLOG_CONFIG.listing.visibleFields,
      ...(incoming.listing?.visibleFields || {}),
    },
    elements: {
      ...DEFAULT_BLOG_CONFIG.listing.elements,
      ...(incoming.listing?.elements || {}),
    },
    styles: {
      ...DEFAULT_BLOG_CONFIG.listing.styles,
      ...(incoming.listing?.styles || {}),
    },
  },
  detail: {
    visibleFields: {
      ...DEFAULT_BLOG_CONFIG.detail.visibleFields,
      ...(incoming.detail?.visibleFields || {}),
    },
    elements: {
      ...DEFAULT_BLOG_CONFIG.detail.elements,
      ...(incoming.detail?.elements || {}),
    },
    styles: {
      ...DEFAULT_BLOG_CONFIG.detail.styles,
      ...(incoming.detail?.styles || {}),
    },
  },
});

const getWebsiteItems = (payload) => {
  if (Array.isArray(payload?.websites)) {
    return payload.websites;
  }

  return Array.isArray(payload) ? payload : [];
};

const formatConfigLabel = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

const getVisibleFieldLabels = (visibleFields = {}) =>
  Object.entries(visibleFields)
    .filter(([, enabled]) => enabled)
    .map(([field]) => formatConfigLabel(field));

const getElementSummary = (elements = {}) =>
  Object.entries(elements)
    .map(([field, tag]) => `${formatConfigLabel(field)} <${tag}>`)
    .join(" | ");

const getStyleSummary = (styles = {}) =>
  [
    `BG ${styles.backgroundColor || "#ffffff"}`,
    `Text ${styles.textColor || "#111827"}`,
    `Accent ${styles.accentColor || "#4f46e5"}`,
    `${styles.textAlign || "left"} aligned`,
    styles.backgroundImage ? "Background image on" : null,
  ]
    .filter(Boolean)
    .join(" | ");

const BlogForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    websiteId: "",
    title: "",
    description: "",
    content: "",
    category: "",
    tags: "",
    featuredImage: "",
    featuredImageAlt: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    status: "draft",
    isPublished: false,
  });

  const selectedWebsite =
    websites.find((website) => website._id === formData.websiteId) || null;
  const selectedBlogConfig = mergeBlogConfig(selectedWebsite?.blogConfig);
  const listingVisibleFields = getVisibleFieldLabels(
    selectedBlogConfig.listing.visibleFields,
  );
  const detailVisibleFields = getVisibleFieldLabels(
    selectedBlogConfig.detail.visibleFields,
  );
  const plainTextContent = getPlainTextFromBlogContent(formData.content);
  const contentWordCount = getBlogWordCount(formData.content);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await api.get("/websites", {
          params: { limit: 100 },
        });
        setWebsites(getWebsiteItems(response.data.data));
      } catch {
        toast.error("Failed to fetch websites");
      }
    };

    fetchWebsites();
  }, []);

  useEffect(() => {
    if (!formData.websiteId) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get(`/blogs/categories/${formData.websiteId}`);
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, [formData.websiteId]);

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    const fetchBlog = async () => {
      try {
        const response = await api.get(`/blogs/${id}`);
        const blog = response.data.data;

        setFormData({
          websiteId: blog.websiteId?._id || "",
          title: blog.title || "",
          description: blog.description || "",
          content: blog.content || "",
          category: blog.category || "",
          tags: (blog.tags || []).join(", "),
          featuredImage: blog.featuredImage || "",
          featuredImageAlt: blog.featuredImageAlt || "",
          seoTitle: blog.seoTitle || "",
          seoDescription: blog.seoDescription || "",
          seoKeywords: (blog.seoKeywords || []).join(", "),
          status: blog.status || "draft",
          isPublished: Boolean(blog.isPublished),
        });
      } catch {
        toast.error("Failed to fetch blog");
        navigate("/admin/blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, isEdit, navigate]);

  const handleChange = ({ target: { name, value, checked, type } }) => {
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContentChange = (content) => {
    setFormData((current) => ({
      ...current,
      content,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedContent = getPlainTextFromBlogContent(formData.content);

    if (normalizedContent.length < 50) {
      toast.error("Blog content should be at least 50 characters long");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        seoKeywords: formData.seoKeywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      };

      if (isEdit) {
        await api.put(`/blogs/${id}`, payload);
        toast.success("Blog updated successfully");
      } else {
        await api.post("/blogs", payload);
        toast.success("Blog created successfully");
      }

      navigate("/admin/blogs");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save blog");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="blog-form-container">
      <div className="form-header">
        <h1>{isEdit ? "Edit Blog" : "Create New Blog"}</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/admin/blogs")}
        >
          Back to Blogs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-group">
          <label htmlFor="websiteId">
            Website <span className="required">*</span>
          </label>
          <select
            id="websiteId"
            name="websiteId"
            value={formData.websiteId}
            onChange={handleChange}
            required
            disabled={isEdit}
          >
            <option value="">Select a website</option>
            {websites.map((website) => (
              <option key={website._id} value={website._id}>
                {website.name}
              </option>
            ))}
          </select>
        </div>

        <div className="blog-display-settings">
          <div className="blog-display-settings-header">
            <div>
              <h2>External Website Rendering</h2>
              <p>
                Orbinest uses the selected website&apos;s blog display settings
                when other websites fetch blogs with the website API key.
              </p>
            </div>
            {selectedWebsite && (
              <span className="blog-display-badge">
                {selectedWebsite.name} integration config
              </span>
            )}
          </div>

          {selectedWebsite ? (
            <>
              <div className="blog-display-summary-grid">
                <div className="blog-display-summary-card">
                  <h3>Listing Output</h3>
                  <p>
                    Fields:{" "}
                    {listingVisibleFields.length
                      ? listingVisibleFields.join(", ")
                      : "None selected"}
                  </p>
                  <code>
                    {getElementSummary(selectedBlogConfig.listing.elements)}
                  </code>
                  <small>
                    {getStyleSummary(selectedBlogConfig.listing.styles)}
                  </small>
                </div>
                <div className="blog-display-summary-card">
                  <h3>Detail Output</h3>
                  <p>
                    Fields:{" "}
                    {detailVisibleFields.length
                      ? detailVisibleFields.join(", ")
                      : "None selected"}
                  </p>
                  <code>
                    {getElementSummary(selectedBlogConfig.detail.elements)}
                  </code>
                  <small>
                    {getStyleSummary(selectedBlogConfig.detail.styles)}
                  </small>
                </div>
              </div>
            </>
          ) : (
            <p className="blog-display-empty">
              Select a website to preview the blog fields, HTML tags, colors,
              and background styles external websites will receive from
              Orbinest.
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">
            Blog Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., 10 Tips for Better Web Design"
            maxLength={200}
            required
          />
          <small>{formData.title.length}/200</small>
          {selectedWebsite &&
            !selectedBlogConfig.listing.visibleFields.title &&
            !selectedBlogConfig.detail.visibleFields.title && (
              <small className="field-visibility-note">
                This website&apos;s integration config currently hides titles on
                both listing and detail responses.
              </small>
            )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Blog Summary</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="A brief summary of your blog post"
            rows={2}
            maxLength={500}
          />
          <small>{formData.description.length}/500</small>
          {selectedWebsite &&
            !selectedBlogConfig.listing.visibleFields.description && (
              <small className="field-visibility-note">
                Listing integrations for this website currently hide the summary
                field.
              </small>
            )}
        </div>

        <div className="form-group">
          <label htmlFor="content">
            Blog Content <span className="required">*</span>
          </label>
          <BlogCanvasEditor
            value={formData.content}
            onChange={handleContentChange}
            previewTitle={formData.title}
            previewDescription={formData.description}
            previewImage={formData.featuredImage}
            previewImageAlt={formData.featuredImageAlt}
          />
          <small>
            Min 50 characters | Word count:{" "}
            {contentWordCount}
          </small>
          {plainTextContent && (
            <small>{plainTextContent.length} characters of readable text</small>
          )}
          {selectedWebsite &&
            !selectedBlogConfig.detail.visibleFields.content && (
              <small className="field-visibility-note">
                Detail integrations for this website currently hide the full
                content field.
              </small>
            )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            {categories.length > 0 ? (
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select or type new</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Technology, Design"
                maxLength={50}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Separate with commas"
            />
            {selectedWebsite &&
              !selectedBlogConfig.listing.visibleFields.tags &&
              !selectedBlogConfig.detail.visibleFields.tags && (
                <small className="field-visibility-note">
                  Tags are currently hidden in this website&apos;s external blog
                  integration.
                </small>
              )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="featuredImage">Featured Image URL</label>
            <input
              type="url"
              id="featuredImage"
              name="featuredImage"
              value={formData.featuredImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {selectedWebsite &&
              !selectedBlogConfig.listing.visibleFields.featuredImage &&
              !selectedBlogConfig.detail.visibleFields.featuredImage && (
                <small className="field-visibility-note">
                  Featured images are currently hidden for this website&apos;s
                  external blog integration.
                </small>
              )}
          </div>

          <div className="form-group">
            <label htmlFor="featuredImageAlt">Image Alt Text</label>
            <input
              type="text"
              id="featuredImageAlt"
              name="featuredImageAlt"
              value={formData.featuredImageAlt}
              onChange={handleChange}
              placeholder="Description for accessibility"
              maxLength={200}
            />
          </div>
        </div>

        {formData.featuredImage && (
          <div className="image-preview">
            <img src={formData.featuredImage} alt={formData.featuredImageAlt} />
          </div>
        )}

        <div className="seo-section">
          <h3>SEO Settings</h3>

          <div className="form-group">
            <label htmlFor="seoTitle">SEO Title</label>
            <input
              type="text"
              id="seoTitle"
              name="seoTitle"
              value={formData.seoTitle}
              onChange={handleChange}
              placeholder="Page title for search engines"
              maxLength={60}
            />
            <small>{formData.seoTitle.length}/60</small>
          </div>

          <div className="form-group">
            <label htmlFor="seoDescription">SEO Description</label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              value={formData.seoDescription}
              onChange={handleChange}
              placeholder="Meta description shown in search results"
              rows={2}
              maxLength={160}
            />
            <small>{formData.seoDescription.length}/160</small>
          </div>

          <div className="form-group">
            <label htmlFor="seoKeywords">SEO Keywords</label>
            <input
              type="text"
              id="seoKeywords"
              name="seoKeywords"
              value={formData.seoKeywords}
              onChange={handleChange}
              placeholder="Separate keywords with commas"
            />
          </div>
        </div>

        <div className="publish-section">
          <h3>Publish Settings</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="isPublished">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  disabled={formData.status !== "published"}
                />
                Publish this blog
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/blogs")}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Saving..." : isEdit ? "Update Blog" : "Create Blog"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;

