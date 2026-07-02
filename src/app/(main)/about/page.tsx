import Image from "next/image";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const missionItems = [
  { icon: BookOpen, title: "Accessible Learning", description: "Making quality education available to every student with organized digital resources." },
  { icon: Users, title: "Interactive Experience", description: "Engaging quizzes and interactive content that make learning enjoyable and effective." },
  { icon: BarChart3, title: "Measurable Progress", description: "Track your learning journey with detailed analytics and progress visualization." },
];

const approachItems = [
  { number: "01", title: "Comprehensive Resources", description: "Curated study materials covering all subjects in your curriculum." },
  { number: "02", title: "Interactive Quizzes", description: "Chapter-wise quizzes to test and reinforce your understanding." },
  { number: "03", title: "Progress Tracking", description: "Visual dashboards showing your achievements and areas to improve." },
  { number: "04", title: "Continuous Improvement", description: "Regular content updates based on student feedback and curriculum changes." },
];

const teamMembers = [
  { name: "Aadaesh Bist", role: "Founder & Lead Educator", image: "/images/Aadarsh.png" },
  { name: "Sumeet Shrestha", role: "Web Developer", image: "/images/Sumeet.png" },
  { name: "Nishant Upadhyay", role: "Web Developer", image: "/images/Nishant.png" },
  { name: "Anil Kumar Panta", role: "Supervisor", image: "/images/anil sir.jpg" },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="text-center px-6 mb-16">
        <h1 className="text-4xl font-bold mb-3">About Learnify</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Transforming education through interactive learning at Shubhashree College of Management
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Our Mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {missionItems.map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 bg-[#427da6]/10 rounded-full flex items-center justify-center">
                <item.icon className="text-[#427da6]" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold">Our Story</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Learnify was born from a simple idea: make learning easier and more accessible for students at Shubhashree College of Management in Baneshwor, Kathmandu.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We noticed that students often struggled to find organized study materials and track their progress. Learnify bridges that gap by providing a centralized platform for PDFs, quizzes, and progress tracking.
            </p>
          </div>
          <div className="flex-1">
            <Image
              src="/images/section.png"
              alt="Our Story"
              width={500}
              height={350}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="bg-white dark:bg-slate-800 py-16 mb-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Our Approach</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {approachItems.map((item) => (
              <div key={item.number} className="flex gap-4 p-4">
                <span className="text-4xl font-bold text-[#427da6]/20">{item.number}</span>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-2xl font-bold text-center mb-3">Meet Our Team</h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-10 max-w-lg mx-auto">
          The passionate individuals behind Learnify who are dedicated to improving the learning experience.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <div key={member.name} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 shadow-md">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-sm">{member.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#427da6] to-[#5a9cc5] py-16 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-white/80 mb-6">Join hundreds of students already using Learnify</p>
        <Link href="/#courses">
          <Button size="lg" className="bg-white text-[#427da6] hover:bg-white/90 rounded-full font-semibold">
            Get Started Now
          </Button>
        </Link>
      </section>
    </div>
  );
}
