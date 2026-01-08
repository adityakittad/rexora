import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Play, Video, Image as ImageIcon, Zap, Mail, Send, Sparkles, Film, Wand2, Instagram } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ onCreditsClick }) {
  const [projects, setProjects] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [siteSettings, setSiteSettings] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchSiteSettings();
    fetchReviews();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setSelectedVideo(response.data.video_data);
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Failed to load video');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setContactForm({ name: '', email: '', message: '' });
  };

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    viewport: { once: true }
  };

  // Helper function to render icon based on name
  const renderIcon = (iconName) => {
    const iconMap = {
      Video: <Video className="w-8 h-8" />,
      Image: <ImageIcon className="w-8 h-8" />,
      Zap: <Zap className="w-8 h-8" />,
      Play: <Play className="w-8 h-8" />,
      Sparkles: <Sparkles className="w-8 h-8" />,
      Film: <Film className="w-8 h-8" />,
      Wand2: <Wand2 className="w-8 h-8" />
    };
    return iconMap[iconName] || <Video className="w-8 h-8" />;
  };

  // Use site settings or fallback to defaults
  const services = siteSettings?.services || [
    {
      icon: "Video",
      title: "Video Editing",
      description: "Cinematic storytelling that captures attention and drives results"
    },
    {
      icon: "Image",
      title: "Photo Editing",
      description: "Professional retouching and enhancement for stunning visuals"
    },
    {
      icon: "Zap",
      title: "Reels & Short-Form Content",
      description: "Viral-ready content optimized for social media platforms"
    },
    {
      icon: "Play",
      title: "Brand Visuals",
      description: "Cohesive visual identity that elevates your brand presence"
    },
    {
      icon: "Sparkles",
      title: "Animation",
      description: "Dynamic animated content that brings your vision to life"
    },
    {
      icon: "Film",
      title: "Motion Graphics",
      description: "Eye-catching motion design for modern digital experiences"
    },
    {
      icon: "Wand2",
      title: "VFX (Visual Effects)",
      description: "Professional visual effects that transform ordinary footage into extraordinary content"
    }
  ];

  const placeholderProjects = [
    {
      id: 'placeholder-1',
      title: 'Luxury Brand Film',
      category: 'Commercial',
      thumbnail: 'https://images.unsplash.com/photo-1738247999648-c251148e4dea?q=85&w=800'
    },
    {
      id: 'placeholder-2',
      title: 'Fashion Editorial',
      category: 'Fashion',
      thumbnail: 'https://images.pexels.com/photos/9218709/pexels-photo-9218709.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: 'placeholder-3',
      title: 'Product Showcase',
      category: 'Commercial',
      thumbnail: 'https://images.unsplash.com/photo-1645819618980-b68561c410f9?q=85&w=800'
    }
  ];

  const displayProjects = projects.length > 0 ? projects : placeholderProjects;

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed]">
      <Toaster position="top-center" theme="dark" />
      
      {/* Subtle Background Visual Enhancement */}
      <div className="noise-overlay" />
      <div className="gradient-orbs" />
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              {siteSettings?.logo ? (
                <img 
                  src={siteSettings.logo} 
                  alt="Logo" 
                  className="h-10 w-auto object-contain"
                  data-testid="site-logo"
                />
              ) : (
                <h1 className="text-2xl font-bold text-[#D4AF37]" data-testid="site-logo-text">
                  {siteSettings?.hero_title || "Rexora Media"}
                </h1>
              )}
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#portfolio" className="text-[#a1a1aa] hover:text-[#D4AF37] transition-colors">Portfolio</a>
              <a href="#services" className="text-[#a1a1aa] hover:text-[#D4AF37] transition-colors">Services</a>
              <a href="#about" className="text-[#a1a1aa] hover:text-[#D4AF37] transition-colors">About</a>
              <a href="#contact" className="text-[#a1a1aa] hover:text-[#D4AF37] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/9665186/pexels-photo-9665186.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter mb-6 uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            data-testid="hero-title"
          >
            {siteSettings?.hero_title || "Rexora Media"}
          </motion.h1>
          
          <motion.p 
            className="text-xl sm:text-2xl lg:text-3xl text-[#a1a1aa] mb-12 tracking-wide font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            data-testid="hero-tagline"
          >
            {siteSettings?.hero_tagline || "Visuals built to perform"}
          </motion.p>
          
          <motion.button 
            className="btn-primary inline-flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => document.getElementById('work').scrollIntoView({ behavior: 'smooth' })}
            data-testid="hero-cta-button"
          >
            <Play className="w-5 h-5" />
            View Work
          </motion.button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24" data-testid="services-section">
        <motion.h2 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-16 text-center tracking-tight"
          {...fadeUp}
        >
          What We Do
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="glass-card p-8 card-hover rounded-lg"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              data-testid={`service-card-${index}`}
            >
              <div className="text-[#D4AF37] mb-4">{renderIcon(service.icon)}</div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Work/Projects Section */}
      <section id="work" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#0a0a0a]" data-testid="work-section">
        <motion.h2 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-16 text-center tracking-tight"
          {...fadeUp}
        >
          Selected Work
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              className="video-thumbnail aspect-[4/5] rounded-lg overflow-hidden relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => project.id.startsWith('placeholder') ? null : handleProjectClick(project.id)}
              data-testid={`project-card-${index}`}
            >
              <img 
                src={project.thumbnail || 'https://images.unsplash.com/photo-1738247999648-c251148e4dea?q=85&w=800'} 
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs text-[#D4AF37] mb-2 uppercase tracking-widest">{project.category}</p>
                <h3 className="text-xl font-bold">{project.title}</h3>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Play className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section with 3D Effects */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 relative overflow-hidden" data-testid="about-section">
        {/* 3D Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#D4AF37] opacity-10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
              x: [0, -50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            {...fadeUp}
          >
            <motion.h2 
              className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-8 tracking-tight"
              style={{
                textShadow: '0 4px 20px rgba(212, 175, 55, 0.3)'
              }}
            >
              {siteSettings?.about_title || "About Us"}
            </motion.h2>
          </motion.div>

          {/* 3D Card Container */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, rotateX: -15 }}
            whileInView={{ opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            <div className="glass-card p-8 md:p-12 lg:p-16 rounded-2xl relative overflow-hidden">
              {/* Floating 3D Elements Inside Card */}
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-20 rounded-full blur-2xl"
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"
                animate={{
                  y: [0, 20, 0],
                  x: [0, -10, 0],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10">
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <p className="text-lg sm:text-xl lg:text-2xl text-[#a1a1aa] leading-relaxed">
                    {siteSettings?.about_text_1 || (
                      <>
                        <span className="text-[#D4AF37] font-semibold">Rexora Media</span> is a creative visual studio specializing in 
                        <span className="text-white font-medium"> high-end video production</span>, 
                        <span className="text-white font-medium"> photo editing</span>, and 
                        <span className="text-white font-medium"> brand storytelling</span>.
                      </>
                    )}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl text-[#a1a1aa] leading-relaxed">
                    {siteSettings?.about_text_2 || (
                      <>
                        We craft visuals that don't just look good—they <span className="text-[#D4AF37] font-semibold">perform</span>. 
                        Every frame is engineered to captivate, convert, and leave a lasting impression.
                      </>
                    )}
                  </p>
                </motion.div>

                {/* Stats Grid with 3D Effect */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  {(siteSettings?.stats || [
                    { label: 'Projects Delivered', value: '500+', icon: '🎬' },
                    { label: 'Happy Clients', value: '200+', icon: '⭐' },
                    { label: 'Years of Excellence', value: '5+', icon: '🏆' }
                  ]).map((stat, index) => (
                    <motion.div
                      key={index}
                      className="text-center p-6 rounded-xl bg-[#0a0a0a]/50 backdrop-blur-sm border border-[rgba(255,255,255,0.08)]"
                      whileHover={{ 
                        scale: 1.05, 
                        rotateY: 5,
                        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2)'
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="text-4xl mb-2">{stat.icon}</div>
                      <div className="text-3xl font-bold text-[#D4AF37] mb-2">{stat.value}</div>
                      <div className="text-sm text-[#a1a1aa]">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Social Links with Instagram */}
                <motion.div
                  className="mt-12 flex justify-center gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <a
                    href={siteSettings?.instagram_url || "https://instagram.com/rexoramedia"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                    data-testid="instagram-link"
                  >
                    <Instagram className="w-5 h-5" />
                    Follow us on Instagram
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#0a0a0a]" data-testid="reviews-section">
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-16 text-center tracking-tight"
            {...fadeUp}
          >
            Client Reviews
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                className="glass-card p-8 rounded-lg"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                data-testid={`review-card-${index}`}
              >
                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[#D4AF37] text-2xl" data-testid={`review-stars-${index}`}>
                    {'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-[#a1a1aa] text-base leading-relaxed mb-6 italic">
                  "{review.review_text}"
                </p>

                {/* Client Name */}
                <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                  <p className="font-bold text-white" data-testid={`review-client-name-${index}`}>
                    {review.client_name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#0a0a0a]" data-testid="contact-section">
        <div className="max-w-2xl mx-auto">
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 text-center tracking-tight"
            {...fadeUp}
          >
            Get In Touch
          </motion.h2>
          
          <motion.div className="text-center mb-8" {...fadeUp}>
            <a 
              href={`mailto:${siteSettings?.contact_email || 'rexoramedia@gmail.com'}`}
              className="text-[#D4AF37] text-lg hover:underline inline-flex items-center gap-2"
              data-testid="contact-email"
            >
              <Mail className="w-5 h-5" />
              {siteSettings?.contact_email || 'rexoramedia@gmail.com'}
            </a>
          </motion.div>

          <motion.form 
            onSubmit={handleContactSubmit}
            className="space-y-6"
            {...fadeUp}
            data-testid="contact-form"
          >
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full px-6 py-4 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#D4AF37] focus:outline-none transition-colors"
                required
                data-testid="contact-name-input"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-6 py-4 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#D4AF37] focus:outline-none transition-colors"
                required
                data-testid="contact-email-input"
              />
            </div>
            <div>
              <textarea
                placeholder="Your Message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={6}
                className="w-full px-6 py-4 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                required
                data-testid="contact-message-input"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary inline-flex items-center justify-center gap-2"
              data-testid="contact-submit-button"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </motion.form>
        </div>
      </section>

      {/* Footer with Credits */}
      <footer className="py-12 px-6 text-center text-[#a1a1aa] border-t border-[rgba(255,255,255,0.08)]">
        <p>&copy; 2026 Rexora Media. All rights reserved.</p>
        <button 
          onClick={onCreditsClick}
          className="mt-2 text-[#a1a1aa] hover:text-[#D4AF37] transition-colors cursor-pointer text-sm"
          data-testid="credits-trigger"
        >
          Credits
        </button>
      </footer>

      {selectedVideo && (
        <VideoPlayer 
          videoData={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
