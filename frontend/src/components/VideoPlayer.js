import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function VideoPlayer({ videoData, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        data-testid="video-player-overlay"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-[#D4AF37] transition-colors"
          data-testid="close-video-button"
        >
          <X className="w-8 h-8" />
        </button>

        <motion.div
          className="w-full max-w-6xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <video
            controls
            autoPlay
            className="w-full rounded-lg"
            data-testid="video-element"
          >
            <source src={`data:video/mp4;base64,${videoData}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}