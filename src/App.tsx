import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  Globe,
  Navigation,
  BookOpen,
  LogIn
} from 'lucide-react';
import { 
  SCHOOL_NAME, 
  NAV_LINKS, 
  COURSES, 
  FEATURES, 
  CONTACT_INFO,
  LOGO_URL 
} from './constants';
import { useCourses } from './hooks';

// --- Header Component ---
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`glass-nav ${scrolled ? 'py-2 shadow-xl' : 'py-4'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center text-primary-content">
        <a href="#home" className="flex items-center gap-2 group">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
            <img src={LOGO_URL} alt={SCHOOL_NAME} className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800">
            {SCHOOL_NAME}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <a 
              key={link.label} 
              href={link.href} 
              className="font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a 
            href="/admin" 
            className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-medium transition-colors"
            title="Admin Login"
          >
            <LogIn size={18} />
            <span>Admin</span>
          </a>
          <a 
            href="#contact" 
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Apply Now
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-brand-600 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {NAV_LINKS.map(link => (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className="text-lg font-medium text-slate-700"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a 
                href="/admin" 
                className="text-lg font-medium text-slate-700 flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <LogIn size={18} />
                Admin Login
              </a>
              <a 
                href="#contact" 
                className="bg-brand-600 text-white text-center py-3 rounded-xl font-bold mt-2"
                onClick={() => setIsOpen(false)}
              >
                Apply Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Section Heading ---
const SectionHeading: React.FC<{ subtitle: string, title: string, centered?: boolean }> = ({ subtitle, title, centered = true }) => (
  <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
    <span className="text-brand-600 font-bold tracking-widest uppercase text-sm block mb-3 font-display">
      {subtitle}
    </span>
    <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 leading-tight">
      {title}
    </h2>
  </div>
);

// --- Hero Section ---
const Hero: React.FC = () => (
  <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 hero-gradient relative overflow-hidden">
    <div className="absolute top-1/4 -right-20 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
    <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -z-10" />
    
    <div className="container mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 text-center lg:text-left"
      >
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
          <Navigation size={14} /> NEW SEMESTER REGISTRATION OPEN
        </span>
        <h1 className="text-4xl lg:text-6xl font-display font-extrabold text-slate-900 leading-[1.1] mb-6">
          Unlock Your Future with <span className="text-brand-600 italic">Language</span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
          Embark on a transformative journey with {SCHOOL_NAME}. Whether it's mastering English for your career or Thai for your new life, we're here to guide you every step of the way.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
          <a href="#courses" className="w-full sm:w-auto bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
            Explore Courses <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#about" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            Learn More
          </a>
        </div>
        <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <img 
                key={i} 
                className="w-10 h-10 rounded-full border-2 border-white grayscale hover:grayscale-0 transition-all cursor-pointer"
                src={`https://i.pravatar.cc/150?u=${i + 12}`} 
                alt="Student" 
              />
            ))}
          </div>
          <p className="text-sm text-slate-500 font-medium">Joined by <span className="text-slate-900 font-bold">500+ students</span> this year</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 relative"
      >
        <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700 border-8 border-white">
          <img 
            src="https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=1000" 
            alt="Students learning" 
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

// --- Course Card ---
const CourseCard: React.FC<{ course: any, onSeeDetails: (course: any) => void }> = ({ course, onSeeDetails }) => (
  <div className={`rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-500 group ${course.borderColor}`}>
    <div className="h-56 overflow-hidden relative">
      <img src={course.image} alt={course.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute top-4 left-4">
        <span className={`${course.color} ${course.textColor} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md`}>
          {course.id.toUpperCase()}
        </span>
      </div>
    </div>
    <div className="p-8 bg-white">
      <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">{course.name}</h3>
      <p className="text-slate-600 mb-6 line-clamp-2">{course.description}</p>
      
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {course.durations.map((d: string) => (
            <span key={d} className="bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1 rounded-lg text-sm font-medium">
              {d} Option
            </span>
          ))}
        </div>
        <ul className="space-y-2">
          {course.benefits.slice(0, 3).map((benefit: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={() => onSeeDetails(course)}
        className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-brand-600 transition-all flex items-center justify-center gap-2"
      >
        See Full Details <ArrowRight size={18} />
      </button>
    </div>
  </div>
);

// --- Course Details Modal ---
const CourseDetailsModal: React.FC<{ course: any, onClose: () => void }> = ({ course, onClose }) => {
  if (!course) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20"
        >
          <X size={24} className="text-slate-600" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Side Image */}
          <div className="lg:w-2/5 relative h-64 lg:h-auto">
            <img 
              src={course.image} 
              alt={course.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <span className={`${course.color} ${course.textColor} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md inline-block mb-3`}>
                {course.id.toUpperCase()}
              </span>
              <h2 className="text-3xl font-display font-bold">{course.name}</h2>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:w-3/5 p-8 lg:p-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen size={20} className="text-brand-500" /> Course Overview
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {course.fullDescription}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock size={20} className="text-brand-500" /> Syllabus Highlights
                  </h3>
                  <ul className="space-y-2">
                    {course.syllabus.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Globe size={20} className="text-brand-500" /> Who is this for?
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {course.targetAudience}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {course.durations.map((d: string) => (
                      <span key={d} className="bg-brand-50 text-brand-600 px-3 py-1 rounded-lg text-xs font-bold">
                        {d} Plan
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <a href="#contact" onClick={onClose} className="flex-1 bg-brand-600 text-white text-center py-4 rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Apply for this Course
                </a>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Feature Section ---
const FeaturesSection: React.FC = () => (
  <section id="features" className="py-24 bg-slate-50">
    <div className="container mx-auto px-6 max-w-6xl">
      <SectionHeading 
        subtitle="Why Choose Us" 
        title="We provide the best environment for your education" 
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                <Icon size={28} />
              </div>
              <h4 className="text-xl font-display font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

// --- Contact Form ---
const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-xl border border-slate-100 text-slate-900">
      {status === 'success' ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Message Sent!</h3>
          <p className="text-slate-600 mb-8">Thank you for your interest. Our team will contact you within 24 hours.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="text-brand-600 font-bold hover:underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Your Name</label>
              <input required type="text" placeholder="John Doe" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 transition-all focus:ring-4 focus:ring-brand-500/10 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <input required type="email" placeholder="john@example.com" className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 transition-all focus:ring-4 focus:ring-brand-500/10 outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Requested Course</label>
            <select className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 transition-all focus:ring-4 focus:ring-brand-500/10 outline-none appearance-none">
              <option>General English (6-12 Months)</option>
              <option>Thai & Culture (6-12 Months)</option>
              <option>Other Inquiry</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Your Message</label>
            <textarea rows={4} placeholder="Tell us about your language goals..." className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 transition-all focus:ring-4 focus:ring-brand-500/10 outline-none resize-none"></textarea>
          </div>
          <button 
            type="submit" 
            disabled={status === 'sending'}
            className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
            <Send size={20} />
          </button>
        </form>
      )}
    </div>
  );
};

// --- Courses Section Component (Using Supabase Data) ---
const CoursesSection: React.FC<{ selectedCourse: any; setSelectedCourse: (course: any) => void }> = ({ selectedCourse, setSelectedCourse }) => {
  const { courses, loading, error } = useCourses();

  if (loading) return (
    <div className="container mx-auto max-w-6xl px-6">
      <SectionHeading 
        subtitle="Our Programs" 
        title="Tailored courses for global citizens" 
      />
      <div className="text-center py-12 text-slate-600">Loading courses...</div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto max-w-6xl px-6">
      <SectionHeading 
        subtitle="Our Programs" 
        title="Tailored courses for global citizens" 
      />
      <div className="text-center py-12 text-red-500">Error loading courses: {error}</div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-6xl px-6">
      <SectionHeading 
        subtitle="Our Programs" 
        title="Tailored courses for global citizens" 
      />
      <div className="grid md:grid-cols-2 gap-10">
        {courses.length > 0 ? (
          courses.map(course => {
            const courseData = {
              id: course.id,
              name: course.name,
              description: course.description,
              language: course.language,
              level: course.level,
              price: course.price,
              duration_weeks: course.duration_weeks,
              max_students: course.max_students,
              image: 'https://images.unsplash.com/photo-1543269865-cbdf26405b4a?auto=format&fit=crop&q=80&w=500',
              color: course.language === 'English' ? 'bg-blue-100' : 'bg-orange-100',
              textColor: course.language === 'English' ? 'text-blue-600' : 'text-orange-600',
              borderColor: course.language === 'English' ? 'border-blue-200' : 'border-orange-200',
              durations: [`${course.duration_weeks} weeks`],
              benefits: [
                `Learn ${course.language} at ${course.level} level`,
                `Max ${course.max_students} students per class`,
                'Interactive and engaging sessions'
              ],
              fullDescription: course.description || `Master ${course.language} with our comprehensive ${course.level} level course. This course is designed to help you achieve fluency through interactive lessons, real-world scenarios, and personalized feedback from experienced instructors.`,
              syllabus: [
                'Fundamentals and core concepts',
                'Communication skills development',
                'Grammar and vocabulary building',
                'Practical conversation practice',
                'Cultural immersion and context'
              ],
              targetAudience: `This course is perfect for ${course.level === 'beginner' ? 'complete beginners' : course.level === 'intermediate' ? 'intermediate learners' : 'advanced learners'} who want to improve their ${course.language} language skills. Whether for personal growth, career advancement, or travel, this course provides the foundation you need.`
            };
            return (
              <CourseCard 
                key={course.id} 
                course={courseData} 
                onSeeDetails={(c) => setSelectedCourse(c)} 
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-slate-600">No courses available</div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [selectedCourseModal, setSelectedCourseModal] = useState<any>(null);

  return (
    <div className="min-h-screen selection:bg-brand-100 selection:text-brand-900">
      <Navbar />
      
      <main>
        <Hero />

        {/* Courses Section */}
        <section id="courses" className="py-24 px-6 relative">
          <CoursesSection selectedCourse={selectedCourseModal} setSelectedCourse={setSelectedCourseModal} />
        </section>

        <FeaturesSection />

        {/* About Section */}
        <section id="about" className="py-24 px-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 relative order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=500" alt="Learning" className="rounded-2xl" />
                  <img src="https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?auto=format&fit=crop&q=80&w=500" alt="Study" className="rounded-2xl mt-8" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white">
                  <p className="text-4xl font-display font-black text-brand-600 mb-1">10+</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years of Teaching</p>
                </div>
              </div>
              <div className="flex-1 order-1 lg:order-2">
                <SectionHeading 
                  subtitle="About our school" 
                  title="Where language meets opportunity" 
                  centered={false}
                />
                <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                  Founded in 2014, {SCHOOL_NAME} has been at the forefront of language education in international hubs. We believe that learning a new language is the most powerful way to open doors to new careers, cultures, and friendships.
                </p>
                <div className="space-y-4 mb-10">
                  {['Personalized learning paths', 'Modern classroom technology', 'Global alumni network'].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="p-1 bg-brand-100 rounded-full text-brand-600">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="font-semibold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
                <button className="text-brand-600 font-bold flex items-center gap-2 group border-b-2 border-transparent hover:border-brand-600 transition-all pb-1">
                  Discover our history <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-6 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-600/10 pointer-events-none" />
          
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-20">
              <div className="lg:w-5/12">
                <span className="text-brand-400 font-bold uppercase text-sm tracking-widest block mb-4">Contact Us</span>
                <h2 className="text-4xl font-display font-bold mb-8 leading-tight">Start your journey today</h2>
                <p className="text-slate-400 mb-12 text-lg">
                  Have questions about our curriculum or visa processing? Our friendly admissions team is here to help you get started.
                </p>
                
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Our Location</p>
                      <p className="text-slate-400">{CONTACT_INFO.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Phone Number</p>
                      <p className="text-slate-400">{CONTACT_INFO.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg mb-1">Opening Hours</p>
                      <p className="text-slate-400">{CONTACT_INFO.hours}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-7/12">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selectedCourseModal && (
          <CourseDetailsModal 
            course={selectedCourseModal} 
            onClose={() => setSelectedCourseModal(null)} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="#home" className="flex items-center gap-2 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden">
                  <img src={LOGO_URL} alt={SCHOOL_NAME} className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-bold text-2xl text-white">
                  {SCHOOL_NAME}
                </span>
              </a>
              <p className="max-w-sm mb-6 leading-relaxed">
                Empowering international students through language and cultural immersion since 2014. Join our global community in the heart of Bangkok.
              </p>
              <div className="flex gap-4">
                {CONTACT_INFO.socials.map(s => (
                  <a key={s.platform} href={s.url} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all">
                    <span className="sr-only">{s.platform}</span>
                    <Globe size={18} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                {NAV_LINKS.map(l => (
                  <li key={l.label}><a href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</a></li>
                ))}
                <li><a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Course Hours</h4>
              <ul className="space-y-4 text-sm">
                <li><span className="text-white">Morning Shift:</span> 09:00 - 12:00</li>
                <li><span className="text-white">Afternoon Shift:</span> 13:00 - 16:00</li>
                <li><span className="text-white">Evening Classes:</span> 18:00 - 21:00</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.</p>
            <p>Designed for Excellence in Education</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
