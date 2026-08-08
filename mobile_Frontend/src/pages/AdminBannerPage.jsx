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
        const res = await axios.get(`${API_BASE}/banner/get_banners.php`);
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
    <div className="min-h-screen bg-[#f8f7f2] px-4 py-28 text-gray-700 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl rounded-3xl border border-[#e8dcc8] bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[4px] text-[#a97c50]">Banner Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Create Spotlight Banner</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-[#a97c50] px-5 py-2 text-sm font-semibold text-[#a97c50] transition hover:bg-[#a97c50] hover:text-white"
          >
            Back to Home
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Banner Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#a97c50]"
                placeholder="Crafted For Celebration"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Banner Description</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#a97c50]"
                placeholder="Beautiful bridal styles inspired by our latest collection."
              />
            </div>

          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Category Dropdown</label>
              <select
                value={formData.category_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, category_id: event.target.value, category_name: event.target.selectedOptions[0]?.text || "" }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#a97c50]"
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

            <div className="overflow-hidden rounded-2xl border border-[#eee4d4] bg-[#fcfaf5] p-4">
              <p className="mb-3 text-sm font-medium">Image Preview</p>
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
            {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">{success}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#a97c50] px-8 py-3 text-sm font-semibold uppercase tracking-[2px] text-white transition hover:bg-[#8c6539] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Banner"}
            </button>
          </div>
        </form>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Existing Banners</h2>
          {bannersLoading ? (
            <div>Loading banners...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full table-auto text-left">
                <thead className="bg-gray-50 text-sm">
                  <tr>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Banner Title</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {banners.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-6 text-center">No banners found</td></tr>
                  ) : (
                    banners.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="px-4 py-3 align-top w-36">
                          {b.image ? <img src={b.image} alt={b.title} className="h-20 w-full object-cover rounded" /> : <div className="h-20 w-full rounded bg-gray-100"></div>}
                        </td>
                        <td className="px-4 py-3 align-top">{b.banner_title}</td>
                        <td className="px-4 py-3 align-top">{b.title}</td>
                        <td className="px-4 py-3 align-top">{b.category_name}</td>
                        <td className="px-4 py-3 align-top">{b.status}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(b)} className="rounded-md bg-blue-600 px-3 py-1 text-white">Edit</button>
                            <button onClick={() => handleDelete(b.id)} className="rounded-md bg-red-600 px-3 py-1 text-white">Delete</button>
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
