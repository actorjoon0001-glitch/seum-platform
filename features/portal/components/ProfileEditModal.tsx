"use client";

import { useState } from "react";
import { useProfile } from "./PortalProvider";
import { Icon } from "./icons";

/** 내 정보 수정 모달 — 사진(avatar) + 전화번호. 저장은 update_my_profile RPC로 자기 행만 수정. */
export function ProfileEditModal({ onClose }: { onClose: () => void }) {
  const { profile, reload } = useProfile();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("update_my_profile", {
        p_phone: phone,
        p_avatar_url: avatarUrl,
      } as never);
      if (rpcError) throw rpcError;
      await reload();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const initial = (profile?.name ?? "·").charAt(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">내 정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {/* 사진 */}
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-seum-100 text-2xl font-bold text-seum-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="프로필 사진" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <label className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:border-seum-400 hover:text-seum-600">
            {uploading ? "업로드 중…" : "사진 변경"}
            <input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* 전화번호 */}
        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium text-neutral-700">연락처</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
          />
        </div>

        {/* 읽기전용 안내 */}
        <p className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400">
          <Icon name="org" size={12} />
          이름·부서·직급·권한은 관리자(세움OS)에서만 변경됩니다.
        </p>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploading}
            className="rounded-lg bg-seum-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
