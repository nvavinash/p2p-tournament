import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const LandingPage = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

  return (
    <div className="bg-background min-h-screen text-text overflow-hidden font-sans">
      
      {/* Hero Section */}
      <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />

        {/* Content */}
        <motion.div 
            style={{ y: textY }}
            className="relative z-20 text-center max-w-4xl px-4"
        >
            <motion.h1 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="text-6xl md:text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            >
                P2P BATTLEGROUND
            </motion.h1>
            <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                 className="text-xl md:text-2xl text-muted mb-10 tracking-wide"
            >
                High Stakes. Instant Payouts. No Mercy.
            </motion.p>
            <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5, delay: 0.6 }}
                 className="flex flex-col sm:flex-row gap-4 justify-center"
            >
                <Link to="/register">
                    <Button className="w-full sm:w-auto text-lg px-8 py-4">
                        JOIN THE ARENA
                    </Button>
                </Link>
                <Link to="/login">
                     <Button variant="secondary" className="w-full sm:w-auto text-lg px-8 py-4">
                        OPERATIVE LOGIN
                    </Button>
                </Link>
            </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-20 bg-background py-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
                title="INSTANT SETTLEMENT"
                description="Smart contract powered secure wallet transfers immediately after match verification."
                delay={0.2}
            />
             <FeatureCard 
                title="ANTI-CHEAT SHIELD"
                description="Advanced kernel-level telemetry analysis to ensure fair play for every operative."
                delay={0.4}
            />
             <FeatureCard 
                title="GLOBAL RANKINGS"
                description="Climb the competitive ladder and earn exclusive seasonal rewards."
                delay={0.6}
            />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="bg-surface/50 border border-white/5 p-8 rounded-2xl hover:border-primary/50 transition-colors duration-300 group"
        >
            <h3 className="text-2xl font-heading font-bold text-white mb-4 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted leading-relaxed">{description}</p>
        </motion.div>
    )
}

export default LandingPage;
