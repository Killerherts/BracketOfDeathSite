import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '../hooks/useApi';
import apiClient from '../services/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { TournamentInput } from '../types/api';

const TournamentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TournamentInput>({
    date: '',
    bodNumber: 0,
    format: 'Mixed',
    location: '',
    advancementCriteria: '',
    notes: '',
    photoAlbums: '',
  });

  const { mutate: createTournament, loading, error } = useMutation(
    (data: TournamentInput) => apiClient.createTournament(data),
    {
      onSuccess: (data) => {
        navigate('/tournaments');
      },
      onError: (error) => {
        console.error('Failed to create tournament:', error);
      }
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value)) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTournament(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Tournament</h1>
          <p className="text-gray-600">Add a new tournament to the system</p>
        </div>
        <button
          onClick={() => navigate('/tournaments')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BOD Number *
                </label>
                <input
                  type="number"
                  name="bodNumber"
                  value={formData.bodNumber}
                  onChange={handleChange}
                  required
                  min="1"
                  className="input"
                  placeholder="Enter BOD number"
                />
              </div>
            </div>
          </div>

          {/* Format and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format *
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                required
                className="select"
              >
                <option value="Mixed">Mixed</option>
                <option value="M">Men's</option>
                <option value="W">Women's</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="input"
                placeholder="Enter tournament location"
              />
            </div>
          </div>

          {/* Advancement Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advancement Criteria *
            </label>
            <textarea
              name="advancementCriteria"
              value={formData.advancementCriteria}
              onChange={handleChange}
              required
              rows={3}
              className="input"
              placeholder="Describe how players advance through the tournament..."
            />
          </div>

          {/* Optional Fields */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                  placeholder="Any additional notes about the tournament..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Albums
                </label>
                <input
                  type="text"
                  name="photoAlbums"
                  value={formData.photoAlbums || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="Links to photo albums (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error creating tournament</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/tournaments')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.date || !formData.bodNumber || !formData.location || !formData.advancementCriteria}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Tournament'
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Preview */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">
                #{formData.bodNumber || '?'}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {formData.format === 'M' ? "Men's" : 
                 formData.format === 'W' ? "Women's" : 
                 "Mixed"} Tournament
              </h4>
              <p className="text-sm text-gray-600">
                {formData.location || 'Location not specified'}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {formData.date ? new Date(formData.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not specified'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">BOD Number:</span>
              <span className="font-medium">{formData.bodNumber || 'Not specified'}</span>
            </div>
            {formData.notes && (
              <div className="flex items-start space-x-2">
                <span className="text-gray-600">Notes:</span>
                <span className="font-medium">{formData.notes}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TournamentCreate;