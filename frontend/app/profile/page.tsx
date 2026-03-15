"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import {
  changeUserPassword,
  deleteUserAccount,
  getCurrentUser,
  updateUserProfile,
} from "@/lib/api";

function localGermanPhone(phone?: string | null) {
  if (!phone) return "";
  return phone.startsWith("+49") ? phone.slice(3) : phone;
}

function normalizeGermanNumberInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13);
}

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressFullName, setAddressFullName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("Germany");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    const userToken = localStorage.getItem("user_token") || "";
    if (!userToken) {
      router.replace("/signin");
      return;
    }
    setToken(userToken);

    getCurrentUser(userToken)
      .then((payload) => {
        setName(payload.user.name || "");
        setEmail(payload.user.email || "");
        setPhone(localGermanPhone(payload.user.phone));
        setAddressFullName(payload.user.address?.fullName || payload.user.name || "");
        setAddressPhone(payload.user.address?.phone || payload.user.phone || "");
        setAddressLine1(payload.user.address?.line1 || "");
        setAddressLine2(payload.user.address?.line2 || "");
        setAddressCity(payload.user.address?.city || "");
        setAddressState(payload.user.address?.state || "");
        setAddressPostalCode(payload.user.address?.postalCode || "");
        setAddressCountry(payload.user.address?.country || "Germany");
        setIdentityVerified(Boolean(payload.user.identityVerified));
      })
      .catch(() => {
        localStorage.removeItem("user_token");
        router.replace("/signin");
      });
  }, [router]);

  const fullPhone = useMemo(() => (phone.trim() ? `+49${phone.trim()}` : null), [phone]);

  const onProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setLoadingProfile(true);
    setMessage("");
    setError("");
    try {
      const payload = await updateUserProfile(token, {
        name: name.trim(),
        phone: fullPhone,
        address: {
          fullName: addressFullName.trim() || name.trim(),
          phone: addressPhone.trim() || fullPhone || "",
          line1: addressLine1.trim(),
          line2: addressLine2.trim(),
          city: addressCity.trim(),
          state: addressState.trim(),
          postalCode: addressPostalCode.trim(),
          country: addressCountry.trim() || "Germany",
        },
      });
      setName(payload.user.name || "");
      setPhone(localGermanPhone(payload.user.phone));
      setAddressFullName(payload.user.address?.fullName || payload.user.name || "");
      setAddressPhone(payload.user.address?.phone || payload.user.phone || "");
      setAddressLine1(payload.user.address?.line1 || "");
      setAddressLine2(payload.user.address?.line2 || "");
      setAddressCity(payload.user.address?.city || "");
      setAddressState(payload.user.address?.state || "");
      setAddressPostalCode(payload.user.address?.postalCode || "");
      setAddressCountry(payload.user.address?.country || "Germany");
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const onChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setLoadingPassword(true);
    setMessage("");
    setError("");
    try {
      await changeUserPassword(token, {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const onDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    setLoadingDelete(true);
    setMessage("");
    setError("");
    try {
      await deleteUserAccount(token, { password: deletePassword.trim() });
      localStorage.removeItem("user_token");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <ClientNavbar />
      <main className="mx-auto w-full max-w-[980px] space-y-5 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">My Profile</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your profile, password and account settings.</p>
        </div>

        {message ? <p className="rounded-lg bg-lime-50 px-3 py-2 text-sm text-lime-700">{message}</p> : null}
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-zinc-900">Account Info</h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                identityVerified
                  ? "bg-lime-100 text-lime-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {identityVerified ? "Verified" : "Unverified"}
            </span>
          </div>
          <form className="mt-4 space-y-3" onSubmit={onProfileSave}>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600">Email</span>
              <input
                value={email}
                disabled
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600">Phone (Germany)</span>
              <div className="flex overflow-hidden rounded-xl border border-zinc-300 focus-within:border-lime-500">
                <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-[15px] text-zinc-700">
                  +49
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(normalizeGermanNumberInput(e.target.value))}
                  className="w-full px-3 py-2 outline-none"
                  placeholder="15123456789"
                />
              </div>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm text-zinc-600">Address full name</span>
                <input
                  value={addressFullName}
                  onChange={(e) => setAddressFullName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  placeholder="John Doe"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm text-zinc-600">Address phone</span>
                <input
                  value={addressPhone}
                  onChange={(e) => setAddressPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  placeholder="+49..."
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm text-zinc-600">Address line 1</span>
                <input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  placeholder="Street and house number"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm text-zinc-600">Address line 2</span>
                <input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  placeholder="Apartment, floor, etc."
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-600">City</span>
                <input
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-600">State</span>
                <input
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-600">Postal code</span>
                <input
                  value={addressPostalCode}
                  onChange={(e) => setAddressPostalCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-600">Country</span>
                <input
                  value={addressCountry}
                  onChange={(e) => setAddressCountry(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-lime-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loadingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Change Password</h2>
          <form className="mt-4 space-y-3" onSubmit={onChangePassword}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            />
            <button
              type="submit"
              disabled={loadingPassword}
              className="rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loadingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Delete Account</h2>
          <p className="mt-1 text-sm text-red-600">This action is permanent and cannot be undone.</p>
          <form className="mt-4 space-y-3" onSubmit={onDeleteAccount}>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              required
              className="w-full rounded-xl border border-red-300 px-3 py-2 outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={loadingDelete}
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loadingDelete ? "Deleting..." : "Delete my account"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
