import { useRef } from "react";

interface CardProps {
  children: React.ReactNode;
}

const PerspectiveCard: React.FC<CardProps> = ({ children }) => {
  const boundingRef = useRef<DOMRect | null>(null);

  return (
    <div className="flex flex-col [perspective:1500px]">
      <div
        onMouseLeave={() => (boundingRef.current = null)}
        onMouseEnter={(ev) => {
          boundingRef.current = ev.currentTarget.getBoundingClientRect();
        }}
        onMouseMove={(ev) => {
          if (!boundingRef.current) return;
          const x = ev.clientX - boundingRef.current.left;
          const y = ev.clientY - boundingRef.current.top;
          const xPercentage = x / boundingRef.current.width;
          const yPercentage = y / boundingRef.current.height;
          const xRotation = (xPercentage - 0.5) * 20;
          const yRotation = (0.5 - yPercentage) * 20;

          ev.currentTarget.style.setProperty("--x-rotation", `${xRotation}deg`);
          ev.currentTarget.style.setProperty("--y-rotation", `${yRotation}deg`);
          ev.currentTarget.style.setProperty("--x", `${xPercentage * 100}%`);
          ev.currentTarget.style.setProperty("--y", `${yPercentage * 100}%`);
        }}
        className="group md:w-full md:h-full md:mt-0 overflow-hidden flex items-center justify-center md:hover:drop-shadow-md md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))_scale(1.03)] transition-transform ease-out duration-300"
      >
        {children}
        <div className="absolute pointer-events-none inset-0 md:group-hover:bg-[radial-gradient(at_var(--x)_var(--y),rgba(255,255,255,0.5)_0%,transparent_80%)] opacity-30 mix-blend-luminosity"></div>
      </div>
    </div>
  );
};

export default PerspectiveCard;
