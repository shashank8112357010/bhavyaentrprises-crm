// components/Spinner.tsx
import { ReloadIcon } from '@radix-ui/react-icons';

export const Spinner = ({size} : {size:string}) => {
  return ( 
    <div className="flex justify-center items-center">
      <ReloadIcon className={`h-${size} w-${size} animate-spin`} />{" "}
    </div>
  );
};
