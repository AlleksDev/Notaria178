// src/features/auth/pages/LoginPage.tsx
import { LoginForm } from '../components/LoginForm';
import folderImg from '../../../assets/folder.png';

export const LoginPage = () => {
  return (
    <div className="h-screen w-full flex justify-center items-center overflow-hidden bg-[#E6E6E6]">
      
      <div className="max-w-[50%] hidden md:flex flex-1 items-center justify-center">
        <img 
          src={folderImg} 
          alt="Expedientes Notaría 178" 
          className="max-w-[95%] lg:max-w-[95%] h-auto drop-shadow-2xl"
        />
      </div>

      <div className="w-full md:w-[480px] lg:w-[520px] h-full bg-[#F9F9F9] flex flex-col justify-center px-10 lg:px-14 shadow-2xl mr-0 md:mr-6 lg:mr-15">
        <LoginForm />
      </div>
      
    </div>
  );
};