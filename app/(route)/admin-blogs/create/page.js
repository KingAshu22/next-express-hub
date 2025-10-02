"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ✅ Dynamic import ReactQuill to fix findDOMNode issue
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    [{ align: [] }],
    ["link", "image"],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

// ✅ SEO analysis function
const analyzeSEO = (formData) => {
  const { metaTitle, metaDesc, keywords, content, title } = formData;

  // ✅ Clean keyword list
  const keywordList = keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const seoChecks = {
    metaTitleCheck: metaTitle.length >= 10 && metaTitle.length <= 60,
    metaDescriptionCheck: metaDesc.length >= 50 && metaDesc.length <= 160,
    keywordsCheck: keywordList.length >= 1 && keywordList.length <= 5,
    contentCheck:
      content.split(" ").length >= 300 && content.split(" ").length <= 15000,
    headingCheck: (content.match(/<h[1-6][^>]*>/g) || []).length >= 1,
    multimediaCheck: content.includes("<img"),
    keywordDensityCheck: false,
    keywordStuffingCheck: false,
    headingKeywordCheck: false,
    internalLinksCheck: 0,
    externalLinksCheck: 0,
  };

  // ✅ Keyword density
  if (keywordList.length > 0) {
    const keywordDensity = (
      content.match(new RegExp(keywordList.join("|"), "gi")) || []
    ).length;
    const keywordCount = content.split(" ").length;
    const keywordDensityPercentage = (keywordDensity / keywordCount) * 100;

    if (keywordDensityPercentage >= 2 && keywordDensityPercentage <= 5) {
      seoChecks.keywordDensityCheck = true;
    }
    if (keywordDensityPercentage > 5) {
      seoChecks.keywordStuffingCheck = true;
    }

    if (
      title &&
      keywordList.some((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      seoChecks.headingKeywordCheck = true;
    }

    return {
      score: calculateScore(seoChecks),
      checks: seoChecks,
      keywordDensityPercentage,
    };
  }

  return {
    score: calculateScore(seoChecks),
    checks: seoChecks,
    keywordDensityPercentage: 0,
  };
};

// Helper to compute score
const calculateScore = (seoChecks) => {
  let score = 0;
  if (seoChecks.metaTitleCheck) score += 20;
  if (seoChecks.metaDescriptionCheck) score += 20;
  if (seoChecks.keywordsCheck) score += 20;
  if (seoChecks.contentCheck) score += 20;
  if (seoChecks.headingCheck) score += 10;
  if (seoChecks.multimediaCheck) score += 10;
  return Math.min(score, 100);
};

export default function BlogForm() {
  const [formData, setFormData] = useState({
    title: "",
    metaTitle: "",
    metaDesc: "",
    slug: "",
    keywords: "",
    content: "",
  });

  const [seoScore, setSeoScore] = useState(0);
  const [seoChecks, setSeoChecks] = useState({});
  const [keywordDensity, setKeywordDensity] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateSEO = (data) => {
    const { score, checks, keywordDensityPercentage } = analyzeSEO(data);
    setSeoScore(score);
    setSeoChecks(checks);
    setKeywordDensity(keywordDensityPercentage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let slugValue = formData.slug;
    if (name === "title") {
      slugValue = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }
    const updated = { ...formData, [name]: value, slug: slugValue };
    setFormData(updated);
    updateSEO(updated);
  };

  const handleContentChange = (content) => {
    const updated = { ...formData, content };
    setFormData(updated);
    updateSEO(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/api/blogs", formData);
      alert("✅ Blog saved successfully!");
      setFormData({
        title: "",
        metaTitle: "",
        metaDesc: "",
        slug: "",
        keywords: "",
        content: "",
      });
      setSeoScore(0);
      setSeoChecks({});
      setKeywordDensity(0);
    } catch (error) {
      console.error("Error saving blog:", error);
      alert("❌ Failed to save blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create a Blog Post</title>
      </Head>
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold mb-6">✍️ Create a Blog Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label>Meta Title</Label>
            <Input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label>Meta Description</Label>
            <textarea
              name="metaDesc"
              value={formData.metaDesc}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <Label>Slug *</Label>
            <Input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label>Keywords (comma separated)</Label>
            <Input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label>Content *</Label>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              theme="snow"
              modules={modules}
              className="h-full border border-gray-300 rounded-md"
            />
          </div>

          {/* ✅ SEO feedback */}
          <div className="mt-4 space-y-1 text-sm">
            <p>SEO Score: {seoScore}/100</p>
            {seoChecks.metaTitleCheck ? (
              <p className="text-green-500">✔ Meta title is valid.</p>
            ) : (
              <p className="text-red-500">❌ Meta title should be 10–60 chars.</p>
            )}
            {seoChecks.metaDescriptionCheck ? (
              <p className="text-green-500">✔ Meta description is valid.</p>
            ) : (
              <p className="text-red-500">❌ Meta description 50–160 chars.</p>
            )}
            {seoChecks.keywordsCheck ? (
              <p className="text-green-500">✔ Keywords count is valid.</p>
            ) : (
              <p className="text-red-500">❌ Keywords should be 1–5.</p>
            )}
            {seoChecks.contentCheck ? (
              <p className="text-green-500">✔ Content length is valid.</p>
            ) : (
              <p className="text-red-500">
                ❌ Content should be 300–15000 words.
              </p>
            )}
            {seoChecks.headingCheck ? (
              <p className="text-green-500">✔ Headings present.</p>
            ) : (
              <p className="text-red-500">❌ Add headings (H1, H2…)</p>
            )}
            {seoChecks.multimediaCheck ? (
              <p className="text-green-500">✔ Images present.</p>
            ) : (
              <p className="text-red-500">❌ Add at least one image.</p>
            )}
            <p>Internal links: {seoChecks.internalLinksCheck || 0}</p>
            <p>External links: {seoChecks.externalLinksCheck || 0}</p>
            {seoChecks.keywordDensityCheck && (
              <p className="text-green-500">✔ Keyword density is OK.</p>
            )}
            {seoChecks.keywordStuffingCheck && (
              <p className="text-red-500">❌ Keyword stuffing detected!</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create Blog"}
          </Button>
        </form>
      </div>
    </>
  );
}
