import Image from "next/image.js";

interface MpesaLogoProps {
  small?: boolean;
  className?: string;
}

export function MpesaLogo({ small = false, className = "" }: MpesaLogoProps) {
  const width = small ? 38 : 76;
  const height = small ? 24 : 48;

  return (
    <Image
      src="/brands/mpesa.svg"
      alt="M-Pesa"
      width={width}
      height={height}
      className={`mpesa-logo${small ? " mpesa-logo-small" : ""} ${className}`.trim()}
    />
  );
}
