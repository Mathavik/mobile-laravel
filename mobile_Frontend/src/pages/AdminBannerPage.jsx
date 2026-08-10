import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "../services/api";
import { useNavigate } from "react-router-dom";



export default function AdminBannerPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    category_name: "",
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // fetch banners for admin table
    const fetchBanners = async () => {
      setBannersLoading(true);
      try {
        const res = await api.get("banner/get_banners.php");
        setBanners(res?.data?.data || []);
      } catch (err) {
        console.error("Failed to load banners", err);
      } finally {
        setBannersLoading(false);
      }
    };

    fetchBanners();

    const fetchCategories = async () => {
      setCategoryLoading(true);
      setCategoryError("");
      try {
        const response = await api.get("category/get_active_category.php");
        const categoryList = response?.data?.data || [];
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category_id: String(categoryList[0].id),
            category_name: categoryList[0].name,
          }));
        }
      } catch (err) {
        console.error(err);
        setCategoryError("Unable to load categories. Please try again.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const selectedCategoryName = useMemo(() => {
    return categories.find((category) => String(category.id) === String(formData.category_id))?.name || "";
  }, [categories, formData.category_id]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.image || !formData.category_id) {
      setError("Please fill the title, description, choose a category, and upload an image.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      // use selected category name as banner_title (group) so frontend can pick correct banner by category
      const bannerGroup = formData.banner_title?.trim() || selectedCategoryName || "IN THE SPOTLIGHT";
      payload.append("banner_title", bannerGroup);
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("category_id", formData.category_id);
      payload.append("category_name", selectedCategoryName);
      payload.append("image", formData.image);
      let response;
      if (formData.id) {
        // update
        payload.append("id", formData.id);
        // only append image if a file was selected
        if (formData.image instanceof File) {
          payload.append("image", formData.image);
        }
        response = await api.post("banner/update_banner.php", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("banner/add_banner.php", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.data?.success) {
        setSuccess(formData.id ? "Banner updated successfully." : "Banner saved successfully.");
        setFormData({
          id: undefined,
          title: "",
          description: "",
          category_id: formData.category_id,
          category_name: selectedCategoryName,
          image: null,
        });
        setPreviewUrl("");
        // refresh list
        const res = await api.get("banner/get_banners.php");
        setBanners(res?.data?.data || []);
      } else {
        setError(response?.data?.message || "Unable to save banner.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Network error while saving banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner) => {
    setFormData((prev) => ({
      ...prev,
      id: banner.id,
      title: banner.title || "",
      description: banner.description || "",
      category_id: banner.category_id || prev.category_id,
      category_name: banner.category_name || prev.category_name,
      image: null,
      banner_title: banner.banner_title || "",
    }));
    setPreviewUrl(banner.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await api.post("banner/delete_banner.php", { id });
      if (res?.data?.success) {
        setBanners((prev) => prev.filter((b) => String(b.id) !== String(id)));
        setSuccess("Banner deleted.");
      } else {
        setError(res?.data?.message || "Unable to delete banner.");
      }
    } catch (err) {
      setError("Network error while deleting banner.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-28 text-gray-700 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">Banner Management</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0f172a]">Create Spotlight Banner</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border-2 border-[#2563eb] px-5 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-gradient-to-r hover:from-[#2563eb] hover:to-[#7c3aed] hover:text-white hover:border-transparent"
          >
            Back to Home
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Banner Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Crafted For Celebration"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Banner Description</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Latest smartphones and accessories from our collection."
              />
            </div>

          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Category Dropdown</label>
              <select
                value={formData.category_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, category_id: event.target.value, category_name: event.target.selectedOptions[0]?.text || "" }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
              >
                <option value="" disabled>
                  {categoryLoading ? "Loading categories..." : "Select a category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoryError ? <p className="mt-2 text-sm text-red-600">{categoryError}</p> : null}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
              <p className="mb-3 text-sm font-semibold text-[#0f172a]">Image Preview</p>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-64 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
                  Preview will appear here after upload.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {error ? <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">{success}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-8 py-3 text-sm font-bold uppercase tracking-[2px] text-white shadow-lg shadow-[#2563eb]/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Banner"}
            </button>
          </div>
        </form>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-[#0f172a]">Existing Banners</h2>
          {bannersLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2563eb]/20 border-t-[#2563eb]" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full table-auto text-left">
                <thead className="bg-[#f8fafc] text-sm">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Preview</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Banner Title</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {banners.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No banners found</td></tr>
                  ) : (
                    banners.map((b) => (
                      <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 align-top w-36">
                          {b.image ? <img src={b.image} alt={b.title} className="h-20 w-full object-cover rounded-xl" /> : <div className="h-20 w-full rounded-xl bg-gray-100"></div>}
                        </td>
                        <td className="px-4 py-3 align-top font-medium text-[#0f172a]">{b.banner_title}</td>
                        <td className="px-4 py-3 align-top">{b.title}</td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex rounded-full bg-[#2563eb]/5 border border-[#2563eb]/20 px-3 py-1 text-xs font-medium text-[#2563eb]">{b.category_name}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">{b.status}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(b)} className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">Edit</button>
                            <button onClick={() => handleDelete(b.id)} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
