'use client';

import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  role: 'admin' | 'doctor' | 'patient';
  actions?: {
    label: string;
    href: string;
    className: string;
  }[];
}

export function HeroSection({ title, subtitle, imageUrl, role, actions }: HeroSectionProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-blue-50 to-blue-100';
      case 'doctor':
        return 'bg-gradient-to-r from-green-50 to-green-100';
      case 'patient':
        return 'bg-gradient-to-r from-purple-50 to-purple-100';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100';
    }
  };

  return (
    <div className={`${getBackgroundColor()} rounded-xl p-8 shadow-lg`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {title}
            </h1>
            <p className="text-lg text-gray-700 mb-6">{subtitle}</p>
            {actions && (
              <div className="flex flex-wrap gap-4">
                {actions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`${action.className} transform transition-all hover:scale-105 hover:shadow-lg`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="hidden md:block relative h-[300px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Hero"
                fill
                className="object-cover rounded-xl shadow-xl"
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-xl shadow-xl flex items-center justify-center">
                <div className="text-white text-6xl font-bold opacity-20">
                  🏥
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 