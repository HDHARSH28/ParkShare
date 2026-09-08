import { Link } from 'react-router-dom';
import { Car, Shield, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: MapPin,
      title: 'Find Nearby Spots',
      desc: 'Discover available parking spaces in your area, listed by homeowners and businesses.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      desc: 'Set your own availability windows. Rent out your spot when you don\'t need it.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Shield,
      title: 'Secure & Trusted',
      desc: 'JWT-secured authentication, verified users, and reliability scoring for peace of mind.',
      color: 'from-purple-500 to-violet-600',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-400/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Parking reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 tracking-tight leading-tight">
              Turn Your Empty Spot Into{' '}
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Extra Income
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-surface-700 leading-relaxed max-w-2xl mx-auto">
              ParkShare connects drivers looking for convenient parking with homeowners who have unused spaces. 
              Earn money from your driveway, or find affordable parking near you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to="/parking"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5"
                  >
                    Explore Parking Spots
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-surface-700 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 shadow-sm transition-all"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to="/parking"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5"
                  >
                    Find Parking
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-surface-700 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 shadow-sm transition-all"
                  >
                    List Your Spot
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
            How It Works
          </h2>
          <p className="mt-3 text-surface-700 text-lg max-w-xl mx-auto">
            Simple, secure, and smart — parking made effortless.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-8 border border-surface-200 hover:border-primary-200 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-2">
                {f.title}
              </h3>
              <p className="text-surface-700 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/20">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Ready to Start?
            </h2>
            <p className="text-primary-100 text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
              Join ParkShare today — whether you're a driver looking for spots or a host with space to share.
            </p>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold text-base rounded-xl hover:bg-primary-50 shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
