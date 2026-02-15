import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Input = ({ label, className, ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-muted">{label}</label>}
      <motion.div
        initial={{ opacity: 0.8 }}
        whileFocus={{ opacity: 1, scale: 1.01 }}
        className="relative"
      >
        <input
          className={cn(
            'w-full bg-surface/50 border border-white/10 rounded-md px-4 py-3 text-text placeholder-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300',
            className
          )}
          {...props}
        />
      </motion.div>
    </div>
  );
};

export default Input;
