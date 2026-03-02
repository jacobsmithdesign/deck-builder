import CustomScrollArea from "@/app/components/ui/CustomScrollArea";

export default function SidePanel() {
  return (
    <CustomScrollArea className="w-96 overflow-y-scroll bg-dark/40 hide-scrollbar z-10 p-2 flex flex-col gap-4 ml-2 mb-1 mt-1 rounded-xl">
      <div className=" w-full h-full rounded-xl">
        <h2 className="text-2xl font-bold">Side Panel</h2>
      </div>
    </CustomScrollArea>
  );
}
