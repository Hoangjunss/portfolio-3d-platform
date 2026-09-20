"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSettings, saveSetting, ApiError } from "@/lib/settingsApiClient";

type SocialLink = {
  label: string;
  url: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseJsonString(raw?: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw;
  }
}

// The backend stores social_links as raw JSONB; this array of {label, url} pairs is a frontend convention.
function parseSocialLinks(raw?: string): SocialLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: typeof item.label === "string" ? item.label : "",
          url: typeof item.url === "string" ? item.url : "",
        }));
    }
  } catch {
    // fallback to empty array if unparseable
  }
  return [];
}

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [siteTitle, setSiteTitle] = useState("");
  const [seoMeta, setSeoMeta] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [contactEmail, setContactEmail] = useState("");

  const initialValuesRef = useRef<{
    site_title: string;
    seo_meta: string;
    social_links: string;
    contact_email: string;
  }>({
    site_title: "",
    seo_meta: "",
    social_links: "[]",
    contact_email: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        setLoading(true);
        const settings = await fetchSettings();
        if (!cancelled) {
          const settingsMap = new Map(settings.map((s) => [s.key, s.valueJson]));
          const loadedTitle = parseJsonString(settingsMap.get("site_title"));
          const loadedSeo = parseJsonString(settingsMap.get("seo_meta"));
          const loadedSocial = parseSocialLinks(settingsMap.get("social_links"));
          const loadedEmail = parseJsonString(settingsMap.get("contact_email"));

          setSiteTitle(loadedTitle);
          setSeoMeta(loadedSeo);
          setSocialLinks(loadedSocial);
          setContactEmail(loadedEmail);

          initialValuesRef.current = {
            site_title: loadedTitle,
            seo_meta: loadedSeo,
            social_links: JSON.stringify(loadedSocial),
            contact_email: loadedEmail,
          };
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const apiErr = err as { status?: number; message?: string };
          if (apiErr.status === 401) {
            router.push("/admin/login");
            return;
          }
          if (apiErr.status === 403) {
            setIsForbidden(true);
            setError(apiErr.message || "Bạn không có quyền truy cập trang cài đặt (yêu cầu vai trò ADMIN).");
            return;
          }
          setError(apiErr.message || "Không thể tải cài đặt từ máy chủ.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const isSiteTitleDirty = siteTitle !== initialValuesRef.current.site_title;
  const isSeoMetaDirty = seoMeta !== initialValuesRef.current.seo_meta;
  const isSocialLinksDirty = JSON.stringify(socialLinks) !== initialValuesRef.current.social_links;
  const isContactEmailDirty = contactEmail !== initialValuesRef.current.contact_email;

  const anyDirty = isSiteTitleDirty || isSeoMetaDirty || isSocialLinksDirty || isContactEmailDirty;

  const emailTrimmed = contactEmail.trim();
  const isEmailInvalid =
    (emailTrimmed.length > 0 && !EMAIL_REGEX.test(emailTrimmed)) ||
    (isContactEmailDirty && emailTrimmed.length === 0);

  const emailError = isEmailInvalid
    ? "Email không hợp lệ. Nhập đúng định dạng, ví dụ ten@congty.com."
    : null;

  const hasValidationErrors = Boolean(emailError);
  const canSave = anyDirty && !hasValidationErrors && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSave) {
      return;
    }

    setSaving(true);
    try {
      const saves: Promise<void>[] = [];
      if (isSiteTitleDirty) {
        saves.push(saveSetting("site_title", JSON.stringify(siteTitle)));
      }
      if (isSeoMetaDirty) {
        saves.push(saveSetting("seo_meta", JSON.stringify(seoMeta)));
      }
      if (isSocialLinksDirty) {
        // The backend stores social_links as raw JSONB; this array of {label, url} pairs is a frontend convention.
        saves.push(saveSetting("social_links", JSON.stringify(socialLinks)));
      }
      if (isContactEmailDirty) {
        saves.push(saveSetting("contact_email", JSON.stringify(emailTrimmed)));
      }

      await Promise.all(saves);

      initialValuesRef.current = {
        site_title: siteTitle,
        seo_meta: seoMeta,
        social_links: JSON.stringify(socialLinks),
        contact_email: emailTrimmed,
      };
      setSuccessMessage("Lưu cài đặt thành công.");
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (apiErr.status === 403) {
        setIsForbidden(true);
        setError(apiErr.message || "Bạn không có quyền thay đổi cài đặt hệ thống (yêu cầu vai trò ADMIN).");
        return;
      }
      setError(apiErr.message || "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  function handleAddLink() {
    setSocialLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function handleRemoveLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateLink(index: number, field: "label" | "url", value: string) {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Cài đặt hệ thống</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Quản lý thông tin chung của trang web.
          </p>
        </div>
        <div
          role="alert"
          className="p-4 rounded border border-red-300 bg-red-50 text-red-800 text-sm flex flex-col gap-1"
        >
          <p className="font-semibold">Truy cập bị từ chối (403 Forbidden)</p>
          <p>
            Tài khoản của bạn không có quyền truy cập trang này. Chỉ quản trị viên (ADMIN) mới có quyền xem và cấu hình cài đặt hệ thống.
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Cài đặt hệ thống</h1>
        <p className="text-sm text-[var(--color-muted)]">Đang tải cài đặt…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Cài đặt hệ thống</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Cấu hình tiêu đề trang, thông tin SEO, liên kết mạng xã hội và email liên hệ.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded text-sm border border-red-300 bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-3 rounded text-sm border border-green-300 bg-green-50 text-green-800">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Site Title */}
        <div className="flex flex-col gap-1">
          <label htmlFor="site_title" className="text-sm font-medium text-[var(--color-ink)]">
            Tiêu đề trang (Site title)
          </label>
          <input
            id="site_title"
            type="text"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Ví dụ: Portfolio 3D Platform"
            className="border border-[var(--color-rule)] rounded p-2 text-sm bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
          />
        </div>

        {/* SEO Meta Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="seo_meta" className="text-sm font-medium text-[var(--color-ink)]">
            Mô tả SEO (SEO meta)
          </label>
          <textarea
            id="seo_meta"
            rows={3}
            value={seoMeta}
            onChange={(e) => setSeoMeta(e.target.value)}
            placeholder="Mô tả tóm tắt website hiển thị trên công cụ tìm kiếm"
            className="border border-[var(--color-rule)] rounded p-2 text-sm bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
          />
        </div>

        {/* Social Links */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Liên kết mạng xã hội (Social links)
            </span>
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={handleAddLink}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              className="text-xs px-2.5 py-1 rounded border border-[var(--color-rule)] hover:bg-[var(--color-paper-2)] text-[var(--color-ink)] transition-colors"
            >
              + Thêm liên kết
            </button>
          </div>

          {socialLinks.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)] italic">
              Chưa có liên kết mạng xã hội nào.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label={`Tên mạng xã hội ${idx + 1}`}
                    placeholder="Tên (vd: GitHub, X)"
                    value={link.label}
                    onChange={(e) => handleUpdateLink(idx, "label", e.target.value)}
                    className="w-1/3 border border-[var(--color-rule)] rounded p-2 text-sm bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <input
                    type="url"
                    aria-label={`URL mạng xã hội ${idx + 1}`}
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleUpdateLink(idx, "url", e.target.value)}
                    className="flex-1 border border-[var(--color-rule)] rounded p-2 text-sm bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <button
                    type="button"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRemoveLink(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRemoveLink(idx);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="contact_email" className="text-sm font-medium text-[var(--color-ink)]">
            Email liên hệ (Contact email)
          </label>
          <input
            id="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="ten@congty.com"
            className={`border rounded p-2 text-sm bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] ${
              emailError ? "border-red-500" : "border-[var(--color-rule)]"
            }`}
          />
          {emailError && (
            <p role="alert" className="text-red-600 text-xs mt-1 font-medium">
              {emailError}
            </p>
          )}
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            role="button"
            tabIndex={0}
            disabled={!canSave}
            className="bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2 rounded text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
