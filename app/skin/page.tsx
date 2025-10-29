"use client";

import { BsArrowLeft } from "react-icons/bs";
import { LuCoins } from "react-icons/lu";
import { useRouter } from "next/navigation";
import SkinCard from "@/components/SkinCard";

const Skins = () => {
  const router = useRouter();

  const skins = [
    { color: "#FF1414", name: "Classic Red", isActive: true },
    { color: "#FFF8F8", name: "white" },
    {
      color: "#FF1414",
      name: "Shadow Red",
      cost: 100,
      tag: "Rear",
      tagColor: "#0076C6",
    },
    {
      color: "#FDC200",
      name: "Golden Hue",
      isLocked: true,
      cost: 300,
      tag: "Epic",
      tagColor: "#8E0085",
    },
    {
      color: "#FF1414",
      name: "Classic Red",
      cost: 100,
      tag: "Rear",
      tagColor: "#0076C6",
    },
    {
      color: "#FDC200",
      name: "Golden Hue",
      isLocked: true,
      cost: 300,
      tag: "Rear",
      tagColor: "#8E0085",
    },
  ];

  return (
    <div className="bg-[#0F172A] h-full flex flex-col">
      <div className="flex gap-23 items-center pt-7">
        <BsArrowLeft
          className="w-6 h-6 text-white ml-8 cursor-pointer"
          onClick={() => router.back()}
        />
        <p className="font-space text-xl font-medium">Snake Skins</p>
      </div>
      <div className="flex justify-end mr-7 mt-3">
        <p className="flex items-center gap-2 bg-[#1B2A4E99] p-1 rounded-3xl w-25 ">
          <LuCoins className="w-6 h-6 text-[#FF1414] ml-2" />
          <p>450</p>
        </p>
      </div>

      <div className="flex-1 space-y-3 mt-3 overflow-y-auto pb-4">
        {skins.map((skin, index) => (
          <SkinCard
            key={index}
            color={skin.color}
            name={skin.name}
            isActive={skin.isActive}
            isLocked={skin.isLocked}
            cost={skin.cost}
            tag={skin.tag}
            tagColor={skin.tagColor}
          />
        ))}
      </div>
    </div>
  );
};

export default Skins;
