'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewCategory({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    maxScore: '25',
    weight: '0.25',
  });

  useEffect(() => {
    if (status === 'loading') return;

    // Check for admin role using a custom property on session.user
    // Since the default Session type does not include 'role', we cast user to any
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/events/${params.id}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxScore: parseInt(formData.maxScore),
          weight: parseFloat(formData.weight),
        }),
      });

      if (response.ok) {
        router.push(`/admin/events/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePresetSelect = (preset: string) => {
    const presets = {
      'Beauty & Poise': { maxScore: '25', weight: '0.25' },
      'Intelligence & Communication': { maxScore: '25', weight: '0.25' },
      'Talent': { maxScore: '20', weight: '0.20' },
      'Personality': { maxScore: '15', weight: '0.15' },
      'Evening Gown': { maxScore: '15', weight: '0.15' },
    };

    if (preset in presets) {
      setFormData({
        name: preset,
        ...presets[preset as keyof typeof presets],
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
              <p className="text-gray-600">Add a scoring category to the pageant event</p>
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
            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Presets (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'Beauty & Poise',
                  'Intelligence & Communication',
                  'Talent',
                  'Personality',
                  'Evening Gown',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g., Beauty & Poise"
                />
              </div>

              <div>
                <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700">
                  Maximum Score *
                </label>
                <input
                  type="number"
                  id="maxScore"
                  name="maxScore"
                  required
                  min="1"
                  max="100"
                  value={formData.maxScore}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g., 25"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The highest score a judge can give for this category
                </p>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (0.0 - 1.0) *
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  required
                  min="0.01"
                  max="1.0"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g., 0.25"
                />
                <p className="mt-1 text-sm text-gray-500">
                  How much this category contributes to the final score (e.g., 0.25 = 25%)
                </p>
              </div>
            </div>

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
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
