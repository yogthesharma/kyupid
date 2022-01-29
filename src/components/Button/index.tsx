import React from "react";

type Props = {
  children: React.ReactNode;
  isCurrFilter: boolean;
  onClick: () => void;
};

const Button = (props: Props) => {
  const { children, isCurrFilter, onClick } = props;
  return (
    <button
      onClick={onClick}
      className={`${
        isCurrFilter ? "bg-slate-800" : "bg-slate-500"
      } px-4 py-2 mr-4 last:mr-0 rounded font-normal text-base`}
    >
      {children}
    </button>
  );
};

export default Button;
