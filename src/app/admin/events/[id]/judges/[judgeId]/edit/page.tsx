'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditJudge({ params }: { params: { id: string; judgeId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    password: '',
    updatePassword: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }

    fetchJudge();
  }, [session, status, router]);

  const fetchJudge = async () => {
    try {
      const response = await fetch(`/api/admin/events/${params.id}/judges/${params.judgeId}`);
      if (response.ok) {
        const judge = await response.json();
        setFormData({
          name: judge.name,
          role: judge.role,
          email: judge.user?.email || '',
          password: '',
          updatePassword: false,
        });
      } else {
        alert('Failed to load judge data');
        router.push(`/admin/events/${params.id}`);
      }
    } catch (error) {
      console.error('Error fetching judge:', error);
      alert('Failed to load judge data');
      router.push(`/admin/events/${params.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/events/${params.id}/judges/${params.judgeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          password: formData.password,
          updatePassword: formData.updatePassword,
        }),
      });

      if (response.ok) {
        router.push(`/admin/events/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update judge');
      }
    } catch (error) {
      console.error('Error updating judge:', error);
      alert('Failed to update judge');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const hasAccount = formData.email !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Judge</h1>
              <p className="text-gray-600">Update judge information</p>
            </div>
            <button
              onClick={() => router.push(`/admin/events/${params.id}`)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Event
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g., Prof. Elena Cruz"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">Select Role</option>
                <option value="Head Judge">Head Judge</option>
                <option value="Faculty Judge">Faculty Judge</option>
                <option value="Alumni Judge">Alumni Judge</option>
                <option value="Industry Judge">Industry Judge</option>
                <option value="Guest Judge">Guest Judge</option>
              </select>
            </div>

            {hasAccount && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm px-3 py-2 border"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Email cannot be changed for existing accounts
                  </p>
                </div>

                <div className="flex items-center mb-4">
                  <input
                    id="updatePassword"
                    name="updatePassword"
                    type="checkbox"
                    checked={formData.updatePassword}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="updatePassword" className="ml-2 block text-sm text-gray-900">
                    Update password for this judge
                  </label>
                </div>

                {formData.updatePassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required={formData.updatePassword}
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Enter new password for judge"
                      minLength={6}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum 6 characters. Leave blank to keep current password.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!hasAccount && (
              <div className="border-t pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    This judge does not have a login account. They were added as a placeholder only.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/admin/events/${params.id}`)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

