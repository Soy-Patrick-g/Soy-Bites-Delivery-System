"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LocationPicker } from "@/components/LocationPicker";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import {
  createOwnerBranch,
  createOwnerMenuItem,
  formatCurrency,
  getOwnerDashboard,
  getOwnerRestaurantMenu,
  setOwnerMenuItemAvailability,
  uploadOwnerImage,
  updateOwnerMenuItem
} from "@/lib/api";
import { MenuItem, OwnerDashboard } from "@/lib/types";
import type { LocationSelection } from "@/lib/location";

type MenuFormState = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  vegetarian: boolean;
  spicy: boolean;
  available: boolean;
  allBranches: boolean;
};

type BranchFormState = {
  brandName: string;
  branchName: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
};

const emptyMenuForm: MenuFormState = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  vegetarian: false,
  spicy: false,
  available: true,
  allBranches: false
};

const emptyBranchForm: BranchFormState = {
  brandName: "",
  branchName: "",
  description: "",
  cuisine: "",
  address: "",
  city: "Accra",
  latitude: "",
  longitude: ""
};

export function OwnerMenuManagementClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [menuByRestaurant, setMenuByRestaurant] = useState<Record<number, MenuItem[]>>({});
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuItemId, setActiveMenuItemId] = useState<number | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState<number | null>(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>(emptyMenuForm);
  const [branchForm, setBranchForm] = useState<BranchFormState>(emptyBranchForm);
  const [branchLocation, setBranchLocation] = useState<LocationSelection>({
    address: "",
    city: "Accra",
    latitude: 5.6037,
    longitude: -0.187
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading || isMenuLoading);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "RESTAURANT") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getOwnerDashboard(session.token);
        setDashboard(data);
        setSelectedRestaurantId((current) => current ?? data.restaurants[0]?.id ?? null);
        setBranchForm((current) => ({
          ...current,
          brandName: current.brandName || data.restaurants[0]?.brandName || data.restaurants[0]?.name || ""
        }));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load menu management");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  useEffect(() => {
    async function loadMenu() {
      if (!session || session.role !== "RESTAURANT" || !selectedRestaurantId || menuByRestaurant[selectedRestaurantId]) {
        return;
      }

      try {
        setIsMenuLoading(true);
        setError(null);
        const items = await getOwnerRestaurantMenu(session.token, selectedRestaurantId);
        setMenuByRestaurant((current) => ({ ...current, [selectedRestaurantId]: items }));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load restaurant menu");
      } finally {
        setIsMenuLoading(false);
      }
    }

    void loadMenu();
  }, [menuByRestaurant, selectedRestaurantId, session]);

  async function handleCreateMenuItem() {
    if (!session || !selectedRestaurantId) {
      return;
    }

    try {
      setActiveMenuItemId(-1);
      setError(null);
      const created = await createOwnerMenuItem(session.token, selectedRestaurantId, {
        name: menuForm.name,
        description: menuForm.description,
        price: Number(menuForm.price),
        imageUrl: menuForm.imageUrl.trim() || undefined,
        vegetarian: menuForm.vegetarian,
        spicy: menuForm.spicy,
        available: menuForm.available,
        availableInAllBranches: menuForm.allBranches
      });
      setMenuByRestaurant((current) => ({
        ...current,
        [selectedRestaurantId]: [...(current[selectedRestaurantId] ?? []), created].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      }));
      resetMenuForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create menu item");
    } finally {
      setActiveMenuItemId(null);
    }
  }

  async function handleUpdateMenuItem() {
    if (!session || !selectedRestaurantId || editingMenuItemId === null) {
      return;
    }

    try {
      setActiveMenuItemId(editingMenuItemId);
      setError(null);
      const updated = await updateOwnerMenuItem(session.token, selectedRestaurantId, editingMenuItemId, {
        name: menuForm.name,
        description: menuForm.description,
        price: Number(menuForm.price),
        imageUrl: menuForm.imageUrl.trim() || undefined,
        vegetarian: menuForm.vegetarian,
        spicy: menuForm.spicy,
        available: menuForm.available,
        applyToAllBranches: menuForm.allBranches
      });
      setMenuByRestaurant((current) => ({
        ...current,
        [selectedRestaurantId]: (current[selectedRestaurantId] ?? []).map((item) =>
          item.id === editingMenuItemId ? updated : item
        )
      }));
      resetMenuForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update menu item");
    } finally {
      setActiveMenuItemId(null);
    }
  }

  async function handleAvailabilityToggle(menuItem: MenuItem) {
    if (!session || !selectedRestaurantId) {
      return;
    }

    try {
      setActiveMenuItemId(menuItem.id);
      setError(null);
      const updated = await setOwnerMenuItemAvailability(
        session.token,
        selectedRestaurantId,
        menuItem.id,
        !menuItem.available
      );
      setMenuByRestaurant((current) => ({
        ...current,
        [selectedRestaurantId]: (current[selectedRestaurantId] ?? []).map((item) =>
          item.id === menuItem.id ? updated : item
        )
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update menu availability");
    } finally {
      setActiveMenuItemId(null);
    }
  }

  async function handleCreateBranch() {
    if (!session) {
      return;
    }

    try {
      const nextBranchCity = branchLocation.city || branchForm.city || "Accra";
      setIsCreatingBranch(true);
      setError(null);
      const created = await createOwnerBranch(session.token, {
        brandName: branchForm.brandName,
        branchName: branchForm.branchName,
        description: branchForm.description,
        cuisine: branchForm.cuisine,
        address: branchLocation.address || branchForm.address,
        city: nextBranchCity,
        latitude: branchLocation.latitude,
        longitude: branchLocation.longitude
      });
      setDashboard((current) =>
        current
          ? {
              ...current,
              restaurants: [...current.restaurants, created].sort((left, right) => left.name.localeCompare(right.name))
            }
          : current
      );
      setSelectedRestaurantId(created.id);
      setMenuByRestaurant((current) => ({ ...current, [created.id]: [] }));
      setBranchForm((current) => ({
        ...emptyBranchForm,
        brandName: current.brandName,
        city: nextBranchCity
      }));
      setBranchLocation({
        address: "",
        city: nextBranchCity,
        latitude: 5.6037,
        longitude: -0.187
      });
      setShowBranchModal(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create branch");
    } finally {
      setIsCreatingBranch(false);
    }
  }

  async function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!session) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);
      const uploaded = await uploadOwnerImage(session.token, file);
      setMenuForm((current) => ({ ...current, imageUrl: uploaded.url }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to upload menu image");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  function startEditing(menuItem: MenuItem) {
    setEditingMenuItemId(menuItem.id);
    setMenuForm({
      name: menuItem.name,
      description: menuItem.description,
      price: String(menuItem.price),
      imageUrl: menuItem.imageUrl ?? "",
      vegetarian: menuItem.vegetarian,
      spicy: menuItem.spicy,
      available: menuItem.available,
      allBranches: false
    });
  }

  function resetMenuForm() {
    setEditingMenuItemId(null);
    setMenuForm(emptyMenuForm);
  }

  if (!isReady || isLoading) {
    return (
      <Shell>
        <div className="space-y-3">
          <p className="text-sm text-ink/70">Loading menu management...</p>
          {showSlowLoadNotice ? (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              This page is taking longer to load. The request is still running.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Restaurant login required"
          body="Sign in as a restaurant owner to add foods, update availability, and create new branches."
          href={`/login?redirect=${encodeURIComponent("/restaurant/menu")}`}
          action="Login as owner"
        />
      </Shell>
    );
  }

  if (session.role !== "RESTAURANT") {
    return (
      <Shell>
        <GateCard
          title="Restaurant portal only"
          body={`You are signed in as ${session.role}. Use a restaurant owner account to manage menu items and branches.`}
          href="/restaurant/register"
          action="Register restaurant"
        />
      </Shell>
    );
  }

  if (error && !dashboard) {
    return (
      <Shell>
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
      </Shell>
    );
  }

  const selectedRestaurant = dashboard?.restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null;
  const selectedMenu = selectedRestaurantId ? menuByRestaurant[selectedRestaurantId] ?? [] : [];

  return (
    <Shell>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] bg-cream p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">Branch management</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Create a new branch when you need one</h2>
            <p className="mt-4 text-sm leading-6 text-ink/68">
              Branch creation is now on demand. Open the branch modal only when you want to register another location.
            </p>
            <button
              type="button"
              onClick={() => setShowBranchModal(true)}
              className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream"
            >
              Create branch
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-olive">Menu management</p>
                <h2 className="mt-2 text-3xl font-semibold text-ink">Register foods manually</h2>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-semibold text-olive">
                <Link href="/restaurant/dashboard">Back to dashboard</Link>
                <Link href="/restaurant/register">Register another restaurant</Link>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/65">
              New dishes can stay branch-specific or be pushed to every branch in the same brand. Existing dishes can also be edited in place.
            </p>
          </div>
        </div>

        {dashboard?.restaurants.length ? (
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              {dashboard.restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => setSelectedRestaurantId(restaurant.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedRestaurantId === restaurant.id
                      ? "bg-ink text-cream"
                      : "border border-ink/15 bg-cream text-ink"
                  }`}
                >
                  {restaurant.brandName && restaurant.brandName !== restaurant.name
                    ? `${restaurant.brandName} • ${restaurant.name}`
                    : restaurant.name}
                </button>
              ))}
            </div>

            {selectedRestaurant ? (
              <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] bg-cream p-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-olive">
                    {editingMenuItemId === null ? "Add new food" : "Edit food"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">{selectedRestaurant.name}</h3>
                  <div className="mt-6 grid gap-4">
                    <Field label="Food name" value={menuForm.name} onChange={(value) => setMenuForm({ ...menuForm, name: value })} />
                    <AreaField
                      label="Description"
                      value={menuForm.description}
                      onChange={(value) => setMenuForm({ ...menuForm, description: value })}
                    />
                    <Field label="Price (gh₵)" value={menuForm.price} onChange={(value) => setMenuForm({ ...menuForm, price: value })} />
                    <div className="block">
                      <span className="mb-2 block text-sm font-medium text-ink/70">Menu image</span>
                      <div className="rounded-2xl border border-ink/10 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream">
                            {isUploadingImage ? "Uploading..." : "Upload from device"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={handleImageFileChange}
                              disabled={isUploadingImage}
                            />
                          </label>
                          <span className="text-sm text-ink/60">
                            JPG, PNG, WEBP, or GIF. We will store it in Cloudinary.
                          </span>
                        </div>
                        <div className="mt-4">
                          <Field
                            label="Image URL"
                            value={menuForm.imageUrl}
                            onChange={(value) => setMenuForm({ ...menuForm, imageUrl: value })}
                          />
                        </div>
                        <p className="mt-2 text-xs text-ink/55">
                          You can upload a file or paste an existing hosted image URL.
                        </p>
                        {menuForm.imageUrl ? (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
                            <img src={menuForm.imageUrl} alt="Menu item preview" className="h-40 w-full object-cover" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <ToggleField
                        label="Available"
                        checked={menuForm.available}
                        onChange={(checked) => setMenuForm({ ...menuForm, available: checked })}
                      />
                      <ToggleField
                        label="Vegetarian"
                        checked={menuForm.vegetarian}
                        onChange={(checked) => setMenuForm({ ...menuForm, vegetarian: checked })}
                      />
                      <ToggleField
                        label="Spicy"
                        checked={menuForm.spicy}
                        onChange={(checked) => setMenuForm({ ...menuForm, spicy: checked })}
                      />
                    </div>
                    <ToggleField
                      label={
                        editingMenuItemId === null
                          ? "Make this dish available in all branches"
                          : "Apply changes to matching dishes in all branches"
                      }
                      checked={menuForm.allBranches}
                      onChange={(checked) => setMenuForm({ ...menuForm, allBranches: checked })}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void (editingMenuItemId === null ? handleCreateMenuItem() : handleUpdateMenuItem())}
                        disabled={activeMenuItemId !== null || !menuForm.name || !menuForm.description || !menuForm.price}
                        className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {activeMenuItemId !== null
                          ? "Saving..."
                          : editingMenuItemId === null
                            ? "Add food to menu"
                            : "Save changes"}
                      </button>
                      {editingMenuItemId !== null ? (
                        <button
                          type="button"
                          onClick={resetMenuForm}
                          className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-ink/10 bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-olive">Current menu</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">Items for {selectedRestaurant.name}</h3>
                  <div className="mt-6 space-y-4">
                    {isMenuLoading ? (
                      <p className="text-sm text-ink/65">Loading menu...</p>
                    ) : selectedMenu.length ? (
                      selectedMenu.map((item) => (
                        <article key={item.id} className="rounded-[24px] border border-ink/10 bg-cream px-5 py-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h4 className="text-xl font-semibold text-ink">{item.name}</h4>
                              <p className="mt-2 text-sm leading-6 text-ink/68">{item.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-olive">
                                <span>{formatCurrency(item.price)}</span>
                                <span>{item.available ? "Available" : "Hidden from customers"}</span>
                                {item.vegetarian ? <span>Vegetarian</span> : null}
                                {item.spicy ? <span>Spicy</span> : null}
                              </div>
                              <p className="mt-3 text-xs text-ink/50">
                                {item.imageUrl ? `Image source: ${item.imageUrl}` : "No image yet. Upload a file or paste a hosted URL."}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink"
                              >
                                Edit item
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleAvailabilityToggle(item)}
                                disabled={activeMenuItemId === item.id}
                                className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                              >
                                {activeMenuItemId === item.id
                                  ? "Updating..."
                                  : item.available
                                    ? "Hide item"
                                    : "Make available"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
                        No foods have been added for this restaurant yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
            Register a restaurant first before adding menu items.
          </p>
        )}
      </section>

      {showBranchModal ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/55 px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex min-h-full items-start justify-center">
            <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-soft sm:p-8 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-olive">Create branch</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Add a new branch and set its location</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBranchModal(false)}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Brand name" value={branchForm.brandName} onChange={(value) => setBranchForm({ ...branchForm, brandName: value })} />
              <Field label="Branch name" value={branchForm.branchName} onChange={(value) => setBranchForm({ ...branchForm, branchName: value })} />
              <AreaField label="Description" value={branchForm.description} onChange={(value) => setBranchForm({ ...branchForm, description: value })} />
              <Field label="Cuisine" value={branchForm.cuisine} onChange={(value) => setBranchForm({ ...branchForm, cuisine: value })} />
              <div className="sm:col-span-2">
                <LocationPicker
                  title="Branch location"
                  description="Choose the branch location from the map, search by address, or use your current position."
                  value={branchLocation}
                  onChange={(nextLocation) => {
                    setBranchLocation(nextLocation);
                    setBranchForm((current) => ({
                      ...current,
                      address: nextLocation.address,
                      city: nextLocation.city || current.city
                    }));
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateBranch()}
                  disabled={
                    isCreatingBranch ||
                    !branchForm.brandName ||
                    !branchForm.branchName ||
                    !branchForm.description ||
                    !branchForm.cuisine ||
                    !branchLocation.address ||
                    !branchLocation.city
                  }
                  className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream disabled:opacity-60"
                >
                  {isCreatingBranch ? "Creating branch..." : "Create branch"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Restaurant menu</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Manage menu items for each branch</h1>
      </div>
      {children}
    </main>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-ink/10 bg-white/90 p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold text-ink">{props.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">{props.body}</p>
      <Link
        href={props.href}
        className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
      >
        {props.action}
      </Link>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/70">{props.label}</span>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none"
      />
    </label>
  );
}

function AreaField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/70">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none"
      />
    </label>
  );
}

function ToggleField(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}
