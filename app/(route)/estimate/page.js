'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export default function EstimateList() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    name: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [deleteId, setDeleteId] = useState(null);

  const fetchEstimates = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.name && { name: filters.name }),
    });

    const res = await fetch(`/api/estimate?${params}`);
    const result = await res.json();
    setEstimates(result.data || []);
    setPagination(result.pagination || {});
    setLoading(false);
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = () => {
    fetchEstimates(1); // Reset to page 1 on filter
  };

  const goToPage = (page) => {
    fetchEstimates(page);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/estimate/${deleteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEstimates((prev) => prev.filter((e) => e._id !== deleteId));
        toast.success('Estimate Deleted');
      } else {
        toast.error('Delete Failed');
      }
    } catch (error) {
      toast.error('Error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Estimates</h1>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="p-2 border rounded"
          placeholder="Start Date"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="p-2 border rounded"
          placeholder="End Date"
        />
        <input
          type="text"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
          className="p-2 border rounded"
          placeholder="Filter by Name"
        />
      </div>

      <button
        onClick={applyFilters}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>

      <Link href="/estimate/create">
        <button className="mb-6 ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Create New Estimate
        </button>
      </Link>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Code</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Country</th>
                <th className="py-2 px-4 border-b">Weight</th>
                <th className="py-2 px-4 border-b">Rate</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => (
                <tr key={estimate._id}>
                  <td className="py-2 px-4 border-b">{estimate.code}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(estimate.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">{estimate.name}</td>
                  <td className="py-2 px-4 border-b">{estimate.receiverCountry}</td>
                  <td className="py-2 px-4 border-b">{estimate.weight}</td>
                  <td className="py-2 px-4 border-b">{estimate.rate}</td>
                  <td className="py-2 px-4 border-b flex items-center space-x-3">
                    <Link href={`/estimate/${estimate.code}`}>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link href={`/edit-estimate/${estimate.code}`}>
                      <button className="text-yellow-600 hover:text-yellow-800">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={() => setDeleteId(estimate.code)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this estimate? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => goToPage(pagination.currentPage - 1)}
              className="px-4 py-2 bg-gray-300 disabled:opacity-50 rounded"
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => goToPage(pagination.currentPage + 1)}
              className="px-4 py-2 bg-gray-300 disabled:opacity-50 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
