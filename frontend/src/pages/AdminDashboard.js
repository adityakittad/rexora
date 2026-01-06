import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Upload, Trash2, LogOut, Edit, X, Settings, Image, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Project',
    video: null,
    thumbnail: null
  });
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: ''
  });
  
  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState({
    total_projects: 0,
    active_services: 0,
    recent_projects: 0
  });
  
  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    client_name: '',
    review_text: '',
    star_rating: 5
  });
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({
    client_name: '',
    review_text: '',
    star_rating: 5
  });
  
  // Site Settings State
  const [siteSettings, setSiteSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    logo: '',
    hero_title: '',
    hero_tagline: '',
    about_title: '',
    about_text_1: '',
    about_text_2: '',
    services: [],
    stats: [],
    instagram_url: '',
    contact_email: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchProjects();
    fetchSiteSettings();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
      setSettingsForm(response.data);
      setLogoPreview(response.data.logo);
    } catch (error) {
      console.error('Error fetching site settings:', error);
      toast.error('Failed to fetch site settings');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      e.target.value = '';
      return;
    }
    
    // Check file size (10MB limit)
    const MAX_SIZE_MB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_SIZE_MB) {
      toast.error(`Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB. Please compress your video and try again.`);
      e.target.value = '';
      return;
    }
    
    setFormData({ ...formData, video: file });
    toast.success(`Video selected: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      e.target.value = '';
      return;
    }
    
    // Check file size (5MB limit for images)
    const MAX_SIZE_MB = 5;
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_SIZE_MB) {
      toast.error(`Image file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    
    setFormData({ ...formData, thumbnail: file });
    toast.success(`Thumbnail selected: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.video) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('admin_token');
    
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('video', formData.video);
    if (formData.thumbnail) {
      uploadData.append('thumbnail', formData.thumbnail);
    }


    try {
      await axios.post(`${API}/projects`, uploadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Project uploaded successfully!');
      setFormData({ title: '', description: '', category: 'Project', video: null, thumbnail: null });
      document.getElementById('video-input').value = '';
      const thumbnailInput = document.getElementById('thumbnail-input');
      if (thumbnailInput) thumbnailInput.value = '';
      fetchProjects();
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error uploading project:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to upload project';
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setEditForm({
      title: project.title,
      description: project.description,
      category: project.category
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      await axios.put(`${API}/projects/${editingProject.id}`, editForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Project updated successfully!');
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    const token = localStorage.getItem('admin_token');
    
    try {
      await axios.delete(`${API}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Project deleted successfully');
      fetchProjects();
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  // Site Settings Functions
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      e.target.value = '';
      return;
    }
    
    const MAX_SIZE_MB = 2;
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_SIZE_MB) {
      toast.error(`Logo file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    toast.success('Logo selected. Click "Save Site Settings" to apply changes.');
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    try {
      const response = await axios.post(`${API}/site-settings/logo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSettingsForm({ ...settingsForm, logo: response.data.logo });
      setLogoFile(null);
      toast.success('Logo uploaded successfully!');
      return response.data.logo;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      throw error;
    }
  };

  const handleAddService = () => {
    setSettingsForm({
      ...settingsForm,
      services: [...settingsForm.services, { icon: 'Video', title: '', description: '' }]
    });
  };

  const handleRemoveService = (index) => {
    const newServices = settingsForm.services.filter((_, i) => i !== index);
    setSettingsForm({ ...settingsForm, services: newServices });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...settingsForm.services];
    newServices[index][field] = value;
    setSettingsForm({ ...settingsForm, services: newServices });
  };

  const handleAddStat = () => {
    setSettingsForm({
      ...settingsForm,
      stats: [...settingsForm.stats, { label: '', value: '', icon: '🎬' }]
    });
  };

  const handleRemoveStat = (index) => {
    const newStats = settingsForm.stats.filter((_, i) => i !== index);
    setSettingsForm({ ...settingsForm, stats: newStats });
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...settingsForm.stats];
    newStats[index][field] = value;
    setSettingsForm({ ...settingsForm, stats: newStats });
  };

  const handleSaveSiteSettings = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      // Upload logo first if there's a new one
      let logoUrl = settingsForm.logo;
      if (logoFile) {
        logoUrl = await handleUploadLogo();
      }
      
      // Save all settings
      const updateData = {
        ...settingsForm,
        logo: logoUrl
      };
      
      await axios.put(`${API}/site-settings`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Site settings saved successfully! Logo will be visible on the homepage (refresh homepage if already open).');
      fetchSiteSettings();
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast.error('Failed to save site settings');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed] p-6">
      <Toaster position="top-center" theme="dark" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[rgba(255,255,255,0.08)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            data-testid="dashboard-tab"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'projects'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            data-testid="projects-tab"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Projects
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
            data-testid="settings-tab"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Site Settings
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Projects */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[rgba(255,255,255,0.08)]" data-testid="stat-total-projects">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#a1a1aa] text-sm font-medium">Total Projects</h3>
                    <Upload className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="text-4xl font-bold text-white">{dashboardStats.total_projects}</p>
                  <p className="text-sm text-[#a1a1aa] mt-2">Projects uploaded</p>
                </div>

                {/* Active Services */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[rgba(255,255,255,0.08)]" data-testid="stat-active-services">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#a1a1aa] text-sm font-medium">Active Services</h3>
                    <Settings className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="text-4xl font-bold text-white">{dashboardStats.active_services}</p>
                  <p className="text-sm text-[#a1a1aa] mt-2">Services available</p>
                </div>

                {/* Recent Projects */}
                <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[rgba(255,255,255,0.08)]" data-testid="stat-recent-projects">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#a1a1aa] text-sm font-medium">Recent Projects</h3>
                    <Image className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="text-4xl font-bold text-white">{dashboardStats.recent_projects}</p>
                  <p className="text-sm text-[#a1a1aa] mt-2">Last 7 days</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('projects')}
                  className="flex items-center gap-4 p-6 bg-[#1a1a1a] hover:bg-[#252525] border border-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
                  data-testid="quick-action-projects"
                >
                  <Upload className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Manage Projects</h3>
                    <p className="text-sm text-[#a1a1aa]">Upload and edit your portfolio projects</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-4 p-6 bg-[#1a1a1a] hover:bg-[#252525] border border-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
                  data-testid="quick-action-settings"
                >
                  <Settings className="w-8 h-8 text-[#D4AF37]" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Site Settings</h3>
                    <p className="text-sm text-[#a1a1aa]">Update services, content, and contact info</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            {/* Upload Form */}
            <motion.div
              className="glass-card p-8 rounded-lg mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid="upload-form"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6 text-[#D4AF37]" />
                Upload New Project
              </h2>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Project Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                required
                data-testid="project-title-input"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                data-testid="project-description-input"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                data-testid="project-category-input"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Video File (MP4) *</label>
              <input
                id="video-input"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#D4AF37] file:text-black file:cursor-pointer hover:file:bg-[#c9a332]"
                required
                data-testid="project-video-input"
              />
              <p className="text-xs text-[#a1a1aa] mt-2">
                Maximum file size: 10MB. For larger videos, please compress them before uploading.
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Thumbnail Image (Optional)</label>
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#D4AF37] file:text-black file:cursor-pointer hover:file:bg-[#c9a332]"
                data-testid="project-thumbnail-input"
              />
              <p className="text-xs text-[#a1a1aa] mt-2">
                Upload a custom thumbnail image for your video. Maximum file size: 5MB. Recommended size: 800x1000px (4:5 ratio).
              </p>
            </div>
            
            <button
              type="submit"
              disabled={uploading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="upload-submit-button"
            >
              {uploading ? 'Uploading...' : 'Upload Project'}
            </button>
          </form>
        </motion.div>

        {/* Projects List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Manage Projects ({projects.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="glass-card p-6 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`project-item-${index}`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2">{project.title}</h3>
                  <p className="text-sm text-[#D4AF37] mb-2">{project.category}</p>
                  {project.description && (
                    <p className="text-sm text-[#a1a1aa]">{project.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c9a332] text-black rounded-lg transition-colors"
                    data-testid={`edit-project-${index}`}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    data-testid={`delete-project-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {projects.length === 0 && (
            <div className="text-center py-12 text-[#a1a1aa]">
              <p>No projects uploaded yet. Upload your first project above!</p>
            </div>
          )}
        </div>
          </>
        )}

        {/* Site Settings Tab */}
        {activeTab === 'settings' && siteSettings && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Logo Section */}
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Image className="w-6 h-6 text-[#D4AF37]" />
                Site Logo
              </h2>
              
              <div className="space-y-4">
                {logoPreview && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-32 object-contain bg-white/5 p-4 rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Upload New Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#D4AF37] file:text-black file:cursor-pointer hover:file:bg-[#c9a332]"
                  />
                  <p className="text-xs text-[#a1a1aa] mt-2">
                    Maximum file size: 2MB. Recommended: PNG or SVG with transparent background.
                  </p>
                  <p className="text-xs text-[#D4AF37] mt-2 font-medium">
                    ℹ️ After saving, the logo will appear in the navigation bar. Open homepage in a new tab or refresh it to see the updated logo.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Hero Section</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Hero Title</label>
                  <input
                    type="text"
                    value={settingsForm.hero_title}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Hero Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.hero_tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_tagline: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">About Section</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">About Title</label>
                  <input
                    type="text"
                    value={settingsForm.about_title}
                    onChange={(e) => setSettingsForm({ ...settingsForm, about_title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">About Paragraph 1</label>
                  <textarea
                    value={settingsForm.about_text_1}
                    onChange={(e) => setSettingsForm({ ...settingsForm, about_text_1: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">About Paragraph 2</label>
                  <textarea
                    value={settingsForm.about_text_2}
                    onChange={(e) => setSettingsForm({ ...settingsForm, about_text_2: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="glass-card p-8 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Stats</h2>
                <button
                  onClick={handleAddStat}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c9a332] text-black rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Stat
                </button>
              </div>
              
              <div className="space-y-4">
                {settingsForm.stats.map((stat, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#1a1a1a] rounded-lg">
                    <input
                      type="text"
                      placeholder="Icon (emoji)"
                      value={stat.icon}
                      onChange={(e) => handleStatChange(index, 'icon', e.target.value)}
                      className="px-4 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., 500+)"
                      value={stat.value}
                      onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                      className="px-4 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      value={stat.label}
                      onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                      className="px-4 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => handleRemoveStat(index)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div className="glass-card p-8 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Services</h2>
                <button
                  onClick={handleAddService}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c9a332] text-black rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>
              </div>
              
              <div className="space-y-4">
                {settingsForm.services.map((service, index) => (
                  <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Service {index + 1}</h3>
                      <button
                        onClick={() => handleRemoveService(index)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[#a1a1aa] mb-1">Icon Name</label>
                        <select
                          value={service.icon}
                          onChange={(e) => handleServiceChange(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                        >
                          <option value="Video">Video</option>
                          <option value="Image">Image</option>
                          <option value="Zap">Zap</option>
                          <option value="Play">Play</option>
                          <option value="Sparkles">Sparkles</option>
                          <option value="Film">Film</option>
                          <option value="Wand2">Wand2</option>
                          <option value="Camera">Camera</option>
                          <option value="Edit">Edit</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs text-[#a1a1aa] mb-1">Title</label>
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                          placeholder="Service Title"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#a1a1aa] mb-1">Description</label>
                      <textarea
                        value={service.description}
                        onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] rounded text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                        placeholder="Service Description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="glass-card p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={settingsForm.contact_email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Instagram URL</label>
                  <input
                    type="url"
                    value={settingsForm.instagram_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSiteSettings}
                className="px-8 py-4 bg-[#D4AF37] hover:bg-[#c9a332] text-black font-bold rounded-lg transition-colors"
              >
                Save Site Settings
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingProject(null)}
            data-testid="edit-modal-overlay"
          >
            <motion.div
              className="glass-card p-8 rounded-lg max-w-2xl w-full relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="edit-modal"
            >
              <button
                onClick={() => setEditingProject(null)}
                className="absolute top-4 right-4 text-[#a1a1aa] hover:text-white transition-colors"
                data-testid="close-edit-button"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <Edit className="w-8 h-8 text-[#D4AF37]" />
                <h2 className="text-2xl font-bold">Edit Project</h2>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6" data-testid="edit-form">
                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    required
                    data-testid="edit-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                    data-testid="edit-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#a1a1aa] mb-2">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                    data-testid="edit-category-input"
                  />
                </div>

                <p className="text-sm text-[#a1a1aa] italic">Note: Video file cannot be changed. Only metadata can be updated.</p>

                <button
                  type="submit"
                  className="w-full btn-primary"
                  data-testid="edit-submit-button"
                >
                  Update Project
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
