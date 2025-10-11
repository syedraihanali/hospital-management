
import ServiceCard from '../components/ServiceCard';

function ServicesPage() {

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-20 text-center">

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 my-20'>
        <ServiceCard/>
      </div>
     </div>
  );
}

export default ServicesPage;
