import { BookOpen, GraduationCap, Globe, Clock, ShieldCheck, Heart } from "lucide-react";

export const SCHOOL_NAME = "KNC Language School";
export const LOGO_URL = "/logo.svg";

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export const COURSES = [
  {
    id: "english",
    name: "General English",
    description:
      "Master the global language of communication. Our interactive classes focus on speaking, listening, reading, and writing.",
    durations: ["6 Months", "12 Months"],
    fullDescription:
      "Our General English course is designed for students who want to improve their communication skills in English for everyday use, work, or travel. We use modern communicative methods to help you gain confidence and fluency. Whether you are a complete beginner or looking to polish your advanced skills, our native-speaking teachers will guide you through a dynamic curriculum that balances grammar, vocabulary, and practical usage.",
    syllabus: [
      "Fundamentals of Grammar & Syntax",
      "Conversational English & Listening Proficiency",
      "Readings on Global Cultures & Media",
      "Academic & Business Writing Workshops",
      "IELTS / TOEFL Preparation Modules",
    ],
    targetAudience:
      "International students, digital nomads, and professionals looking to enhance their global communication.",
    benefits: [
      "IELTS Preparation available",
      "Native English speakers",
      "Interactive group activities",
      "Weekly progress monitoring",
    ],
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800",
    color: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-100",
  },
  {
    id: "thai",
    name: "Thai Language & Culture",
    description:
      "Navigate Thailand with confidence. Learn to speak, read, and write Central Thai while discovering cultural nuances.",
    durations: ["6 Months", "12 Months"],
    fullDescription:
      "Living in the Land of Smiles is much more rewarding when you can speak the language. Our Thai Language & Culture course goes beyond textbooks, immersing you in the tones, script, and etiquette of Thailand. We focus on practical, real-world communication that you can use immediately in the markets, with friends, and in professional settings. Plus, we provide the necessary documentation for your educational visa.",
    syllabus: [
      "Introduction to Thai Tones & Phonology",
      "Essential Daily Conversation Skills",
      "Reading & Writing the Thai Script",
      "Etiquette, Traditions & Social Nuances",
      "Thai History & Geography Through Language",
    ],
    targetAudience:
      "Expats in Thailand, culture enthusiasts, and students seeking a long-term educational visa.",
    benefits: [
      "Student visa assistance",
      "Practical conversation focus",
      "Local cultural excursions",
      "Experienced Thai educators",
    ],
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800",
    color: "bg-rose-50",
    textColor: "text-rose-600",
    borderColor: "border-rose-100",
  },
];

export const FEATURES = [
  {
    icon: GraduationCap,
    title: "Experienced Teachers",
    description:
      "Our certified educators bring years of international expertise to the classroom.",
  },
  {
    icon: ShieldCheck,
    title: "Student Visa Support",
    description:
      "We provide full documentation and guidance for long-term Thai student visas.",
  },
  {
    icon: Heart,
    title: "Friendly Learning Environment",
    description:
      "Small class sizes and a supportive atmosphere designed for comfortable learning.",
  },
  {
    icon: Clock,
    title: "Flexible Durations",
    description:
      "Choose between our intensive 6-month or immersive 12-month course options.",
  },
  {
    icon: BookOpen,
    title: "Beginner Friendly",
    description:
      "No prior knowledge needed. We have specialized tracks starting from absolute zero.",
  },
  {
    icon: Globe,
    title: "Global Community",
    description:
      "Join students from over 30 countries and build worldwide connections.",
  },
];

export const CONTACT_INFO = {
  address: "87 Lat Pla Khao Rd, Anusawari, Bang Khen, Bangkok 10220",
  phone: "+66 (0) 2 033 9299",
  email: "knclanguageschool@gmail.com",
  hours: "Mon - Fri: 09:00 - 16:00",
  socials: [
    { platform: "Facebook", url: "https://www.facebook.com/share/1BHZC5EToS/?mibextid=wwXIfr" },
    { platform: "Instagram", url: "#" },
    { platform: "Line", url: "#" },
  ],
};
