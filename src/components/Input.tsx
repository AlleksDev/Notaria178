// src/components/Input.tsx
interface InputProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export const Input = ({ label, type, placeholder, value, onChange, autoComplete }: InputProps) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-[16px] text-gray-800 mb-2 font-normal tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="text-[16px] w-full border-b border-gray-300 py-2 text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none focus:border-[#740A03] transition-colors [&:-webkit-autofill]:shadow-[0_0_0_30px_#F9F9F9_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#374151]"
        required
      />
    </div>
  );
};