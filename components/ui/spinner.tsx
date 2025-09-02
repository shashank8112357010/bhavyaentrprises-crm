// components/Spinner.tsx
import { ReloadIcon } from '@radix-ui/react-icons';

export const Spinner = ({size, className} : {size?:string, className?:string}) => {
  return ( 
    <div className="flex justify-center items-center">
      <ReloadIcon className={`h-${size || '4'} w-${size || '4'} animate-spin ${className || ''}`} />{" "}
    </div>
  );
};
