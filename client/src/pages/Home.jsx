import React from 'react';
import { useSelector } from 'react-redux';

const Home = () => {
  const { loading, error, currentUser } = useSelector((state) => state.user);

  const homeImages = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8D_gBodaltfNeK5c21GvfJcQThr5kYz9qnA&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_CEH9O-pSLcFiA57BbW1e4pahbm_HaJmvfg&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtRxtjQx4G2sg25tWYNEt76gPA-ZqPzB884w&s']

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <section className="py-20 bg-cyan-800 text-white">
        <div>
             <div className="container pt-10 mx-auto text-center px-4">
                <div className='bg-' >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 ">Exchange Skills, Grow Together</h1>
                </div>
                
                <p className="text-lg md:text-xl mb-8">
                    Connect with others to learn new skills and share your expertise.
                </p>
                <a
                    href={currentUser ? 'dashboard' : '/sign-in'}
                    className="bg-white text-gray-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition duration-300"
                >
                    Get Started
                </a>
            </div>
        </div>
       
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-8">Why Skill Swap?</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[ 
              {
                title: 'Community-driven Learning',
                description:
                  'Join a vibrant community of learners and experts who are passionate about sharing knowledge.'
              },
              {
                title: 'Skill Exchange',
                description:
                  'Trade skills with others in a supportive environment, without any monetary transactions.'
              },
              {
                title: 'Personal Growth',
                description:
                  'Enhance your skills, broaden your horizons, and become a part of a diverse learning community.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="w-full sm:w-2/3 md:w-1/3 px-4 flex flex-col items-center text-center"
              >
                <img
                  src={homeImages[index]}
                  alt="Feature"
                  className="mb-4 w-24 h-24 object-cover rounded-full"
                />
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
