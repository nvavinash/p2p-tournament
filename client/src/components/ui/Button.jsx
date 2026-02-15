import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming you have the cn utility from earlier

const Button = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = 'px-6 py-2 rounded-md font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:shadow-[0_0_25px_rgba(249,115,22,0.7)]',
    secondary: 'bg-surface text-primary border border-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-white/5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
